import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Activity} from '../models/activity';

export interface AthleteProfile {
  id: number;
  firstname: string;
  lastname: string;
  profile_medium: string;
  profile: string;
  city: string;
  country: string;
  sex: string;
  created_at: string;
  weight: number;
}

interface Totals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
}

interface Record {
  value: number;
  activity_type: string;
  activity_name: string;
  activity_date: string;
  activity_period: 'current_year' | 'all_time';  // Type union strict
}

export interface AthleteSummary {
  all_run_totals: Totals;
  all_ride_totals: Totals;
  ytd_run_totals: Totals;
  ytd_ride_totals: Totals;
  current_year_records: {
    biggest_climb: Record;
    longest_run: Record;
  };
  all_time_records: {
    biggest_climb: Record;
    longest_run: Record;
  };
  current_year_ride_records: {
    biggest_climb: Record;
    longest_ride: Record;
  };
  all_time_ride_records: {
    biggest_climb: Record;
    longest_ride: Record;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AthleteService {
  private apiUrl = 'https://www.strava.com/api/v3';

  constructor(private http: HttpClient) {
  }

  getAthleteProfile(): Observable<AthleteProfile> {
    return this.http.get<AthleteProfile>(`${this.apiUrl}/athlete`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération du profil:', error);
          return throwError(() => new Error('Impossible de récupérer le profil de l\'athlète'));
        })
      );
  }

  getAthleteSummary(): Observable<AthleteSummary> {
    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) {
      return throwError(() => new Error('ID de l\'athlète non trouvé'));
    }

