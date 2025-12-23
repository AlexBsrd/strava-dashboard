import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Stats} from '../../models/stats';
import {StatsCardComponent} from '../stats-card/stats-card.component';
import {ShareModalComponent} from '../share-modal/share-modal.component';
import {PeriodType} from "../../types/period";
import {MetricKey, ALL_METRICS} from "../../types/sport-config";

@Component({
  selector: 'app-stats-list',
  standalone: true,
  imports: [
    CommonModule,
    StatsCardComponent,
    ShareModalComponent
  ],
  templateUrl: './stats-list.component.html',
  styleUrls: ['./stats-list.component.css', './stats-list.animations.css']
})
export class StatsListComponent {
  @Input() stats!: Stats;
  @Input() title!: string;
  @Input() selectedPeriod: PeriodType = 'week';
  @Input() groupColor?: string;
  @Input() groupIcon?: string;
  @Input() visibleMetrics?: MetricKey[];

  showShareModal = false;

  /**
   * Vérifie si une métrique doit être affichée
   */
  isMetricVisible(metric: MetricKey): boolean {
    return (this.visibleMetrics || ALL_METRICS).includes(metric);
  }

  get activityType(): string {
    return this.title.toLowerCase();
  }

  /**
   * Retourne la couleur du groupe ou une couleur par défaut basée sur le titre
   */
  get displayColor(): string {
    if (this.groupColor) {
      return this.groupColor;
    }
    // Couleurs par défaut pour rétrocompatibilité
    switch (this.title.toLowerCase()) {
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

  openShareModal() {
    this.showShareModal = true;
  }

  closeShareModal() {
    this.showShareModal = false;
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod) {
      case 'week':
        return '7 derniers jours';
      case 'month':
        return '30 derniers jours';
      case 'current_year':
        return 'Depuis le 1er janvier';
      case '2024':
        return 'Année 2024';
      default:
        return '';
    }
  }
}
