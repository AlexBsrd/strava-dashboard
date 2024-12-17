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
    path: 'challenges',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/challenges/challenges-dashboard/challenges-dashboard.component')
            .then(m => m.ChallengesDashboardComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./components/challenges/challenge-create/challenge-create.component')
            .then(m => m.ChallengeCreateComponent),
        canActivate: [AuthGuard]
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/challenges/challenge-detail/challenge-detail.component')
            .then(m => m.ChallengeDetailComponent),
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  }
];
