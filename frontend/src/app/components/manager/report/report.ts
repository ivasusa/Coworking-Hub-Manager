import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../services/reservation.service';

@Component({
  selector: 'app-manager-report',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './report.html',
})
export class ManagerReportComponent {
  selectedMonth = this.currentMonthStr();
  maxMonth = this.currentMonthStr();
  reportData: any = null;
  loading = false;
  error = '';

  constructor(private reservationService: ReservationService) {}

  generate(): void {
    this.loading = true;
    this.error = '';
    this.reportData = null;
    this.reservationService.getManagerMonthlyReport(this.selectedMonth).subscribe({
      next: (data) => { this.reportData = data; this.loading = false; },
      error: (err) => { this.error = err.error?.message ?? 'Failed to load report'; this.loading = false; },
    });
  }

  printPdf(): void {
    const [year, mon] = this.selectedMonth.split('-').map(Number);
    const monthName = new Date(year, mon - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });

    const rows = this.reportData.spaces.flatMap((space: any) =>
      space.elements.map((el: any) => `
        <tr>
          <td>${space.name}</td>
          <td>${space.city}</td>
          <td>${el.name}</td>
          <td>${el.type}${el.deskCount ? ' (' + el.deskCount + ' desks)' : ''}</td>
          <td class="num">${el.bookedHours} h</td>
          <td class="num">${el.capacityHours} h</td>
          <td class="num bar-cell">
            <div class="bar-wrap"><div class="bar" style="width:${el.utilization}%"></div></div>
            ${el.utilization.toFixed(1)} %
          </td>
        </tr>`)
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Monthly Report – ${monthName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    p.sub { color: #64748b; font-size: 11px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .bar-cell { min-width: 120px; }
    .bar-wrap { background: #e2e8f0; border-radius: 4px; height: 8px; width: 80px; display: inline-block; vertical-align: middle; margin-right: 6px; }
    .bar { background: #3b82f6; border-radius: 4px; height: 8px; }
    footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: right; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Monthly Capacity Report</h1>
  <p class="sub">${monthName} &nbsp;·&nbsp; ${this.reportData.daysInMonth} days &nbsp;·&nbsp; Working hours: 08:00–20:00</p>
  <table>
    <thead>
      <tr>
        <th>Space</th><th>City</th><th>Element</th><th>Type</th>
        <th class="num">Booked</th><th class="num">Capacity</th><th class="num">Utilization</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>Generated ${new Date().toLocaleString()}</footer>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  utilizationColor(pct: number): string {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 40) return 'bg-amber-400';
    return 'bg-blue-400';
  }

  private currentMonthStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
