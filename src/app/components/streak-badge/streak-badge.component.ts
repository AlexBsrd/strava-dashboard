import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StreakInfo } from '../../services/streak.service';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './streak-badge.component.html',
  styleUrl: './streak-badge.component.css'
})
export class StreakBadgeComponent {
  @Input() streakInfo: StreakInfo | null = null;
  @Input() loading: boolean = false;

  get hasCurrentStreak(): boolean {
    return !!this.streakInfo && this.streakInfo.currentStreak > 0;
  }

  get hasLongestStreak(): boolean {
    return !!this.streakInfo && this.streakInfo.longestStreak > 0;
  }

  formatDateRange(start?: Date, end?: Date): string {
    if (!start || !end) return '';

    if (start.getTime() === end.getTime()) {
      return this.formatDate(start);
    }

    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  getDayLabel(count: number): string {
    return count === 1 ? 'jour' : 'jours';
  }
}
