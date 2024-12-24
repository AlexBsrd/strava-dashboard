import {HttpInterceptorFn} from '@angular/common/http';
import {environment} from '../environments/environment';
import {Router} from '@angular/router';
import {inject} from '@angular/core';
import {catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Pour l'API backend
  if (req.url.startsWith(environment.apiUrl)) {
    const cloned = req.clone({
      setHeaders: {
        'x-api-key': environment.apiKey
      }
    });
    return next(cloned);
  }

  // Pour les requêtes vers Strava
  const token = localStorage.getItem('strava_token');
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(cloned).pipe(
      catchError(error => {
        // Si l'erreur est 401 (non autorisé) ou une erreur liée à l'authentification Strava
        if (error.status === 401 ||
          (error.error && error.error.message && error.error.message.includes('Authorization Error'))) {
          // Nettoyer le localStorage
          localStorage.clear();
          // Rediriger vers la page de login
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
