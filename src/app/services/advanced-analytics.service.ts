import { Injectable } from '@angular/core';
import { Activity } from '../models/activity';

export interface PerformanceStats {
  totalDistance: number;
  averageSpeed: number;
  totalTime: number;
  totalElevation: number;
  activityCount: number;
  averageDistance: number;
  maxDistance: number;
  maxSpeed: number;
  maxElevation: number;
  averagePace: number;
  totalActivities: number;
  averageTimePerActivity: number;
  averageElevationPerKm: number;
  intensityDistribution: {
    easy: number;
    moderate: number;
    intense: number;
  };
}

export interface PeriodComparison {
  currentPeriod: PerformanceStats;
  previousPeriod: PerformanceStats;
  percentageChanges: {
    distance: number;
    speed: number;
    time: number;
    elevation: number;
    activityCount: number;
    averageDistance: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedAnalyticsService {
  
  comparePeriods(currentActivities: Activity[], previousActivities: Activity[]): PeriodComparison {
    const currentStats = this.calculatePeriodStats(currentActivities);
    const previousStats = this.calculatePeriodStats(previousActivities);
    
    return {
      currentPeriod: currentStats,
      previousPeriod: previousStats,
      percentageChanges: {
        distance: this.calculatePercentageChange(currentStats.totalDistance, previousStats.totalDistance),
        speed: this.calculatePercentageChange(currentStats.averageSpeed, previousStats.averageSpeed),
        time: this.calculatePercentageChange(currentStats.totalTime, previousStats.totalTime),
        elevation: this.calculatePercentageChange(currentStats.totalElevation, previousStats.totalElevation),
        activityCount: this.calculatePercentageChange(currentStats.activityCount, previousStats.activityCount),
        averageDistance: this.calculatePercentageChange(currentStats.averageDistance, previousStats.averageDistance)
      }
    };
  }

  private calculatePeriodStats(activities: Activity[]): PerformanceStats {
    if (!activities.length) {
      return this.getEmptyStats();
    }

    // Filtrer uniquement les activités du type sélectionné
    const filteredActivities = activities.filter(a => a.type === activities[0].type);
    
    console.log('Activités filtrées:', filteredActivities);

    // Les distances sont déjà en km
    const totalDistance = filteredActivities.reduce((sum, act) => sum + act.distance, 0);
    const totalTime = filteredActivities.reduce((sum, act) => sum + act.elapsed_time, 0);
    const totalElevation = filteredActivities.reduce((sum, act) => sum + act.total_elevation_gain, 0);
    
    // Calcul de la vitesse moyenne en km/h
    const averageSpeed = totalDistance / (totalTime / 3600);

    // Les distances sont déjà en km, pas besoin de conversion
    const maxDistance = Math.max(...filteredActivities.map(a => a.distance));
    const maxSpeed = Math.max(...filteredActivities.map(a => a.average_speed * 3.6));
    const maxElevation = Math.max(...filteredActivities.map(a => a.total_elevation_gain));

    const averageDistance = totalDistance / filteredActivities.length;
    const averageTimePerActivity = totalTime / filteredActivities.length;
    const averageElevationPerKm = totalDistance > 0 ? (totalElevation / totalDistance) : 0;

    return {
      totalDistance,  // Déjà en km
      averageSpeed,
      totalTime,
      totalElevation,
      activityCount: filteredActivities.length,
      averageDistance,
      maxDistance,
      maxSpeed,
      maxElevation,
      averagePace: averageSpeed > 0 ? 60 / averageSpeed : 0,
      totalActivities: filteredActivities.length,
      averageTimePerActivity,
      averageElevationPerKm,
      intensityDistribution: this.calculateIntensityDistribution(filteredActivities, filteredActivities[0].type)
    };
  }

  private calculateIntensityDistribution(activities: Activity[], activityType: string): { easy: number; moderate: number; intense: number } {
    const totalActivities = activities.length;
    if (totalActivities === 0) return { easy: 0, moderate: 0, intense: 0 };

    let easy = 0, moderate = 0, intense = 0;
    const convertToKmh = (speedMs: number) => speedMs * 3.6;

    // Seuils en km/h pour chaque type d'activité
    let thresholds = {
      low: 8,
      high: 12
    };

    switch (activityType) {
      case 'Run':
        thresholds = { low: 8, high: 11 };
        break;
      case 'Ride':
        thresholds = { low: 15, high: 25 };
        break;
      case 'Walk':
      case 'Hike':
        thresholds = { low: 4, high: 6 };
        break;
    }

    activities.forEach(activity => {
      const speedKmh = convertToKmh(activity.average_speed);
      if (speedKmh < thresholds.low) easy++;
      else if (speedKmh < thresholds.high) moderate++;
      else intense++;
    });

    return {
      easy: (easy / totalActivities) * 100,
      moderate: (moderate / totalActivities) * 100,
      intense: (intense / totalActivities) * 100
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  }

  private getEmptyStats(): PerformanceStats {
    return {
      totalDistance: 0,
      averageSpeed: 0,
      totalTime: 0,
      totalElevation: 0,
      activityCount: 0,
      averageDistance: 0,
      maxDistance: 0,
      maxSpeed: 0,
      maxElevation: 0,
      averagePace: 0,
      totalActivities: 0,
      averageTimePerActivity: 0,
      averageElevationPerKm: 0,
      intensityDistribution: {
        easy: 0,
        moderate: 0,
        intense: 0
      }
    };
  }

  analyzeProgressionTrend(activities: Activity[]): 'improving' | 'stable' | 'declining' {
    if (activities.length < 2) return 'stable';

    const convertToKmh = (speedMs: number) => speedMs * 3.6;

    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    // Convertir les vitesses de m/s en km/h
    const speeds = sortedActivities.map(a => convertToKmh(a.average_speed));
    const trend = this.calculateTrendSlope(speeds);

    const distances = sortedActivities.map(a => a.distance);
    const distanceTrend = this.calculateTrendSlope(distances);

    const times = sortedActivities.map(a => a.elapsed_time);
    const timeTrend = this.calculateTrendSlope(times);

    const trends = [
      { value: trend, weight: 0.5 },
      { value: distanceTrend, weight: 0.3 },
      { value: -timeTrend, weight: 0.2 }
    ];

    const weightedTrend = trends.reduce((acc, curr) => acc + (curr.value * curr.weight), 0);

    if (weightedTrend > 0.05) return 'improving';
    if (weightedTrend < -0.05) return 'declining';
    return 'stable';
  }

  private calculateTrendSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;

    const indices = Array.from({length: n}, (_, i) => i);
    
    // Calculer les moyennes
    const meanX = indices.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    
    // Calculer la pente de la régression linéaire
    const numerator = indices.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0);
    const denominator = indices.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}