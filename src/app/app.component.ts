// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService } from './services/theme.service';
import { SportSidebarComponent } from './components/sport-sidebar/sport-sidebar.component';
import { SportConfigService } from './services/sport-config.service';
import { ActivityCacheService } from './services/activity-cache.service';
import { PeriodStateService } from './services/period-state.service';
import { Activity } from './models/activity';
import { PeriodType } from './types/period';

const STORAGE_KEY = 'strava_language';
const SUPPORTED_LANGS = ['fr', 'en'];
const DEFAULT_LANG = 'fr';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SportSidebarComponent,
    TranslateModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  isDarkTheme = false;
  sportConfigOpen = false;
  activities: Activity[] = [];
  filteredActivities: Activity[] = [];
  currentRoute = '/';
  isHeaderVisible = true;
  currentLang = 'fr';
  private currentPeriod: PeriodType = 'week';

  private destroy$ = new Subject<void>();
  private lastScrollY = 0;
  private scrollThreshold = 10; // Pixels avant de déclencher le masquage

  constructor(
    private themeService: ThemeService,
    private translateService: TranslateService,
    private sportConfigService: SportConfigService,
    private activityCacheService: ActivityCacheService,
    private periodStateService: PeriodStateService,
    private router: Router
  ) {
    // Configure available languages
    this.translateService.addLangs(SUPPORTED_LANGS);
    this.translateService.setDefaultLang(DEFAULT_LANG);
  }

  ngOnInit() {
    // Initialize language from localStorage or browser preference
    this.initializeLanguage();

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
        // Mettre à jour les activités filtrées
        this.updateFilteredActivities();
      });

    // S'abonner aux changements de période pour le dashboard
    this.periodStateService.dashboardPeriod$
      .pipe(takeUntil(this.destroy$))
      .subscribe((period: PeriodType) => {
        this.currentPeriod = period;
        this.updateFilteredActivities();
      });

    // Mettre à jour la route courante et fermer la sidebar mobile lors d'un changement de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects || event.url;
      this.sportConfigOpen = false;
      this.updateFilteredActivities();
    });

    // Initialiser avec la route courante
    this.currentRoute = this.router.url;

    // Gérer le masquage du header au scroll (mobile uniquement)
    this.setupScrollListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Retirer le listener de scroll
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll.bind(this));
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLanguage() {
    const newLang = this.currentLang === 'fr' ? 'en' : 'fr';
    this.translateService.use(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    this.currentLang = newLang;
  }

  private initializeLanguage(): void {
    const storedLang = localStorage.getItem(STORAGE_KEY);

    if (storedLang && SUPPORTED_LANGS.includes(storedLang)) {
      this.translateService.use(storedLang);
      this.currentLang = storedLang;
    } else {
      // Detect browser language
      const browserLang = navigator.language?.split('-')[0]?.toLowerCase() || DEFAULT_LANG;
      const lang = SUPPORTED_LANGS.includes(browserLang) ? browserLang : DEFAULT_LANG;
      this.translateService.use(lang);
      this.currentLang = lang;
    }
  }

  toggleSportConfig() {
    this.sportConfigOpen = !this.sportConfigOpen;
  }

  closeSportConfig() {
    this.sportConfigOpen = false;
  }

  private updateFilteredActivities() {
    // Sur les pages Dashboard et Activities, filtrer par période
    // Sur les autres pages, afficher toutes les activités
    if (this.currentRoute === '/' || this.currentRoute === '' || this.currentRoute === '/activities') {
      this.filteredActivities = this.activityCacheService.getFilteredActivities(this.currentPeriod);
    } else {
      this.filteredActivities = this.activities;
    }
  }

  private setupScrollListener() {
    // Détecter le scroll uniquement sur mobile
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }
  }

  private handleScroll() {
    // Ne masquer le header que sur mobile (< 768px)
    if (window.innerWidth >= 768) {
      this.isHeaderVisible = true;
      return;
    }

    const currentScrollY = window.scrollY;

    // Ne pas masquer si on est tout en haut
    if (currentScrollY < 50) {
      this.isHeaderVisible = true;
      this.lastScrollY = currentScrollY;
      return;
    }

    // Vérifier si on scroll vers le bas ou vers le haut
    if (Math.abs(currentScrollY - this.lastScrollY) > this.scrollThreshold) {
      if (currentScrollY > this.lastScrollY) {
        // Scroll vers le bas - masquer le header
        this.isHeaderVisible = false;
      } else {
        // Scroll vers le haut - afficher le header
        this.isHeaderVisible = true;
      }
      this.lastScrollY = currentScrollY;
    }
  }
}
