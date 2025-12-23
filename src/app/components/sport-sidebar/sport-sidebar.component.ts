import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SportConfigService } from '../../services/sport-config.service';
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

@Component({
  selector: 'app-sport-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, SportGroupItemComponent],
  templateUrl: './sport-sidebar.component.html',
  styleUrls: ['./sport-sidebar.component.css']
})
export class SportSidebarComponent implements OnInit, OnDestroy {
  @Input() activities: Activity[] = [];
  @Input() isMobileOpen = false;
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

  constructor(private sportConfigService: SportConfigService) {}

  ngOnInit(): void {
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Fermer la sidebar mobile lors d'un swipe vers le bas
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (this.isMobileOpen) {
      const touch = event.touches[0];
      (this as any)._touchStartY = touch.clientY;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (this.isMobileOpen && (this as any)._touchStartY !== undefined) {
      const touch = event.touches[0];
      const deltaY = touch.clientY - (this as any)._touchStartY;
      if (deltaY > 100) {
        this.closeMobile.emit();
        (this as any)._touchStartY = undefined;
      }
    }
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
}
