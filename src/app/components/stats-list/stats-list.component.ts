import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Stats} from '../../models/stats';
import {StatsCardComponent} from '../stats-card/stats-card.component';
import {ShareModalComponent} from '../share-modal/share-modal.component';
import {PeriodType} from "../../types/period";

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

  showShareModal = false;

  get activityType(): string {
    return this.title.toLowerCase();
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
