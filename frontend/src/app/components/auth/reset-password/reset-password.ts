import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

const PASSWORD_PATTERN = /^[a-zA-Z](?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{7,11}$/;

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token = '';
  tokenValid = false;
  tokenChecked = false;
  message = '';
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.tokenChecked = true;
      return;
    }
    this.auth.verifyResetToken(this.token).subscribe({
      next: (res) => {
        this.tokenValid = res.valid;
        this.tokenChecked = true;
      },
      error: () => {
        this.tokenValid = false;
        this.tokenChecked = true;
      },
    });
  }

  get passwordsMatch(): boolean {
    return this.form.value.newPassword === this.form.value.confirmPassword;
  }

  submit(): void {
    if (this.form.invalid || !this.passwordsMatch) return;
    this.loading = true;
    this.error = '';
    this.auth.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Reset failed';
      },
    });
  }
}
