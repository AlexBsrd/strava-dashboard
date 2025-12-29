import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComparisonPeriod, ComparisonPreset } from '../../types/comparison';
import { ComparisonService } from '../../services/comparison.service';

@Component({
  selector: 'app-comparison-period-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './comparison-period-selector.component.html',
  styleUrls: ['./comparison-period-selector.component.css']
})
export class ComparisonPeriodSelectorComponent {
  @Input() period1: ComparisonPeriod | null = null;
  @Input() period2: ComparisonPeriod | null = null;
  @Output() period1Change = new EventEmitter<ComparisonPeriod>();
  @Output() period2Change = new EventEmitter<ComparisonPeriod>();
  @Output() compareClick = new EventEmitter<void>();

  presets: ComparisonPreset[] = [];
  selectedPresetIndex: number | null = null;
  showCustomPeriod1 = false;
  showCustomPeriod2 = false;

  // Custom date inputs
  customPeriod1Start = '';
  customPeriod1End = '';
  customPeriod2Start = '';
  customPeriod2End = '';

  constructor(
    private comparisonService: ComparisonService,
    private translateService: TranslateService
  ) {
    this.presets = this.comparisonService.getComparisonPresets();
  }

  onPresetSelect(index: number) {
    this.selectedPresetIndex = index;
    const preset = this.presets[index];
    this.period1 = preset.period1;
    this.period2 = preset.period2;
    this.showCustomPeriod1 = false;
    this.showCustomPeriod2 = false;
    this.period1Change.emit(this.period1);
    this.period2Change.emit(this.period2);
  }

  onCustomMode() {
    this.selectedPresetIndex = null;
    this.showCustomPeriod1 = true;
    this.showCustomPeriod2 = true;
  }

  applyCustomPeriod1() {
    if (this.customPeriod1Start && this.customPeriod1End) {
      const startDate = new Date(this.customPeriod1Start);
      const endDate = new Date(this.customPeriod1End);
      endDate.setHours(23, 59, 59, 999);

      this.period1 = {
        type: 'custom',
        label: 'Période personnalisée 1',
        startDate,
        endDate
      };
      this.period1Change.emit(this.period1);
    }
  }

  applyCustomPeriod2() {
    if (this.customPeriod2Start && this.customPeriod2End) {
      const startDate = new Date(this.customPeriod2Start);
      const endDate = new Date(this.customPeriod2End);
      endDate.setHours(23, 59, 59, 999);

      this.period2 = {
        type: 'custom',
        label: 'Période personnalisée 2',
        startDate,
        endDate
      };
      this.period2Change.emit(this.period2);
    }
  }

  onCompare() {
    if (this.period1 && this.period2) {
      this.compareClick.emit();
    }
  }

  canCompare(): boolean {
    return !!(this.period1 && this.period2);
  }

  formatPeriod(period: ComparisonPeriod | null): string {
    if (!period) return this.translateService.instant('sidebar.comparison.selectPeriod');
    return this.comparisonService.formatPeriodLabel(period);
  }
}
