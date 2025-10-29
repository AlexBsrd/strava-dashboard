import {Injectable} from '@angular/core';
import {Activity} from '../models/activity';
import {BehaviorSubject} from 'rxjs';
import {PeriodType} from "../types/period";

interface CachedData {
  activities: Activity[];
  timestamp: number;
  athleteId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityCacheService {
  private activities: Activity[] = [];
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  private lastUpdate: Date | null = null;
  private currentPeriod: PeriodType | null = null;
  private readonly CACHE_KEY = 'strava_activities_cache';
  private readonly IN_MEMORY_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly LOCAL_STORAGE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.loadFromLocalStorage();
  }

  setActivities(activities: Activity[], period: PeriodType) {
    // Fusionner les nouvelles activités avec celles existantes (dédupliquer par ID)
    const existingIds = new Set(this.activities.map(a => a.id));
    const newActivities = activities.filter(a => !existingIds.has(a.id));
    this.activities = [...this.activities, ...newActivities];

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
      case '2024':
        startDate = new Date(2024, 0, 1);
        endDate = new Date(2024, 11, 31, 23, 59, 59);
        break;
    }

    return this.activities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      if (period === '2024') {
        return activityDate >= startDate && activityDate <= endDate;
      }
      return activityDate >= startDate;
    });
  }

  needsRefresh(period: PeriodType): boolean {
    if (!this.lastUpdate || this.activities.length === 0) {
      return true;
    }

    // Si la dernière mise à jour date de plus de 15 minutes (in-memory cache)
    const cacheAge = Date.now() - this.lastUpdate.getTime();
    return cacheAge > this.IN_MEMORY_CACHE_DURATION;
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
        athleteId: athleteId
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
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}
