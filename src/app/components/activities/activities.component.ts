import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {StravaService} from '../../services/strava.service';
import {PeriodStateService} from '../../services/period-state.service';
import {Activity} from '../../models/activity';
import {SpinnerComponent} from '../spinner/spinner.component';
import {PeriodType} from "../../types/period";
import {getSportMetadata} from "../../types/sport-config";
import {formatPace, usesPace} from "../../utils/pace";

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SpinnerComponent
  ],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css']
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  groupedActivities: { [key: string]: Activity[] } = {};
  isLoading = false;
  error: string | null = null;
  selectedPeriod: PeriodType = 'week';
  searchTerm = '';
  sportFilter = '';
  availableSports: string[] = [];
  readonly formatPace = formatPace;

  private readonly cardioActivities = ['RUN', 'RIDE', 'WALK', 'HIKE', 'ALPINESKI', 'BACKCOUNTRYSKI'];
  private destroy$ = new Subject<void>();

  constructor(
    private stravaService: StravaService,
    private periodStateService: PeriodStateService,
    private translateService: TranslateService
  ) {
  }

  ngOnInit() {
    // S'abonner aux changements de période
    this.periodStateService.dashboardPeriod$
      .pipe(takeUntil(this.destroy$))
      .subscribe((period: PeriodType) => {
        this.selectedPeriod = period;
        this.loadActivities();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Clé de traduction du sport précis (Trail, VTT…) ; un type inconnu s'affiche tel quel */
  sportLabelKey(activity: Activity): string {
    return this.sportKey(activity.sport_type || activity.type);
  }

  sportKey(sportType: string): string {
    return getSportMetadata(sportType).labelKey;
  }

  usesPace(activity: Activity): boolean {
    return usesPace(activity.sport_type || activity.type);
  }

  /** Filtre la période chargée par nom (sans tenir compte des accents ni de la casse) et par sport */
  applyFilters(): void {
    const term = normalize(this.searchTerm.trim());
    const filtered = this.activities.filter(activity =>
      (!this.sportFilter || (activity.sport_type || activity.type) === this.sportFilter) &&
      (!term || normalize(activity.name).includes(term))
    );
    this.groupActivitiesByDay(filtered);
  }

  get hasResults(): boolean {
    return Object.keys(this.groupedActivities).length > 0;
  }

  isCardioActivity(type: string): boolean {
    return this.cardioActivities.includes(type.toUpperCase());
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  formatDayHeader(date: string): string {
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(`${date}T00:00`).toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  formatTime(date: Date | string): string {
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  reverseOrder = (a: any, b: any) => {
    return a.key > b.key ? -1 : 1;
  }

  private loadActivities() {
    this.isLoading = true;
    this.error = null;

    this.stravaService.getActivities(this.selectedPeriod).subscribe({
      next: (activities) => {
        this.activities = activities;
        this.availableSports = [...new Set(activities.map(a => a.sport_type || a.type))].sort();
        if (!this.availableSports.includes(this.sportFilter)) {
          this.sportFilter = '';
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
        this.error = this.translateService.instant('errors.loading_error.title');
      }
    });
  }

  private groupActivitiesByDay(activities: Activity[]) {
    this.groupedActivities = activities.reduce((groups: { [key: string]: Activity[] }, activity) => {
      // Jour en heure locale, AAAA-MM-JJ (toISOString passerait en UTC et décalerait les sorties nocturnes)
      const day = new Date(activity.start_date).toLocaleDateString('sv-SE');

      if (!groups[day]) {
        groups[day] = [];
      }

      groups[day].push({
        ...activity,
        start_date: new Date(activity.start_date)
      });

      // Trier les activités de chaque jour par heure
      groups[day].sort((a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );

      return groups;
    }, {});
  }
}

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
