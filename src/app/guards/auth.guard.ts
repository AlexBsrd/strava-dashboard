import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {SessionService} from '../services/session.service';
import {AuthService} from '../services/auth.service';
import {switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService
  ) {
  }

  canActivate(): boolean {
    if (!this.authService.hasSession()) {
      this.authService.logout();
      return false;
    }

    // Session locale présente : la page s'affiche tout de suite (avec le cache d'activités).
    // Le token et la session backend sont vérifiés en arrière-plan : le backend (Vercel)
    // peut mettre plusieurs secondes à répondre au démarrage à froid.
    this.authService.getValidToken().pipe(
      switchMap(() => this.sessionService.checkSession(localStorage.getItem('strava_athlete_id')!))
    ).subscribe({
      error: error => {
        // Session inconnue ou refresh refusé : reconnexion nécessaire
        // (backend injoignable : on laisse faire, les appels Strava gèrent leurs erreurs)
        if (error.status === 401 || error.status === 404) {
          this.authService.logout();
        }
      }
    });
    return true;
  }
}
