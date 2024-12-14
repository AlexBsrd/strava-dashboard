import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StravaService} from '../../services/strava.service';
import {Activity} from '../../models/activity';
import {PeriodSelectorComponent} from '../period-selector/period-selector.component';
import {SpinnerComponent} from '../spinner/spinner.component';

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
  isLoading = false;
  error: string | null = null;
  selectedPeriod: 'week' | 'month' | 'current_year' = 'week';

  private readonly cardioActivities = ['RUN', 'RIDE', 'WALK', 'HIKE', 'ALPINESKI', 'BACKCOUNTRYSKI'];

  constructor(private stravaService: StravaService) {
  }

  ngOnInit() {
    this.loadActivities();
  }

  onPeriodChange(period: 'week' | 'month' | 'current_year') {
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private loadActivities() {
    this.isLoading = true;
    this.error = null;

    this.stravaService.getActivities(this.selectedPeriod).subscribe({
      next: (activities) => {
        this.activities = activities;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
        this.error = 'Une erreur est survenue lors du chargement des activités.';
      }
    });
  }
}
