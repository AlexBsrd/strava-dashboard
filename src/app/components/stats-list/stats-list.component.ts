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
      default:
        // Si c'est une année (format YYYY)
        const year = parseInt(this.selectedPeriod, 10);
        if (!isNaN(year)) {
          return `Année ${year}`;
        }
        return '';
    }
  }

  /**
   * Convertit un identifiant d'icône en emoji
   */
  getIconEmoji(icon: string): string {
    const iconMap: Record<string, string> = {
      'run': '🏃',
      'bike': '🚴',
      'walk': '🚶',
      'hike': '🥾',
      'trail': '🏃‍♂️',
      'swim': '🏊',
      'ski': '⛷️',
      'weight': '🏋️',
      'yoga': '🧘',
      'activity': '💪',
      'fitness': '💪',
      'workout': '🏃',
      'crossfit': '🏋️‍♂️'
    };
    return iconMap[icon] || '🏃';
  }

  /**
   * Retourne l'emoji à afficher (depuis groupIcon ou basé sur le titre)
   */
  getDisplayIcon(): string {
    if (this.groupIcon) {
      return this.getIconEmoji(this.groupIcon);
    }

    // Fallback basé sur le titre pour les types standards
    const titleLower = this.title.toLowerCase();
    if (titleLower.includes('course') || titleLower.includes('run')) {
      return '🏃';
    } else if (titleLower.includes('vélo') || titleLower.includes('bike')) {
      return '🚴';
    } else if (titleLower.includes('marche') || titleLower.includes('walk')) {
      return '🚶';
    }

    return '💪'; // Icône par défaut
  }
}
