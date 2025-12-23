import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Activity } from '../models/activity';
import {
  SportConfig,
  SportGroup,
  StravaActivityType,
  GroupedActivities,
  DEFAULT_SPORT_CONFIG,
  DEFAULT_SPORT_GROUPS,
  getSportMetadata,
  generateGroupId,
  SportTypeMetadata,
  MetricKey,
  ALL_METRICS,
  UngroupedSportConfig,
  getRecommendedMetrics
} from '../types/sport-config';

@Injectable({
  providedIn: 'root'
})
export class SportConfigService {
  private readonly STORAGE_KEY = 'sport_config';

  private config = new BehaviorSubject<SportConfig>(DEFAULT_SPORT_CONFIG);
  private availableTypes = new BehaviorSubject<StravaActivityType[]>([]);

  /** Observable de la configuration complète */
  config$ = this.config.asObservable();

  /** Observable des types d'activités disponibles (détectés depuis les activités de l'utilisateur) */
  availableTypes$ = this.availableTypes.asObservable();

  /** Observable des groupes activés, triés par ordre */
  enabledGroups$ = this.config$.pipe(
    map(config => config.groups
      .filter(g => g.isEnabled)
      .sort((a, b) => a.order - b.order)
    )
  );

  /** Observable de tous les groupes, triés par ordre */
  allGroups$ = this.config$.pipe(
    map(config => [...config.groups].sort((a, b) => a.order - b.order))
  );

  constructor() {
    this.loadConfig();
  }

  /**
   * Charge la configuration depuis localStorage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SportConfig;
        // Migration si nécessaire (pour les futures versions)
        const migrated = this.migrateConfig(parsed);
        this.config.next(migrated);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de la configuration des sports:', error);
      // En cas d'erreur, utiliser la config par défaut
      this.config.next({ ...DEFAULT_SPORT_CONFIG });
    }
  }

  /**
   * Sauvegarde la configuration dans localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config.value));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration des sports:', error);
    }
  }

  /**
   * Migre la configuration si nécessaire (pour les futures versions)
   */
  private migrateConfig(config: SportConfig): SportConfig {
    let migratedConfig = { ...config };

    // Migration v1 -> v2 : ajouter visibleMetrics si absent
    if (migratedConfig.version < 2) {
      migratedConfig = {
        ...migratedConfig,
        version: 2,
        groups: migratedConfig.groups.map(group => ({
          ...group,
          visibleMetrics: group.visibleMetrics || [...ALL_METRICS]
        }))
      };
    }

    // Migration v2 -> v3 : ajouter ungroupedSportsConfig
    if (migratedConfig.version < 3) {
      // Créer la config pour les sports déjà activés
      const ungroupedSportsConfig: Record<string, UngroupedSportConfig> = {};
      const enabledSports = migratedConfig.ungroupedSportsEnabled || [];

      enabledSports.forEach(type => {
        ungroupedSportsConfig[type] = {
          type,
          isEnabled: true,
          visibleMetrics: getRecommendedMetrics([type])
        };
      });

      migratedConfig = {
        ...migratedConfig,
        version: 3,
        ungroupedSportsConfig
      };
    }

    return migratedConfig;
  }

  /**
   * Retourne la configuration actuelle
   */
  getConfig(): SportConfig {
    return this.config.value;
  }

  /**
   * Retourne les groupes activés, triés par ordre
   */
  getEnabledGroups(): SportGroup[] {
    return this.config.value.groups
      .filter(g => g.isEnabled)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Retourne tous les groupes, triés par ordre
   */
  getAllGroups(): SportGroup[] {
    return [...this.config.value.groups].sort((a, b) => a.order - b.order);
  }

  /**
   * Retourne un groupe par son ID
   */
  getGroupById(groupId: string): SportGroup | undefined {
    return this.config.value.groups.find(g => g.id === groupId);
  }

  /**
   * Active ou désactive un groupe
   */
  toggleGroup(groupId: string): void {
    const config = this.config.value;
    const groupIndex = config.groups.findIndex(g => g.id === groupId);

    if (groupIndex !== -1) {
      const updatedGroups = [...config.groups];
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        isEnabled: !updatedGroups[groupIndex].isEnabled
      };

      this.config.next({
        ...config,
        groups: updatedGroups
      });
      this.saveConfig();
    }
  }

  /**
   * Met à jour l'ordre des groupes
   */
  reorderGroups(groupIds: string[]): void {
    const config = this.config.value;
    const updatedGroups = config.groups.map(group => {
      const newOrder = groupIds.indexOf(group.id);
      return {
        ...group,
        order: newOrder !== -1 ? newOrder : group.order
      };
    });

    this.config.next({
      ...config,
      groups: updatedGroups
    });
    this.saveConfig();
  }

