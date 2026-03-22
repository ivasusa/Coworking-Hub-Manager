import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpaceService } from '../../../services/space.service';
import { ReservationService } from '../../../services/reservation.service';
import { ReviewService } from '../../../services/review.service';
import { AuthService } from '../../../services/auth.service';
import { Space, SpaceElement } from '../../../models/space.model';
import * as L from 'leaflet';

const COOKIE_KEY_PREFIX = 'space_main_img_';

const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-space-details',
  imports: [RouterLink, NgClass, DatePipe, FormsModule],
  templateUrl: './space-details.html',
  styleUrl: './space-details.css',
})
export class SpaceDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  space: Space | null = null;
  loading = true;
  error = '';
  selectedImage = '';

  elementType: 'open' | 'office' | 'conference' | null = null;
  minDesks: number | null = null;

  calendarItems: SpaceElement[] = [];
  activIndex = 0;
  get activeItem(): SpaceElement | null {
    return this.calendarItems[this.activIndex] ?? null;
  }

  weekStartDate: Date = this.findMonday(new Date());
  calData: any = null;
  daysOfWeek: Date[] = [];
  calendarLoading = false;

  isLoggedIn = false;
  chosenDay = '';
  startHour = '08:00';
  endHour = '09:00';
  bookMsg = '';
  bookErr = '';

  private map: L.Map | null = null;
  private spaceId = '';

  reviewList: any[] = [];
  myReviewData: any = null;
  numConfirmed = 0;
  newCommentText = '';
  reviewSuccessMsg = '';
  reviewErrMsg = '';
  currentUserId = '';

  constructor(
    private route: ActivatedRoute,
    private spaceService: SpaceService,
    private reservationService: ReservationService,
    private reviewService: ReviewService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.spaceId = this.route.snapshot.paramMap.get('id')!;
    this.elementType = (this.route.snapshot.queryParamMap.get('elementType') as any) ?? null;
    const md = this.route.snapshot.queryParamMap.get('minDesks');
    this.minDesks = md ? parseInt(md) : null;
    this.isLoggedIn = !!this.authService.token;
    this.currentUserId = this.authService.currentUser?.id ?? '';

    this.spaceService.getDetails(this.spaceId).subscribe({
      next: (s) => {
        this.space = s;
        this.loading = false;
        this.selectedImage = this.getImageFromCookie(this.spaceId) || s.mainImage || (s.images[0] ?? '');
        this.prepareCalendarList();
        this.createWeekDays();
        this.loadCalendarWeek();
        this.getReviews();
        setTimeout(() => this.initMap(), 0);
      },
      error: () => {
        this.error = 'Space not found';
        this.loading = false;
      },
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    if (!this.space || this.map) return;
    this.map = L.map('space-map', { scrollWheelZoom: false }).setView([this.space.latitude, this.space.longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    L.marker([this.space.latitude, this.space.longitude])
      .addTo(this.map)
      .bindPopup(`<b>${this.space.name}</b><br>${this.space.address}, ${this.space.city}`)
      .openPopup();
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private prepareCalendarList(): void {
    if (!this.space?.elements) return;
    if (!this.elementType) {
      this.calendarItems = this.space.elements;
      return;
    }
    const filtered: SpaceElement[] = [];
    for (const el of this.space.elements) {
      if (el.type !== this.elementType) continue;
      if (this.elementType === 'office' && this.minDesks && (el.deskCount ?? 0) < this.minDesks) continue;
      filtered.push(el);
    }
    this.calendarItems = filtered;
  }

  private findMonday(d: Date): Date {
    const date = new Date(d);
    const dayOfWeek = date.getDay();
    let diff = 1 - dayOfWeek;
    if (dayOfWeek === 0) diff = -6;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private createWeekDays(): void {
    this.daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.weekStartDate);
      d.setDate(d.getDate() + i);
      this.daysOfWeek.push(d);
    }
  }

  prevWeek(): void {
    this.weekStartDate = new Date(this.weekStartDate);
    this.weekStartDate.setDate(this.weekStartDate.getDate() - 7);
    this.createWeekDays();
    this.loadCalendarWeek();
  }

  nextWeek(): void {
    this.weekStartDate = new Date(this.weekStartDate);
    this.weekStartDate.setDate(this.weekStartDate.getDate() + 7);
    this.createWeekDays();
    this.loadCalendarWeek();
  }

  loadCalendarWeek(): void {
    if (!this.activeItem) return;
    this.calendarLoading = true;
    const ws = this.weekStartDate.toISOString();
    this.reservationService.getElementCalendar(this.activeItem._id, ws).subscribe({
      next: (data) => {
        this.calData = data;
        this.calendarLoading = false;
      },
      error: () => { this.calendarLoading = false; },
    });
  }

  dayIsOccupied(day: Date): boolean {
    if (!this.calData) return false;
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const overlapping = this.calData.reservations.filter((s: any) => {
      return new Date(s.startTime) <= dayEnd && new Date(s.endTime) >= day;
    });
    if (this.calData.element.type === 'open') {
      return overlapping.length >= (this.calData.element.deskCount ?? 1);
    }
    return overlapping.length > 0;
  }

  dayIsPast(day: Date): boolean {
    return day < new Date(new Date().setHours(0, 0, 0, 0));
  }

  clickDay(day: Date): void {
    if (this.dayIsPast(day)) return;
    this.chosenDay = this.formatDate(day);
    this.startHour = '08:00';
    this.endHour = '09:00';
    this.bookMsg = '';
    this.bookErr = '';
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const dd = d.getDate();
    return `${y}-${mo < 10 ? '0' + mo : mo}-${dd < 10 ? '0' + dd : dd}`;
  }

  prevElement(): void {
    if (this.activIndex > 0) {
      this.activIndex--;
      this.loadCalendarWeek();
    }
  }

  nextElement(): void {
    if (this.activIndex < this.calendarItems.length - 1) {
      this.activIndex++;
      this.loadCalendarWeek();
    }
  }

  submitReservation(): void {
    if (!this.activeItem || !this.space || !this.chosenDay) return;
    this.bookMsg = '';
    this.bookErr = '';

    const start = new Date(`${this.chosenDay}T${this.startHour}:00`);
    const end = new Date(`${this.chosenDay}T${this.endHour}:00`);

    this.reservationService.createReservation({
      spaceId: this.space._id,
      elementId: this.activeItem._id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    }).subscribe({
      next: () => {
        this.bookMsg = 'Reservation created successfully!';
        this.chosenDay = '';
        this.reservationService.getElementCalendar(this.activeItem!._id, this.weekStartDate.toISOString()).subscribe({
          next: (data) => {
            this.calData = data;
            this.daysOfWeek = [...this.daysOfWeek];
          },
        });
      },
      error: (err) => {
        this.bookErr = err.error?.message ?? 'Failed to create reservation';
      },
    });
  }

  getReviews(): void {
    this.reviewService.getSpaceReviews(this.spaceId).subscribe({
      next: (data) => {
        this.reviewList = data.comments;
        this.myReviewData = data.memberReview;
        this.numConfirmed = data.confirmedCount;
      },
    });
  }

  get userCanReview(): boolean {
    if (!this.isLoggedIn || this.authService.role !== 'member') return false;
    if (this.numConfirmed === 0) return false;
    const reactions = (this.myReviewData?.likeCount ?? 0) + (this.myReviewData?.dislikeCount ?? 0);
    const comments = this.myReviewData?.commentCount ?? 0;
    return reactions < this.numConfirmed || comments < this.numConfirmed;
  }

  isMyComment(memberId: string): boolean {
    return memberId === this.currentUserId;
  }

  like(): void {
    if (!this.space) return;
    this.reviewSuccessMsg = '';
    this.reviewErrMsg = '';
    this.reviewService.addLike(this.space._id).subscribe({
      next: (r) => { this.myReviewData = r; this.getReviews(); },
      error: (err) => { this.reviewErrMsg = err.error?.message ?? 'Error'; },
    });
  }

  dislike(): void {
    if (!this.space) return;
    this.reviewSuccessMsg = '';
    this.reviewErrMsg = '';
    this.reviewService.addDislike(this.space._id).subscribe({
      next: (r) => { this.myReviewData = r; this.getReviews(); },
      error: (err) => { this.reviewErrMsg = err.error?.message ?? 'Error'; },
    });
  }

  submitComment(): void {
    if (!this.space || !this.newCommentText.trim()) return;
    this.reviewSuccessMsg = '';
    this.reviewErrMsg = '';
    this.reviewService.addComment(this.space._id, this.newCommentText).subscribe({
      next: (r) => {
        this.myReviewData = r;
        this.newCommentText = '';
        this.getReviews();
      },
      error: (err) => { this.reviewErrMsg = err.error?.message ?? 'Error'; },
    });
  }

  selectImage(img: string): void {
    this.selectedImage = img;
    if (this.space) this.saveImageCookie(this.space._id, img);
  }

  imageUrl(path: string): string {
    if (!path) return 'http://localhost:4000/uploads/profiles/default.png';
    return `http://localhost:4000/${path}`;
  }

  get allImages(): string[] {
    if (!this.space) return [];
    const imgs = this.space.images?.length ? this.space.images : [];
    if (this.space.mainImage && !imgs.includes(this.space.mainImage)) {
      return [this.space.mainImage, ...imgs];
    }
    return imgs;
  }

  get thumbnails(): string[] {
    return this.allImages.slice(0, 6);
  }

  private getCookieName(id: string): string {
    return `${COOKIE_KEY_PREFIX}${id}`;
  }

  private saveImageCookie(id: string, img: string): void {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${this.getCookieName(id)}=${encodeURIComponent(img)}; expires=${expires}; path=/`;
  }

  private getImageFromCookie(id: string): string {
    const key = this.getCookieName(id);
    const allCookies = document.cookie.split(';');
    for (let i = 0; i < allCookies.length; i++) {
      const cookie = allCookies[i].trim();
      const eqPos = cookie.indexOf('=');
      const cName = cookie.substring(0, eqPos);
      const cVal = cookie.substring(eqPos + 1);
      if (cName === key) return decodeURIComponent(cVal || '');
    }
    return '';
  }
}
