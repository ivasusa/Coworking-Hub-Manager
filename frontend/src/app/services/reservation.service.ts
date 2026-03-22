import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

const API = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private http: HttpClient) {}

  getElementCalendar(elementId: string, weekStart?: string) {
    let params = new HttpParams();
    if (weekStart) params = params.set('weekStart', weekStart);
    return this.http.get<any>(`${API}/reservations/element/${elementId}`, { params });
  }

  createReservation(data: any) {
    return this.http.post<any>(`${API}/reservations`, data);
  }

  getManagerReservations() {
    return this.http.get<any>(`${API}/reservations/manager`);
  }

  confirm(id: string) {
    return this.http.put<any>(`${API}/reservations/${id}/confirm`, {});
  }

  noShow(id: string) {
    return this.http.put<any>(`${API}/reservations/${id}/noshow`, {});
  }

  getManagerMonthlyReport(month: string) {
    const params = new HttpParams().set('month', month);
    return this.http.get<any>(`${API}/reservations/manager/report`, { params });
  }

  getManagerElementCalendar(elementId: string, weekStart?: string) {
    let params = new HttpParams();
    if (weekStart) params = params.set('weekStart', weekStart);
    return this.http.get<any>(`${API}/reservations/manager/element/${elementId}`, { params });
  }
}
