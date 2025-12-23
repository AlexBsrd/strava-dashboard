import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SportConfigService } from '../../services/sport-config.service';
import { PeriodStateService } from '../../services/period-state.service';
import { ComparisonService } from '../../services/comparison.service';
import {
  SportGroup,
  StravaActivityType,
  MetricKey,
  getSportMetadata,
  getRecommendedMetrics,
  GROUP_COLORS,
  ALL_METRICS,
  METRIC_METADATA
} from '../../types/sport-config';
import { SportGroupItemComponent } from './sport-group-item/sport-group-item.component';
import { Activity } from '../../models/activity';
import { PeriodType } from '../../types/period';
import { ComparisonPeriod, ComparisonPreset } from '../../types/comparison';

@Component({
  selector: 'app-sport-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, SportGroupItemComponent],
  templateUrl: './sport-sidebar.component.html',
  styleUrls: ['./sport-sidebar.component.css']
})
export class SportSidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() activities: Activity[] = [];
  @Input() isMobileOpen = false;
  @Input() currentRoute = '/';
  @Output() closeMobile = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  groups: SportGroup[] = [];
  ungroupedTypes: StravaActivityType[] = [];
  expandedGroupId: string | null = null;
  expandedUngroupedType: string | null = null;

  // État du formulaire de création
  showCreateForm = false;
  newGroupName = '';
  newGroupColor = GROUP_COLORS[0];
  newGroupTypes: StravaActivityType[] = [];
  newGroupMetrics: MetricKey[] = [...ALL_METRICS];

  // État du formulaire d'édition
  editingGroupId: string | null = null;
  editGroupName = '';
  editGroupColor = '';
  editGroupTypes: StravaActivityType[] = [];
  editGroupMetrics: MetricKey[] = [];

  availableColors = GROUP_COLORS;
  allMetrics = ALL_METRICS;
  metricMetadata = METRIC_METADATA;

  // Cache pour le comptage des activités
  private activityCountCache = new Map<string, number>();

  // ========== Sélection de période (Dashboard) ==========
  dashboardPeriods: { value: PeriodType; label: string }[] = [];
  availableYears: number[] = [];
  selectedDashboardPeriod: PeriodType = 'week';

  // ========== Sélection de comparaison (Compare) ==========
  comparisonPresets: ComparisonPreset[] = [];
  selectedPresetIndex: number | null = null;
  comparePeriod1: ComparisonPeriod | null = null;
  comparePeriod2: ComparisonPeriod | null = null;
  showCustomPeriod1 = false;
  showCustomPeriod2 = false;
  customPeriod1Start = '';
  customPeriod1End = '';
  customPeriod2Start = '';
  customPeriod2End = '';

  constructor(
    private sportConfigService: SportConfigService,
    private periodStateService: PeriodStateService,
    private comparisonService: ComparisonService
  ) {
    this.comparisonPresets = this.comparisonService.getComparisonPresets();
  }

  ngOnInit(): void {
    // Générer la liste des périodes standards (sans les années)
    this.dashboardPeriods = [
      { value: 'week', label: '7 derniers jours' },
      { value: 'month', label: '30 derniers jours' },
      { value: 'current_year', label: 'Depuis le 1er janvier' }
    ];

    // Générer la liste des années disponibles (de l'année en cours à 2020)
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    for (let year = currentYear; year >= startYear; year--) {
      this.availableYears.push(year);
    }

    // S'abonner aux changements de groupes
    this.sportConfigService.allGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe(groups => {
        this.groups = groups;
        this.updateActivityCounts();
      });

    // S'abonner à tous les types détectés (pas seulement les non-groupés)
    this.sportConfigService.availableTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        this.ungroupedTypes = types;
      });

    // S'abonner aux changements de période du dashboard
    this.periodStateService.dashboardPeriod$
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        this.selectedDashboardPeriod = period;
      });

    // S'abonner aux périodes de comparaison
    this.periodStateService.comparePeriod1$
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        this.comparePeriod1 = period;
      });

    this.periodStateService.comparePeriod2$
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        this.comparePeriod2 = period;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Mettre à jour les compteurs quand les activités changent
    if (changes['activities'] && !changes['activities'].firstChange) {
      this.updateActivityCounts();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateActivityCounts(): void {
    this.activityCountCache.clear();
    this.groups.forEach(group => {
      const count = this.activities.filter(a => {
        const activityType = a.sport_type || a.type;
        return group.types.includes(activityType as StravaActivityType);
      }).length;
      this.activityCountCache.set(group.id, count);
    });
  }

  getActivityCount(groupId: string): number {
    return this.activityCountCache.get(groupId) || 0;
  }

  getUngroupedActivityCount(type: StravaActivityType): number {
    return this.activities.filter(a => (a.sport_type || a.type) === type).length;
  }

  // Gestion des groupes
  toggleGroup(groupId: string): void {
    this.sportConfigService.toggleGroup(groupId);
  }

  expandGroup(groupId: string): void {
    this.expandedGroupId = this.expandedGroupId === groupId ? null : groupId;
  }

  toggleMetric(groupId: string, metric: MetricKey): void {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    let newMetrics: MetricKey[];
    if (group.visibleMetrics.includes(metric)) {
      newMetrics = group.visibleMetrics.filter(m => m !== metric);
    } else {
      newMetrics = [...group.visibleMetrics, metric];
    }

    this.sportConfigService.updateGroup(groupId, { visibleMetrics: newMetrics });
  }

  // Gestion des sports non-groupés
  toggleUngroupedSport(type: StravaActivityType): void {
    this.sportConfigService.toggleUngroupedSport(type);
    // Automatiquement étendre le sport quand on l'active pour montrer les métriques
    if (!this.isUngroupedSportEnabled(type)) {
      // Si on l'active, on l'étend
      this.expandedUngroupedType = type;
    }
  }

  isUngroupedSportEnabled(type: StravaActivityType): boolean {
    return this.sportConfigService.isUngroupedSportEnabled(type);
  }

  expandUngroupedType(type: StravaActivityType): void {
    this.expandedUngroupedType = this.expandedUngroupedType === type ? null : type;
  }

  /** Récupère les métriques visibles pour un sport individuel */
  getUngroupedSportMetrics(type: StravaActivityType): MetricKey[] {
    const config = this.sportConfigService.getUngroupedSportConfig(type);
    return config?.visibleMetrics || getRecommendedMetrics([type]);
  }

  /** Vérifie si une métrique est visible pour un sport individuel */
  isUngroupedMetricSelected(type: StravaActivityType, metric: MetricKey): boolean {
    const metrics = this.getUngroupedSportMetrics(type);
    return metrics.includes(metric);
  }

  /** Toggle une métrique pour un sport individuel */
  toggleUngroupedMetric(type: StravaActivityType, metric: MetricKey): void {
    const currentMetrics = this.getUngroupedSportMetrics(type);
    // Empêcher de désactiver la dernière métrique
    if (currentMetrics.length === 1 && currentMetrics.includes(metric)) {
      return;
    }
    this.sportConfigService.toggleUngroupedSportMetric(type, metric);
  }

  /** Récupère les métriques disponibles pour un type de sport (basé sur ses capacités) */
  getAvailableMetricsForType(type: StravaActivityType): MetricKey[] {
    return getRecommendedMetrics([type]);
  }

  getSportLabel(type: StravaActivityType): string {
    return getSportMetadata(type).label;
  }

  getSportIcon(type: StravaActivityType): string {
    return getSportMetadata(type).icon;
  }

  /** Vérifie si un sport est déjà dans un groupe */
  isTypeInGroup(type: StravaActivityType): boolean {
    return this.sportConfigService.isTypeInAnyGroup(type);
  }

  /** Retourne le nom du groupe contenant ce sport */
  getGroupNameForType(type: StravaActivityType): string | null {
    const group = this.sportConfigService.getGroupContainingType(type);
    return group ? group.name : null;
  }

  // Formulaire de création de groupe
  startCreateGroup(): void {
    this.showCreateForm = true;
    this.newGroupName = '';
    this.newGroupColor = GROUP_COLORS[0];
    this.newGroupTypes = [];
    this.newGroupMetrics = [...ALL_METRICS];
  }

  cancelCreateGroup(): void {
    this.showCreateForm = false;
  }

  toggleNewGroupType(type: StravaActivityType): void {
    const index = this.newGroupTypes.indexOf(type);
    if (index === -1) {
      this.newGroupTypes.push(type);
    } else {
      this.newGroupTypes.splice(index, 1);
    }
    // Mettre à jour les métriques recommandées en fonction des types sélectionnés
    if (this.newGroupTypes.length > 0) {
      this.newGroupMetrics = getRecommendedMetrics(this.newGroupTypes);
    } else {
      this.newGroupMetrics = [...ALL_METRICS];
    }
  }

  isNewGroupTypeSelected(type: StravaActivityType): boolean {
    return this.newGroupTypes.includes(type);
  }

  toggleNewGroupMetric(metric: MetricKey): void {
    if (this.newGroupMetrics.length === 1 && this.newGroupMetrics.includes(metric)) {
      return; // Garder au moins une métrique
    }
    const index = this.newGroupMetrics.indexOf(metric);
    if (index === -1) {
      this.newGroupMetrics.push(metric);
    } else {
      this.newGroupMetrics.splice(index, 1);
    }
  }

  isNewGroupMetricSelected(metric: MetricKey): boolean {
    return this.newGroupMetrics.includes(metric);
  }

  canCreateGroup(): boolean {
    return this.newGroupName.trim().length > 0 &&
           this.newGroupTypes.length > 0 &&
           this.newGroupMetrics.length > 0;
  }

  createGroup(): void {
    if (!this.canCreateGroup()) return;

    this.sportConfigService.createGroup(
      this.newGroupName.trim(),
      this.newGroupTypes,
      'activity', // Icône par défaut
      this.newGroupColor,
      this.newGroupMetrics
    );

    this.showCreateForm = false;
  }

  // Réinitialiser aux valeurs par défaut
  resetToDefaults(): void {
    if (confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      this.sportConfigService.resetToDefaults();
    }
  }

  // Obtenir tous les types disponibles pour la création de groupe
  getAvailableTypesForNewGroup(): StravaActivityType[] {
    return this.sportConfigService.getAvailableTypes();
  }

  getMetricLabel(metric: MetricKey): string {
    return METRIC_METADATA[metric].label;
  }

  trackByGroupId(index: number, group: SportGroup): string {
    return group.id;
  }

  // ==================== Édition de groupe ====================

  startEditGroup(group: SportGroup): void {
    this.editingGroupId = group.id;
    this.editGroupName = group.name;
    this.editGroupColor = group.color;
    this.editGroupTypes = [...group.types];
    this.editGroupMetrics = [...group.visibleMetrics];
    // Fermer le formulaire de création si ouvert
    this.showCreateForm = false;
  }

  cancelEditGroup(): void {
    this.editingGroupId = null;
  }

  toggleEditGroupType(type: StravaActivityType): void {
    const index = this.editGroupTypes.indexOf(type);
    if (index === -1) {
      this.editGroupTypes.push(type);
    } else {
      this.editGroupTypes.splice(index, 1);
    }
  }

  isEditGroupTypeSelected(type: StravaActivityType): boolean {
    return this.editGroupTypes.includes(type);
  }

  toggleEditGroupMetric(metric: MetricKey): void {
    if (this.editGroupMetrics.length === 1 && this.editGroupMetrics.includes(metric)) {
      return; // Garder au moins une métrique
    }
    const index = this.editGroupMetrics.indexOf(metric);
    if (index === -1) {
      this.editGroupMetrics.push(metric);
    } else {
      this.editGroupMetrics.splice(index, 1);
    }
  }

  isEditGroupMetricSelected(metric: MetricKey): boolean {
    return this.editGroupMetrics.includes(metric);
  }

  canSaveEditGroup(): boolean {
    return this.editGroupName.trim().length > 0 &&
           this.editGroupTypes.length > 0 &&
           this.editGroupMetrics.length > 0;
  }

  saveEditGroup(): void {
    if (!this.editingGroupId || !this.canSaveEditGroup()) return;

    this.sportConfigService.updateGroup(this.editingGroupId, {
      name: this.editGroupName.trim(),
      color: this.editGroupColor,
      types: this.editGroupTypes,
      visibleMetrics: this.editGroupMetrics
    });

    this.editingGroupId = null;
  }

  deleteGroup(groupId: string): void {
    const group = this.groups.find(g => g.id === groupId);
    if (group && !group.isDefault) {
      if (confirm(`Supprimer le groupe "${group.name}" ?`)) {
        this.sportConfigService.deleteGroup(groupId);
        this.editingGroupId = null;
      }
    }
  }

  /** Obtenir tous les types disponibles pour l'édition (inclut les types du groupe + les types non groupés) */
  getAvailableTypesForEdit(): StravaActivityType[] {
    const availableTypes = this.sportConfigService.getAvailableTypes();
    const currentGroup = this.groups.find(g => g.id === this.editingGroupId);
    if (!currentGroup) return availableTypes;

    // Inclure les types actuels du groupe même s'ils ne sont plus dans availableTypes
    const allTypes = new Set([...availableTypes, ...currentGroup.types]);
    return Array.from(allTypes).sort();
  }

  // ==================== Sélection de période (Dashboard) ====================

  /** Vérifie si on est sur la page Dashboard */
  isDashboardPage(): boolean {
    return this.currentRoute === '/' || this.currentRoute === '';
  }

  /** Vérifie si on est sur la page Comparer */
  isComparePage(): boolean {
    return this.currentRoute === '/compare';
  }

  /** Vérifie si on est sur la page Activités */
  isActivitiesPage(): boolean {
    return this.currentRoute === '/activities';
  }

  /** Sélectionne une période pour le dashboard */
  selectDashboardPeriod(period: PeriodType): void {
    this.periodStateService.setDashboardPeriod(period);
  }

  /** Sélectionne une année pour le dashboard */
  selectDashboardYear(year: number): void {
    this.periodStateService.setDashboardPeriod(year.toString());
  }

  /** Vérifie si une année est sélectionnée */
  isYearSelected(): boolean {
    const year = parseInt(this.selectedDashboardPeriod, 10);
    return !isNaN(year);
  }

  /** Obtient l'année sélectionnée ou null */
  getSelectedYear(): number | null {
    const year = parseInt(this.selectedDashboardPeriod, 10);
    return !isNaN(year) ? year : null;
  }

  // ==================== Sélection de comparaison (Compare) ====================

  /** Sélectionne un preset de comparaison */
  selectComparisonPreset(index: number): void {
    this.selectedPresetIndex = index;
    const preset = this.comparisonPresets[index];
    this.periodStateService.setComparePeriod1(preset.period1);
    this.periodStateService.setComparePeriod2(preset.period2);
    this.showCustomPeriod1 = false;
    this.showCustomPeriod2 = false;
  }

  /** Active le mode personnalisé */
  enableCustomMode(): void {
    this.selectedPresetIndex = null;
    this.showCustomPeriod1 = true;
    this.showCustomPeriod2 = true;
  }

  /** Applique une période personnalisée 1 */
  applyCustomPeriod1(): void {
    if (this.customPeriod1Start && this.customPeriod1End) {
      const startDate = new Date(this.customPeriod1Start);
      const endDate = new Date(this.customPeriod1End);
      endDate.setHours(23, 59, 59, 999);

      this.periodStateService.setComparePeriod1({
        type: 'custom',
        label: 'Période personnalisée 1',
        startDate,
        endDate
      });
    }
  }

  /** Applique une période personnalisée 2 */
  applyCustomPeriod2(): void {
    if (this.customPeriod2Start && this.customPeriod2End) {
      const startDate = new Date(this.customPeriod2Start);
      const endDate = new Date(this.customPeriod2End);
      endDate.setHours(23, 59, 59, 999);

      this.periodStateService.setComparePeriod2({
        type: 'custom',
        label: 'Période personnalisée 2',
        startDate,
        endDate
      });
    }
  }

  /** Déclenche la comparaison */
  triggerCompare(): void {
    this.periodStateService.triggerCompare();
    // Fermer la sidebar mobile après avoir lancé la comparaison
    if (this.isMobileOpen) {
      this.closeMobile.emit();
    }
  }

  /** Vérifie si on peut comparer */
  canCompare(): boolean {
    return this.periodStateService.canCompare();
  }

  /** Formate une période */
  formatPeriodLabel(period: ComparisonPeriod | null): string {
    return this.periodStateService.formatPeriodLabel(period);
  }
}
