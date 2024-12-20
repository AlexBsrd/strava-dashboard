import {Routes} from '@angular/router';
import {AuthGuard} from './guards/auth.guard';
import {PerformanceComparisonComponent} from './components/performance-comparison/performance-comparison.component';

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
    path: 'callback',
    loadComponent: () =>
      import('./components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: 'comparison',
    component: PerformanceComparisonComponent,
    canActivate: [AuthGuard],
    title: 'Comparaison des performances'
  }
];
