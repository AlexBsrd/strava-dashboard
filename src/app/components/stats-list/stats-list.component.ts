import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Stats} from '../../models/stats';
import {StatsCardComponent} from '../stats-card/stats-card.component';
import {ShareModalComponent} from '../share-modal/share-modal.component';
import {SportIconComponent} from '../sport-icon/sport-icon.component';
import {PeriodType} from "../../types/period";
import {MetricKey, ALL_METRICS} from "../../types/sport-config";

@Component({
  selector: 'app-stats-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    StatsCardComponent,
    ShareModalComponent,
    SportIconComponent
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
  /** Groupe de course ou de marche : vitesse affichée en allure */
  @Input() showPace = false;

  showShareModal = false;

  constructor(private translateService: TranslateService) {}

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

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod) {
      case 'week':
        return this.translateService.instant('sidebar.period.last7days');
      case 'month':
        return this.translateService.instant('sidebar.period.last30days');
      case 'current_year':
        return this.translateService.instant('sidebar.period.sinceJan1');
      default:
        // Si c'est une année (format YYYY)
        const year = parseInt(this.selectedPeriod, 10);
        if (!isNaN(year)) {
          return this.translateService.instant('sidebar.period.year', { year });
        }
        return '';
    }
  }

  /**
   * Identifiant d'icône de sport (pour app-sport-icon).
   * Utilise groupIcon si disponible, sinon déduit depuis le titre.
   */
  get sportIconId(): string {
    if (this.groupIcon) {
      return this.groupIcon;
    }
    const titleLower = this.title.toLowerCase();
    if (titleLower.includes('course') || titleLower.includes('run')) {
      return 'run';
    } else if (titleLower.includes('vélo') || titleLower.includes('bike') || titleLower.includes('cycl')) {
      return 'bike';
    } else if (titleLower.includes('marche') || titleLower.includes('walk')) {
      return 'walk';
    }
    return 'activity';
  }
}
