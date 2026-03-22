import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReservationService } from '../../../services/reservation.service';

@Component({
  selector: 'app-manager-reservations',
  imports: [DatePipe],
  templateUrl: './reservations.html',
})
export class ManagerReservationsComponent implements OnInit {
  reservations: any[] = [];
  loading = true;
  actionMsg: Record<string, string> = {};
  actionError: Record<string, string> = {};
  inProgress: Record<string, boolean> = {};

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.reservationService.getManagerReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  canAct(r: any): boolean {
    if (r.status !== 'active') return false;
    const tenAfterStart = new Date(r.startTime).getTime() + 10 * 60 * 1000;
    return Date.now() >= tenAfterStart;
  }

  confirm(r: any): void {
    this.inProgress[r._id] = true;
    this.actionMsg[r._id] = '';
    this.actionError[r._id] = '';
    this.reservationService.confirm(r._id).subscribe({
      next: () => {
        this.actionMsg[r._id] = 'Confirmed';
        this.inProgress[r._id] = false;
        this.load();
      },
      error: (err) => {
        this.actionError[r._id] = err.error?.message ?? 'Error';
        this.inProgress[r._id] = false;
      },
    });
  }

  noShow(r: any): void {
    this.inProgress[r._id] = true;
    this.actionMsg[r._id] = '';
    this.actionError[r._id] = '';
    this.reservationService.noShow(r._id).subscribe({
      next: () => {
        this.actionMsg[r._id] = 'Marked as no-show';
        this.inProgress[r._id] = false;
        this.load();
      },
      error: (err) => {
        this.actionError[r._id] = err.error?.message ?? 'Error';
        this.inProgress[r._id] = false;
      },
    });
  }

  statusClass(status: string): string {
    if (status === 'active') return 'bg-blue-50 text-blue-700';
    if (status === 'confirmed') return 'bg-green-50 text-green-700';
    if (status === 'no_show') return 'bg-red-50 text-red-600';
    return 'bg-slate-100 text-slate-500';
  }
}
