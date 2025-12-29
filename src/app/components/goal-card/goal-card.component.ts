import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GoalProgress } from '../../models/goal';

@Component({
  selector: 'app-goal-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './goal-card.component.html',
  styleUrl: './goal-card.component.css'
})
export class GoalCardComponent {
  @Input() progress: GoalProgress | null = null;
  @Input() showActions: boolean = true;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  constructor(private translateService: TranslateService) {}

  get progressBarColor(): string {
    if (!this.progress) return 'var(--gray-300)';
    if (this.progress.isCompleted) return 'var(--green-500)';
    if (this.progress.isOnTrack) return 'var(--primary-500)';
    return 'var(--orange-500)';
  }

  get projectionColor(): string {
    if (!this.progress) return 'var(--text-secondary)';
    if (this.progress.isOnTrack) return 'var(--green-600)';
    return 'var(--orange-600)';
  }

  get statusIcon(): string {
    if (!this.progress) return '🎯';
    if (this.progress.isCompleted) return '✅';
    if (this.progress.isOnTrack) return '📈';
    return '⚠️';
  }

  formatValue(value: number, type: string): string {
    const count = Math.floor(value);
    switch (type) {
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'time':
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return `${hours}h ${minutes}min`;
      case 'count':
        const activityLabel = count === 1
          ? this.translateService.instant('common.plurals.activity_one')
          : this.translateService.instant('common.plurals.activity_other');
        return `${count} ${activityLabel}`;
      default:
        return value.toFixed(1);
    }
  }

  getPeriodLabel(period: string): string {
    const key = `goals.periods.${period}`;
    return this.translateService.instant(key);
  }

  onEdit(): void {
    if (this.progress) {
      this.edit.emit(this.progress.goal.id);
    }
  }

  onDelete(): void {
    if (this.progress) {
      const message = this.translateService.instant('goals.card.delete_confirmation');
      if (confirm(message)) {
        this.delete.emit(this.progress.goal.id);
      }
    }
  }
}
