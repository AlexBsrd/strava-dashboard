import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StreakInfo } from '../../services/streak.service';
import { StreakMode } from '../../services/display-preferences.service';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './streak-badge.component.html',
  styleUrl: './streak-badge.component.css'
})
export class StreakBadgeComponent {
  @Input() streakInfo: StreakInfo | null = null;
  @Input() loading: boolean = false;
  @Input() streakMode: StreakMode = 'weeks';

  constructor(private translateService: TranslateService) {}

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
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    return date.toLocaleDateString(locale, options);
  }

  getUnitLabel(count: number): string {
    if (this.streakMode === 'weeks') {
      const key = count === 1 ? 'common.plurals.week_one' : 'common.plurals.week_other';
      return this.translateService.instant(key);
    } else {
      const key = count === 1 ? 'common.plurals.day_one' : 'common.plurals.day_other';
      return this.translateService.instant(key);
    }
  }
}
