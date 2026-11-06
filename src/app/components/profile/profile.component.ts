// src/app/components/profile/profile.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {AthleteProfile, AthleteService, AthleteSummary} from '../../services/athlete.service';
import {ProfileCacheService} from '../../services/profile-cache.service';
import {Subject, takeUntil} from 'rxjs';
import {StravaService} from "../../services/strava.service";
import {animate, style, transition, trigger} from '@angular/animations';
import {ProfileSkeletonComponent} from "./skeleton/profile-skeleton.component";
import {SportIconComponent} from "../sport-icon/sport-icon.component";
import {ActivityHeatmapComponent} from "../activity-heatmap/activity-heatmap.component";
import {ActivityCacheService} from "../../services/activity-cache.service";
import {Activity} from "../../models/activity";

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({opacity: 0}),
    animate('300ms ease-out', style({opacity: 1}))
  ])
]);

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule, ProfileSkeletonComponent, SportIconComponent, ActivityHeatmapComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: AthleteProfile | null = null;
  summary: AthleteSummary | null = null;
  heatmapActivities: Activity[] = [];
  isLoadingProfile = true;
  isLoadingSummary = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private athleteService: AthleteService,
    private profileCache: ProfileCacheService,
    private stravaService: StravaService,
    private translateService: TranslateService,
    private activityCache: ActivityCacheService
  ) {
  }


  ngOnInit() {
    // S'abonner aux changements du cache
    this.profileCache.getProfileData$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cache => {
        if (cache.profile) {
          this.profile = cache.profile;
          this.isLoadingProfile = false;
        }
        if (cache.summary) {
          this.summary = cache.summary;
          this.isLoadingSummary = false;
        }
      });

    // Calendrier : alimenté par le cache d'activités (2 ans), mis à jour à chaque synchro
    this.activityCache.activities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activities => this.heatmapActivities = activities);

    this.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDistance(km: number): string {
    return km.toFixed(1) + ' km';
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }

  formatElevation(meters: number): string {
    return Math.round(meters) + ' m';
  }

  formatDate(date: string): string {
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(date).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatMemberSince(date: string): string {
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(date).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric'
    });
  }

  reconnect() {
    this.profileCache.clear(); // Vider le cache
    this.stravaService.authenticate(); // Rediriger vers la page d'authentification Strava
  }

  private loadProfile() {
    // Vérifier si on a besoin de rafraîchir les données
    if (!this.profileCache.needsRefresh()) {
      this.isLoadingProfile = false;
      this.isLoadingSummary = false;
      return;
    }

    this.isLoadingProfile = true;
    this.isLoadingSummary = true;
    this.error = null;

    // Charger le profil d'abord (rapide)
    this.athleteService.getAthleteProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isLoadingProfile = false;
          // Mettre à jour le cache avec le profil seulement
          this.profileCache.setProfileOnly(profile);
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.error = this.translateService.instant('errors.loading_error.title');
          this.isLoadingProfile = false;
          this.isLoadingSummary = false;
        }
      });

    // Charger le summary en parallèle (lent - récupère toutes les activités)
    this.athleteService.getAthleteSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.isLoadingSummary = false;
          // Mettre à jour le cache avec le summary
          if (this.profile) {
            this.profileCache.setProfileData(this.profile, summary);
          }
        },
        error: (error) => {
          console.error('Error loading summary:', error);
          this.error = this.translateService.instant('errors.loading_error.title');
          this.isLoadingSummary = false;
        }
      });
  }
}