    return this.getAllActivities().pipe(
      map(activities => {
        const currentYear = new Date().getFullYear();
        const currentYearActivities = activities.filter(a =>
          new Date(a.start_date).getFullYear() === currentYear
        );

        const runActivities = activities.filter(a => a.type === 'Run');
        const rideActivities = activities.filter(a => a.type === 'Ride');
        const ytdRunActivities = currentYearActivities.filter(a => a.type === 'Run');
        const ytdRideActivities = currentYearActivities.filter(a => a.type === 'Ride');

        // Records de l'année en cours
        const yearClimb = this.findBiggestClimb(currentYearActivities);
        const yearRun = this.findLongestRun(currentYearActivities);

        // Records de tous les temps
        const allTimeClimb = this.findBiggestClimb(activities);
        const allTimeRun = this.findLongestRun(activities);

        // Records de vélo de l'année en cours
        const yearRideClimb = this.findBiggestRideClimb(currentYearActivities);
        const yearLongestRide = this.findLongestRide(currentYearActivities);

        // Records de vélo de tous les temps
        const allTimeRideClimb = this.findBiggestRideClimb(activities);
        const allTimeLongestRide = this.findLongestRide(activities);

        return {
          all_run_totals: this.calculateTotals(runActivities),
          all_ride_totals: this.calculateTotals(rideActivities),
          ytd_run_totals: this.calculateTotals(ytdRunActivities),
          ytd_ride_totals: this.calculateTotals(ytdRideActivities),
          current_year_records: {
            biggest_climb: {
              value: yearClimb?.total_elevation_gain || 0,
              activity_type: yearClimb?.type || '',
              activity_name: yearClimb?.name || 'Aucune activité',
              activity_date: yearClimb?.start_date.toString() || '',
              activity_period: 'current_year' as const  // Forcer le type littéral
            },
            longest_run: {
              value: yearRun?.distance || 0,
              activity_type: yearRun?.type || '',
              activity_name: yearRun?.name || 'Aucune activité',
              activity_date: yearRun?.start_date.toString() || '',
              activity_period: 'current_year' as const  // Forcer le type littéral
            }
          },
          all_time_records: {
            biggest_climb: {
              value: allTimeClimb?.total_elevation_gain || 0,
              activity_type: allTimeClimb?.type || '',
              activity_name: allTimeClimb?.name || 'Aucune activité',
              activity_date: allTimeClimb?.start_date.toString() || '',
              activity_period: 'all_time' as const  // Forcer le type littéral
            },
            longest_run: {
              value: allTimeRun?.distance || 0,
              activity_type: allTimeRun?.type || '',
              activity_name: allTimeRun?.name || 'Aucune activité',
              activity_date: allTimeRun?.start_date.toString() || '',
              activity_period: 'all_time' as const  // Forcer le type littéral
            }
          },
          current_year_ride_records: {
            biggest_climb: {
              value: yearRideClimb?.total_elevation_gain || 0,
              activity_type: yearRideClimb?.type || '',
              activity_name: yearRideClimb?.name || 'Aucune activité',
              activity_date: yearRideClimb?.start_date.toString() || '',
              activity_period: 'current_year' as const
            },
            longest_ride: {
              value: yearLongestRide?.distance || 0,
              activity_type: yearLongestRide?.type || '',
              activity_name: yearLongestRide?.name || 'Aucune activité',
              activity_date: yearLongestRide?.start_date.toString() || '',
              activity_period: 'current_year' as const
            }
          },
          all_time_ride_records: {
            biggest_climb: {
              value: allTimeRideClimb?.total_elevation_gain || 0,
              activity_type: allTimeRideClimb?.type || '',
              activity_name: allTimeRideClimb?.name || 'Aucune activité',
              activity_date: allTimeRideClimb?.start_date.toString() || '',
              activity_period: 'all_time' as const
            },
            longest_ride: {
              value: allTimeLongestRide?.distance || 0,
              activity_type: allTimeLongestRide?.type || '',
              activity_name: allTimeLongestRide?.name || 'Aucune activité',
              activity_date: allTimeLongestRide?.start_date.toString() || '',
              activity_period: 'all_time' as const
            }
          }
        };
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return throwError(() => new Error('Impossible de récupérer les statistiques de l\'athlète'));
      })
    );
  }

  private getAllActivities(): Observable<Activity[]> {
    return new Observable<Activity[]>(subscriber => {
      const fetchPage = (page: number, accumulatedActivities: Activity[] = []) => {
        this.http.get<Activity[]>(`${this.apiUrl}/athlete/activities`, {
          params: {
            per_page: '200',
            page: page.toString()
          }
        }).subscribe({
          next: (activities) => {
            if (activities.length === 0) {
              // Plus d'activités à récupérer
              subscriber.next(accumulatedActivities);
              subscriber.complete();
            } else {
              // Récupérer la page suivante
              fetchPage(page + 1, [...accumulatedActivities, ...activities]);
            }
          },
          error: (error) => subscriber.error(error)
        });
      };

      fetchPage(1); // Commencer à la première page
    });
  }

  private filterCurrentYear(activities: Activity[]): Activity[] {
    const currentYear = new Date().getFullYear();
    return activities.filter(activity =>
      new Date(activity.start_date).getFullYear() === currentYear
    );
  }

  private calculateTotals(activities: Activity[]): Totals {
    return {
      count: activities.length,
      distance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
      moving_time: activities.reduce((sum, a) => sum + (a.moving_time || 0), 0),
      elapsed_time: activities.reduce((sum, a) => sum + (a.elapsed_time || 0), 0),
      elevation_gain: activities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0)
    };
  }

  private findBiggestClimb(activities: Activity[]): Activity | undefined {
    const runningActivities = activities.filter(a =>
      a.type === 'Run' || a.type === 'Walk' || a.type === 'Hike'
    );

    if (runningActivities.length === 0) return undefined;

    return runningActivities.reduce((max, current) =>
        !max || current.total_elevation_gain > max.total_elevation_gain ? current : max
      , runningActivities[0]);
  }

  private findLongestRun(activities: Activity[]): Activity | undefined {
    const runningActivities = activities.filter(a =>
      a.type === 'Run' || a.type === 'Walk' || a.type === 'Hike'
    );

    if (runningActivities.length === 0) return undefined;

    return runningActivities.reduce((max, current) =>
        !max || current.distance > max.distance ? current : max
      , runningActivities[0]);
  }

  private findBiggestRideClimb(activities: Activity[]): Activity | undefined {
    const rideActivities = activities.filter(a => a.type === 'Ride');

    if (rideActivities.length === 0) return undefined;

    return rideActivities.reduce((max, current) =>
        !max || current.total_elevation_gain > max.total_elevation_gain ? current : max
      , rideActivities[0]);
  }

  private findLongestRide(activities: Activity[]): Activity | undefined {
    const rideActivities = activities.filter(a => a.type === 'Ride');

    if (rideActivities.length === 0) return undefined;

    return rideActivities.reduce((max, current) =>
        !max || current.distance > max.distance ? current : max
      , rideActivities[0]);
  }
}
