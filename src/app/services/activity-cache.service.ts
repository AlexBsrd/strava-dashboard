import {Injectable} from '@angular/core';
import {Activity} from '../models/activity';
import {BehaviorSubject} from 'rxjs';
import {PeriodType} from "../types/period";

@Injectable({
  providedIn: 'root'
})
export class ActivityCacheService {
  private activities: Activity[] = [];
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  private lastUpdate: Date | null = null;
  private currentPeriod: PeriodType | null = null;

  setActivities(activities: Activity[], period: PeriodType) {
    if (!['current_year', '2024'].includes(period)) {
      this.activities = activities;
    } else {
      const existingIds = new Set(this.activities.map(a => a.id));
      const newActivities = activities.filter(a => !existingIds.has(a.id));
      this.activities = [...this.activities, ...newActivities];
    }

    this.lastUpdate = new Date();
    this.currentPeriod = period;
    this.activitiesSubject.next(activities);
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

    // Si on demande une période plus longue que celle qu'on a en cache
    if (this.currentPeriod === 'week' && ['month', 'current_year', '2024'].includes(period)) {
      return true;
    }
    if (this.currentPeriod === 'month' && ['current_year', '2024'].includes(period)) {
      return true;
    }
    if (this.currentPeriod === 'current_year' && period === '2024') {
      return true;
    }

    // Si la dernière mise à jour date de plus de 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.lastUpdate < fifteenMinutesAgo;
  }
}
