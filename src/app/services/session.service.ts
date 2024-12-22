// src/app/services/session.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';
import {Observable} from 'rxjs';

interface Session {
  athleteId: string;
  firstname: string;
  lastname: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  lastActivity: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  startSession(tokenResponse: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/sessions`, {
      athleteId: tokenResponse.athlete.id,
      firstname: tokenResponse.athlete.firstname,
      lastname: tokenResponse.athlete.lastname,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: tokenResponse.expires_at
    });
  }

  updateActivity(): Observable<void> {
    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) return new Observable();

    return this.http.post<void>(`${this.apiUrl}/sessions/${athleteId}/activity`, {});
  }

  checkSession(athleteId: string): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/sessions/${athleteId}/check`);
  }

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/sessions`);
  }

  endSession(): Observable<void> {
    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) return new Observable();

    return this.http.delete<void>(`${this.apiUrl}/sessions/${athleteId}`);
  }
}
