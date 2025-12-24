import {Injectable} from '@angular/core';
import {Activity} from '../models/activity';
import {BehaviorSubject} from 'rxjs';
import {PeriodType, getYearFromPeriod} from "../types/period";

interface CachedData {
  activities: Activity[];
  timestamp: number;
  athleteId: string;
  oldestActivityDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityCacheService {
  private activities: Activity[] = [];
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  public activities$ = this.activitiesSubject.asObservable();
  private lastUpdate: Date | null = null;
  private currentPeriod: PeriodType | null = null;
  private readonly CACHE_KEY = 'strava_activities_cache';
  private readonly IN_MEMORY_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly LOCAL_STORAGE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private isPreloading = false;
  private oldestActivityDate: Date | null = null;

  constructor() {
    this.loadFromLocalStorage();
  }

  setActivities(activities: Activity[], period: PeriodType) {
    // Créer une Map pour dédupliquer les activités par ID
    const activityMap = new Map<number, Activity>();

    // Ajouter d'abord les activités existantes
    this.activities.forEach(a => activityMap.set(a.id, a));

    // Puis ajouter/écraser avec les nouvelles activités
    activities.forEach(a => activityMap.set(a.id, a));

    // Convertir la Map en tableau
    this.activities = Array.from(activityMap.values());

    // Mettre à jour la date de l'activité la plus ancienne
    if (this.activities.length > 0) {
      // Si on a déjà une oldestActivityDate, on vérifie seulement les nouvelles activités
      if (this.oldestActivityDate && activities.length > 0) {
        const newOldest = activities.reduce((oldest, current) => {
          const currentDate = new Date(current.start_date);
          const oldestDate = new Date(oldest.start_date);
          return currentDate < oldestDate ? current : oldest;
        });
        const newOldestDate = new Date(newOldest.start_date);

        if (newOldestDate < this.oldestActivityDate) {
          this.oldestActivityDate = newOldestDate;
        }
      } else {
        // Première fois ou pas de oldestActivityDate - scanner toutes les activités
        const oldestActivity = this.activities.reduce((oldest, current) => {
          const currentDate = new Date(current.start_date);
          const oldestDate = new Date(oldest.start_date);
          return currentDate < oldestDate ? current : oldest;
        });
        this.oldestActivityDate = new Date(oldestActivity.start_date);
      }
    }

    this.lastUpdate = new Date();
    this.currentPeriod = period;
    this.activitiesSubject.next(this.activities);

    // Sauvegarder dans localStorage
    this.saveToLocalStorage();
  }

  getFilteredActivities(period: PeriodType): Activity[] {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    // Vérifier si c'est une année spécifique
    const year = getYearFromPeriod(period);
    if (year !== null) {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
    }

    return this.activities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      if (year !== null) {
        return activityDate >= startDate && activityDate <= endDate;
      }
      return activityDate >= startDate;
    });
  }

  /**
   * Get all cached activities (not filtered by period)
   */
  getAllActivities(): Activity[] {
    return this.activities;
  }

  needsRefresh(period: PeriodType): boolean {
    if (!this.lastUpdate || this.activities.length === 0) {
      return true;
    }

    // Si la dernière mise à jour date de plus de 15 minutes (in-memory cache)
    const cacheAge = Date.now() - this.lastUpdate.getTime();
    if (cacheAge > this.IN_MEMORY_CACHE_DURATION) {
      return true;
    }

    // Vérifier si la période demandée est couverte par le cache
    return !this.isPeriodCovered(period);
  }

  /**
   * Vérifie si la période demandée est couverte par les données en cache
   */
  isPeriodCovered(period: PeriodType): boolean {
    if (!this.oldestActivityDate) {
      return false;
    }

    const periodStartDate = this.getPeriodStartDate(period);

    // La période est couverte si l'activité la plus ancienne du cache
    // est antérieure ou égale à la date de début de la période
    return this.oldestActivityDate <= periodStartDate;
  }

  private saveToLocalStorage(): void {
    try {
      const athleteId = localStorage.getItem('strava_athlete_id');
      if (!athleteId) {
        return; // Pas d'athlete ID, on ne sauvegarde pas
      }

      const cachedData: CachedData = {
        activities: this.activities,
        timestamp: Date.now(),
        athleteId: athleteId,
        oldestActivityDate: this.oldestActivityDate?.toISOString() ?? null
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedData));
    } catch (error) {
      // localStorage peut être désactivé ou plein, on ignore silencieusement
      console.warn('Failed to save activities to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) {
        return;
      }

      const cachedData: CachedData = JSON.parse(cached);
      const currentAthleteId = localStorage.getItem('strava_athlete_id');

      // Vérifier que le cache appartient à l'utilisateur actuel
      if (cachedData.athleteId !== currentAthleteId) {
        this.clearLocalStorageCache();
        return;
      }

      // Vérifier l'âge du cache (1 heure pour localStorage)
      const cacheAge = Date.now() - cachedData.timestamp;
      if (cacheAge > this.LOCAL_STORAGE_CACHE_DURATION) {
        this.clearLocalStorageCache();
        return;
      }

      // Charger les activités depuis le cache
      this.activities = cachedData.activities;
      this.lastUpdate = new Date(cachedData.timestamp);
      this.oldestActivityDate = cachedData.oldestActivityDate
        ? new Date(cachedData.oldestActivityDate)
        : null;
      this.activitiesSubject.next(this.activities);
    } catch (error) {
      // Si erreur de parsing, on nettoie le cache
      console.warn('Failed to load activities from localStorage:', error);
      this.clearLocalStorageCache();
    }
  }

  clearLocalStorageCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      this.activities = [];
      this.lastUpdate = null;
      this.currentPeriod = null;
      this.oldestActivityDate = null;
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  setPreloading(value: boolean): void {
    this.isPreloading = value;
  }

  getOldestActivityDate(): Date | null {
    return this.oldestActivityDate;
  }

  /**
   * Calcule la date de début pour une période donnée
   */
  private getPeriodStartDate(period: PeriodType): Date {
    const now = new Date();
    let startDate = new Date();

    // Vérifier si c'est une année spécifique
    const year = getYearFromPeriod(period);
    if (year !== null) {
      startDate = new Date(year, 0, 1);
    } else {
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
    }

    return startDate;
  }

  /**
   * Vérifie si les données de la période demandée sont prêtes à être affichées.
   * Retourne true si:
   * - Le preload n'est pas en cours, OU
   * - On a chargé toutes les activités jusqu'à la date de début de la période
   */
  isPeriodReady(period: PeriodType): boolean {
    // Si le preload n'est pas en cours, les données sont toujours prêtes
    if (!this.isPreloading) {
      return true;
    }

    // Si on n'a pas encore d'activités, pas prêt
    if (this.activities.length === 0 || !this.oldestActivityDate) {
      return false;
    }

    // Calculer la date de début de la période
    const periodStartDate = this.getPeriodStartDate(period);

    // La période est prête si l'activité la plus ancienne du cache
    // est antérieure ou égale à la date de début de la période
    return this.oldestActivityDate <= periodStartDate;
  }
}
