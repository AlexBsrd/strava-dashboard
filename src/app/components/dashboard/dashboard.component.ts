// src/app/components/dashboard/dashboard.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {Subject, takeUntil, distinctUntilChanged} from 'rxjs';
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
import {SportConfigService} from "../../services/sport-config.service";
import {PeriodStateService} from "../../services/period-state.service";
import {SportGroup, StravaActivityType, getSportMetadata, getRecommendedMetrics, ALL_METRICS} from "../../types/sport-config";

/** Interface pour les données groupées par sport */
interface GroupedStatsData {
  group: SportGroup;
  activities: Activity[];
  stats: Stats;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatsListComponent,
    SpinnerComponent,
    PerformanceDashboardComponent,
    ModernActivityChartComponent,
    PaceScatterComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedPeriod: PeriodType = 'week';
  isLoading = false;
  isInitialLoad = true;
  error: string | null = null;
  authError = false;

  // Données groupées dynamiques
  groupedStatsData: GroupedStatsData[] = [];

  // Données pour le PerformanceDashboard (uniquement les activités de course)
  runningActivityData: Activity[] = [];

  allActivities: Activity[] = [];

  constructor(
    private stravaService: StravaService,
    private statsService: StatsService,
    private router: Router,
    private activityCache: ActivityCacheService,
    private sportConfigService: SportConfigService,
    private periodStateService: PeriodStateService
  ) {}

  ngOnInit() {
    if (!this.checkAuth()) {
      return;
    }

    // S'abonner aux changements de configuration des sports (config complète pour détecter les changements de types)
    this.sportConfigService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-filtrer les activités quand la config change
        if (this.allActivities.length > 0) {
          this.updateActivitiesDisplay(this.allActivities);
        }
      });

    // S'abonner aux changements de période depuis la sidebar
    this.periodStateService.dashboardPeriod$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(period => {
        if (period !== this.selectedPeriod) {
          this.selectedPeriod = period;
          if (this.allActivities.length > 0) {
            this.loadData();
          }
        }
      });

    this.loadInitialData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  protected loadInitialData() {
    this.isLoading = true;
    this.isInitialLoad = true;
    this.error = null;
    this.authError = false;

    // Charger toutes les activités des 2 dernières années
    this.stravaService.loadAllRecentActivities().subscribe({
      next: (activities) => {
        // Mettre à jour avec la période sélectionnée
        const filteredActivities = this.activityCache.getFilteredActivities(this.selectedPeriod);
        this.updateActivitiesDisplay(filteredActivities);
        this.isLoading = false;
        this.isInitialLoad = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
        this.isInitialLoad = false;

        if (error.status === 401) {
          this.handleAuthError();
        } else {
          this.error = 'Une erreur est survenue lors du chargement des données.';
          this.authError = false;
        }
      }
    });
  }

  protected loadData() {
    this.isLoading = true;
    this.error = null;
    this.authError = false;

    // Charger les activités via le service (utilise le cache si disponible)
    this.stravaService.getActivities(this.selectedPeriod).subscribe({
      next: (activities) => {
        this.updateActivitiesDisplay(activities);
        this.isLoading = false;
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

    // Détecter les types d'activités disponibles
    this.sportConfigService.detectAvailableTypes(activities);

    // Filtrer les activités par groupes activés
    const enabledGroups = this.sportConfigService.getEnabledGroups();
    this.groupedStatsData = enabledGroups.map(group => {
      const groupActivities = this.sportConfigService.filterActivitiesByGroup(activities, group);
      return {
        group,
        activities: groupActivities,
        stats: this.statsService.calculateStats(groupActivities)
      };
    });

    // Ajouter les sports individuels activés (même s'ils sont dans un groupe)
    const config = this.sportConfigService.getConfig();

    for (const type of config.ungroupedSportsEnabled) {
      const metadata = getSportMetadata(type);
      // Utiliser sport_type pour le filtrage (ex: TrailRun)
      const typeActivities = activities.filter(a => (a.sport_type || a.type) === type);

      if (typeActivities.length > 0) {
        // Récupérer la configuration des métriques pour ce sport
        const sportConfig = this.sportConfigService.getUngroupedSportConfig(type);
        const visibleMetrics = sportConfig?.visibleMetrics || getRecommendedMetrics([type]);

        // Créer un groupe virtuel pour ce sport individuel
        const virtualGroup: SportGroup = {
          id: `individual-${type}`,
          name: metadata.label,
          types: [type],
          icon: metadata.icon,
          color: this.getColorForCategory(metadata.category),
          isDefault: false,
          isEnabled: true,
          order: 999, // À la fin
          visibleMetrics: visibleMetrics
        };

        this.groupedStatsData.push({
          group: virtualGroup,
          activities: typeActivities,
          stats: this.statsService.calculateStats(typeActivities)
        });
      }
    }

    // Extraire les activités de course pour le PerformanceDashboard
    // On cherche le groupe "running" par défaut ou un groupe contenant des types Run
    const runningGroup = enabledGroups.find(g => g.id === 'running') ||
      enabledGroups.find(g => g.types.some(t => t.includes('Run')));
    if (runningGroup) {
      this.runningActivityData = this.sportConfigService.filterActivitiesByGroup(activities, runningGroup);
    } else {
      // Fallback: filtrer directement les activités de type Run
      this.runningActivityData = activities.filter(a => a.type.includes('Run'));
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

  /** Helper pour le trackBy dans le template */
  trackByGroupId(index: number, item: GroupedStatsData): string {
    return item.group.id;
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