  /**
   * Déplace un groupe vers le haut ou le bas
   */
  moveGroup(groupId: string, direction: 'up' | 'down'): void {
    const groups = this.getAllGroups();
    const currentIndex = groups.findIndex(g => g.id === groupId);

    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= groups.length) return;

    // Échanger les ordres
    const groupIds = groups.map(g => g.id);
    [groupIds[currentIndex], groupIds[newIndex]] = [groupIds[newIndex], groupIds[currentIndex]];

    this.reorderGroups(groupIds);
  }

  /**
   * Crée un nouveau groupe personnalisé
   */
  createGroup(name: string, types: StravaActivityType[], icon: string, color: string, visibleMetrics?: MetricKey[]): SportGroup {
    const config = this.config.value;

    const newGroup: SportGroup = {
      id: generateGroupId(),
      name,
      types,
      icon,
      color,
      isDefault: false,
      isEnabled: true,
      order: config.groups.length,
      visibleMetrics: visibleMetrics || [...ALL_METRICS]
    };

    this.config.next({
      ...config,
      groups: [...config.groups, newGroup]
    });
    this.saveConfig();

    return newGroup;
  }

  /**
   * Met à jour un groupe existant
   */
  updateGroup(groupId: string, updates: Partial<Omit<SportGroup, 'id' | 'isDefault'>>): boolean {
    const config = this.config.value;
    const groupIndex = config.groups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) return false;

    const updatedGroups = [...config.groups];
    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      ...updates
    };

    this.config.next({
      ...config,
      groups: updatedGroups
    });
    this.saveConfig();

    return true;
  }

  /**
   * Supprime un groupe personnalisé (les groupes par défaut ne peuvent pas être supprimés)
   */
  deleteGroup(groupId: string): boolean {
    const config = this.config.value;
    const group = config.groups.find(g => g.id === groupId);

    // Ne pas supprimer les groupes par défaut
    if (!group || group.isDefault) return false;

    const updatedGroups = config.groups.filter(g => g.id !== groupId);

    // Réindexer les ordres
    updatedGroups.forEach((g, index) => {
      g.order = index;
    });

    this.config.next({
      ...config,
      groups: updatedGroups
    });
    this.saveConfig();

    return true;
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut
   */
  resetToDefaults(): void {
    this.config.next({ ...DEFAULT_SPORT_CONFIG, groups: [...DEFAULT_SPORT_GROUPS] });
    this.saveConfig();
  }

  /**
   * Détecte les types d'activités disponibles à partir des activités
   * et met à jour l'observable availableTypes$
   */
  detectAvailableTypes(activities: Activity[]): StravaActivityType[] {
    const types = new Set<StravaActivityType>();
    // Utiliser sport_type pour détecter les types spécifiques (TrailRun, MountainBikeRide, etc.)
    activities.forEach(a => types.add((a.sport_type || a.type) as StravaActivityType));
    const sortedTypes = Array.from(types).sort();
    this.availableTypes.next(sortedTypes);
    return sortedTypes;
  }

  /**
   * Retourne les types d'activités disponibles actuels
   */
  getAvailableTypes(): StravaActivityType[] {
    return this.availableTypes.value;
  }

  /**
   * Filtre les activités par un groupe spécifique
   * Utilise sport_type en priorité pour un filtrage précis
   */
  filterActivitiesByGroup(activities: Activity[], group: SportGroup): Activity[] {
    return activities.filter(activity => {
      // Utiliser sport_type si disponible, sinon type
      const activityType = activity.sport_type || activity.type;

      // Vérifier si le type exact est dans le groupe
      if (group.types.includes(activityType as StravaActivityType)) {
        return true;
      }

      // Si sport_type n'est pas dans le groupe, vérifier si c'est un sous-type d'un type générique
      // Par exemple: si le groupe contient 'Run' mais pas 'TrailRun', et l'activité est 'TrailRun'
      // => on l'exclut car l'utilisateur a spécifiquement retiré TrailRun
      // Mais si sport_type n'existe pas et que type correspond, on l'inclut
      if (!activity.sport_type && group.types.includes(activity.type as StravaActivityType)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Filtre les activités par tous les groupes activés
   */
  filterActivitiesByEnabledGroups(activities: Activity[]): GroupedActivities[] {
    const enabledGroups = this.getEnabledGroups();
    return enabledGroups.map(group => ({
      group,
      activities: this.filterActivitiesByGroup(activities, group)
    }));
  }

  /**
   * Retourne les types d'activités non groupés (présents dans les activités mais pas dans un groupe)
   */
  getUngroupedTypes(activities: Activity[]): StravaActivityType[] {
    const allTypes = this.detectAvailableTypes(activities);
    const groupedTypes = new Set<string>();

    // Un type est groupé seulement s'il est explicitement dans les types d'un groupe
    this.config.value.groups.forEach(group => {
      group.types.forEach(type => {
        groupedTypes.add(type);
      });
    });

    return allTypes.filter(type => !groupedTypes.has(type));
  }

  /**
   * Active/désactive un sport individuel non groupé
   */
  toggleUngroupedSport(type: StravaActivityType): void {
    const config = this.config.value;
    const enabled = [...config.ungroupedSportsEnabled];
    const sportsConfig = { ...config.ungroupedSportsConfig };

    const index = enabled.indexOf(type);
    if (index === -1) {
      // Activer le sport et créer sa config si elle n'existe pas
      enabled.push(type);
      if (!sportsConfig[type]) {
        sportsConfig[type] = {
          type,
          isEnabled: true,
          visibleMetrics: getRecommendedMetrics([type])
        };
      } else {
        sportsConfig[type] = { ...sportsConfig[type], isEnabled: true };
      }
    } else {
      // Désactiver le sport
      enabled.splice(index, 1);
      if (sportsConfig[type]) {
        sportsConfig[type] = { ...sportsConfig[type], isEnabled: false };
      }
    }

    this.config.next({
      ...config,
      ungroupedSportsEnabled: enabled,
      ungroupedSportsConfig: sportsConfig
    });
    this.saveConfig();
  }

  /**
   * Vérifie si un sport individuel est activé
   */
  isUngroupedSportEnabled(type: StravaActivityType): boolean {
    return this.config.value.ungroupedSportsEnabled.includes(type);
  }

  /**
   * Retourne la configuration d'un sport individuel
   */
  getUngroupedSportConfig(type: StravaActivityType): UngroupedSportConfig | undefined {
    return this.config.value.ungroupedSportsConfig[type];
  }

  /**
   * Met à jour les métriques visibles d'un sport individuel
   */
  updateUngroupedSportMetrics(type: StravaActivityType, visibleMetrics: MetricKey[]): void {
    const config = this.config.value;
    const sportsConfig = { ...config.ungroupedSportsConfig };

    if (!sportsConfig[type]) {
      sportsConfig[type] = {
        type,
        isEnabled: this.isUngroupedSportEnabled(type),
        visibleMetrics
      };
    } else {
      sportsConfig[type] = { ...sportsConfig[type], visibleMetrics };
    }

    this.config.next({
      ...config,
      ungroupedSportsConfig: sportsConfig
    });
    this.saveConfig();
  }

  /**
   * Toggle une métrique pour un sport individuel
   */
  toggleUngroupedSportMetric(type: StravaActivityType, metric: MetricKey): void {
    const sportConfig = this.getUngroupedSportConfig(type);
    const currentMetrics = sportConfig?.visibleMetrics || getRecommendedMetrics([type]);

    let newMetrics: MetricKey[];
    if (currentMetrics.includes(metric)) {
      newMetrics = currentMetrics.filter(m => m !== metric);
    } else {
      newMetrics = [...currentMetrics, metric];
    }

    this.updateUngroupedSportMetrics(type, newMetrics);
  }

  /**
   * Active/désactive l'affichage des sports non groupés
   */
  toggleShowUngroupedSports(): void {
    const config = this.config.value;
    this.config.next({
      ...config,
      showUngroupedSports: !config.showUngroupedSports
    });
    this.saveConfig();
  }

  /**
   * Obtient les métadonnées d'un type de sport
   */
  getSportMetadata(type: string): SportTypeMetadata {
    return getSportMetadata(type);
  }

  /**
   * Vérifie si un type d'activité est couvert par un des groupes
   */
  isTypeCoveredByGroups(type: string): boolean {
    return this.config.value.groups.some(group =>
      group.types.some(groupType =>
        type === groupType || type.includes(groupType)
      )
    );
  }

  /**
   * Vérifie si un type est explicitement dans un groupe
   */
  isTypeInAnyGroup(type: StravaActivityType): boolean {
    return this.config.value.groups.some(group => group.types.includes(type));
  }

  /**
   * Retourne le nom du groupe contenant ce type (ou null)
   */
  getGroupContainingType(type: StravaActivityType): SportGroup | null {
    return this.config.value.groups.find(group => group.types.includes(type)) || null;
  }
}
