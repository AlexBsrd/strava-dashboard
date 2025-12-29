/**
 * Types et configuration pour la gestion des sports et groupes d'activités
 */

import { Activity } from '../models/activity';

/**
 * Clés des métriques affichables pour chaque groupe
 */
export type MetricKey =
  | 'totalElapsedTime'
  | 'averageSpeed'
  | 'totalDistance'
  | 'averageDistance'
  | 'totalElevation'
  | 'averageElevation';

/**
 * Métadonnées des métriques pour l'UI
 * Les labels sont des clés de traduction (metrics.labels.*)
 */
export const METRIC_METADATA: Record<MetricKey, { labelKey: string; unit: string; isTime?: boolean }> = {
  totalElapsedTime: { labelKey: 'metrics.labels.totalElapsedTime', unit: '', isTime: true },
  averageSpeed: { labelKey: 'metrics.labels.averageSpeed', unit: 'km/h' },
  totalDistance: { labelKey: 'metrics.labels.totalDistance', unit: 'km' },
  averageDistance: { labelKey: 'metrics.labels.averageDistance', unit: 'km' },
  totalElevation: { labelKey: 'metrics.labels.totalElevation', unit: 'm' },
  averageElevation: { labelKey: 'metrics.labels.averageElevation', unit: 'm' }
};

/**
 * Toutes les métriques par défaut (activées)
 */
export const ALL_METRICS: MetricKey[] = [
  'totalElapsedTime',
  'averageSpeed',
  'totalDistance',
  'averageDistance',
  'totalElevation',
  'averageElevation'
];

/**
 * Types d'activités Strava connus (extensible avec string pour les types inconnus)
 */
export type StravaActivityType =
  // Course
  | 'Run'
  | 'VirtualRun'
  | 'TrailRun'
  // Vélo
  | 'Ride'
  | 'MountainBikeRide'
  | 'GravelRide'
  | 'VirtualRide'
  | 'EBikeRide'
  // Marche
  | 'Walk'
  | 'Hike'
  // Fitness
  | 'WeightTraining'
  | 'Yoga'
  | 'Workout'
  | 'CrossFit'
  | 'Elliptical'
  | 'StairStepper'
  // Eau
  | 'Swim'
  | 'Rowing'
  | 'Kayaking'
  | 'Canoeing'
  | 'StandUpPaddling'
  | 'Surfing'
  // Hiver
  | 'AlpineSki'
  | 'BackcountrySki'
  | 'NordicSki'
  | 'Snowboard'
  | 'IceSkate'
  // Autres
  | 'Skateboard'
  | 'InlineSkate'
  | 'RockClimbing'
  | 'Golf'
  | 'Tennis'
  | 'Soccer'
  | string; // Permet les types inconnus de Strava

/**
 * Catégories pour organiser les types de sports dans l'UI
 */
export type SportCategory = 'running' | 'cycling' | 'walking' | 'fitness' | 'water' | 'winter' | 'other';

/**
 * Métadonnées d'un type de sport
 */
export interface SportTypeMetadata {
  type: StravaActivityType;
  labelKey: string;        // Clé de traduction (sports.types.*)
  icon: string;            // Identifiant d'icône
  category: SportCategory; // Catégorie parente
  hasDistance: boolean;    // Si true, affiche les stats de distance/vitesse
  hasElevation: boolean;   // Si true, affiche les stats de dénivelé
}

/**
 * Groupe de sports (prédéfini ou personnalisé)
 */
export interface SportGroup {
  id: string;                      // Identifiant unique (ex: 'running', 'custom-1')
  nameKey: string;                 // Clé de traduction (sports.groups.*) ou nom personnalisé
  types: StravaActivityType[];     // Types d'activités inclus
  icon: string;                    // Icône du groupe
  color: string;                   // Couleur CSS du groupe
  isDefault: boolean;              // Groupe prédéfini (non supprimable)
  isEnabled: boolean;              // Affiché ou masqué
  order: number;                   // Ordre d'affichage
  visibleMetrics: MetricKey[];     // Métriques à afficher pour ce groupe
}

/**
 * Configuration d'un sport individuel non-groupé
 */
export interface UngroupedSportConfig {
  type: StravaActivityType;
  isEnabled: boolean;
  visibleMetrics: MetricKey[];
}

/**
 * Configuration complète stockée dans localStorage
 */
export interface SportConfig {
  version: number;                               // Version du schéma pour migrations
  groups: SportGroup[];                          // Tous les groupes de sports
  showUngroupedSports: boolean;                  // Afficher les sports non groupés
  ungroupedSportsEnabled: StravaActivityType[];  // Sports individuels activés (legacy, pour compatibilité)
  ungroupedSportsConfig: Record<string, UngroupedSportConfig>; // Configuration détaillée par sport
}

