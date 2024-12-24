import {Routes} from '@angular/router';
import {AuthGuard} from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'activities',
    loadComponent: () =>
      import('./components/activities/activities.component').then(m => m.ActivitiesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  }
];
