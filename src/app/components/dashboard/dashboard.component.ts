// src/app/components/dashboard/dashboard.component.ts
import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {PeriodSelectorComponent} from '../period-selector/period-selector.component';
import {StravaService} from '../../services/strava.service';
import {StatsService} from '../../services/stats.service';
import {Stats} from "../../models/stats";
import {StatsListComponent} from "../stats-list/stats-list.component";
import {SpinnerComponent} from "../spinner/spinner.component";
import {PerformanceDashboardComponent} from "../performance-dashboard/performance-dashboard.component";
import {ModernActivityChartComponent} from "../modern-activity-chart/modern-activity-chart.component";
import {Activity} from "../../models/activity";
import {PaceScatterComponent} from "../pace-scatter/pace-scatter.component";
import {PeriodType} from "../../types/period";
import {ActivityCacheService} from "../../services/activity-cache.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    StatsListComponent,
    SpinnerComponent,
    PerformanceDashboardComponent,
    ModernActivityChartComponent,
    PaceScatterComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  selectedPeriod: PeriodType = 'week';
  isLoading = false;
  error: string | null = null;
  authError = false;

  runningStats: Stats;
  bikingStats: Stats;
  walkingStats: Stats;

  allActivities: Activity[] = [];
  runningActivityData: any[] = [];
  bikingActivityData: any[] = [];
  walkingActivityData: any[] = [];

  constructor(
    private stravaService: StravaService,
    private statsService: StatsService,
    private router: Router,
    private activityCache: ActivityCacheService
  ) {
    const emptyStat: Stats = {
      averageSpeed: 0,
      totalDistance: 0,
      averageDistance: 0,
      totalElevation: 0,
      averageElevation: 0,
      totalElapsedTime: 0,
      numberOfActivities: 0
    }
    this.runningStats = emptyStat;
    this.bikingStats = emptyStat;
    this.walkingStats = emptyStat;
  }

  ngOnInit() {
    if (!this.checkAuth()) {
      return;
    }
    this.loadData();
  }

  onPeriodChange(period: PeriodType) {
    this.selectedPeriod = period;
    if (!this.checkAuth()) {
      return;
    }
    this.loadData();
  }

  reconnectToStrava() {
    localStorage.clear();
    this.stravaService.authenticate();
  }

  protected loadData() {
    this.isLoading = true;
    this.error = null;
    this.authError = false;

    // Charger les activités via le service
    this.stravaService.getActivities(this.selectedPeriod).subscribe({
      next: (activities) => {
        this.updateActivitiesDisplay(activities);

        // Si la période n'est pas encore prête (preload en cours)
        // S'abonner aux changements du cache pour mise à jour automatique
        if (!this.activityCache.isPeriodReady(this.selectedPeriod)) {
          const subscription = this.activityCache.activities$.subscribe(() => {
            if (this.activityCache.isPeriodReady(this.selectedPeriod)) {
              subscription.unsubscribe();
              // Recharger les activités maintenant que la période est complète
              const updatedActivities = this.activityCache.getFilteredActivities(this.selectedPeriod);
              this.updateActivitiesDisplay(updatedActivities);
              this.isLoading = false;
            }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.handleAuthError();
        } else {
          this.error = 'Une erreur est survenue lors du chargement des données.';
          this.authError = false;
        }
      }
    });
  }

  private updateActivitiesDisplay(activities: Activity[]) {
    this.allActivities = activities;
    this.runningActivityData = activities.filter(a => a.type.includes('Run'));
    this.bikingActivityData = activities.filter(a => a.type.includes('Ride'));
    this.walkingActivityData = activities.filter(a => a.type.includes('Hike') || a.type.includes('Walk'));

    this.runningStats = this.statsService.calculateStats(this.runningActivityData);
    this.bikingStats = this.statsService.calculateStats(this.bikingActivityData);
    this.walkingStats = this.statsService.calculateStats(this.walkingActivityData);
  }

  private checkAuth(): boolean {
    const token = localStorage.getItem('strava_token');
    const expiresAt = localStorage.getItem('strava_token_expires_at');
    if (!token || !expiresAt || Date.now() / 1000 > Number(expiresAt)) {
      this.handleAuthError();
      return false;
    }
    return true;
  }

  private handleAuthError() {
    this.authError = true;
    this.error = null;
    this.isLoading = false;
  }
}
