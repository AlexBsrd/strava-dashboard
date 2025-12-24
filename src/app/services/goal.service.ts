import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Goal, GoalProgress, GoalPeriod } from '../models/goal';
import { Activity } from '../models/activity';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private readonly STORAGE_KEY = 'strava_goals';
  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  public goals$ = this.goalsSubject.asObservable();

  constructor() {
    this.loadGoals();
  }

  /**
   * Load goals from localStorage
   */
  private loadGoals(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const goals = JSON.parse(stored) as Goal[];
        // Convert date strings back to Date objects
        goals.forEach(goal => {
          goal.createdAt = new Date(goal.createdAt);
          if (goal.startDate) goal.startDate = new Date(goal.startDate);
          if (goal.endDate) goal.endDate = new Date(goal.endDate);
        });
        this.goalsSubject.next(goals);
      } catch (error) {
        console.error('Error loading goals:', error);
        this.goalsSubject.next([]);
      }
    }
  }

  /**
   * Save goals to localStorage
   */
  private saveGoals(goals: Goal[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(goals));
    this.goalsSubject.next(goals);
  }

  /**
   * Get all goals
   */
  getGoals(): Goal[] {
    return this.goalsSubject.value;
  }

  /**
   * Get a goal by ID
   */
  getGoalById(id: string): Goal | undefined {
    return this.goalsSubject.value.find(g => g.id === id);
  }

  /**
   * Create a new goal
   */
  createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: this.generateId(),
      createdAt: new Date()
    };
    const goals = [...this.goalsSubject.value, newGoal];
    this.saveGoals(goals);
    return newGoal;
  }

  /**
   * Update an existing goal
   */
  updateGoal(id: string, updates: Partial<Goal>): Goal | undefined {
    const goals = this.goalsSubject.value;
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return undefined;

    const updatedGoal = { ...goals[index], ...updates };
    goals[index] = updatedGoal;
    this.saveGoals(goals);
    return updatedGoal;
  }

  /**
   * Delete a goal
   */
  deleteGoal(id: string): boolean {
    const goals = this.goalsSubject.value.filter(g => g.id !== id);
    if (goals.length === this.goalsSubject.value.length) return false;
    this.saveGoals(goals);
    return true;
  }

  /**
   * Calculate progress for a goal
   */
  calculateProgress(goal: Goal, activities: Activity[]): GoalProgress {
    const { startDate, endDate } = this.getGoalPeriodDates(goal);
    const today = new Date();

    // Filter activities within the goal period
    const periodActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= startDate && activityDate <= endDate;
    });

    // Filter by sport types if specified
    const filteredActivities = goal.sportTypes && goal.sportTypes.length > 0
      ? periodActivities.filter(a => goal.sportTypes!.includes(a.sport_type || a.type))
      : periodActivities;

    // Calculate current progress based on goal type
    let current = 0;
    switch (goal.type) {
      case 'distance':
        current = filteredActivities.reduce((sum, a) => sum + a.distance, 0);
        break;
      case 'time':
        current = filteredActivities.reduce((sum, a) => sum + a.elapsed_time, 0);
        break;
      case 'count':
        current = filteredActivities.length;
        break;
    }

    const percentage = (current / goal.target) * 100;
    const remaining = Math.max(0, goal.target - current);
    const isCompleted = current >= goal.target;

    // Calculate time-based metrics
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate projection
    const dailyAverage = current / daysElapsed;
    const projection = dailyAverage * totalDays;
    const projectionPercentage = (projection / goal.target) * 100;
    const isOnTrack = projection >= goal.target;

    return {
      goal,
      current,
      percentage: Math.min(100, percentage),
      remaining,
      projection,
      projectionPercentage,
      daysRemaining,
      daysElapsed,
      totalDays,
      isOnTrack,
      isCompleted
    };
  }

  /**
   * Get start and end dates for a goal period
   */
  private getGoalPeriodDates(goal: Goal): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (goal.period) {
      case 'week':
        // Start from Monday
        startDate = new Date(now);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case 'custom':
        if (!goal.startDate || !goal.endDate) {
          throw new Error('Custom period requires startDate and endDate');
        }
        startDate = new Date(goal.startDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(goal.endDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        throw new Error(`Unknown goal period: ${goal.period}`);
    }

    return { startDate, endDate };
  }

  /**
   * Get active goals (goals that are in progress)
   */
  getActiveGoals(): Goal[] {
    const now = new Date();
    return this.goalsSubject.value.filter(goal => {
      const { startDate, endDate } = this.getGoalPeriodDates(goal);
      return now >= startDate && now <= endDate;
    });
  }

  /**
   * Generate a unique ID for a goal
   */
  private generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
