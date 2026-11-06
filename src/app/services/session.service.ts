import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  updateActivity(): Observable<void> {
    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) return new Observable();

    return this.http.post<void>(`${this.apiUrl}/sessions/${athleteId}/activity`, {});
  }

  checkSession(athleteId: string): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/sessions/${athleteId}/check`);
  }
}
