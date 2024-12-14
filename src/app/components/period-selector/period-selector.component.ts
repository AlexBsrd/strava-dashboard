// src/app/components/period-selector/period-selector.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

type PeriodType = 'week' | 'month' | 'current_year';

interface Period {
  value: PeriodType;
  label: string;
}

@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './period-selector.component.html',
  styleUrls: ['./period-selector.component.css']
})
export class PeriodSelectorComponent {
  @Input() selectedPeriod: PeriodType = 'week';
  @Output() periodChange = new EventEmitter<PeriodType>();

  periods: Period[] = [
    {value: 'week', label: '7 derniers jours'},
    {value: 'month', label: '30 derniers jours'},
    {value: 'current_year', label: 'Depuis le 1er janvier'}
  ];

  onChange(period: PeriodType) {
    this.selectedPeriod = period;
    this.periodChange.emit(period);
  }
}
