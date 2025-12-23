// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ThemeService } from './services/theme.service';
import { SportSidebarComponent } from './components/sport-sidebar/sport-sidebar.component';
import { SportConfigService } from './services/sport-config.service';
import { ActivityCacheService } from './services/activity-cache.service';
import { Activity } from './models/activity';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SportSidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  isDarkTheme = false;
  sportConfigOpen = false;
  activities: Activity[] = [];
  currentRoute = '/';

  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private sportConfigService: SportConfigService,
    private activityCacheService: ActivityCacheService,
    private router: Router
  ) {}

  ngOnInit() {
    this.themeService.theme$.pipe(takeUntil(this.destroy$)).subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
    });

    // S'abonner au cache d'activités pour les passer à la sidebar
    this.activityCacheService.activities$
      .pipe(takeUntil(this.destroy$))
      .subscribe((activities: Activity[]) => {
        this.activities = activities;
        // Mettre à jour les types disponibles dans le service de config
        if (activities.length > 0) {
          this.sportConfigService.detectAvailableTypes(activities);
        }
      });

    // Mettre à jour la route courante et fermer la sidebar mobile lors d'un changement de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects || event.url;
      this.sportConfigOpen = false;
    });

    // Initialiser avec la route courante
    this.currentRoute = this.router.url;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleSportConfig() {
    this.sportConfigOpen = !this.sportConfigOpen;
  }

  closeSportConfig() {
    this.sportConfigOpen = false;
  }
}
