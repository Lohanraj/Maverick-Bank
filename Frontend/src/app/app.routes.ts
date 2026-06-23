import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { EmployeeDashboard } from './pages/employee/employee-dashboard';
import { AdminDashboard } from './pages/admin/admin-dashboard';
import { authGuard, customerGuard, employeeGuard, adminGuard } from './services/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // Customer routes (protected)
  { path: 'dashboard', component: Dashboard, canActivate: [customerGuard] },

  // Employee routes (protected)
  { path: 'employee', component: EmployeeDashboard, canActivate: [employeeGuard] },

  // Admin routes (protected)
  { path: 'admin', component: AdminDashboard, canActivate: [adminGuard] },

  // Redirects
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
