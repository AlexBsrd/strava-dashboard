import {TestBed} from '@angular/core/testing';
import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {AuthService} from './auth.service';
import {authInterceptor} from '../interceptors/auth.interceptor';
import {environment} from '../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const now = () => Math.floor(Date.now() / 1000);
  const login = (expiresAt: number) => {
    localStorage.setItem('strava_token', 'old');
    localStorage.setItem('strava_refresh_token', 'refresh');
    localStorage.setItem('strava_token_expires_at', String(expiresAt));
    localStorage.setItem('strava_athlete_id', '42');
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('renvoie le token courant sans appel réseau tant qu\'il est valide', () => {
    login(now() + 3600);
    let token = '';
    service.getValidToken().subscribe(t => token = t);
    expect(token).toBe('old');
  });

  it('rafraîchit une seule fois pour des appels simultanés quand le token expire', () => {
    login(now() - 10);
    const tokens: string[] = [];
    service.getValidToken().subscribe(t => tokens.push(t));
    service.getValidToken().subscribe(t => tokens.push(t));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.body).toEqual({refresh_token: 'refresh', athleteId: '42'});
    req.flush({access_token: 'new', refresh_token: 'refresh2', expires_at: now() + 21600});

    expect(tokens).toEqual(['new', 'new']);
    expect(localStorage.getItem('strava_token')).toBe('new');
    expect(localStorage.getItem('strava_refresh_token')).toBe('refresh2');
  });

  it('la déconnexion conserve objectifs, réglages et cache', () => {
    login(now() + 3600);
    localStorage.setItem('strava_goals', '[1]');
    localStorage.setItem('theme', 'dark');
    service.logout();
    expect(localStorage.getItem('strava_token')).toBeNull();
    expect(localStorage.getItem('strava_athlete_id')).toBeNull();
    expect(localStorage.getItem('strava_goals')).toBe('[1]');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('intercepteur : sur un 401 Strava, rafraîchit puis rejoue la requête', () => {
    login(now() + 3600);
    let body: unknown;
    http.get('https://www.strava.com/api/v3/athlete').subscribe(b => body = b);

    const first = httpMock.expectOne('https://www.strava.com/api/v3/athlete');
    expect(first.request.headers.get('Authorization')).toBe('Bearer old');
    first.flush({}, {status: 401, statusText: 'Unauthorized'});

    httpMock.expectOne(`${environment.apiUrl}/auth/refresh`)
      .flush({access_token: 'new', refresh_token: 'refresh', expires_at: now() + 21600});

    const retry = httpMock.expectOne('https://www.strava.com/api/v3/athlete');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush({id: 42});
    expect(body).toEqual({id: 42});
  });

  it('intercepteur : refresh refusé, déconnexion', () => {
    login(now() - 10);
    http.get('https://www.strava.com/api/v3/athlete').subscribe({error: () => undefined});
    httpMock.expectOne(`${environment.apiUrl}/auth/refresh`)
      .flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(localStorage.getItem('strava_token')).toBeNull();
  });
});
