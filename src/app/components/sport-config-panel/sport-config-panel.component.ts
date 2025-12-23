import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SportConfigService } from '../../services/sport-config.service';
import {
  SportGroup,
  StravaActivityType,
  SportConfig,
  GROUP_COLORS,
  getSportMetadata,
  SportTypeMetadata,
  MetricKey,
  ALL_METRICS,
  METRIC_METADATA,
  DEFAULT_SPORT_GROUPS
} from '../../types/sport-config';

@Component({
  selector: 'app-sport-config-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sport-config-panel.component.html',
  styleUrls: ['./sport-config-panel.component.css']
})
export class SportConfigPanelComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() availableTypes: StravaActivityType[] = [];
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  config: SportConfig | null = null;
  groups: SportGroup[] = [];

  // État du formulaire de création
  showNewGroupForm = false;
  newGroupName = '';
  newGroupTypes: StravaActivityType[] = [];
  newGroupColor = GROUP_COLORS[0];
  newGroupIcon = 'activity';
  newGroupMetrics: MetricKey[] = [...ALL_METRICS];

  // État de l'édition
  editingGroupId: string | null = null;
  editGroupName = '';
  editGroupTypes: StravaActivityType[] = [];
  editGroupColor = '';
  editGroupMetrics: MetricKey[] = [];

  // Métriques disponibles
  allMetrics = ALL_METRICS;

  // Confirmation de suppression
  deletingGroupId: string | null = null;

  // Gestion du swipe mobile
  private touchStartY: number | null = null;

  // Couleurs disponibles
  availableColors = GROUP_COLORS;

  // Icônes disponibles
  availableIcons = [
    { id: 'run', label: 'Course' },
    { id: 'bike', label: 'Vélo' },
    { id: 'walk', label: 'Marche' },
    { id: 'weight', label: 'Musculation' },
    { id: 'swim', label: 'Natation' },
    { id: 'ski', label: 'Ski' },
    { id: 'activity', label: 'Générique' }
  ];

  constructor(private sportConfigService: SportConfigService) {}

  ngOnInit(): void {
    this.sportConfigService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.config = config;
      });

    this.sportConfigService.allGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe(groups => {
        this.groups = groups;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Gestion du panneau ===

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('panel-overlay')) {
      this.closePanel();
    }
  }

  closePanel(): void {
    this.cancelNewGroup();
    this.cancelEdit();
    this.deletingGroupId = null;
    this.close.emit();
  }

  // === Gestion des gestes tactiles (mobile) ===

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    // Seulement sur le drag handle ou le header
    if (target.closest('.drag-handle') || target.closest('.panel-header')) {
      this.touchStartY = event.touches[0].clientY;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (this.touchStartY !== null) {
      const deltaY = event.touches[0].clientY - this.touchStartY;
      if (deltaY > 100) {
        this.closePanel();
        this.touchStartY = null;
      }
    }
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    this.touchStartY = null;
  }

  // === Gestion des groupes ===

  toggleGroup(groupId: string): void {
    this.sportConfigService.toggleGroup(groupId);
  }

  moveGroupUp(groupId: string): void {
    this.sportConfigService.moveGroup(groupId, 'up');
  }

  moveGroupDown(groupId: string): void {
    this.sportConfigService.moveGroup(groupId, 'down');
  }

  isFirstGroup(group: SportGroup): boolean {
    return this.groups.indexOf(group) === 0;
  }

  isLastGroup(group: SportGroup): boolean {
    return this.groups.indexOf(group) === this.groups.length - 1;
  }

  // === Création de groupe ===

  startNewGroup(): void {
    this.showNewGroupForm = true;
    this.newGroupName = '';
    this.newGroupTypes = [];
    this.newGroupColor = GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
    this.newGroupIcon = 'activity';
    this.newGroupMetrics = [...ALL_METRICS];
  }

  cancelNewGroup(): void {
    this.showNewGroupForm = false;
    this.newGroupName = '';
    this.newGroupTypes = [];
    this.newGroupMetrics = [...ALL_METRICS];
  }

  toggleNewGroupType(type: StravaActivityType): void {
    const index = this.newGroupTypes.indexOf(type);
    if (index === -1) {
      this.newGroupTypes.push(type);
    } else {
      this.newGroupTypes.splice(index, 1);
    }
  }

  isTypeSelectedForNewGroup(type: StravaActivityType): boolean {
    return this.newGroupTypes.includes(type);
  }

  canCreateGroup(): boolean {
    return this.newGroupName.trim().length > 0 && this.newGroupTypes.length > 0;
  }

  createGroup(): void {
    if (this.canCreateGroup()) {
      this.sportConfigService.createGroup(
        this.newGroupName.trim(),
        this.newGroupTypes,
        this.newGroupIcon,
        this.newGroupColor,
        this.newGroupMetrics
      );
      this.cancelNewGroup();
    }
  }

  toggleNewGroupMetric(metric: MetricKey): void {
    const index = this.newGroupMetrics.indexOf(metric);
    if (index === -1) {
      this.newGroupMetrics.push(metric);
    } else if (this.newGroupMetrics.length > 1) {
      // Garder au moins une métrique
      this.newGroupMetrics.splice(index, 1);
    }
  }

  isMetricSelectedForNewGroup(metric: MetricKey): boolean {
    return this.newGroupMetrics.includes(metric);
  }

  // === Édition de groupe ===

  /** Types disponibles pour l'édition (union des types du groupe et des types détectés) */
  editAvailableTypes: StravaActivityType[] = [];

  startEdit(group: SportGroup): void {
    this.editingGroupId = group.id;
    this.editGroupName = group.name;
    this.editGroupTypes = [...group.types];
    this.editGroupColor = group.color;
    this.editGroupMetrics = [...(group.visibleMetrics || ALL_METRICS)];

    // Combiner les types du groupe avec les types disponibles
    // Pour les groupes par défaut, inclure aussi les types originaux (pour pouvoir les re-sélectionner)
    const allTypes = new Set<StravaActivityType>([
      ...group.types,
      ...this.availableTypes
    ]);

    // Ajouter les types originaux pour les groupes par défaut
    if (group.isDefault) {
      const defaultGroup = DEFAULT_SPORT_GROUPS.find(g => g.id === group.id);
      if (defaultGroup) {
        defaultGroup.types.forEach(type => allTypes.add(type));
      }
    }

    this.editAvailableTypes = Array.from(allTypes).sort((a, b) =>
      this.getSportLabel(a).localeCompare(this.getSportLabel(b))
    );
  }

  cancelEdit(): void {
    this.editingGroupId = null;
    this.editGroupName = '';
    this.editGroupTypes = [];
    this.editGroupMetrics = [];
  }

  toggleEditGroupType(type: StravaActivityType): void {
    const index = this.editGroupTypes.indexOf(type);
    if (index === -1) {
      this.editGroupTypes.push(type);
    } else {
      this.editGroupTypes.splice(index, 1);
    }
  }

  isTypeSelectedForEdit(type: StravaActivityType): boolean {
    return this.editGroupTypes.includes(type);
  }

  canSaveEdit(): boolean {
    return this.editGroupName.trim().length > 0 && this.editGroupTypes.length > 0;
  }

  saveEdit(): void {
    if (this.editingGroupId && this.canSaveEdit()) {
      this.sportConfigService.updateGroup(this.editingGroupId, {
        name: this.editGroupName.trim(),
        types: this.editGroupTypes,
        color: this.editGroupColor,
        visibleMetrics: this.editGroupMetrics
      });
      this.cancelEdit();
    }
  }

  toggleEditMetric(metric: MetricKey): void {
    const index = this.editGroupMetrics.indexOf(metric);
    if (index === -1) {
      this.editGroupMetrics.push(metric);
    } else if (this.editGroupMetrics.length > 1) {
      // Garder au moins une métrique
      this.editGroupMetrics.splice(index, 1);
    }
  }

  isMetricSelectedForEdit(metric: MetricKey): boolean {
    return this.editGroupMetrics.includes(metric);
  }

  // === Suppression de groupe ===

  confirmDelete(groupId: string): void {
    this.deletingGroupId = groupId;
  }

  cancelDelete(): void {
    this.deletingGroupId = null;
  }

  deleteGroup(): void {
    if (this.deletingGroupId) {
      this.sportConfigService.deleteGroup(this.deletingGroupId);
      this.deletingGroupId = null;
    }
  }

  // === Réinitialisation ===

  resetToDefaults(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      this.sportConfigService.resetToDefaults();
    }
  }

  // === Utilitaires ===

  getSportLabel(type: StravaActivityType): string {
    return getSportMetadata(type).label;
  }

  getSportMetadata(type: string): SportTypeMetadata {
    return getSportMetadata(type);
  }

  getMetricLabel(metric: MetricKey): string {
    return METRIC_METADATA[metric].label;
  }

  getGroupTypesLabel(group: SportGroup): string {
    if (group.types.length === 1) {
      return '1 type d\'activité';
    }
    return `${group.types.length} types d'activités`;
  }

  getTypesNotInAnyGroup(): StravaActivityType[] {
    const groupedTypes = new Set<string>();
    this.groups.forEach(g => g.types.forEach(t => groupedTypes.add(t)));
    return this.availableTypes.filter(type => !groupedTypes.has(type));
  }

  trackByGroupId(index: number, group: SportGroup): string {
    return group.id;
  }

  trackByType(index: number, type: StravaActivityType): string {
    return type;
  }
}
