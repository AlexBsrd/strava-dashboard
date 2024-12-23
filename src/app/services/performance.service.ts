import {Injectable} from '@angular/core';
import {Activity} from '../models/activity';

export interface PersonalRecord {
  value: number;
  date: Date;
  activityName: string;
}

export interface PerformanceMetrics {
  bestRaces: {
    fiveKm: PersonalRecord;
    tenKm: PersonalRecord;
    semi: PersonalRecord;
    marathon: PersonalRecord;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  analyzePerformances(activities: Activity[]): PerformanceMetrics {
    const emptyRecord: PersonalRecord = {
      value: 0,
      date: new Date(),
      activityName: ''
    };

    let bestRaces = {
      fiveKm: {...emptyRecord},
      tenKm: {...emptyRecord},
      semi: {...emptyRecord},
      marathon: {...emptyRecord}
    };

    activities.forEach(activity => {
      const pace = activity.average_speed;
      const distance = activity.distance;

      // Marathon (tolérance 500m)
      if (distance >= 41.695) {
        if (pace > bestRaces.marathon.value || bestRaces.marathon.value === 0) {
          bestRaces.marathon = {
            value: pace,
            date: new Date(activity.start_date),
            activityName: activity.name
          };
        }
      }

      // Semi-marathon (tolérance 500m)
      if (distance >= 20.6) {
        if (pace > bestRaces.semi.value || bestRaces.semi.value === 0) {
          bestRaces.semi = {
            value: pace,
            date: new Date(activity.start_date),
            activityName: activity.name
          };
        }
      }

      // 10km
      if (distance >= 9.5) {
        if (pace > bestRaces.tenKm.value || bestRaces.tenKm.value === 0) {
          bestRaces.tenKm = {
            value: pace,
            date: new Date(activity.start_date),
            activityName: activity.name
          };
        }
      }

      // 5km (tolérance 300m)
      if (distance >= 4.7) {
        if (pace > bestRaces.fiveKm.value || bestRaces.fiveKm.value === 0) {
          bestRaces.fiveKm = {
            value: pace,
            date: new Date(activity.start_date),
            activityName: activity.name
          };
        }
      }
    });

    return {bestRaces};
  }
}
