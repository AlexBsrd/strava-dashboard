import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

interface YearlyStats {
  type: string;
  distance: number;
  movingTime: number;
  elevationGain: number;
  count: number;
}

@Component({
  selector: 'app-yearly-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yearly-stats.component.html',
  styleUrls: ['./yearly-stats.component.css']
})
export class YearlyStatsComponent {
  @Input() stats: YearlyStats[] = [];
  @Input() year: string = new Date().getFullYear().toString();

  formatDistance(meters: number): string {
    return (meters / 1000).toFixed(1) + ' km';
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }

  formatElevation(meters: number): string {
    return Math.round(meters) + ' m';
  }
}
