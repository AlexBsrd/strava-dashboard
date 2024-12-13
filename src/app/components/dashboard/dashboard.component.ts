import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PeriodSelectorComponent} from '../period-selector/period-selector.component';
import {ActivityChartComponent} from '../activity-chart/activity-chart.component';
import {StravaService} from '../../services/strava.service';
import {StatsService} from '../../services/stats.service';
import {Stats} from "../../models/stats";
import {StatsListComponent} from "../stats-list/stats-list.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    ActivityChartComponent,
    StatsListComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  selectedPeriod: 'week' | 'month' | 'current_year' = 'week';
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

  private loadData() {
    // Cette méthode sera implémentée une fois l'API Strava configurée
    this.stravaService.getActivities(this.selectedPeriod).subscribe(activities => {
      console.log(activities)
      this.runningActivityData = activities.filter(a => a.type.includes('Run'));
      this.bikingActivityData = activities.filter(a => a.type.includes('Ride'));
      this.walkingActivityData = activities.filter(a => a.type.includes('Hike') || a.type.includes('Walk'));
      this.runningStats = this.statsService.calculateStats(this.runningActivityData);
      console.log(this.runningStats)

      this.bikingStats = this.statsService.calculateStats(this.bikingActivityData);
      console.log(this.bikingStats)

      this.walkingStats = this.statsService.calculateStats(this.walkingActivityData);
      console.log(this.walkingStats)
    });
  }
}
