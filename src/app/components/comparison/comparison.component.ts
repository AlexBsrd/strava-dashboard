import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ComparisonPeriod, StatsComparison } from '../../types/comparison';
import { ComparisonService } from '../../services/comparison.service';
import { StravaService } from '../../services/strava.service';
import { StatsService } from '../../services/stats.service';
import { Activity } from '../../models/activity';
import { Stats } from '../../models/stats';
import { ComparisonPeriodSelectorComponent } from '../comparison-period-selector/comparison-period-selector.component';
import { ComparisonStatsGridComponent } from '../comparison-stats-grid/comparison-stats-grid.component';
import { ComparisonChartComponent } from '../comparison-chart/comparison-chart.component';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [
    CommonModule,
    ComparisonPeriodSelectorComponent,
    ComparisonStatsGridComponent,
    ComparisonChartComponent,
    SpinnerComponent
  ],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent {
  period1: ComparisonPeriod | null = null;
  period2: ComparisonPeriod | null = null;

  isLoading = false;
  error: string | null = null;
  authError = false;
  hasCompared = false;

  // Activities per period
  activities1: Activity[] = [];
  activities2: Activity[] = [];

  // Activities filtered by type
  runActivities1: Activity[] = [];
  runActivities2: Activity[] = [];
  walkActivities1: Activity[] = [];
  walkActivities2: Activity[] = [];
  bikeActivities1: Activity[] = [];
  bikeActivities2: Activity[] = [];

  // Comparisons per activity type
  runComparison: StatsComparison | null = null;
  walkComparison: StatsComparison | null = null;
  bikeComparison: StatsComparison | null = null;

  constructor(
    private comparisonService: ComparisonService,
    private stravaService: StravaService,
    private statsService: StatsService,
    private router: Router
  ) {}

  onPeriod1Change(period: ComparisonPeriod) {
    this.period1 = period;
  }

  onPeriod2Change(period: ComparisonPeriod) {
    this.period2 = period;
  }

  onCompare() {
    if (!this.period1 || !this.period2) {
      return;
    }

    if (!this.checkAuth()) {
      return;
    }

    this.loadComparisonData();
  }

  private loadComparisonData() {
    this.isLoading = true;
    this.error = null;
    this.authError = false;
    this.hasCompared = false;

    if (!this.period1 || !this.period2) {
      this.isLoading = false;
      return;
    }

    // Fetch activities from '2024' period which includes both 2024 and current year activities
    // This ensures we have data for comparisons like "Oct 2024 vs Oct 2025"
    this.stravaService.getActivities('2024').subscribe({
      next: (activities2024) => {
        // Also fetch current year to get recent activities
        this.stravaService.getActivities('current_year').subscribe({
          next: (activitiesCurrentYear) => {
            if (!this.period1 || !this.period2) return;

            // Merge and deduplicate activities
            const allActivitiesMap = new Map<number, Activity>();
            [...activities2024, ...activitiesCurrentYear].forEach(activity => {
              allActivitiesMap.set(activity.id, activity);
            });
            const allActivities = Array.from(allActivitiesMap.values());

            // Filter activities by each period
            this.activities1 = this.comparisonService.filterActivitiesByPeriod(allActivities, this.period1);
            this.activities2 = this.comparisonService.filterActivitiesByPeriod(allActivities, this.period2);

            console.log('Period 1:', this.period1.label, '- Activities:', this.activities1.length);
            console.log('Period 2:', this.period2.label, '- Activities:', this.activities2.length);

            // Filter by activity type
            this.filterActivitiesByType();

            // Calculate stats and comparisons
            this.calculateComparisons();

            this.isLoading = false;
            this.hasCompared = true;
          },
          error: (error) => {
            console.error('Error loading current year activities:', error);
            this.handleError(error);
          }
        });
      },
      error: (error) => {
        console.error('Error loading 2024 activities:', error);
        this.handleError(error);
      }
    });
  }

  private handleError(error: any) {
    this.isLoading = false;

    if (error.status === 401) {
      this.handleAuthError();
    } else {
      this.error = 'Une erreur est survenue lors du chargement des données.';
      this.authError = false;
    }
  }

  private filterActivitiesByType() {
    // Period 1
    this.runActivities1 = this.activities1.filter(a => a.type.includes('Run'));
    this.walkActivities1 = this.activities1.filter(a => a.type.includes('Hike') || a.type.includes('Walk'));
    this.bikeActivities1 = this.activities1.filter(a => a.type.includes('Ride'));

    // Period 2
    this.runActivities2 = this.activities2.filter(a => a.type.includes('Run'));
    this.walkActivities2 = this.activities2.filter(a => a.type.includes('Hike') || a.type.includes('Walk'));
    this.bikeActivities2 = this.activities2.filter(a => a.type.includes('Ride'));
  }

  private calculateComparisons() {
    // Running comparison
    const runStats1 = this.statsService.calculateStats(this.runActivities1);
    const runStats2 = this.statsService.calculateStats(this.runActivities2);
    this.runComparison = this.comparisonService.compareStats(runStats1, runStats2);

    // Walking comparison
    const walkStats1 = this.statsService.calculateStats(this.walkActivities1);
    const walkStats2 = this.statsService.calculateStats(this.walkActivities2);
    this.walkComparison = this.comparisonService.compareStats(walkStats1, walkStats2);

    // Biking comparison
    const bikeStats1 = this.statsService.calculateStats(this.bikeActivities1);
    const bikeStats2 = this.statsService.calculateStats(this.bikeActivities2);
    this.bikeComparison = this.comparisonService.compareStats(bikeStats1, bikeStats2);
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

  reconnectToStrava() {
    localStorage.clear();
    this.stravaService.authenticate();
  }

  hasActivities(activityType: 'run' | 'walk' | 'bike'): boolean {
    switch (activityType) {
      case 'run':
        return this.runActivities1.length > 0 || this.runActivities2.length > 0;
      case 'walk':
        return this.walkActivities1.length > 0 || this.walkActivities2.length > 0;
      case 'bike':
        return this.bikeActivities1.length > 0 || this.bikeActivities2.length > 0;
      default:
        return false;
    }
  }
}
