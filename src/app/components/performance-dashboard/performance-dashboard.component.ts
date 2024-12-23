import {Component, Input, OnChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Activity} from '../../models/activity';
import {PerformanceMetrics, PerformanceService} from '../../services/performance.service';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.css']
})
export class PerformanceDashboardComponent implements OnChanges {
  @Input() activities: Activity[] = [];
  metrics!: PerformanceMetrics;

  constructor(private performanceService: PerformanceService) {
  }

  ngOnChanges() {
    if (this.activities.length) {
      this.metrics = this.performanceService.analyzePerformances(this.activities);
    }
  }

  hasRecords(): boolean {
    if (!this.metrics?.bestRaces) return false;

    return !!(
      this.metrics.bestRaces.fiveKm.value ||
      this.metrics.bestRaces.tenKm.value ||
      this.metrics.bestRaces.semi.value ||
      this.metrics.bestRaces.marathon.value
    );
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  calculatePace(speedKmh: number): string {
    const minutesPerKm = 60 / speedKmh;
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  }
}
