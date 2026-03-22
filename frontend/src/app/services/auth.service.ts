import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';

const API = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser() {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  get currentUser() {
    return this.currentUserSubject.value;
  }

  get token() {
    return localStorage.getItem('token');
  }

  get isLoggedIn() {
    return !!this.token;
  }

  get role() {
    return this.currentUser?.role ?? null;
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${API}/auth/login`, { username, password }).pipe(
      tap((res: any) => this.storeSession(res))
    );
  }

  adminLogin(username: string, password: string) {
    return this.http.post<any>(`${API}/auth/admin/login`, { username, password }).pipe(
      tap((res: any) => this.storeSession(res))
    );
  }

  register(formData: FormData) {
    return this.http.post<any>(`${API}/auth/register`, formData);
  }

  forgotPassword(identifier: string) {
    return this.http.post<any>(`${API}/auth/forgot-password`, { identifier });
  }

  verifyResetToken(token: string) {
    return this.http.get<any>(`${API}/auth/verify-reset-token/${token}`);
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<any>(`${API}/auth/reset-password`, { token, newPassword });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private storeSession(res: any): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('currentUser', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
}
