import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StravaService} from '../../services/strava.service';
import {Activity} from '../../models/activity';
import {PeriodSelectorComponent} from '../period-selector/period-selector.component';
import {SpinnerComponent} from '../spinner/spinner.component';
import {PeriodType} from "../../types/period";

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    SpinnerComponent
  ],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css']
})
export class ActivitiesComponent implements OnInit {
  activities: Activity[] = [];
  groupedActivities: { [key: string]: Activity[] } = {};
  isLoading = false;
  error: string | null = null;
  selectedPeriod: PeriodType = 'week';

  private readonly cardioActivities = ['RUN', 'RIDE', 'WALK', 'HIKE', 'ALPINESKI', 'BACKCOUNTRYSKI'];

  constructor(private stravaService: StravaService) {
  }

  ngOnInit() {
    this.loadActivities();
  }

  onPeriodChange(period: PeriodType) {
    this.selectedPeriod = period;
    this.loadActivities();
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
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
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
        this.groupActivitiesByDay();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
        this.error = 'Une erreur est survenue lors du chargement des activités.';
      }
    });
  }

  private groupActivitiesByDay() {
    this.groupedActivities = this.activities.reduce((groups: { [key: string]: Activity[] }, activity) => {
      const date = new Date(activity.start_date);
      const day = date.toISOString().split('T')[0];

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
