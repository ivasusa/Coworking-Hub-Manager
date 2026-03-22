import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get<any>(`${API}/users/profile`);
  }

  updateProfile(formData: FormData) {
    return this.http.put<any>(`${API}/users/profile`, formData);
  }

  getMyReservations() {
    return this.http.get<any>(`${API}/users/reservations`);
  }

  cancelReservation(id: string) {
    return this.http.put<any>(`${API}/users/reservations/${id}/cancel`, {});
  }

  getAllUsers() {
    return this.http.get<any>(`${API}/users/admin/all`);
  }

  getPendingUsers() {
    return this.http.get<any>(`${API}/users/admin/pending`);
  }

  approveUser(id: string) {
    return this.http.put<any>(`${API}/users/admin/${id}/approve`, {});
  }

  rejectUser(id: string) {
    return this.http.put<any>(`${API}/users/admin/${id}/reject`, {});
  }

  deleteUser(id: string) {
    return this.http.delete<any>(`${API}/users/admin/${id}`);
  }
}
