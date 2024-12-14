// src/app/services/performance.service.ts
import {Injectable} from '@angular/core';
import {Activity} from '../models/activity';

export interface PersonalRecord {
  value: number;
  date: Date;
  activityName: string;
}

export interface PerformanceMetrics {
  bestRaces: {
    semi: PersonalRecord;
    trail30: PersonalRecord;
    tenKm: PersonalRecord;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  analyzePerformances(activities: Activity[]): PerformanceMetrics {
    return {
      bestRaces: this.findBestRaces(activities)
    };
  }

  private findBestRaces(activities: Activity[]): PerformanceMetrics['bestRaces'] {
    let bestRaces = {
      semi: {value: 0, date: new Date(), activityName: ''},
      trail30: {value: 0, date: new Date(), activityName: ''},
      tenKm: {value: 0, date: new Date(), activityName: ''}
    };

    activities.forEach(activity => {
      const pace = activity.average_speed;
      const distance = activity.distance;

      if (distance >= 9.9 && distance <= 10.1) {
        if (pace > bestRaces.tenKm.value || bestRaces.tenKm.value === 0) {
          bestRaces.tenKm = {
            value: pace,
            date: new Date(activity.start_date),
            activityName: activity.name
          };
        }
      }

      if (distance >= 21 && distance <= 21.5) {
        if (pace > bestRaces.semi.value || bestRaces.semi.value === 0) {
          bestRaces.semi = {
            value: pace,
            date: new Date(activity.start_date),
            activityName: activity.name
          };
        }
      }

      if (distance >= 30 && activity.total_elevation_gain > 500) {
        if (pace > bestRaces.trail30.value || bestRaces.trail30.value === 0) {
          bestRaces.trail30 = {
            value: pace,
            date: new Date(activity.start_date),
            activityName: activity.name
          };
        }
      }
    });

    return bestRaces;
  }
}
