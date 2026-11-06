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

  checkSession(athleteId: string): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/sessions/${athleteId}/check`);
  }
}
