import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';
import {Activity} from '../models/activity';
import {environment} from "../environments/environment";
import {ActivityCacheService} from "./activity-cache.service";
import {PeriodType, getYearFromPeriod} from "../types/period";

@Injectable({
  providedIn: 'root'
})
export class StravaService {
  private apiUrl = 'https://www.strava.com/api/v3';
  private clientId = environment.stravaClientId;
  private redirectUri = environment.redirectUri;

  constructor(
    private http: HttpClient,
    private activityCache: ActivityCacheService
  ) {
  }

  getActivities(period: PeriodType): Observable<Activity[]> {
    if (!this.activityCache.needsRefresh(period)) {
      return of(this.activityCache.getFilteredActivities(period));
    }

    // Période déjà en cache mais synchro ancienne : ne récupérer que les activités récentes
    if (this.activityCache.isPeriodCovered(period)) {
      return this.syncRecentActivities().pipe(
        map(() => this.activityCache.getFilteredActivities(period))
      );
    }

    // Période non couverte par le cache - charger les données manquantes
    let after = new Date();
    let before: Date | undefined;

    // Vérifier si c'est une année spécifique
    const year = getYearFromPeriod(period);
    if (year !== null) {
      after = new Date(year, 0, 1);
      // Pour une année spécifique, télécharger jusqu'à la fin de l'année
      // ou jusqu'à oldestActivityDate si on a déjà des données plus récentes
      const oldestDate = this.activityCache.getOldestActivityDate();
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);
      if (oldestDate && oldestDate > after) {
        // On a déjà des données plus récentes, télécharger seulement jusqu'à oldestDate
        before = oldestDate;
      } else {
        // Pas de données plus récentes, télécharger jusqu'à la fin de l'année
        before = yearEnd;
      }
    } else {
      switch (period) {
        case 'week':
          after.setDate(after.getDate() - 7);
          break;
        case 'month':
          after.setDate(after.getDate() - 30);
          break;
        case 'current_year':
          after = new Date(after.getFullYear(), 0, 1);
          break;
      }
      // Pour les périodes dynamiques, télécharger jusqu'à oldestActivityDate si disponible
      const oldestDate = this.activityCache.getOldestActivityDate();
      if (oldestDate && oldestDate > after) {
        before = oldestDate;
      }
    }

    return this.getAllActivities(after, before).pipe(
      tap(activities => this.activityCache.setActivities(activities, period)),
      map(() => this.activityCache.getFilteredActivities(period))
    );
  }

  /**
   * Récupère uniquement les activités depuis la plus récente du cache.
   * Marge de 2 jours pour capter les activités modifiées ou synchronisées en retard.
   */
  private syncRecentActivities(): Observable<Activity[]> {
    const after = this.activityCache.getNewestActivityDate() ?? new Date();
    after.setDate(after.getDate() - 2);
    return this.getAllActivities(after).pipe(
      tap(activities => this.activityCache.setActivities(activities, 'week'))
    );
  }

  authenticate(): void {
    const scope = 'read,activity:read_all';
    window.location.href =
      `https://www.strava.com/oauth/authorize?client_id=${this.clientId}` +
      `&redirect_uri=${this.redirectUri}&response_type=code&scope=${scope}`;
  }

  private getActivitiesPage(after: Date, page: number, before?: Date): Observable<Activity[]> {
    const params: any = {
      after: Math.floor(after.getTime() / 1000).toString(),
      per_page: '200',
      page: page.toString()
    };

    // Ajouter le paramètre 'before' si fourni
    if (before) {
      params.before = Math.floor(before.getTime() / 1000).toString();
    }

    return this.http
      .get<Activity[]>(`${this.apiUrl}/athlete/activities`, {params})
      .pipe(
        map(activities => activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          distance: activity.distance / 1000,
          moving_time: activity.moving_time,
          elapsed_time: activity.elapsed_time,
          total_elevation_gain: activity.total_elevation_gain,
          start_date: new Date(activity.start_date),
          average_speed: (activity.average_speed * 3.6),
          type: activity.type,
          sport_type: activity.sport_type || activity.type // Fallback sur type si sport_type absent
        })))
      );
  }

  private getAllActivities(after: Date, before?: Date): Observable<Activity[]> {
    return new Observable<Activity[]>(subscriber => {
      const fetchPage = (page: number, accumulatedActivities: Activity[] = []) => {
        this.getActivitiesPage(after, page, before).subscribe({
          next: (activities) => {
            if (activities.length === 0) {
              // Plus de pages à charger, émettre le résultat final
              subscriber.next(accumulatedActivities);
              subscriber.complete();
            } else {
              const newAccumulated = [...accumulatedActivities, ...activities];
              // Continuer à charger la page suivante
              fetchPage(page + 1, newAccumulated);
            }
          },
          error: (error) => subscriber.error(error)
        });
      };

      fetchPage(1);
    });
  }

  /**
   * Charge toutes les activités des 2 dernières années avec affichage d'un spinner.
   * Cette méthode est appelée au chargement initial du dashboard pour éviter les bugs
   * quand l'utilisateur clique sur une période qui n'a pas encore été chargée.
   * Si un chargement complet date de moins de 24h, seules les activités récentes sont récupérées.
   * @param force ignore le cache et recharge tout (rafraîchissement manuel)
   */
  loadAllRecentActivities(force = false): Observable<Activity[]> {
    if (!force && this.activityCache.hasRecentFullLoad()) {
      const sync$ = this.activityCache.isStale() ? this.syncRecentActivities() : of([]);
      return sync$.pipe(map(() => this.activityCache.getAllActivities()));
    }

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    return this.getAllActivities(twoYearsAgo).pipe(
      // Sauvegarder dans le cache pour toutes les périodes, en remplaçant les 2 dernières années
      tap(activities => this.activityCache.setActivities(activities, 'current_year', twoYearsAgo))
    );
  }

  /**
   * Historique complet (page Profil : totaux et records de tous les temps).
   * Les activités antérieures au cache ne sont téléchargées qu'une fois, puis conservées dans le cache.
   */
  loadFullHistory(): Observable<Activity[]> {
    return this.loadAllRecentActivities().pipe(
      switchMap(() => {
        if (this.activityCache.isHistoryComplete()) {
          return of(this.activityCache.getAllActivities());
        }
        return this.getAllActivities(new Date(0), this.activityCache.getOldestActivityDate() ?? undefined).pipe(
          tap(older => this.activityCache.addOlderActivities(older)),
          map(() => this.activityCache.getAllActivities())
        );
      })
    );
  }
}
