import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatDelta } from '../../types/comparison';

@Component({
  selector: 'app-comparison-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparison-stats-card.component.html',
  styleUrls: ['./comparison-stats-card.component.css']
})
export class ComparisonStatsCardComponent {
  @Input() title: string = '';
  @Input() value1: number = 0;
  @Input() value2: number = 0;
  @Input() unit: string = '';
  @Input() isTime: boolean = false;
  @Input() delta: StatDelta | null = null;

  get formattedValue1(): string {
    if (this.isTime) {
      return this.formatTime(this.value1);
    }
    return this.value1.toFixed(1);
  }

  get formattedValue2(): string {
    if (this.isTime) {
      return this.formatTime(this.value2);
    }
    return this.value2.toFixed(1);
  }

  get formattedDelta(): string {
    if (!this.delta) return '';

    if (this.isTime) {
      const hours = Math.floor(Math.abs(this.delta.absolute) / 3600);
      const minutes = Math.floor((Math.abs(this.delta.absolute) % 3600) / 60);
      const sign = this.delta.absolute >= 0 ? '+' : '-';
      if (hours > 0) {
        return `${sign}${hours}h${minutes}min`;
      }
      return `${sign}${minutes}min`;
    }

    const sign = this.delta.absolute >= 0 ? '+' : '';
    return `${sign}${this.delta.absolute} ${this.unit}`;
  }

  get formattedPercentage(): string {
    if (!this.delta) return '';
    const sign = this.delta.percentage >= 0 ? '+' : '';
    return `${sign}${this.delta.percentage}%`;
  }

  get trendIcon(): string {
    if (!this.delta) return '';
    switch (this.delta.trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'stable':
        return '→';
      default:
        return '';
    }
  }

  get trendClass(): string {
    if (!this.delta) return '';
    return this.delta.trend;
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h${minutes}min`;
    }
    return `${minutes}min`;
  }
}
