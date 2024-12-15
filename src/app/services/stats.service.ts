import {Injectable} from '@angular/core';
import {Activity} from '../models/activity';
import {Stats} from "../models/stats";

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  calculateStats(activities: Activity[]): Stats {
    if (!activities.length) {
      return {
        averageSpeed: 0,
        totalDistance: 0,
        averageDistance: 0,
        totalElevation: 0,
        averageElevation: 0,
        totalElapsedTime: 0,
        numberOfActivities: 0
      };
    }

    const totalDistance = activities.reduce((sum, activity) =>
      sum + activity.distance, 0);

    const totalElevation = activities.reduce((sum, activity) =>
      sum + activity.total_elevation_gain, 0);

    const totalElapsedTime = activities.reduce((sum, activity) =>
      sum + activity.elapsed_time, 0);

    const averageDistance = totalDistance / activities.length;

    const averageSpeed = activities.reduce((sum, activity) =>
      sum + activity.average_speed, 0) / activities.length;

    const averageElevation = totalElevation / activities.length;

    return {
      averageSpeed: Number(averageSpeed.toFixed(1)),
      totalDistance: Number(totalDistance.toFixed(1)),
      averageDistance: Number(averageDistance.toFixed(1)),
      totalElevation: Number(totalElevation.toFixed(0)),
      totalElapsedTime: Number(totalElapsedTime),
      averageElevation: Number(averageElevation.toFixed(0)),
      numberOfActivities: activities.length
    };
  }
}
