import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { StravaService } from '../services/strava.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private stravaService: StravaService
  ) {}

  canActivate(): boolean {
    const token = localStorage.getItem('strava_token');
    const expiresAt = localStorage.getItem('strava_token_expires_at');

    if (!token || !expiresAt) {
      this.stravaService.authenticate();
      return false;
    }

    // Vérifier si le token est expiré
    if (Date.now() / 1000 > Number(expiresAt)) {
      this.stravaService.authenticate();
      return false;
    }

    return true;
  }
}
