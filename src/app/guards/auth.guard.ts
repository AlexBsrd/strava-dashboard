import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {StravaService} from '../services/strava.service';
import {SessionService} from '../services/session.service';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private stravaService: StravaService,
    private sessionService: SessionService
  ) {
  }

  canActivate(): Observable<boolean> {
    const token = localStorage.getItem('strava_token');
    const expiresAt = localStorage.getItem('strava_token_expires_at');
    const athleteId = localStorage.getItem('strava_athlete_id');

    if (!token || !expiresAt || !athleteId) {
      this.stravaService.authenticate();
      return of(false);
    }

    // Vérifier si le token est expiré
    if (Date.now() / 1000 > Number(expiresAt)) {
      this.stravaService.authenticate();
      return of(false);
    }

    // Vérifier la session
    return this.sessionService.checkSession(athleteId).pipe(
      map(() => true),
      catchError(() => {
        // Si la session n'est pas valide, nettoyer et rediriger
        localStorage.clear();
        this.stravaService.authenticate();
        return of(false);
      })
    );
  }
}
