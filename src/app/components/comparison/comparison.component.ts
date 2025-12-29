import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComparisonPeriod, StatsComparison } from '../../types/comparison';
import { ComparisonService } from '../../services/comparison.service';
import { StravaService } from '../../services/strava.service';
import { StatsService } from '../../services/stats.service';
import { Activity } from '../../models/activity';
import { ComparisonStatsGridComponent } from '../comparison-stats-grid/comparison-stats-grid.component';
import { ComparisonChartComponent } from '../comparison-chart/comparison-chart.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { SportConfigService } from '../../services/sport-config.service';
import { PeriodStateService } from '../../services/period-state.service';
import { SportGroup, getSportMetadata, getRecommendedMetrics } from '../../types/sport-config';

/** Interface pour les comparaisons groupées par sport */
interface GroupComparisonData {
  group: SportGroup;
  activities1: Activity[];
  activities2: Activity[];
  comparison: StatsComparison;
}

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ComparisonStatsGridComponent,
    ComparisonChartComponent,
    SpinnerComponent
  ],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  period1: ComparisonPeriod | null = null;
  period2: ComparisonPeriod | null = null;

  isLoading = false;
  error: string | null = null;
  authError = false;
  hasCompared = false;

  // Activities per period
  activities1: Activity[] = [];
  activities2: Activity[] = [];

  // Comparaisons groupées dynamiques
  groupComparisons: GroupComparisonData[] = [];

  constructor(
    private comparisonService: ComparisonService,
    private stravaService: StravaService,
    private statsService: StatsService,
    private router: Router,
    private sportConfigService: SportConfigService,
    private periodStateService: PeriodStateService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    // S'abonner aux changements de configuration des sports (config complète pour détecter les changements de types)
    this.sportConfigService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-calculer les comparaisons quand la config change
        if (this.hasCompared && this.activities1.length > 0) {
          this.filterAndCalculateComparisons();
        }
      });

    // S'abonner aux changements de périodes depuis la sidebar
    this.periodStateService.comparePeriod1$
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        this.period1 = period;
      });

    this.periodStateService.comparePeriod2$
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        this.period2 = period;
      });

    // S'abonner au déclenchement de la comparaison
    this.periodStateService.compareTriggered$
      .pipe(
        takeUntil(this.destroy$),
        filter(triggered => triggered)
      )
      .subscribe(() => {
        this.onCompare();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

    // Fetch all recent activities (2 years) to ensure we have data for all possible comparisons
    this.stravaService.loadAllRecentActivities().subscribe({
      next: (allActivities) => {
        if (!this.period1 || !this.period2) return;

        // Filter activities by each period
        this.activities1 = this.comparisonService.filterActivitiesByPeriod(allActivities, this.period1);
        this.activities2 = this.comparisonService.filterActivitiesByPeriod(allActivities, this.period2);

        console.log('Period 1:', this.period1.label, '- Activities:', this.activities1.length);
        console.log('Period 2:', this.period2.label, '- Activities:', this.activities2.length);

        // Filter by activity type and calculate comparisons
        this.filterAndCalculateComparisons();

        this.isLoading = false;
        this.hasCompared = true;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.handleError(error);
      }
    });
  }

  private handleError(error: any) {
    this.isLoading = false;

    if (error.status === 401) {
      this.handleAuthError();
    } else {
      this.error = this.translateService.instant('errors.loading_error.title');
      this.authError = false;
    }
  }

  /**
   * Filtre les activités par groupe et calcule les comparaisons
   */
  private filterAndCalculateComparisons() {
    const enabledGroups = this.sportConfigService.getEnabledGroups();

    this.groupComparisons = enabledGroups.map(group => {
      const activities1 = this.sportConfigService.filterActivitiesByGroup(this.activities1, group);
      const activities2 = this.sportConfigService.filterActivitiesByGroup(this.activities2, group);

      const stats1 = this.statsService.calculateStats(activities1);
      const stats2 = this.statsService.calculateStats(activities2);
      const comparison = this.comparisonService.compareStats(stats1, stats2);

      return {
        group,
        activities1,
        activities2,
        comparison
      };
    });

    // Ajouter les sports individuels activés (même s'ils sont dans un groupe)
    const config = this.sportConfigService.getConfig();

    for (const type of config.ungroupedSportsEnabled) {
      const metadata = getSportMetadata(type);

      // Filtrer les activités par type
      const typeActivities1 = this.activities1.filter(a => (a.sport_type || a.type) === type);
      const typeActivities2 = this.activities2.filter(a => (a.sport_type || a.type) === type);

      // Ne pas ajouter si aucune activité dans les deux périodes
      if (typeActivities1.length === 0 && typeActivities2.length === 0) {
        continue;
      }

      // Récupérer la configuration des métriques pour ce sport
      const sportConfig = this.sportConfigService.getUngroupedSportConfig(type);
      const visibleMetrics = sportConfig?.visibleMetrics || getRecommendedMetrics([type]);

      // Créer un groupe virtuel pour ce sport individuel
      const virtualGroup: SportGroup = {
        id: `individual-${type}`,
        nameKey: metadata.labelKey,
        types: [type],
        icon: metadata.icon,
        color: this.getColorForCategory(metadata.category),
        isDefault: false,
        isEnabled: true,
        order: 999,
        visibleMetrics: visibleMetrics
      };

      const stats1 = this.statsService.calculateStats(typeActivities1);
      const stats2 = this.statsService.calculateStats(typeActivities2);
      const comparison = this.comparisonService.compareStats(stats1, stats2);

      this.groupComparisons.push({
        group: virtualGroup,
        activities1: typeActivities1,
        activities2: typeActivities2,
        comparison
      });
    }
  }

  /** Retourne une couleur par défaut selon la catégorie de sport */
  private getColorForCategory(category: string): string {
    const colors: Record<string, string> = {
      'running': '#ef4444',
      'cycling': '#3b82f6',
      'walking': '#22c55e',
      'fitness': '#8b5cf6',
      'water': '#06b6d4',
      'winter': '#64748b',
      'other': '#f97316'
    };
    return colors[category] || '#6b7280';
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

  /**
   * Vérifie si un groupe a des activités dans au moins une des deux périodes
   */
  hasGroupActivities(groupData: GroupComparisonData): boolean {
    return groupData.activities1.length > 0 || groupData.activities2.length > 0;
  }

  /**
   * Vérifie s'il y a des activités dans au moins un groupe
   */
  hasAnyActivities(): boolean {
    return this.groupComparisons.some(gc => this.hasGroupActivities(gc));
  }

  /**
   * TrackBy pour les comparaisons de groupes
   */
  trackByGroupId(index: number, item: GroupComparisonData): string {
    return item.group.id;
  }
}