/**
 * Activités filtrées par groupe
 */
export interface GroupedActivities {
  group: SportGroup;
  activities: Activity[];
}

/**
 * Métadonnées pour tous les types de sports connus
 * Les labelKey sont des clés de traduction (sports.types.*)
 */
export const SPORT_TYPE_METADATA: Record<string, SportTypeMetadata> = {
  // Course - distance et dénivelé
  'Run': { type: 'Run', labelKey: 'sports.types.Run', icon: 'run', category: 'running', hasDistance: true, hasElevation: true },
  'VirtualRun': { type: 'VirtualRun', labelKey: 'sports.types.VirtualRun', icon: 'run', category: 'running', hasDistance: true, hasElevation: false },
  'TrailRun': { type: 'TrailRun', labelKey: 'sports.types.TrailRun', icon: 'trail', category: 'running', hasDistance: true, hasElevation: true },

  // Vélo - distance et dénivelé
  'Ride': { type: 'Ride', labelKey: 'sports.types.Ride', icon: 'bike', category: 'cycling', hasDistance: true, hasElevation: true },
  'MountainBikeRide': { type: 'MountainBikeRide', labelKey: 'sports.types.MountainBikeRide', icon: 'mtb', category: 'cycling', hasDistance: true, hasElevation: true },
  'GravelRide': { type: 'GravelRide', labelKey: 'sports.types.GravelRide', icon: 'bike', category: 'cycling', hasDistance: true, hasElevation: true },
  'VirtualRide': { type: 'VirtualRide', labelKey: 'sports.types.VirtualRide', icon: 'bike', category: 'cycling', hasDistance: true, hasElevation: false },
  'EBikeRide': { type: 'EBikeRide', labelKey: 'sports.types.EBikeRide', icon: 'ebike', category: 'cycling', hasDistance: true, hasElevation: true },

  // Marche - distance et dénivelé
  'Walk': { type: 'Walk', labelKey: 'sports.types.Walk', icon: 'walk', category: 'walking', hasDistance: true, hasElevation: true },
  'Hike': { type: 'Hike', labelKey: 'sports.types.Hike', icon: 'hike', category: 'walking', hasDistance: true, hasElevation: true },

  // Fitness - pas de distance, pas de dénivelé
  'WeightTraining': { type: 'WeightTraining', labelKey: 'sports.types.WeightTraining', icon: 'weight', category: 'fitness', hasDistance: false, hasElevation: false },
  'Yoga': { type: 'Yoga', labelKey: 'sports.types.Yoga', icon: 'yoga', category: 'fitness', hasDistance: false, hasElevation: false },
  'Workout': { type: 'Workout', labelKey: 'sports.types.Workout', icon: 'workout', category: 'fitness', hasDistance: false, hasElevation: false },
  'CrossFit': { type: 'CrossFit', labelKey: 'sports.types.CrossFit', icon: 'crossfit', category: 'fitness', hasDistance: false, hasElevation: false },
  'Elliptical': { type: 'Elliptical', labelKey: 'sports.types.Elliptical', icon: 'elliptical', category: 'fitness', hasDistance: false, hasElevation: false },
  'StairStepper': { type: 'StairStepper', labelKey: 'sports.types.StairStepper', icon: 'stairs', category: 'fitness', hasDistance: false, hasElevation: false },

  // Eau - distance mais pas de dénivelé
  'Swim': { type: 'Swim', labelKey: 'sports.types.Swim', icon: 'swim', category: 'water', hasDistance: true, hasElevation: false },
  'Rowing': { type: 'Rowing', labelKey: 'sports.types.Rowing', icon: 'rowing', category: 'water', hasDistance: true, hasElevation: false },
  'Kayaking': { type: 'Kayaking', labelKey: 'sports.types.Kayaking', icon: 'kayak', category: 'water', hasDistance: true, hasElevation: false },
  'Canoeing': { type: 'Canoeing', labelKey: 'sports.types.Canoeing', icon: 'canoe', category: 'water', hasDistance: true, hasElevation: false },
  'StandUpPaddling': { type: 'StandUpPaddling', labelKey: 'sports.types.StandUpPaddling', icon: 'paddle', category: 'water', hasDistance: true, hasElevation: false },
  'Surfing': { type: 'Surfing', labelKey: 'sports.types.Surfing', icon: 'surf', category: 'water', hasDistance: false, hasElevation: false },

  // Hiver - distance et dénivelé
  'AlpineSki': { type: 'AlpineSki', labelKey: 'sports.types.AlpineSki', icon: 'ski', category: 'winter', hasDistance: true, hasElevation: true },
  'BackcountrySki': { type: 'BackcountrySki', labelKey: 'sports.types.BackcountrySki', icon: 'ski', category: 'winter', hasDistance: true, hasElevation: true },
  'NordicSki': { type: 'NordicSki', labelKey: 'sports.types.NordicSki', icon: 'nordic', category: 'winter', hasDistance: true, hasElevation: true },
  'Snowboard': { type: 'Snowboard', labelKey: 'sports.types.Snowboard', icon: 'snowboard', category: 'winter', hasDistance: true, hasElevation: true },
  'IceSkate': { type: 'IceSkate', labelKey: 'sports.types.IceSkate', icon: 'skate', category: 'winter', hasDistance: true, hasElevation: false },

  // Autres
  'Skateboard': { type: 'Skateboard', labelKey: 'sports.types.Skateboard', icon: 'skateboard', category: 'other', hasDistance: true, hasElevation: false },
  'InlineSkate': { type: 'InlineSkate', labelKey: 'sports.types.InlineSkate', icon: 'roller', category: 'other', hasDistance: true, hasElevation: false },
  'RockClimbing': { type: 'RockClimbing', labelKey: 'sports.types.RockClimbing', icon: 'climbing', category: 'other', hasDistance: false, hasElevation: true },
  'Golf': { type: 'Golf', labelKey: 'sports.types.Golf', icon: 'golf', category: 'other', hasDistance: true, hasElevation: false },
  'Tennis': { type: 'Tennis', labelKey: 'sports.types.Tennis', icon: 'tennis', category: 'other', hasDistance: false, hasElevation: false },
  'Soccer': { type: 'Soccer', labelKey: 'sports.types.Soccer', icon: 'soccer', category: 'other', hasDistance: true, hasElevation: false },
};

