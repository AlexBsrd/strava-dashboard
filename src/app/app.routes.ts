import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  }
];
