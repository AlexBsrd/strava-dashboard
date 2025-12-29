import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeatmapDay } from '../../services/streak.service';

interface HeatmapWeek {
  days: (HeatmapDay | null)[];
}

@Component({
  selector: 'app-activity-heatmap',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './activity-heatmap.component.html',
  styleUrl: './activity-heatmap.component.css'
})
export class ActivityHeatmapComponent implements OnChanges, OnInit {
  @Input() heatmapData: HeatmapDay[] = [];
  @Input() loading: boolean = false;

  weeks: HeatmapWeek[] = [];
  monthLabels: { label: string; weekIndex: number }[] = [];
  weekdays: string[] = [];

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.updateWeekdays();
    this.translateService.onLangChange.subscribe(() => {
      this.updateWeekdays();
      this.organizeDataIntoWeeks();
    });
  }

  private updateWeekdays(): void {
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    // Generate weekday names using JavaScript's Date
    this.weekdays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i + 1); // Jan 1, 2024 was a Monday
      this.weekdays.push(date.toLocaleDateString(locale, { weekday: 'short' }));
    }
  }

  private getLocale(): string {
    return this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['heatmapData']) {
      this.organizeDataIntoWeeks();
    }
  }

  private organizeDataIntoWeeks(): void {
    if (!this.heatmapData || this.heatmapData.length === 0) {
      this.weeks = [];
      this.monthLabels = [];
      return;
    }

    this.weeks = [];
    this.monthLabels = [];

    const firstDate = this.heatmapData[0]?.date;
    if (!firstDate) return;

    // Start from Monday of the first week
    const startDate = new Date(firstDate);
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    let currentWeek: (HeatmapDay | null)[] = [];
    let currentDate = new Date(startDate);
    let dataIndex = 0;
    let weekIndex = 0;
    let lastMonth = -1;

    while (dataIndex < this.heatmapData.length || currentWeek.length > 0) {
      const currentMonth = currentDate.getMonth();

      // Track month labels
      if (currentMonth !== lastMonth && currentDate.getDay() === 1) {
        this.monthLabels.push({
          label: this.getMonthLabel(currentMonth),
          weekIndex: weekIndex
        });
        lastMonth = currentMonth;
      }

      // Find matching data for current date
      const matchingData = this.heatmapData.find(d =>
        this.isSameDay(new Date(d.date), currentDate)
      );

      if (matchingData) {
        currentWeek.push(matchingData);
        dataIndex++;
      } else if (currentDate < this.heatmapData[0].date) {
        // Before data starts
        currentWeek.push(null);
      } else if (dataIndex >= this.heatmapData.length) {
        // After data ends - stop
        break;
      } else {
        // Gap in data
        currentWeek.push({
          date: new Date(currentDate),
          count: 0,
          activities: []
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);

      // When week is complete (7 days)
      if (currentWeek.length === 7) {
        this.weeks.push({ days: currentWeek });
        currentWeek = [];
        weekIndex++;
      }
    }

    // Add incomplete last week if exists
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      this.weeks.push({ days: currentWeek });
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private getMonthLabel(month: number): string {
    const date = new Date(2024, month, 1);
    return date.toLocaleDateString(this.getLocale(), { month: 'short' });
  }

  getIntensityClass(day: HeatmapDay | null): string {
    if (!day || day.count === 0) {
      return 'intensity-0';
    }
    if (day.count === 1) {
      return 'intensity-1';
    }
    if (day.count === 2) {
      return 'intensity-2';
    }
    if (day.count >= 3) {
      return 'intensity-3';
    }
    return 'intensity-0';
  }

  getTooltipText(day: HeatmapDay | null): string {
    if (!day) {
      return '';
    }

    const dateStr = day.date.toLocaleDateString(this.getLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (day.count === 0) {
      const noActivity = this.translateService.instant('heatmap.no_activity');
      return `${dateStr} - ${noActivity}`;
    }

    const key = day.count === 1 ? 'common.plurals.activity_one' : 'common.plurals.activity_other';
    const activityText = this.translateService.instant(key);
    return `${dateStr} - ${day.count} ${activityText}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString(this.getLocale(), {
      day: 'numeric',
      month: 'short'
    });
  }
}
