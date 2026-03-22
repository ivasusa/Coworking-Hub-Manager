import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/auth/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'spaces/:id',
    loadComponent: () => import('./components/home/space-details/space-details').then((m) => m.SpaceDetailsComponent),
  },
  {
    path: 'member/profile',
    canActivate: [roleGuard],
    data: { roles: ['member'] },
    loadComponent: () => import('./components/member/profile/profile').then((m) => m.MemberProfileComponent),
  },
  {
    path: 'manager/profile',
    canActivate: [roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () => import('./components/manager/profile/profile').then((m) => m.ManagerProfileComponent),
  },
  {
    path: 'manager/spaces',
    canActivate: [roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () => import('./components/manager/spaces/spaces').then((m) => m.ManagerSpacesComponent),
  },
  {
    path: 'manager/report',
    canActivate: [roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () => import('./components/manager/report/report').then((m) => m.ManagerReportComponent),
  },
  {
    path: 'manager/calendar',
    canActivate: [roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () => import('./components/manager/calendar/calendar').then((m) => m.ManagerCalendarComponent),
  },
  {
    path: 'manager/reservations',
    canActivate: [roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () => import('./components/manager/reservations/reservations').then((m) => m.ManagerReservationsComponent),
  },
  {
    path: 'admin/dashboard',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./components/admin/dashboard/dashboard').then((m) => m.AdminDashboardComponent),
  },

  {
    path: 'secure-admin-access',
    loadComponent: () => import('./components/auth/admin-login/admin-login').then((m) => m.AdminLoginComponent),
  },
  { path: '**', redirectTo: '' },
];
