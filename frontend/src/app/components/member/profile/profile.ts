import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Reservation } from '../../../models/space.model';

type SortField = 'spaceName' | 'city' | 'startTime' | 'endTime';

@Component({
  selector: 'app-member-profile',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class MemberProfileComponent implements OnInit {
  user: User | null = null;
  reservations: Reservation[] = [];
  form: FormGroup;
  editMode = false;
  message = '';
  error = '';
  saving = false;
  selectedFile: File | null = null;
  fileError = '';

  sortField: SortField = 'startTime';
  sortDir: 'asc' | 'desc' = 'desc';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public auth: AuthService,
    private zone: NgZone
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
    this.userService.getMyReservations().subscribe((r) => {
      this.reservations = r;
      this.applySort();
    });
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

  canCancel(r: Reservation): boolean {
    if (r.status === 'cancelled' || r.status === 'no_show') return false;
    const hours = (new Date(r.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    return hours >= 12;
  }

  cancelReservation(id: string): void {
    this.userService.cancelReservation(id).subscribe({
      next: () => {
        const r = this.reservations.find((x) => x._id === id);
        if (r) r.status = 'cancelled';
      },
      error: (err) => alert(err.error?.message || 'Could not cancel'),
    });
  }

  sortBy(field: SortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.applySort();
  }

  private applySort(): void {
    this.reservations = [...this.reservations].sort((a, b) => {
      let va: string, vb: string;
      if (this.sortField === 'spaceName') {
        va = a.spaceId?.name ?? '';
        vb = b.spaceId?.name ?? '';
      } else if (this.sortField === 'city') {
        va = a.spaceId?.city ?? '';
        vb = b.spaceId?.city ?? '';
      } else {
        va = a[this.sortField];
        vb = b[this.sortField];
      }
      return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  sortIndicator(field: SortField): string {
    if (this.sortField !== field) return '↕';
    return this.sortDir === 'asc' ? '▲' : '▼';
  }
}
