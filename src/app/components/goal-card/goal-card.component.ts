import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoalProgress } from '../../models/goal';

@Component({
  selector: 'app-goal-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goal-card.component.html',
  styleUrl: './goal-card.component.css'
})
export class GoalCardComponent {
  @Input() progress: GoalProgress | null = null;
  @Input() showActions: boolean = true;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

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
    switch (type) {
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'time':
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return `${hours}h ${minutes}min`;
      case 'count':
        return `${Math.floor(value)} activité${Math.floor(value) > 1 ? 's' : ''}`;
      default:
        return value.toFixed(1);
    }
  }

  getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      'week': 'cette semaine',
      'month': 'ce mois',
      'year': 'cette année',
      'custom': 'période personnalisée'
    };
    return labels[period] || period;
  }

  onEdit(): void {
    if (this.progress) {
      this.edit.emit(this.progress.goal.id);
    }
  }

  onDelete(): void {
    if (this.progress && confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      this.delete.emit(this.progress.goal.id);
    }
  }
}
