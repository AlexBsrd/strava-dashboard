import { Stats } from '../models/stats';
import { Activity } from '../models/activity';
import { PeriodType } from './period';

/**
 * Represents a period for comparison with start and end dates
 */
export interface ComparisonPeriod {
  type: PeriodType | 'custom';
  label: string; // Display label (translated or formatted date range)
  labelKey?: string; // Translation key for preset labels
  startDate: Date;
  endDate: Date;
}

/**
 * Delta between two stat values
 */
export interface StatDelta {
  absolute: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Complete comparison of stats between two periods
 */
export interface StatsComparison {
  period1Stats: Stats;
  period2Stats: Stats;
  deltas: {
    totalDistance: StatDelta;
    averageDistance: StatDelta;
    averageSpeed: StatDelta;
    totalElevation: StatDelta;
    averageElevation: StatDelta;
    totalElapsedTime: StatDelta;
    numberOfActivities: StatDelta;
  };
}

/**
 * Complete comparison data including activities and stats for both periods
 */
export interface ComparisonData {
  period1: {
    period: ComparisonPeriod;
    activities: Activity[];
    stats: Stats;
  };
  period2: {
    period: ComparisonPeriod;
    activities: Activity[];
    stats: Stats;
  };
  comparison: StatsComparison;
}

/**
 * Preset comparison suggestions
 */
export interface ComparisonPreset {
  label: string; // Fallback label
  labelKey: string; // Translation key
  period1: ComparisonPeriod;
  period2: ComparisonPeriod;
}
