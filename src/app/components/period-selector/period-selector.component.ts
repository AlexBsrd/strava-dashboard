import {Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
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

  isHidden = false;
  periods: Period[] = [
    {value: 'week', label: '7 derniers jours'},
    {value: 'month', label: '30 derniers jours'},
    {value: 'current_year', label: 'Depuis le 1er janvier'}
  ];
  private lastScrollTop = 0;
  private scrollThreshold = 50;

  constructor(private elementRef: ElementRef) {
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > this.scrollThreshold) {
      if (currentScroll > this.lastScrollTop) {
        this.isHidden = true; // Défilement vers le bas
      } else {
        this.isHidden = false; // Défilement vers le haut
      }
    } else {
      this.isHidden = false; // Au début de la page
    }

    this.lastScrollTop = currentScroll;
  }

  onChange(period: PeriodType) {
    this.selectedPeriod = period;
    this.periodChange.emit(period);
  }
}
