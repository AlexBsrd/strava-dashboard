import {Component, ElementRef, EventEmitter, HostListener, Input, Output, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PeriodType, isYearPeriod} from "../../types/period";

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
export class PeriodSelectorComponent implements OnInit {
  @Input() selectedPeriod: PeriodType = 'week';
  @Output() periodChange = new EventEmitter<PeriodType>();

  isHidden = false;
  periods: Period[] = [
    {value: 'week', label: '7 derniers jours'},
    {value: 'month', label: '30 derniers jours'},
    {value: 'current_year', label: 'Depuis le 1er janvier'}
  ];
  availableYears: number[] = [];
  selectedYear: number | null = null;
  private lastScrollTop = 0;
  private scrollThreshold = 50;

  constructor(private elementRef: ElementRef) {
  }

  ngOnInit() {
    // Générer la liste des années disponibles (de 2020 à l'année en cours)
    const currentYear = new Date().getFullYear();
    const startYear = 2020;

    for (let year = currentYear; year >= startYear; year--) {
      this.availableYears.push(year);
    }

    // Vérifier si la période sélectionnée est une année
    if (isYearPeriod(this.selectedPeriod)) {
      this.selectedYear = parseInt(this.selectedPeriod, 10);
    }
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
    this.selectedYear = null; // Réinitialiser la sélection d'année
    this.periodChange.emit(period);
  }

  onYearChange(year: number) {
    this.selectedYear = year;
    this.selectedPeriod = year.toString();
    this.periodChange.emit(year.toString());
  }

  isYearSelected(): boolean {
    return isYearPeriod(this.selectedPeriod);
  }
}
