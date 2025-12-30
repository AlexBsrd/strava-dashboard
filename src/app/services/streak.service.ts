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

  /**
   * Calculate current streak and longest streak in weeks (weeks with at least one activity)
   */
  calculateWeekStreaks(activities: Activity[]): StreakInfo {
    if (!activities || activities.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0
      };
    }

    // Group activities by week (ISO week number)
    const activitiesByWeek = this.groupActivitiesByWeek(activities);
    const weekKeys = Array.from(activitiesByWeek.keys()).sort();

    if (weekKeys.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0
      };
    }

    // Calculate current streak (working backwards from current week)
    const today = new Date();
    const currentWeekKey = this.getWeekKey(today);
    let currentStreak = 0;
    let currentStreakStart: Date | undefined;
    let currentStreakEnd: Date | undefined;
    let checkWeekKey = currentWeekKey;

    while (true) {
      if (activitiesByWeek.has(checkWeekKey)) {
        currentStreak++;
        const weekDates = this.getWeekDates(checkWeekKey);
        currentStreakStart = weekDates.start;
        if (!currentStreakEnd) {
          currentStreakEnd = weekDates.end;
        }
        checkWeekKey = this.getPreviousWeekKey(checkWeekKey);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let longestStreakStart: Date | undefined;
    let longestStreakEnd: Date | undefined;
    let tempStreak = 1;
    let tempStreakStartKey = weekKeys[0];

    for (let i = 1; i < weekKeys.length; i++) {
      const prevKey = weekKeys[i - 1];
      const currKey = weekKeys[i];

      if (this.areConsecutiveWeeks(prevKey, currKey)) {
        tempStreak++;
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          longestStreakStart = this.getWeekDates(tempStreakStartKey).start;
          longestStreakEnd = this.getWeekDates(weekKeys[i - 1]).end;
        }
        tempStreak = 1;
        tempStreakStartKey = currKey;
      }
    }

    // Check last streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
      longestStreakStart = this.getWeekDates(tempStreakStartKey).start;
      longestStreakEnd = this.getWeekDates(weekKeys[weekKeys.length - 1]).end;
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
   * Group activities by ISO week (YYYY-WNN format)
   */
  private groupActivitiesByWeek(activities: Activity[]): Map<string, Activity[]> {
    const grouped = new Map<string, Activity[]>();

    activities.forEach(activity => {
      const date = new Date(activity.start_date);
      const weekKey = this.getWeekKey(date);

      if (!grouped.has(weekKey)) {
        grouped.set(weekKey, []);
      }
      grouped.get(weekKey)!.push(activity);
    });

    return grouped;
  }

  /**
   * Get ISO week key (YYYY-WNN)
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const weekNumber = this.getISOWeekNumber(date);
    // Handle year boundary (week 1 might be in December)
    const jan4 = new Date(year, 0, 4);
    const yearOfWeek = date < jan4 && weekNumber > 50 ? year - 1 :
                       (date > new Date(year, 11, 28) && weekNumber === 1 ? year + 1 : year);
    return `${yearOfWeek}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Get ISO week number for a date
   */
  private getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Get previous week key
   */
  private getPreviousWeekKey(weekKey: string): string {
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);

    if (week === 1) {
      // Go to last week of previous year
      // We need to find a date that's definitely in the last week of the previous year
      // Go back 7 days from the start of week 1 to be sure we're in the previous week
      const week1Dates = this.getWeekDates(weekKey);
      const previousWeekDate = new Date(week1Dates.start);
      previousWeekDate.setDate(previousWeekDate.getDate() - 1); // Go to Sunday of previous week
      return this.getWeekKey(previousWeekDate);
    }
    return `${year}-W${(week - 1).toString().padStart(2, '0')}`;
  }

  /**
   * Check if two week keys are consecutive
   */
  private areConsecutiveWeeks(prevKey: string, currKey: string): boolean {
    const [prevYearStr, prevWeekStr] = prevKey.split('-W');
    const [currYearStr, currWeekStr] = currKey.split('-W');
    const prevYear = parseInt(prevYearStr);
    const prevWeek = parseInt(prevWeekStr);
    const currYear = parseInt(currYearStr);
    const currWeek = parseInt(currWeekStr);

    if (currYear === prevYear && currWeek === prevWeek + 1) {
      return true;
    }

    // Year boundary: last week of previous year to week 1 of current year
    if (currYear === prevYear + 1 && currWeek === 1) {
      const lastDayPrevYear = new Date(prevYear, 11, 31);
      const lastWeekOfPrevYear = this.getISOWeekNumber(lastDayPrevYear);
      return prevWeek === lastWeekOfPrevYear || prevWeek === 52 || prevWeek === 53;
    }

    return false;
  }

  /**
   * Get start and end dates of a week from week key
   */
  private getWeekDates(weekKey: string): { start: Date; end: Date } {
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);

    // Find January 4th of the year (always in week 1)
    const jan4 = new Date(year, 0, 4);
    const jan4DayOfWeek = jan4.getDay() || 7; // Convert Sunday (0) to 7

    // Find Monday of week 1
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - jan4DayOfWeek + 1);

    // Calculate Monday of the target week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7);

    // Calculate Sunday of the target week
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    return { start: targetMonday, end: targetSunday };
  }
}
