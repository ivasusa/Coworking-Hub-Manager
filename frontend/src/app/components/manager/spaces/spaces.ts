import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { NoNegativeDirective } from '../../../directives/no-negative.directive';
import { forkJoin, Observable } from 'rxjs';
import { SpaceService } from '../../../services/space.service';
import { Space, SpaceElement } from '../../../models/space.model';

type AddingType = 'office' | 'conference' | null;

@Component({
  selector: 'app-manager-spaces',
  imports: [ReactiveFormsModule, NoNegativeDirective],
  templateUrl: './spaces.html',
  styleUrl: './spaces.css',
})
export class ManagerSpacesComponent implements OnInit {
  spaces: Space[] = [];

  showCreateForm = false;
  createForm: FormGroup;
  createMsg = '';
  createError = '';
  creating = false;
  createdSpaceId: string | null = null;

  showJsonForm = false;
  jsonMsg = '';
  jsonError = '';
  jsonImporting = false;

  addingElement: Record<string, AddingType> = {};
  officeForm: FormGroup;
  conferenceForm: FormGroup;
  elementMsg: Record<string, string> = {};
  elementError: Record<string, string> = {};
  addingInProgress: Record<string, boolean> = {};

  constructor(private spaceService: SpaceService, private fb: FormBuilder) {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
      description: [''],
      pricePerHour: ['', [Validators.required, Validators.min(0)]],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      maxPenalties: ['', [Validators.required, Validators.min(1)]],
      deskCount: ['', [Validators.required, Validators.min(5)]],
    });

    this.officeForm = this.fb.group({
      name: ['', Validators.required],
      deskCount: ['', [Validators.required, Validators.min(1)]],
    });

    this.conferenceForm = this.fb.group({
      name: ['', Validators.required],
      equipment: ['', Validators.maxLength(300)],
    });
  }

  ngOnInit(): void {
    this.loadSpaces();
  }

  loadSpaces(): void {
    this.spaceService.getManagerSpaces().subscribe((s) => (this.spaces = s));
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.creating = true;
    this.createError = '';
    const fd = new FormData();
    Object.entries(this.createForm.value).forEach(([k, v]) => fd.append(k, String(v)));
    this.spaceService.createSpace(fd).subscribe({
      next: (s) => {
        this.createdSpaceId = s._id;
        this.createMsg = 'Space created! Now you can add offices and conference rooms below.';
        this.creating = false;
        this.createForm.reset();
        this.loadSpaces();
      },
      error: (err) => {
        this.createError = err.error?.message ?? 'Failed to create space';
        this.creating = false;
      },
    });
  }

  startAdding(spaceId: string, type: AddingType): void {
    this.addingElement[spaceId] = type;
    this.officeForm.reset();
    this.conferenceForm.reset();
    this.elementMsg[spaceId] = '';
    this.elementError[spaceId] = '';
  }

  cancelAdding(spaceId: string): void {
    this.addingElement[spaceId] = null;
  }

  submitOffice(spaceId: string): void {
    if (this.officeForm.invalid) return;
    this.addingInProgress[spaceId] = true;
    this.spaceService.addElement(spaceId, {
      type: 'office',
      name: this.officeForm.value.name,
      deskCount: this.officeForm.value.deskCount,
    }).subscribe({
      next: () => {
        this.elementMsg[spaceId] = 'Office added.';
        this.addingElement[spaceId] = null;
        this.addingInProgress[spaceId] = false;
        this.loadSpaces();
      },
      error: (err) => {
        this.elementError[spaceId] = err.error?.message ?? 'Error';
        this.addingInProgress[spaceId] = false;
      },
    });
  }

  submitConference(spaceId: string): void {
    if (this.conferenceForm.invalid) return;
    this.addingInProgress[spaceId] = true;
    this.spaceService.addElement(spaceId, {
      type: 'conference',
      name: this.conferenceForm.value.name,
      equipment: this.conferenceForm.value.equipment,
    }).subscribe({
      next: () => {
        this.elementMsg[spaceId] = 'Conference room added.';
        this.addingElement[spaceId] = null;
        this.addingInProgress[spaceId] = false;
        this.loadSpaces();
      },
      error: (err) => {
        this.elementError[spaceId] = err.error?.message ?? 'Error';
        this.addingInProgress[spaceId] = false;
      },
    });
  }

  onJsonFileChange(event: Event): void {
    this.jsonMsg = '';
    this.jsonError = '';
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.name.endsWith('.json')) {
      this.jsonError = 'Only .json files are allowed';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        this.importFromJson(data);
      } catch {
        this.jsonError = 'Invalid JSON file';
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  private importFromJson(data: any): void {
    const required = ['name', 'city', 'address', 'pricePerHour', 'latitude', 'longitude', 'maxPenalties', 'deskCount'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        this.jsonError = `Missing required field: "${field}"`;
        return;
      }
    }
    if (parseInt(data.deskCount) < 5) {
      this.jsonError = 'deskCount must be at least 5';
      return;
    }
    const offices: { name: string; deskCount: number }[] = data.offices ?? [];
    const conferences: { name: string; equipment?: string }[] = data.conferences ?? [];
    for (const o of offices) {
      if (!o.name || !o.deskCount || o.deskCount < 1) {
        this.jsonError = `Invalid office entry: each office needs "name" and "deskCount" (≥1)`;
        return;
      }
    }
    for (const c of conferences) {
      if (!c.name) {
        this.jsonError = 'Each conference room needs a "name"';
        return;
      }
      if (c.equipment && c.equipment.length > 300) {
        this.jsonError = `Conference "${c.name}": equipment exceeds 300 characters`;
        return;
      }
    }

    this.jsonImporting = true;
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('city', data.city);
    fd.append('address', data.address);
    fd.append('description', data.description ?? '');
    fd.append('pricePerHour', String(data.pricePerHour));
    fd.append('latitude', String(data.latitude));
    fd.append('longitude', String(data.longitude));
    fd.append('maxPenalties', String(data.maxPenalties));
    fd.append('deskCount', String(data.deskCount));

    this.spaceService.createSpace(fd).subscribe({
      next: (space) => {
        const elementCalls: Observable<any>[] = [
          ...offices.map((o) => this.spaceService.addElement(space._id, { type: 'office', name: o.name, deskCount: o.deskCount })),
          ...conferences.map((c) => this.spaceService.addElement(space._id, { type: 'conference', name: c.name, equipment: c.equipment ?? '' })),
        ];
        if (!elementCalls.length) {
          this.jsonMsg = 'Space imported successfully!';
          this.jsonImporting = false;
          this.showJsonForm = false;
          this.loadSpaces();
          return;
        }
        forkJoin(elementCalls).subscribe({
          next: () => {
            this.jsonMsg = `Space imported with ${offices.length} office(s) and ${conferences.length} conference room(s).`;
            this.jsonImporting = false;
            this.showJsonForm = false;
            this.loadSpaces();
          },
          error: (err) => {
            this.jsonError = `Space created but some elements failed: ${err.error?.message ?? 'unknown error'}`;
            this.jsonImporting = false;
            this.loadSpaces();
          },
        });
      },
      error: (err) => {
        this.jsonError = err.error?.message ?? 'Import failed';
        this.jsonImporting = false;
      },
    });
  }

  elements(space: Space): SpaceElement[] {
    return (space as any).elements ?? [];
  }

  openEl(space: Space): SpaceElement | undefined {
    return this.elements(space).find((e) => e.type === 'open');
  }

  offices(space: Space): SpaceElement[] {
    return this.elements(space).filter((e) => e.type === 'office');
  }

  conferences(space: Space): SpaceElement[] {
    return this.elements(space).filter((e) => e.type === 'conference');
  }

  statusClass(status: string): string {
    if (status === 'active') return 'bg-green-50 text-green-700';
    if (status === 'pending') return 'bg-yellow-50 text-yellow-700';
    return 'bg-slate-100 text-slate-500';
  }
}
