import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordComponent {
  form: FormGroup;
  message = '';
  error = '';
  loading = false;
  resetLink = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({ identifier: ['', Validators.required] });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.message = '';
    this.error = '';
    this.resetLink = '';
    this.auth.forgotPassword(this.form.value.identifier).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message;
        this.resetLink = res.resetLink || '';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Something went wrong';
      },
    });
  }
}
