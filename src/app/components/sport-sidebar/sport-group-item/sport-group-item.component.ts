import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SportGroup, MetricKey, METRIC_METADATA, ALL_METRICS } from '../../../types/sport-config';

@Component({
  selector: 'app-sport-group-item',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './sport-group-item.component.html',
  styleUrls: ['./sport-group-item.component.css']
})
export class SportGroupItemComponent {
  @Input() group!: SportGroup;
  @Input() isExpanded = false;
  @Input() activityCount = 0;

  @Output() toggle = new EventEmitter<void>();
  @Output() expand = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() metricToggle = new EventEmitter<MetricKey>();

  readonly allMetrics = ALL_METRICS;
  readonly metricMetadata = METRIC_METADATA;

  onToggle(event: Event): void {
    event.stopPropagation();
    this.toggle.emit();
  }

  onExpand(): void {
    this.expand.emit();
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit();
  }

  onMetricToggle(metric: MetricKey, event: Event): void {
    event.stopPropagation();
    // Ne pas permettre de désactiver la dernière métrique
    if (this.group.visibleMetrics.length === 1 && this.isMetricEnabled(metric)) {
      return;
    }
    this.metricToggle.emit(metric);
  }

  isMetricEnabled(metric: MetricKey): boolean {
    return this.group.visibleMetrics.includes(metric);
  }

  getMetricLabelKey(metric: MetricKey): string {
    return METRIC_METADATA[metric].labelKey;
  }

  getTypesCount(): number {
    return this.group.types.length;
  }

  getMetricsCount(): number {
    return this.group.visibleMetrics.length;
  }
}
