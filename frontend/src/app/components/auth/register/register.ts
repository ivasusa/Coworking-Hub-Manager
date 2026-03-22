import { Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

const PASSWORD_PATTERN = /^[a-zA-Z](?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{7,11}$/;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  form: FormGroup;
  selectedFile: File | null = null;
  fileError = '';
  message = '';
  error = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private zone: NgZone) {
    this.form = this.fb.group({
      role: ['member', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^06\d{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      companyName: [''],
      companyAddress: [''],
      registrationNumber: ['', Validators.pattern(/^\d{8}$/)],
      taxId: ['', Validators.pattern(/^[1-9]\d{8}$/)],
    });
  }

  get isManager(): boolean {
    return this.form.value.role === 'manager';
  }

  onFileChange(event: Event): void {
    this.fileError = '';
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.fileError = 'Only JPG/PNG files are allowed';
      return;
    }
    const img = new Image();
    img.onload = () => {
      this.zone.run(() => {
        if (img.width < 100 || img.height < 100 || img.width > 300 || img.height > 300) {
          this.fileError = 'Image must be between 100x100 and 300x300 pixels';
          this.selectedFile = null;
        } else {
          this.selectedFile = file;
        }
      });
    };
    img.src = URL.createObjectURL(file);
  }

  submit(): void {
    if (this.form.invalid) return;
    if (this.isManager) {
      const { companyName, companyAddress, registrationNumber, taxId } = this.form.value;
      if (!companyName || !companyAddress || !registrationNumber || !taxId) {
        this.error = 'All company fields are required for manager registration';
        return;
      }
    }
    this.loading = true;
    this.error = '';
    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => {
      if (v !== null && v !== '') fd.append(k, v as string);
    });
    if (this.selectedFile) fd.append('profileImage', this.selectedFile);

    this.auth.register(fd).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      },
    });
  }
}
