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
import {StreakService, StreakInfo} from "../../services/streak.service";
import {StreakBadgeComponent} from "../streak-badge/streak-badge.component";
import {GoalService} from "../../services/goal.service";
import {Goal, GoalProgress} from "../../models/goal";
import {GoalCardComponent} from "../goal-card/goal-card.component";
import {GoalFormComponent} from "../goal-form/goal-form.component";
import {DisplayPreferencesService, DisplayPreferences} from "../../services/display-preferences.service";

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
    PaceScatterComponent,
    StreakBadgeComponent,
    GoalCardComponent,
    GoalFormComponent
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

  // Données pour les streaks
  streakInfo: StreakInfo | null = null;

  // Données pour les goals
  goalProgresses: GoalProgress[] = [];
  showGoalForm: boolean = false;
  editingGoal: Goal | null = null;
  availableSports: string[] = [];

  // Display preferences
  displayPreferences: DisplayPreferences = { showStreaks: true, showGoals: true };

  constructor(
    private stravaService: StravaService,
    private statsService: StatsService,
    private router: Router,
    private activityCache: ActivityCacheService,
    private sportConfigService: SportConfigService,
    private periodStateService: PeriodStateService,
    private streakService: StreakService,
    private goalService: GoalService,
    private displayPreferencesService: DisplayPreferencesService
  ) {}

  ngOnInit() {
    if (!this.checkAuth()) {
      return;
    }

    // S'abonner aux préférences d'affichage
    this.displayPreferencesService.getPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => {
        this.displayPreferences = prefs;
      });

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

    // Vérifier si le cache contient déjà des données valides
    if (!this.activityCache.needsRefresh(this.selectedPeriod)) {
      // Utiliser les données en cache
      const filteredActivities = this.activityCache.getFilteredActivities(this.selectedPeriod);
      this.updateActivitiesDisplay(filteredActivities);
      this.isLoading = false;
      this.isInitialLoad = false;
      return;
    }

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

    // Calculer les streaks
    this.streakInfo = this.streakService.calculateStreaks(activities);

    // Calculer la progression des goals
    this.updateGoalProgresses(activities);

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

  /** Update goal progresses based on ALL cached activities (not filtered by dashboard period) */
  private updateGoalProgresses(activities: Activity[]): void {
    const activeGoals = this.goalService.getActiveGoals();
    // Get ALL activities from cache, not just the filtered ones for the current period
    const allCachedActivities = this.activityCache.getAllActivities();
    this.goalProgresses = activeGoals.map(goal =>
      this.goalService.calculateProgress(goal, allCachedActivities)
    );
  }

  /** Open form to create a new goal */
  openCreateGoalForm(): void {
    this.editingGoal = null;
    this.updateAvailableSports();
    this.showGoalForm = true;
  }

  /** Open form to edit an existing goal */
  onEditGoal(goalId: string): void {
    const goal = this.goalService.getGoalById(goalId);
    if (goal) {
      this.editingGoal = goal;
      this.updateAvailableSports();
      this.showGoalForm = true;
    }
  }

  /** Handle goal form save */
  onSaveGoal(goalData: Partial<Goal>): void {
    if (this.editingGoal) {
      // Update existing goal
      this.goalService.updateGoal(this.editingGoal.id, goalData);
    } else {
      // Create new goal - ensure all required fields are present
      if (goalData.name && goalData.type && goalData.target && goalData.period) {
        this.goalService.createGoal({
          name: goalData.name,
          type: goalData.type,
          target: goalData.target,
          period: goalData.period,
          sportTypes: goalData.sportTypes,
          startDate: goalData.startDate,
          endDate: goalData.endDate
        });
      }
    }
    this.showGoalForm = false;
    this.editingGoal = null;
    this.updateGoalProgresses(this.activityCache.getAllActivities());
  }

  /** Handle goal form cancel */
  onCancelGoalForm(): void {
    this.showGoalForm = false;
    this.editingGoal = null;
  }

  /** Handle goal delete */
  onDeleteGoal(goalId: string): void {
    this.goalService.deleteGoal(goalId);
    this.updateGoalProgresses(this.activityCache.getAllActivities());
  }

  /** Update available sports list from activities */
  private updateAvailableSports(): void {
    const allActivities = this.activityCache.getAllActivities();
    const sportsSet = new Set<string>();
    allActivities.forEach(activity => {
      sportsSet.add(activity.sport_type || activity.type);
    });
    this.availableSports = Array.from(sportsSet).sort();
  }

  /** Get limited goal progresses (max 4) */
  get limitedGoalProgresses(): GoalProgress[] {
    return this.goalProgresses.slice(0, 4);
  }
}
