import { Injectable } from '@angular/core';
import { Activity } from '../models/activity';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  currentStreakStart?: Date;
  currentStreakEnd?: Date;
  longestStreakStart?: Date;
  longestStreakEnd?: Date;
}

export interface HeatmapDay {
  date: Date;
  count: number;
  activities: Activity[];
}

@Injectable({
  providedIn: 'root'
})
export class StreakService {

  constructor() { }

  /**
   * Calculate current streak and longest streak from activities
   */
  calculateStreaks(activities: Activity[]): StreakInfo {
    if (!activities || activities.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0
      };
    }

    // Group activities by date (ignore time)
    const activitiesByDate = this.groupActivitiesByDate(activities);
    const dates = Array.from(activitiesByDate.keys()).sort((a, b) => a - b).map(timestamp => new Date(timestamp));

    if (dates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0
      };
    }

    // Calculate current streak (working backwards from today)
    const today = this.getDateWithoutTime(new Date());
    let currentStreak = 0;
    let currentStreakStart: Date | undefined;
    let currentStreakEnd: Date | undefined;
    let checkDate = new Date(today);

    while (true) {
      const dateStr = this.getDateWithoutTime(checkDate).getTime();
      if (activitiesByDate.has(dateStr)) {
        currentStreak++;
        currentStreakStart = new Date(checkDate);
        if (!currentStreakEnd) {
          currentStreakEnd = new Date(checkDate);
        }
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak in the entire dataset
    let longestStreak = 0;
    let longestStreakStart: Date | undefined;
    let longestStreakEnd: Date | undefined;
    let tempStreak = 1;
    let tempStreakStart = dates[0];

    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1];
      const currDate = dates[i];
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Streak broken
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          longestStreakStart = new Date(tempStreakStart);
          longestStreakEnd = new Date(dates[i - 1]);
        }
        tempStreak = 1;
        tempStreakStart = currDate;
      }
    }

    // Check last streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
      longestStreakStart = new Date(tempStreakStart);
      longestStreakEnd = new Date(dates[dates.length - 1]);
    }

    // Current streak might be the longest
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStart = currentStreakStart;
      longestStreakEnd = currentStreakEnd;
    }

    return {
      currentStreak,
      longestStreak,
      currentStreakStart,
      currentStreakEnd,
      longestStreakStart,
      longestStreakEnd
    };
  }

  /**
   * Generate heatmap data for a given period (e.g., last 365 days)
   */
  generateHeatmapData(activities: Activity[], days: number = 365): HeatmapDay[] {
    const activitiesByDate = this.groupActivitiesByDate(activities);
    const heatmapData: HeatmapDay[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateWithoutTime = this.getDateWithoutTime(date);
      const dateKey = dateWithoutTime.getTime();

      const dayActivities = activitiesByDate.get(dateKey) || [];
      heatmapData.push({
        date: dateWithoutTime,
        count: dayActivities.length,
        activities: dayActivities
      });
    }

    return heatmapData;
  }

  /**
   * Generate heatmap data for a specific month
   */
  generateMonthHeatmapData(activities: Activity[], year: number, month: number): HeatmapDay[] {
    const activitiesByDate = this.groupActivitiesByDate(activities);
    const heatmapData: HeatmapDay[] = [];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateWithoutTime = this.getDateWithoutTime(date);
      const dateKey = dateWithoutTime.getTime();

      const dayActivities = activitiesByDate.get(dateKey) || [];
      heatmapData.push({
        date: dateWithoutTime,
        count: dayActivities.length,
        activities: dayActivities
      });
    }

    return heatmapData;
  }

  /**
   * Group activities by date (without time)
   */
  private groupActivitiesByDate(activities: Activity[]): Map<number, Activity[]> {
    const grouped = new Map<number, Activity[]>();

    activities.forEach(activity => {
      const date = this.getDateWithoutTime(new Date(activity.start_date));
      const dateKey = date.getTime();

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(activity);
    });

    return grouped;
  }

  /**
   * Get date without time component (normalized to midnight)
   */
  private getDateWithoutTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Check if a date has activities
   */
  hasActivitiesOnDate(activities: Activity[], date: Date): boolean {
    const dateWithoutTime = this.getDateWithoutTime(date);
    return activities.some(activity => {
      const activityDate = this.getDateWithoutTime(new Date(activity.start_date));
      return activityDate.getTime() === dateWithoutTime.getTime();
    });
  }

  /**
   * Get activities for a specific date
   */
  getActivitiesForDate(activities: Activity[], date: Date): Activity[] {
    const dateWithoutTime = this.getDateWithoutTime(date);
    return activities.filter(activity => {
      const activityDate = this.getDateWithoutTime(new Date(activity.start_date));
      return activityDate.getTime() === dateWithoutTime.getTime();
    });
  }
}
