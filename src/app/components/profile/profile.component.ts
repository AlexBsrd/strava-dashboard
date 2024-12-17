// src/app/components/profile/profile.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AthleteProfile, AthleteService, AthleteSummary} from '../../services/athlete.service';
import {SpinnerComponent} from '../spinner/spinner.component';
import {ProfileCacheService} from '../../services/profile-cache.service';
import {Subject, takeUntil} from 'rxjs';
import {StravaService} from "../../services/strava.service";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: AthleteProfile | null = null;
  summary: AthleteSummary | null = null;
  isLoading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private athleteService: AthleteService,
    private profileCache: ProfileCacheService,
    private stravaService: StravaService
  ) {
  }


  ngOnInit() {
    // S'abonner aux changements du cache
    this.profileCache.getProfileData$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cache => {
        if (cache.profile && cache.summary) {
          this.profile = cache.profile;
          this.summary = cache.summary;
          this.isLoading = false;
        }
      });

    this.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDistance(meters: number): string {
    return (meters / 1000).toFixed(1) + ' km';
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
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  reconnect() {
    this.profileCache.clear(); // Vider le cache
    this.stravaService.authenticate(); // Rediriger vers la page d'authentification Strava
  }

  private loadProfile() {
    // Vérifier si on a besoin de rafraîchir les données
    if (!this.profileCache.needsRefresh()) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    Promise.all([
      this.athleteService.getAthleteProfile().toPromise(),
      this.athleteService.getAthleteSummary().toPromise()
    ]).then(([profile, summary]) => {
      if (profile && summary) {
        this.profileCache.setProfileData(profile, summary);
      }
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading profile:', error);
      this.error = 'Une erreur est survenue lors du chargement du profil.';
      this.isLoading = false;
    });
  }
}
