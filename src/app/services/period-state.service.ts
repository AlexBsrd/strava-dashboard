import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { PeriodType } from '../types/period';
import { ComparisonPeriod, ComparisonPreset } from '../types/comparison';
import { ComparisonService } from './comparison.service';

@Injectable({
  providedIn: 'root'
})
export class PeriodStateService {
  // État pour la page Dashboard
  private dashboardPeriod = new BehaviorSubject<PeriodType>('week');
  dashboardPeriod$ = this.dashboardPeriod.asObservable();

  // État pour la page Comparer
  private comparePeriod1 = new BehaviorSubject<ComparisonPeriod | null>(null);
  private comparePeriod2 = new BehaviorSubject<ComparisonPeriod | null>(null);
  private compareTriggered = new BehaviorSubject<boolean>(false);

  comparePeriod1$ = this.comparePeriod1.asObservable();
  comparePeriod2$ = this.comparePeriod2.asObservable();
  compareTriggered$ = this.compareTriggered.asObservable();

  // Presets de comparaison
  comparisonPresets: ComparisonPreset[] = [];

  constructor(
    private comparisonService: ComparisonService,
    private translateService: TranslateService
  ) {
    this.comparisonPresets = this.comparisonService.getComparisonPresets();
  }

  // Dashboard
  setDashboardPeriod(period: PeriodType): void {
    this.dashboardPeriod.next(period);
  }

  getDashboardPeriod(): PeriodType {
    return this.dashboardPeriod.value;
  }

  // Comparer
  setComparePeriod1(period: ComparisonPeriod): void {
    this.comparePeriod1.next(period);
  }

  setComparePeriod2(period: ComparisonPeriod): void {
    this.comparePeriod2.next(period);
  }

  getComparePeriod1(): ComparisonPeriod | null {
    return this.comparePeriod1.value;
  }

  getComparePeriod2(): ComparisonPeriod | null {
    return this.comparePeriod2.value;
  }

  triggerCompare(): void {
    if (this.comparePeriod1.value && this.comparePeriod2.value) {
      this.compareTriggered.next(true);
      // Reset après émission
      setTimeout(() => this.compareTriggered.next(false), 100);
    }
  }

  canCompare(): boolean {
    return !!(this.comparePeriod1.value && this.comparePeriod2.value);
  }

  formatPeriodLabel(period: ComparisonPeriod | null): string {
    if (!period) return this.translateService.instant('sidebar.comparison.selectPeriod');
    return this.comparisonService.formatPeriodLabel(period);
  }
}
