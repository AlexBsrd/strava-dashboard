import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.css']
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
  }

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.router.navigate(['/']);
      return;
    }
    // Rediriger vers le dashboard qui chargera les activités avec spinner
    this.authService.exchangeCode(code).subscribe({
      next: () => this.router.navigate(['/']),
      error: (error) => {
        console.error('Erreur d\'authentification:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}
