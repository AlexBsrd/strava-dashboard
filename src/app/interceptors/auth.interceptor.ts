import {HttpInterceptorFn} from '@angular/common/http';
import {environment} from '../environments/environment';
import {inject} from '@angular/core';
import {catchError, switchMap} from 'rxjs/operators';
import {throwError} from 'rxjs';
import {AuthService} from '../services/auth.service';

const STRAVA_API = 'https://www.strava.com/api/';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Pour l'API backend
  if (req.url.startsWith(environment.apiUrl)) {
    return next(req.clone({setHeaders: {'x-api-key': environment.apiKey}}));
  }

  if (!req.url.startsWith(STRAVA_API)) {
    return next(req);
  }

  // Pour l'API Strava : token rafraîchi avant expiration, et un nouvel essai si Strava le refuse (401)
  const auth = inject(AuthService);
  const withToken = (token: string) => next(req.clone({setHeaders: {Authorization: `Bearer ${token}`}}));

  return auth.getValidToken().pipe(
    switchMap(token => withToken(token).pipe(
      catchError(error => error.status === 401
        ? auth.refresh().pipe(switchMap(withToken))
        : throwError(() => error))
    )),
    catchError(error => {
      // Refresh token révoqué ou absent : il faut se reconnecter
      if (error.status === 401) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
