import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of, tap} from 'rxjs';
import {map} from 'rxjs/operators';
import {Activity} from '../models/activity';
import {environment} from "../environments/environment";
import {ActivityCacheService} from "./activity-cache.service";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    username: string | null;
    resource_state: number;
    firstname: string;
    lastname: string;
    bio: string;
    city: string;
    state: string;
    country: string;
    sex: string;
    premium: boolean;
    summit: boolean;
    created_at: string;
    updated_at: string;
    badge_type_id: number;
    weight: number;
    profile_medium: string;
    profile: string;
    friend: null;
    follower: null;
    blocked: boolean;
    can_follow: boolean;
    follower_count: number;
    friend_count: number;
    mutual_friend_count: number;
    athlete_type: number;
    date_preference: string;
    measurement_preference: string;
    clubs: any[];
    ftp: number | null;
    bikes: Array<{
      id: string;
      primary: boolean;
      name: string;
      resource_state: number;
      distance: number;
    }>;
    shoes: Array<{
      id: string;
      primary: boolean;
      name: string;
      resource_state: number;
      distance: number;
    }>;
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
    private activityCache: ActivityCacheService
  ) {
  }

  getActivities(period: 'week' | 'month' | 'current_year'): Observable<Activity[]> {
    // Vérifier si nous avons besoin de rafraîchir les données
    if (!this.activityCache.needsRefresh(period)) {
      return of(this.activityCache.getFilteredActivities(period));
    }

    let after = new Date();

    // Ajuster la date de début selon la période
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
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${localStorage.getItem('strava_token')}`
    );

    return this.getAllActivities(after, headers).pipe(
      tap(activities => {
        this.activityCache.setActivities(activities, period);
      }),
      map(activities => {
        return this.activityCache.getFilteredActivities(period);
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
              // Plus d'activités à récupérer
              subscriber.next(accumulatedActivities);
              subscriber.complete();
            } else {
              // Récupérer la page suivante
              fetchPage(page + 1, [...accumulatedActivities, ...activities]);
            }
          },
          error: (error) => subscriber.error(error)
        });
      };

      fetchPage(1); // Commencer à la première page
    });
  }

  getActivitiesByDateRange(startDate: string, endDate: string): Observable<Activity[]> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${localStorage.getItem('strava_token')}`
    );

    const after = new Date(startDate).getTime() / 1000;
    const before = new Date(endDate).getTime() / 1000;

    return this.getAllActivities(new Date(startDate), headers).pipe(
      map(activities => {
        return activities.filter(activity => {
          const activityDate = new Date(activity.start_date).getTime() / 1000;
          return activityDate >= after && activityDate <= before;
        });
      })
    );
  }
}
