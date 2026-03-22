import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  getSpaceReviews(spaceId: string) {
    return this.http.get<any>(`${API}/reviews/${spaceId}`);
  }

  addLike(spaceId: string) {
    return this.http.post<any>(`${API}/reviews/${spaceId}/like`, {});
  }

  addDislike(spaceId: string) {
    return this.http.post<any>(`${API}/reviews/${spaceId}/dislike`, {});
  }

  addComment(spaceId: string, text: string) {
    return this.http.post<any>(`${API}/reviews/${spaceId}/comment`, { text });
  }
}
