import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsComparison } from '../../types/comparison';
import { ComparisonStatsCardComponent } from '../comparison-stats-card/comparison-stats-card.component';
import { MetricKey, ALL_METRICS } from '../../types/sport-config';

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
  @Input() groupColor?: string;
  @Input() visibleMetrics?: MetricKey[];

  /**
   * Vérifie si une métrique doit être affichée
   */
  isMetricVisible(metric: MetricKey): boolean {
    return (this.visibleMetrics || ALL_METRICS).includes(metric);
  }

  get activityIcon(): string {
    switch (this.activityType.toLowerCase()) {
      case 'run':
      case 'course':
        return 'run';
      case 'walk':
      case 'marche':
        return 'walk';
      case 'bike':
      case 'vélo':
        return 'bike';
      default:
        return 'activity';
    }
  }

  /**
   * Retourne la couleur du groupe ou une couleur par défaut
   */
  get displayColor(): string {
    if (this.groupColor) {
      return this.groupColor;
    }
    // Couleurs par défaut pour rétrocompatibilité
    switch (this.activityType.toLowerCase()) {
      case 'run':
      case 'course':
        return '#ef4444';
      case 'walk':
      case 'marche':
        return '#22c55e';
      case 'bike':
      case 'vélo':
        return '#3b82f6';
      default:
        return '#6366f1';
    }
  }
}
