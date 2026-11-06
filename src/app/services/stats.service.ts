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
        totalMovingTime: 0,
        numberOfActivities: 0
      };
    }

    const totalDistance = activities.reduce((sum, activity) =>
      sum + activity.distance, 0);

    const totalElevation = activities.reduce((sum, activity) =>
      sum + activity.total_elevation_gain, 0);

    const totalElapsedTime = activities.reduce((sum, activity) =>
      sum + activity.elapsed_time, 0);

    const totalMovingTime = activities.reduce((sum, activity) =>
      sum + activity.moving_time, 0);

    const averageDistance = totalDistance / activities.length;

    // Distance totale / temps en mouvement total : une moyenne des vitesses donnerait
    // autant de poids à un footing de 10 min qu'à un marathon.
    // Les activités sans distance (muscu, yoga…) sont exclues pour ne pas diluer la vitesse.
    const withDistance = activities.filter(activity => activity.distance > 0);
    const distanceForSpeed = withDistance.reduce((sum, activity) => sum + activity.distance, 0);
    const movingTimeForSpeed = withDistance.reduce((sum, activity) => sum + activity.moving_time, 0);
    const averageSpeed = movingTimeForSpeed ? distanceForSpeed / (movingTimeForSpeed / 3600) : 0;

    const averageElevation = totalElevation / activities.length;

    return {
      averageSpeed: Number(averageSpeed.toFixed(1)),
      totalDistance: Number(totalDistance.toFixed(1)),
      averageDistance: Number(averageDistance.toFixed(1)),
      totalElevation: Number(totalElevation.toFixed(0)),
      totalElapsedTime: Number(totalElapsedTime),
      totalMovingTime,
      averageElevation: Number(averageElevation.toFixed(0)),
      numberOfActivities: activities.length
    };
  }
}
