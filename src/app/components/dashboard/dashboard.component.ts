// src/app/components/dashboard/dashboard.component.ts
import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {animate, style, transition, trigger} from '@angular/animations';
import {PeriodSelectorComponent} from '../period-selector/period-selector.component';
import {ActivityChartComponent} from '../activity-chart/activity-chart.component';
import {StravaService} from '../../services/strava.service';
import {StatsService} from '../../services/stats.service';
import {Stats} from "../../models/stats";
import {StatsListComponent} from "../stats-list/stats-list.component";
import {SpinnerComponent} from "../spinner/spinner.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    ActivityChartComponent,
    StatsListComponent,
    SpinnerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({opacity: 0}),
        animate('300ms', style({opacity: 1}))
      ]),
      transition(':leave', [
        animate('300ms', style({opacity: 0}))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  selectedPeriod: 'week' | 'month' | 'current_year' = 'week';
  isLoading = false;
  error: string | null = null;

  runningStats: Stats;
  bikingStats: Stats;
  walkingStats: Stats;

  runningActivityData: any[] = [];
  bikingActivityData: any[] = [];
  walkingActivityData: any[] = [];

  constructor(
    private stravaService: StravaService,
    private statsService: StatsService
  ) {
    const emptyStat: Stats = {
      averageSpeed: 0,
      totalDistance: 0,
      averageDistance: 0,
      totalElevation: 0,
      averageElevation: 0,
      totalElapsedTime: 0,
      numberOfActivities: 0
    }
    this.runningStats = emptyStat;
    this.bikingStats = emptyStat;
    this.walkingStats = emptyStat;
  }

  ngOnInit() {
    this.loadData();
  }

  onPeriodChange(period: 'week' | 'month' | 'current_year') {
    this.selectedPeriod = period;
    this.loadData();
  }

  retryLoad() {
    this.loadData();
  }

  private loadData() {
    this.isLoading = true;
    this.error = null;

    this.stravaService.getActivities(this.selectedPeriod).subscribe({
      next: (activities) => {
        this.processActivities(activities);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
        this.error = this.getErrorMessage(error);
      }
    });
  }

  private processActivities(activities: any[]) {
    this.runningActivityData = activities.filter(a => a.type.includes('Run'));
    this.bikingActivityData = activities.filter(a => a.type.includes('Ride'));
    this.walkingActivityData = activities.filter(a => a.type.includes('Hike') || a.type.includes('Walk'));

    this.runningStats = this.statsService.calculateStats(this.runningActivityData);
    this.bikingStats = this.statsService.calculateStats(this.bikingActivityData);
    this.walkingStats = this.statsService.calculateStats(this.walkingActivityData);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 429) {
      return 'Trop de requêtes. Veuillez réessayer plus tard.';
    } else if (!navigator.onLine) {
      return 'Pas de connexion internet. Veuillez vérifier votre connexion.';
    }
    return 'Une erreur est survenue lors du chargement des données. Veuillez réessayer.';
  }
}
