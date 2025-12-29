import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Stats } from '../models/stats';
import { Activity } from '../models/activity';
import { ComparisonPeriod, StatDelta, StatsComparison, ComparisonPreset } from '../types/comparison';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  constructor(private translateService: TranslateService) {}

  /**
   * Calculate delta between two values
   */
  calculateDelta(value1: number, value2: number): StatDelta {
    const absolute = value2 - value1;
    const percentage = value1 === 0 ? (value2 > 0 ? 100 : 0) : (absolute / value1) * 100;

    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(percentage) < 0.5) {
      trend = 'stable';
    } else if (absolute > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    return {
      absolute: Number(absolute.toFixed(2)),
      percentage: Number(percentage.toFixed(1)),
      trend
    };
  }

  /**
   * Compare two Stats objects and return deltas for all metrics
   */
  compareStats(stats1: Stats, stats2: Stats): StatsComparison {
    return {
      period1Stats: stats1,
      period2Stats: stats2,
      deltas: {
        totalDistance: this.calculateDelta(stats1.totalDistance, stats2.totalDistance),
        averageDistance: this.calculateDelta(stats1.averageDistance, stats2.averageDistance),
        averageSpeed: this.calculateDelta(stats1.averageSpeed, stats2.averageSpeed),
        totalElevation: this.calculateDelta(stats1.totalElevation, stats2.totalElevation),
        averageElevation: this.calculateDelta(stats1.averageElevation, stats2.averageElevation),
        totalElapsedTime: this.calculateDelta(stats1.totalElapsedTime, stats2.totalElapsedTime),
        numberOfActivities: this.calculateDelta(stats1.numberOfActivities, stats2.numberOfActivities)
      }
    };
  }

  /**
   * Generate smart comparison presets
   */
  getComparisonPresets(): ComparisonPreset[] {
    const now = new Date();
    const presets: ComparisonPreset[] = [];

    // Current week vs Previous week
    const thisWeekStart = this.getStartOfWeek(now);
    const thisWeekEnd = new Date(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);

    presets.push({
      label: 'Current week vs Previous week',
      labelKey: 'comparison_presets.current_week_vs_previous',
      period1: {
        type: 'custom',
        label: 'Previous week',
        labelKey: 'comparison_labels.previous_week',
        startDate: lastWeekStart,
        endDate: lastWeekEnd
      },
      period2: {
        type: 'custom',
        label: 'Current week',
        labelKey: 'comparison_labels.current_week',
        startDate: thisWeekStart,
        endDate: thisWeekEnd
      }
    });

    // Current month vs Previous month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    presets.push({
      label: 'Current month vs Previous month',
      labelKey: 'comparison_presets.current_month_vs_previous',
      period1: {
        type: 'custom',
        label: 'Previous month',
        labelKey: 'comparison_labels.previous_month',
        startDate: lastMonthStart,
        endDate: lastMonthEnd
      },
      period2: {
        type: 'custom',
        label: 'Current month',
        labelKey: 'comparison_labels.current_month',
        startDate: thisMonthStart,
        endDate: thisMonthEnd
      }
    });

    // Last 30 days vs Previous 30 days
    const last30Start = new Date(now);
    last30Start.setDate(last30Start.getDate() - 30);
    const last30End = new Date(now);
    const prev30Start = new Date(now);
    prev30Start.setDate(prev30Start.getDate() - 60);
    const prev30End = new Date(now);
    prev30End.setDate(prev30End.getDate() - 30);
    prev30End.setSeconds(prev30End.getSeconds() - 1);

    presets.push({
      label: 'Last 30 days vs Previous 30 days',
      labelKey: 'comparison_presets.last_30_vs_previous_30',
      period1: {
        type: 'custom',
        label: 'Previous 30 days',
        labelKey: 'comparison_labels.previous_30_days',
        startDate: prev30Start,
        endDate: prev30End
      },
      period2: {
        type: 'custom',
        label: 'Last 30 days',
        labelKey: 'comparison_labels.last_30_days',
        startDate: last30Start,
        endDate: last30End
      }
    });

    // Current year vs Previous year (same day-of-year)
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const thisYearEnd = new Date(now);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    // Last year end should be the same day-of-year as today in the previous year
    const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59);

    presets.push({
      label: 'This year vs Last year',
      labelKey: 'comparison_presets.current_year_vs_previous',
      period1: {
        type: 'custom',
        label: `Year ${now.getFullYear() - 1}`,
        labelKey: 'comparison_labels.year',
        startDate: lastYearStart,
        endDate: lastYearEnd
      },
      period2: {
        type: 'custom',
        label: `Year ${now.getFullYear()}`,
        labelKey: 'comparison_labels.year',
        startDate: thisYearStart,
        endDate: thisYearEnd
      }
    });

    return presets;
  }

  /**
   * Get start of week (Monday) for a given date
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Filter activities by date range
   */
  filterActivitiesByPeriod(activities: Activity[], period: ComparisonPeriod): Activity[] {
    return activities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= period.startDate && activityDate <= period.endDate;
    });
  }

  /**
   * Format period label for display
   */
  formatPeriodLabel(period: ComparisonPeriod): string {
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    const startStr = period.startDate.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const endStr = period.endDate.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `${startStr} - ${endStr}`;
  }
}
