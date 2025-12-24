export type GoalType = 'distance' | 'time' | 'count';
export type GoalPeriod = 'week' | 'month' | 'year' | 'custom';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  target: number; // In km for distance, seconds for time, count for activities
  period: GoalPeriod;
  sportTypes?: string[]; // Optional: filter by sport types (Run, Ride, etc.)
  startDate?: Date; // For custom period
  endDate?: Date; // For custom period
  createdAt: Date;
}

export interface GoalProgress {
  goal: Goal;
  current: number;
  percentage: number;
  remaining: number;
  projection: number;
  projectionPercentage: number;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
  isOnTrack: boolean;
  isCompleted: boolean;
}
