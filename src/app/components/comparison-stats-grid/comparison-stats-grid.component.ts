import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsComparison } from '../../types/comparison';
import { ComparisonStatsCardComponent } from '../comparison-stats-card/comparison-stats-card.component';

@Component({
  selector: 'app-comparison-stats-grid',
  standalone: true,
  imports: [CommonModule, ComparisonStatsCardComponent],
  templateUrl: './comparison-stats-grid.component.html',
  styleUrls: ['./comparison-stats-grid.component.css']
})
export class ComparisonStatsGridComponent {
  @Input() comparison: StatsComparison | null = null;
  @Input() activityType: string = '';

  get activityIcon(): string {
    switch (this.activityType.toLowerCase()) {
      case 'run':
        return 'run';
      case 'walk':
        return 'walk';
      case 'bike':
        return 'bike';
      default:
        return '';
    }
  }
}