/**
 * Groupes de sports par défaut
 */
export const DEFAULT_SPORT_GROUPS: SportGroup[] = [
  {
    id: 'running',
    nameKey: 'sports.groups.running',
    types: ['Run', 'VirtualRun', 'TrailRun'],
    icon: 'run',
    color: '#ef4444',
    isDefault: true,
    isEnabled: true,
    order: 0,
    visibleMetrics: [...ALL_METRICS]
  },
  {
    id: 'walking',
    nameKey: 'sports.groups.walking',
    types: ['Walk', 'Hike'],
    icon: 'walk',
    color: '#22c55e',
    isDefault: true,
    isEnabled: true,
    order: 1,
    visibleMetrics: [...ALL_METRICS]
  },
  {
    id: 'cycling',
    nameKey: 'sports.groups.cycling',
    types: ['Ride', 'MountainBikeRide', 'GravelRide', 'VirtualRide', 'EBikeRide'],
    icon: 'bike',
    color: '#3b82f6',
    isDefault: true,
    isEnabled: true,
    order: 2,
    visibleMetrics: [...ALL_METRICS]
  }
];

/**
 * Configuration par défaut
 */
export const DEFAULT_SPORT_CONFIG: SportConfig = {
  version: 3,
  groups: DEFAULT_SPORT_GROUPS,
  showUngroupedSports: false,
  ungroupedSportsEnabled: [],
  ungroupedSportsConfig: {}
};

/**
 * Palette de couleurs disponibles pour les groupes personnalisés
 */
export const GROUP_COLORS: string[] = [
  '#ef4444', // Rouge
  '#f97316', // Orange
  '#f59e0b', // Ambre
  '#eab308', // Jaune
  '#84cc16', // Lime
  '#22c55e', // Vert
  '#10b981', // Émeraude
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Bleu
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Rose
];

/**
 * Obtient les métadonnées d'un type de sport (avec fallback pour les types inconnus)
 */
export function getSportMetadata(type: string): SportTypeMetadata {
  return SPORT_TYPE_METADATA[type] || {
    type: type as StravaActivityType,
    labelKey: type, // Pour les types inconnus, utiliser le type comme clé
    icon: 'activity',
    category: 'other' as SportCategory,
    hasDistance: false,
    hasElevation: false
  };
}

/**
 * Calcule les métriques recommandées pour un ensemble de types d'activités
 * Basé sur hasDistance et hasElevation des métadonnées
 */
export function getRecommendedMetrics(types: StravaActivityType[]): MetricKey[] {
  // Toujours inclure le temps total
  const metrics: MetricKey[] = ['totalElapsedTime'];

  // Vérifier si au moins un type a de la distance
  const hasDistance = types.some(t => getSportMetadata(t).hasDistance);
  if (hasDistance) {
    metrics.push('averageSpeed', 'totalDistance', 'averageDistance');
  }

  // Vérifier si au moins un type a du dénivelé
  const hasElevation = types.some(t => getSportMetadata(t).hasElevation);
  if (hasElevation) {
    metrics.push('totalElevation', 'averageElevation');
  }

  return metrics;
}

/**
 * Génère un ID unique pour un groupe personnalisé
 */
export function generateGroupId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
