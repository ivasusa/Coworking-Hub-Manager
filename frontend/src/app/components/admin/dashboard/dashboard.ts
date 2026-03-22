import { Component, OnInit } from '@angular/core';

import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { ChartData, ChartOptions } from 'chart.js';
import { UserService } from '../../../services/user.service';
import { SpaceService } from '../../../services/space.service';
import { User } from '../../../models/user.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  imports: [BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  pendingUsers: User[] = [];
  allUsers: User[] = [];
  pendingSpaces: any[] = [];
  activeTab: 'pending' | 'all' | 'spaces' | 'stats' = 'pending';
  
  message = '';
  error = '';

  popularityData: ChartData<'bar'> = { labels: [], datasets: [] };
  revenueData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  constructor(private userService: UserService, private spaceService: SpaceService) {}

  ngOnInit(): void {
    this.loadPending();
    this.loadAll();
    this.loadPendingSpaces();
    this.loadStats();
  }

  loadStats(): void {
    this.spaceService.getAdminStats().subscribe({
      next: (stats: any[]) => {
        const labels = stats.map((s: any) => s.name);
        this.popularityData = {
          labels,
          datasets: [{
            data: stats.map((s) => s.reservationCount),
            backgroundColor: '#3b82f6',
            borderRadius: 6,
            label: 'Reservations',
          }],
        };
        this.revenueData = {
          labels,
          datasets: [{
            data: stats.map((s) => s.revenue),
            backgroundColor: '#10b981',
            borderRadius: 6,
            label: 'Revenue (€)',
          }],
        };
      },
    });
  }

  loadPending(): void {
    this.userService.getPendingUsers().subscribe({
      next: (users) => (this.pendingUsers = users),
      error: () => (this.error = 'Failed to load pending users'),
    });
  }

  loadAll(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => (this.allUsers = users),
    });
  }

  loadPendingSpaces(): void {
    this.spaceService.getPendingSpaces().subscribe({
      next: (spaces) => (this.pendingSpaces = spaces),
    });
  }

  approveSpace(id: string): void {
    this.spaceService.approveSpace(id).subscribe({
      next: () => {
        this.pendingSpaces = this.pendingSpaces.filter((s) => s._id !== id);
        this.showMessage('Space approved and now visible to all users');
      },
      error: () => (this.error = 'Approval failed'),
    });
  }

  approve(id: string): void {
    this.userService.approveUser(id).subscribe({
      next: () => {
        this.pendingUsers = this.pendingUsers.filter((u) => u._id !== id);
        this.loadAll();
        this.showMessage('User approved successfully');
      },
      error: () => (this.error = 'Approval failed'),
    });
  }

  reject(id: string): void {
    this.userService.rejectUser(id).subscribe({
      next: () => {
        this.pendingUsers = this.pendingUsers.filter((u) => u._id !== id);
        this.loadAll();
        this.showMessage('User rejected');
      },
      error: () => (this.error = 'Rejection failed'),
    });
  }

  deleteUser(id: string): void {
    if (!confirm('Delete this user permanently?')) return;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter((u) => u._id !== id);
        this.showMessage('User deleted');
      },
      error: () => (this.error = 'Delete failed'),
    });
  }

  private showMessage(msg: string): void {
    this.message = msg;
    this.error = '';
    setTimeout(() => (this.message = ''), 3000);
  }

  imageUrl(path: string): string {
    if (!path) return 'http://localhost:4000/uploads/profiles/default.png';
    return `http://localhost:4000/${path}`;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      active:   'bg-green-50 text-green-700',
      pending:  'bg-amber-50 text-amber-700',
      rejected: 'bg-red-50 text-red-600',
      blocked:  'bg-slate-100 text-slate-500',
    };
    return map[status] ?? '';
  }
}
