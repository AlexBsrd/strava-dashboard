import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StravaService} from '../../services/strava.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(private stravaService: StravaService) {
  }

  login() {
    this.stravaService.authenticate();
  }
}
