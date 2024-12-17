import {Injectable} from '@angular/core';
import {Activity} from '../models/activity';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityCacheService {
  private activities: Activity[] = [];
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  private lastUpdate: Date | null = null;
  private currentPeriod: 'week' | 'month' | 'current_year' | null = null;

  setActivities(activities: Activity[], period: 'week' | 'month' | 'current_year') {
    // Pour les périodes plus courtes, ne conserver que les activités de la période
    if (period !== 'current_year') {
      this.activities = activities;
    } else {
      // Pour l'année complète, fusionner avec les activités existantes
      const existingIds = new Set(this.activities.map(a => a.id));
      const newActivities = activities.filter(a => !existingIds.has(a.id));
      this.activities = [...this.activities, ...newActivities];
    }

    this.lastUpdate = new Date();
    this.currentPeriod = period;
    this.activitiesSubject.next(activities);
  }

  getFilteredActivities(period: 'week' | 'month' | 'current_year'): Activity[] {
    const now = new Date();
    let startDate = new Date();

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

    return this.activities.filter(activity =>
      new Date(activity.start_date) >= startDate
    );
  }

  needsRefresh(period: 'week' | 'month' | 'current_year'): boolean {
    if (!this.lastUpdate || this.activities.length === 0) {
      return true;
    }

    // Si on demande une période plus longue que celle qu'on a en cache
    if (this.currentPeriod === 'week' && ['month', 'current_year'].includes(period)) {
      return true;
    }
    if (this.currentPeriod === 'month' && period === 'current_year') {
      return true;
    }

    // Si la dernière mise à jour date de plus de 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.lastUpdate < fifteenMinutesAgo;
  }

  clear() {
    this.activities = [];
    this.lastUpdate = null;
    this.currentPeriod = null;
    this.activitiesSubject.next([]);
  }

  getActivities$(): Observable<Activity[]> {
    return this.activitiesSubject.asObservable();
  }

  getCurrentPeriod(): 'week' | 'month' | 'current_year' | null {
    return this.currentPeriod;
  }
}
