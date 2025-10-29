import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {Activity} from '../models/activity';
import {environment} from "../environments/environment";
import {ActivityCacheService} from "./activity-cache.service";
import {SessionService} from "./session.service";
import {Router} from '@angular/router';
import {PeriodType} from "../types/period";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StravaService {
  private apiUrl = 'https://www.strava.com/api/v3';
  private clientId = environment.stravaClientId;
  private clientSecret = environment.stravaClientSecret;
  private redirectUri = environment.redirectUri;

  constructor(
    private http: HttpClient,
    private activityCache: ActivityCacheService,
    private sessionService: SessionService,
    private router: Router
  ) {
  }

  checkTokenExpiration() {
    const expiresAt = localStorage.getItem('strava_token_expires_at');
    if (expiresAt && Date.now() / 1000 > Number(expiresAt)) {
      localStorage.clear();
      this.router.navigate(['/login']);
      return true;
    }
    return false;
  }

  getActivities(period: PeriodType): Observable<Activity[]> {
    if (this.checkTokenExpiration()) {
      return throwError(() => new Error('Token expired'));
    }

    const athlete = {
      id: localStorage.getItem('strava_athlete_id'),
      accessToken: localStorage.getItem('strava_token'),
      refreshToken: localStorage.getItem('strava_refresh_token'),
      expiresAt: localStorage.getItem('strava_token_expires_at'),
    };

    if (athlete.id && athlete.accessToken && athlete.refreshToken && athlete.expiresAt) {
      this.sessionService.startSession({
        athlete: {id: athlete.id},
        access_token: athlete.accessToken,
        refresh_token: athlete.refreshToken,
        expires_at: Number(athlete.expiresAt)
      }).subscribe();
    }

    if (!this.activityCache.needsRefresh(period)) {
      return of(this.activityCache.getFilteredActivities(period));
    }

    let after = new Date();

    switch (period) {
      case 'week':
        after.setDate(after.getDate() - 7);
        break;
      case 'month':
        after.setDate(after.getDate() - 30);
        break;
      case 'current_year':
        after = new Date(after.getFullYear(), 0, 1);
        break;
      case '2024':
        after = new Date(2024, 0, 1);
        break;
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${athlete.accessToken}`
    );

    return this.getAllActivities(after, headers).pipe(
      tap(activities => {
        this.activityCache.setActivities(activities, period);
      }),
      map(activities => {
        return this.activityCache.getFilteredActivities(period);
      }),
      catchError(error => {
        // Si l'erreur est liée à l'authentification
        if (error.status === 401 ||
          (error.error && error.error.message && error.error.message.includes('Authorization Error'))) {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  authenticate(): void {
    const scope = 'read,activity:read_all';
    window.location.href =
      `https://www.strava.com/oauth/authorize?client_id=${this.clientId}` +
      `&redirect_uri=${this.redirectUri}&response_type=code&scope=${scope}`;
  }

  handleAuthCallback(code: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/oauth/token`, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code'
    }).pipe(
      tap(response => {
        localStorage.setItem('strava_token', response.access_token);
        localStorage.setItem('strava_refresh_token', response.refresh_token);
        localStorage.setItem('strava_token_expires_at', response.expires_at.toString());
        localStorage.setItem('strava_athlete_id', response.athlete.id.toString());

        this.sessionService.startSession(response).subscribe();
      }),
      catchError(error => {
        console.error('Erreur lors de l\'authentification:', error);
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  private getActivitiesPage(after: Date, page: number = 1, headers: HttpHeaders): Observable<Activity[]> {
    return this.http
      .get<Activity[]>(`${this.apiUrl}/athlete/activities`, {
        headers,
        params: {
          after: Math.floor(after.getTime() / 1000).toString(),
          per_page: '200',
          page: page.toString()
        }
      })
      .pipe(
        map(activities => activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          distance: activity.distance / 1000,
          moving_time: activity.moving_time,
          elapsed_time: activity.elapsed_time,
          total_elevation_gain: activity.total_elevation_gain,
          start_date: new Date(activity.start_date),
          average_speed: (activity.average_speed * 3.6),
          type: activity.type
        })))
      );
  }

  private getAllActivities(after: Date, headers: HttpHeaders): Observable<Activity[]> {
    return new Observable<Activity[]>(subscriber => {
      const fetchPage = (page: number, accumulatedActivities: Activity[] = []) => {
        this.getActivitiesPage(after, page, headers).subscribe({
          next: (activities) => {
            if (activities.length === 0) {
              subscriber.next(accumulatedActivities);
              subscriber.complete();
            } else {
              fetchPage(page + 1, [...accumulatedActivities, ...activities]);
            }
          },
          error: (error) => subscriber.error(error)
        });
      };

      fetchPage(1);
    });
  }

  /**
   * Précharge toutes les activités des 2 dernières années en arrière-plan.
   * Cette méthode est silencieuse : pas de spinner, pas d'erreur affichée.
   * Elle peuple le cache localStorage pour des chargements instantanés ultérieurs.
   */
  preloadAllRecentActivities(): Observable<Activity[]> {
    if (this.checkTokenExpiration()) {
      return of([]);
    }

    const athlete = {
      id: localStorage.getItem('strava_athlete_id'),
      accessToken: localStorage.getItem('strava_token'),
      refreshToken: localStorage.getItem('strava_refresh_token'),
      expiresAt: localStorage.getItem('strava_token_expires_at'),
    };

    if (!athlete.id || !athlete.accessToken || !athlete.refreshToken || !athlete.expiresAt) {
      return of([]);
    }

    // Démarrer la session avec le backend
    this.sessionService.startSession({
      athlete: {id: athlete.id},
      access_token: athlete.accessToken,
      refresh_token: athlete.refreshToken,
      expires_at: Number(athlete.expiresAt)
    }).subscribe();

    // Calculer la date d'il y a 2 ans
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${athlete.accessToken}`
    );

    return this.getAllActivities(twoYearsAgo, headers).pipe(
      tap(activities => {
        // Sauvegarder dans le cache (période 'current_year' pour compatibilité)
        this.activityCache.setActivities(activities, 'current_year');
      }),
      catchError(error => {
        // Erreur silencieuse : on ne fait rien, le cache restera vide
        console.warn('Background preload failed (silent):', error);
        return of([]);
      })
    );
  }
}
