import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { UserService } from '../../../services/user.service';
import { SpaceService } from '../../../services/space.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Space, SpaceElement } from '../../../models/space.model';

@Component({
  selector: 'app-manager-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ManagerProfileComponent implements OnInit {
  user: User | null = null;
  spaces: Space[] = [];
  form: FormGroup;
  editMode = false;
  message = '';
  error = '';
  saving = false;
  selectedFile: File | null = null;
  fileError = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private spaceService: SpaceService,
    public auth: AuthService,
    private zone: NgZone,
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^06\d{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.userService.getProfile().subscribe((u) => {
      this.user = u;
      this.form.patchValue({
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        email: u.email,
      });
    });
    this.spaceService.getManagerSpaces().subscribe((s) => (this.spaces = s));
  }

  get profileImageUrl(): string {
    const img = this.user?.profileImage;
    if (!img) return 'http://localhost:4000/uploads/profiles/default.png';
    return `http://localhost:4000/${img}`;
  }

  onFileChange(event: Event): void {
    this.fileError = '';
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.fileError = 'Only JPG/PNG files are allowed';
      return;
    }
    const img = new Image();
    img.onload = () => {
      this.zone.run(() => {
        if (img.width < 100 || img.height < 100 || img.width > 300 || img.height > 300) {
          this.fileError = 'Image must be between 100×100 and 300×300 pixels';
          this.selectedFile = null;
        } else {
          this.selectedFile = file;
        }
      });
    };
    img.src = URL.createObjectURL(file);
  }

  saveProfile(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.message = '';
    this.error = '';
    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => fd.append(k, v as string));
    if (this.selectedFile) fd.append('profileImage', this.selectedFile);
    this.userService.updateProfile(fd).subscribe({
      next: (u) => {
        this.user = u;
        this.saving = false;
        this.editMode = false;
        this.message = 'Profile updated successfully';
        setTimeout(() => (this.message = ''), 3000);
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Update failed';
      },
    });
  }

  openElements(space: Space): string {
    const elements: SpaceElement[] = (space as any).elements ?? [];
    const parts: string[] = [];

    const open = elements.find((e) => e.type === 'open');
    if (open) parts.push(`Open space (${open.deskCount} desks)`);

    const offices = elements.filter((e) => e.type === 'office');
    offices.forEach((o) => parts.push(`Office "${o.name}" (${o.deskCount} desks)`));

    const conferences = elements.filter((e) => e.type === 'conference');
    conferences.forEach((c) => parts.push(`Conference "${c.name}"`));

    return parts.join(' · ');
  }

  spaceStatusClass(status: string): string {
    if (status === 'active') return 'bg-green-50 text-green-700';
    if (status === 'pending') return 'bg-yellow-50 text-yellow-700';
    return 'bg-slate-100 text-slate-500';
  }
}
