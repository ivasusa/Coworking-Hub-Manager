import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpaceService } from '../../../services/space.service';
import { ReservationService } from '../../../services/reservation.service';

@Component({
  selector: 'app-manager-calendar',
  imports: [DatePipe, FormsModule],
  templateUrl: './calendar.html',
})
export class ManagerCalendarComponent implements OnInit {
  spaces: any[] = [];
  selectedSpaceId = '';
  selectedElementId = '';

  calendarData: any = null;
  loadingCalendar = false;

  weekStart: Date = this.getMonday(new Date());
  weekDays: Date[] = [];

  constructor(
    private spaceService: SpaceService,
    private reservationService: ReservationService,
  ) {}

  ngOnInit(): void {
    this.buildWeekDays();
    this.spaceService.getManagerSpaces().subscribe((s) => {
      this.spaces = s;
    });
  }

  get selectedSpace(): any {
    return this.spaces.find((s) => s._id === this.selectedSpaceId) ?? null;
  }

  get elements(): any[] {
    return (this.selectedSpace as any)?.elements ?? [];
  }

  onSpaceChange(): void {
    this.selectedElementId = '';
    this.calendarData = null;
  }

  onElementChange(): void {
    if (this.selectedElementId) this.loadCalendar();
  }

  loadCalendar(): void {
    if (!this.selectedElementId) return;
    this.loadingCalendar = true;
    this.reservationService.getManagerElementCalendar(
      this.selectedElementId,
      this.weekStart.toISOString(),
    ).subscribe({
      next: (data) => { this.calendarData = data; this.loadingCalendar = false; },
      error: () => { this.loadingCalendar = false; },
    });
  }

  prevWeek(): void {
    this.weekStart = new Date(this.weekStart);
    this.weekStart.setDate(this.weekStart.getDate() - 7);
    this.buildWeekDays();
    this.loadCalendar();
  }

  nextWeek(): void {
    this.weekStart = new Date(this.weekStart);
    this.weekStart.setDate(this.weekStart.getDate() + 7);
    this.buildWeekDays();
    this.loadCalendar();
  }

  reservationsForDay(day: Date): any[] {
    if (!this.calendarData?.reservations) return [];
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
    return this.calendarData.reservations.filter((r: any) => {
      return new Date(r.startTime) <= dayEnd && new Date(r.endTime) >= dayStart;
    });
  }

  isDayPast(day: Date): boolean {
    return day < new Date(new Date().setHours(0, 0, 0, 0));
  }

  statusClass(status: string): string {
    if (status === 'confirmed') return 'bg-green-100 border-green-400 text-green-800';
    if (status === 'no_show') return 'bg-red-100 border-red-400 text-red-700';
    return 'bg-blue-100 border-blue-400 text-blue-800';
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private buildWeekDays(): void {
    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }
}
