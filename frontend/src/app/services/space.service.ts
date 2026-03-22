import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

const API = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class SpaceService {
  constructor(private http: HttpClient) {}

  getCount() {
    return this.http.get<any>(`${API}/spaces/count`);
  }

  getTop5() {
    return this.http.get<any>(`${API}/spaces/top5`);
  }

  getCities() {
    return this.http.get<any>(`${API}/spaces/cities`);
  }

  search(name: string, cities: string[], elementType?: string, minDesks?: number) {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (cities.length) params = params.set('cities', cities.join(','));
    if (elementType) params = params.set('elementType', elementType);
    if (minDesks) params = params.set('minDesks', String(minDesks));
    return this.http.get<any>(`${API}/spaces/search`, { params });
  }

  getDetails(id: string) {
    return this.http.get<any>(`${API}/spaces/${id}`);
  }

  getManagerSpaces() {
    return this.http.get<any>(`${API}/spaces/manager/my`);
  }

  getPendingSpaces() {
    return this.http.get<any>(`${API}/spaces/admin/pending`);
  }

  approveSpace(id: string) {
    return this.http.put<any>(`${API}/spaces/admin/${id}/approve`, {});
  }

  getAdminStats() {
    return this.http.get<any>(`${API}/spaces/admin/stats`);
  }

  createSpace(formData: FormData) {
    return this.http.post<any>(`${API}/spaces`, formData);
  }

  addElement(spaceId: string, data: any) {
    return this.http.post<any>(`${API}/spaces/${spaceId}/elements`, data);
  }

  updateSpace(spaceId: string, data: any) {
    return this.http.put<any>(`${API}/spaces/${spaceId}`, data);
  }
}
