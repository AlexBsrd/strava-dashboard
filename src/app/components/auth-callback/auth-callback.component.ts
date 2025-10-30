import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {StravaService} from '../../services/strava.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.css']
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stravaService: StravaService
  ) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        console.log("code: " + code);
        this.stravaService.handleAuthCallback(code).subscribe({
          next: (response) => {
            localStorage.setItem('strava_token', response.access_token);
            localStorage.setItem('strava_refresh_token', response.refresh_token);
            localStorage.setItem('strava_token_expires_at', response.expires_at.toString());
            localStorage.setItem('strava_athlete_id', response.athlete.id.toString());

            // Rediriger vers le dashboard qui chargera les activités avec spinner
            this.router.navigate(['/']);
          },
          error: (error) => {
            console.error('Erreur d\'authentification:', error);
            this.router.navigate(['/']);
          }
        });
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}
