import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Challenge} from '../models/challenge/challenge.model';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000/api'}/challenges`;

  constructor(private http: HttpClient) {
  }

  getChallenges(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(this.apiUrl);
  }

  getChallengeById(id: string): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.apiUrl}/${id}`);
  }

  createChallenge(challenge: Partial<Challenge>): Observable<Challenge> {
    return this.http.post<Challenge>(this.apiUrl, challenge);
  }

  joinChallenge(challengeId: string): Observable<Challenge> {
    return this.http.post<Challenge>(`${this.apiUrl}/${challengeId}/join`, {});
  }

  updateChallenge(challengeId: string, challenge: Partial<Challenge>): Observable<Challenge> {
    return this.http.put<Challenge>(`${this.apiUrl}/${challengeId}`, challenge);
  }

  deleteChallenge(challengeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${challengeId}`);
  }
}
