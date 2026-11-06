import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {SessionService} from '../services/session.service';
import {AuthService} from '../services/auth.service';
import {Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService
  ) {
  }

  canActivate(): Observable<boolean> {
    if (!this.authService.hasSession()) {
      this.authService.logout();
      return of(false);
    }

    // Token rafraîchi si expiré, puis vérification de la session backend (met aussi à jour lastActivity)
    return this.authService.getValidToken().pipe(
      switchMap(() => this.sessionService.checkSession(localStorage.getItem('strava_athlete_id')!)),
      map(() => true),
      catchError(error => {
        // Session inconnue ou refresh refusé : reconnexion nécessaire
        if (error.status === 401 || error.status === 404) {
          this.authService.logout();
          return of(false);
        }
        // Backend injoignable (réseau, démarrage à froid de Vercel) : on laisse passer,
        // les appels Strava gèrent eux-mêmes leurs erreurs
        return of(true);
      })
    );
  }
}
