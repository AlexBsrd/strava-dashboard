import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Observable, of, throwError} from 'rxjs';
import {finalize, map, shareReplay} from 'rxjs/operators';
import {environment} from '../environments/environment';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
}

/** Clés d'authentification : seules celles-ci sont effacées à la déconnexion (objectifs, réglages et cache sont conservés) */
const AUTH_KEYS = ['strava_token', 'strava_refresh_token', 'strava_token_expires_at', 'strava_athlete_id'];
/** Marge avant expiration à partir de laquelle on rafraîchit le token */
const REFRESH_MARGIN_S = 5 * 60;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private refreshInFlight$: Observable<string> | null = null;

  constructor(private http: HttpClient, private router: Router) {
  }

  /** Session locale présente (le token d'accès peut être expiré : il sera rafraîchi) */
  hasSession(): boolean {
    return !!localStorage.getItem('strava_refresh_token') && !!localStorage.getItem('strava_athlete_id');
  }

  /** Échange le code OAuth via le backend, qui détient le client_secret */
  exchangeCode(code: string): Observable<void> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/token`, {code}).pipe(
      map(response => this.store(response))
    );
  }

  /** Token d'accès valide, rafraîchi au besoin */
  getValidToken(): Observable<string> {
    const token = localStorage.getItem('strava_token');
    const expiresAt = Number(localStorage.getItem('strava_token_expires_at'));
    if (token && Date.now() / 1000 < expiresAt - REFRESH_MARGIN_S) {
      return of(token);
    }
    return this.refresh();
  }

  /** Rafraîchit le token via le backend ; les appels simultanés partagent la même requête */
  refresh(): Observable<string> {
    const refreshToken = localStorage.getItem('strava_refresh_token');
    if (!refreshToken) {
      return throwError(() => ({status: 401, message: 'No refresh token'}));
    }
    this.refreshInFlight$ ??= this.http.post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, {
      refresh_token: refreshToken,
      athleteId: localStorage.getItem('strava_athlete_id')
    }).pipe(
      map(response => {
        this.store(response);
        return response.access_token;
      }),
      finalize(() => this.refreshInFlight$ = null),
      shareReplay(1)
    );
    return this.refreshInFlight$;
  }

  /** Efface uniquement l'authentification et renvoie vers la connexion */
  logout(): void {
    AUTH_KEYS.forEach(key => localStorage.removeItem(key));
    this.router.navigate(['/login']);
  }

  private store(response: TokenResponse): void {
    localStorage.setItem('strava_token', response.access_token);
    localStorage.setItem('strava_refresh_token', response.refresh_token);
    localStorage.setItem('strava_token_expires_at', response.expires_at.toString());
    if (response.athlete) {
      localStorage.setItem('strava_athlete_id', response.athlete.id.toString());
    }
  }
}
