// src/app/components/dashboard/dashboard.component.ts
import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PeriodSelectorComponent} from '../period-selector/period-selector.component';
import {StravaService} from '../../services/strava.service';
import {StatsService} from '../../services/stats.service';
import {Stats} from "../../models/stats";
import {StatsListComponent} from "../stats-list/stats-list.component";
import {SpinnerComponent} from "../spinner/spinner.component";
import {PerformanceDashboardComponent} from "../performance-dashboard/performance-dashboard.component";
import {ModernActivityChartComponent} from "../modern-activity-chart/modern-activity-chart.component";
import {Activity} from "../../models/activity";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    StatsListComponent,
    SpinnerComponent,
    PerformanceDashboardComponent,
    ModernActivityChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  selectedPeriod: 'week' | 'month' | 'current_year' = 'week';
  isLoading = false;
  error: string | null = null;

  runningStats: Stats;
  bikingStats: Stats;
  walkingStats: Stats;

  allActivities: Activity[] = [];
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

  protected loadData() {
    this.isLoading = true;
    this.error = null;

    this.stravaService.getActivities(this.selectedPeriod).subscribe({
      next: (activities) => {
        this.allActivities = activities;
        this.runningActivityData = activities.filter(a => a.type.includes('Run'));
        this.bikingActivityData = activities.filter(a => a.type.includes('Ride'));
        this.walkingActivityData = activities.filter(a => a.type.includes('Hike') || a.type.includes('Walk'));

        this.runningStats = this.statsService.calculateStats(this.runningActivityData);
        this.bikingStats = this.statsService.calculateStats(this.bikingActivityData);
        this.walkingStats = this.statsService.calculateStats(this.walkingActivityData);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
        this.error = 'Une erreur est survenue lors du chargement des données.';
      }
    });
  }
}
