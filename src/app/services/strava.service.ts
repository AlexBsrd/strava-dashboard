import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Activity} from '../models/activity';
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class StravaService {
  private apiUrl = 'https://www.strava.com/api/v3';
  private clientId = environment.stravaClientId;
  private clientSecret = environment.stravaClientSecret;
  private redirectUri = environment.redirectUri;

  constructor(private http: HttpClient) {
  }

  getActivities(period: 'week' | 'month' | 'current_year'): Observable<Activity[]> {
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
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${localStorage.getItem('strava_token')}`
    );

    return this.getAllActivities(after, headers);
  }

  authenticate(): void {
    const scope = 'read,activity:read_all';
    window.location.href =
      `https://www.strava.com/oauth/authorize?client_id=${this.clientId}` +
      `&redirect_uri=${this.redirectUri}&response_type=code&scope=${scope}`;
  }

  handleAuthCallback(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/oauth/token`, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code'
    });
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
}
