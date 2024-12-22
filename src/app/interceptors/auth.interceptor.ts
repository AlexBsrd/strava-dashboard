import {HttpInterceptorFn} from '@angular/common/http';
import {environment} from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // On vérifie si la requête est destinée à notre API backend
  if (req.url.startsWith(environment.apiUrl)) {
    const cloned = req.clone({
      setHeaders: {
        'x-api-key': environment.apiKey
      }
    });
    return next(cloned);
  }

  // Pour les requêtes vers Strava, on ajoute le bearer token comme avant
  const token = localStorage.getItem('strava_token');
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
