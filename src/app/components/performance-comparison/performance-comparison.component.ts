import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activity } from '../../models/activity';
import { StravaService } from '../../services/strava.service';
import { AdvancedAnalyticsService, PeriodComparison } from '../../services/advanced-analytics.service';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Chart, ChartConfiguration } from 'chart.js';

interface MetricOption {
  id: string;
  label: string;
  icon?: string;
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  tension: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface PeriodOption {
  label: string;
  days: number;
  active?: boolean;
}

@Component({
  selector: 'app-performance-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './performance-comparison.component.html',
  styleUrls: ['./performance-comparison.component.css']
})
export class PerformanceComparisonComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  selectedSport: 'Run' | 'Ride' | 'Walk/Hike' = 'Run';
  selectedMetric: string = 'distance';
  selectedQuickCompare: string | null = null;
  isLoading = false;
  error: string | null = null;
  
  period1Start: string = '';
  period1End: string = '';
  period2Start: string = '';
  period2End: string = '';
  
  period1Activities: Activity[] = [];
  period2Activities: Activity[] = [];
  comparisonData: PeriodComparison | null = null;
  chart: Chart | null = null;

  availableMetrics: MetricOption[] = [
    { id: 'distance', label: 'Distance', icon: '📏' },
    { id: 'speed', label: 'Vitesse', icon: '⚡' },
    { id: 'elevation', label: 'Dénivelé', icon: '⛰️' },
    { id: 'time', label: 'Temps', icon: '⏱️' },
    { id: 'intensity', label: 'Intensité', icon: '🔥' }
  ];

  // Ajout des métriques principales
  metrics = [
    { id: 'distance', label: 'Distance', icon: '📏', unit: 'km' },
    { id: 'time', label: 'Temps total', icon: '⏱️', unit: 'h' },
    { id: 'elevation', label: 'Dénivelé', icon: '⛰️', unit: 'm' },
    { id: 'avgSpeed', label: 'Vitesse moyenne', icon: '⚡', unit: 'km/h' },
    { id: 'avgPace', label: 'Allure moyenne', icon: '👣', unit: '/km' },
    { id: 'activityCount', label: 'Nombre de sorties', icon: '🎯', unit: '' }
  ];

  periodOptions: PeriodOption[] = [
    { label: '7 jours', days: 7 },
    { label: '14 jours', days: 14 },
    { label: '1 mois', days: 30, active: true },
    { label: '3 mois', days: 90 }
  ];

  selectedPeriodLength = 30; // Par défaut 1 mois

  // Ajouter la propriété today
  today = new Date().toISOString().split('T')[0];

  constructor(
    private stravaService: StravaService,
    private analyticsService: AdvancedAnalyticsService
  ) {}

  ngOnInit() {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    
    this.period1End = this.formatDate(today);
    this.period1Start = this.formatDate(lastMonth);
    
    const twoMonthsAgo = new Date(lastMonth);
    twoMonthsAgo.setMonth(lastMonth.getMonth() - 1);
    
    this.period2End = this.formatDate(lastMonth);
    this.period2Start = this.formatDate(twoMonthsAgo);
  }

  onSportChange(sport: 'Run' | 'Ride' | 'Walk/Hike') {
    this.selectedSport = sport;
    // Ne pas lancer la comparaison automatiquement
  }

  quickCompare(type: 'last_months' | 'last_years' | 'same_season') {
    this.selectedQuickCompare = type;
    const today = new Date();
    
    switch(type) {
      case 'last_months':
        this.selectedPeriodLength = 30;
        this.setPeriod1(today);
        break;
        
      case 'last_years':
        this.selectedPeriodLength = 365;
        this.setPeriod1(today);
        break;
        
      case 'same_season':
        this.selectedPeriodLength = 90;
        this.setPeriod1(today);
        break;
    }
    
    // Lancer la comparaison après avoir défini les périodes
    this.comparePerformances();
  }

  comparePerformances() {
    this.isLoading = true;
    this.error = null;

    Promise.all([
      this.stravaService.getActivitiesByDateRange(this.period1Start, this.period1End).toPromise(),
      this.stravaService.getActivitiesByDateRange(this.period2Start, this.period2End).toPromise()
    ]).then(([period1Activities, period2Activities]) => {
      console.log('Période 1 - Activités brutes:', period1Activities);
      console.log('Période 2 - Activités brutes:', period2Activities);
      if (!period1Activities || !period2Activities) {
        throw new Error('Erreur lors de la récupération des activités');
      }

      // Filtrer par sport et trier par date
      this.period1Activities = period1Activities
        .filter(a => a.type === this.selectedSport)
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      this.period2Activities = period2Activities
        .filter(a => a.type === this.selectedSport)
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      // Calculer les comparaisons
      this.comparisonData = this.analyticsService.comparePeriods(
        this.period1Activities,
        this.period2Activities
      );

      console.log('Données de comparaison:', this.comparisonData);

      // Mettre à jour le graphique avec les nouvelles données
      this.updateChart();
      
      this.isLoading = false;
    }).catch(error => {
      console.error('Erreur lors de la comparaison:', error);
      this.error = 'Une erreur est survenue lors de la récupération des données.';
      this.isLoading = false;
    });
  }

  getActivityCount(type: string): number {
    return this.period1Activities.filter(a => a.type === type).length;
  }

  getTrendClass(): string {
    if (!this.comparisonData) return '';
    const trend = this.analyticsService.analyzeProgressionTrend(this.period1Activities);
    return `trend-${trend}`;
  }

  getTrendIcon(): string {
    if (!this.comparisonData) return '📊';
    const trend = this.analyticsService.analyzeProgressionTrend(this.period1Activities);
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '📊';
    }
  }

  getTrendDescription(): string {
    if (!this.comparisonData) return '';
    const trend = this.analyticsService.analyzeProgressionTrend(this.period1Activities);
    switch (trend) {
      case 'improving': return 'Vos performances sont en progression !';
      case 'declining': return 'Vos performances sont en légère baisse';
      default: return 'Vos performances sont stables';
    }
  }

  formatMetricValue(metric: string, value: number): string {
    switch (metric) {
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'time':
        return this.formatDuration(value);
      case 'avgSpeed':
        return this.selectedSport === 'Run' 
          ? this.formatPace(value)
          : `${value.toFixed(1)} km/h`;
      case 'maxSpeed':
        return this.selectedSport === 'Run'
          ? this.formatPace(value)
          : `${value.toFixed(1)} km/h`;
      case 'elevation':
        return `${Math.round(value)} m`;
      default:
        return value.toString();
    }
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  }

  formatPace(speedKmh: number): string {
    const minutesPerKm = 60 / speedKmh;
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  }

  updateChart(metric: string = this.selectedMetric) {
    this.selectedMetric = metric;
    if (!this.comparisonData || !this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: this.getChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Comparaison - ${this.getMetricLabel()}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                // Formater les valeurs selon la métrique
                switch (this.selectedMetric) {
                  case 'distance':
                    return `${(Number(value) / 1000).toFixed(1)} km`;
                  case 'time':
                    return this.formatDuration(Number(value));
                  case 'elevation':
                    return `${value}m`;
                  case 'avgSpeed':
                    return `${value} km/h`;
                  default:
                    return value;
                }
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private getChartData(): ChartData {
    if (!this.period1Activities.length || !this.period2Activities.length) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Période 1',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'Période 2',
            data: [],
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }
        ]
      };
    }

    const period1Data = this.aggregateActivitiesData(this.period1Activities);
    const period2Data = this.aggregateActivitiesData(this.period2Activities);

    return {
      labels: period1Data.labels,
      datasets: [
        {
          label: 'Période 1',
          data: period1Data.values,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Période 2',
          data: period2Data.values,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    };
  }

  private getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Comparaison - ${this.getMetricLabel()}`
        }
      }
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getMetricLabel(): string {
    const metric = this.availableMetrics.find(m => m.id === this.selectedMetric);
    return metric ? metric.label : '';
  }

  private aggregateActivitiesData(activities: Activity[]) {
    if (!activities.length) return { labels: [], values: [] };

    const timeSpan = Math.abs(
      new Date(activities[activities.length - 1].start_date).getTime() -
      new Date(activities[0].start_date).getTime()
    ) / (1000 * 60 * 60 * 24);

    const aggregateByWeek = timeSpan > 30;
    const aggregatedData: { [key: string]: { sum: number; count: number } } = {};
    const labels: string[] = [];

    activities.forEach(activity => {
      const date = new Date(activity.start_date);
      const key = aggregateByWeek
        ? `Semaine ${this.getWeekNumber(date)}`
        : new Date(date.setHours(0,0,0,0)).toLocaleDateString('fr-FR');

      if (!aggregatedData[key]) {
        aggregatedData[key] = { sum: 0, count: 0 };
        labels.push(key);
      }

      switch (this.selectedMetric) {
        case 'distance':
          aggregatedData[key].sum += activity.distance / 1000;
          break;
        case 'elevation':
          aggregatedData[key].sum += activity.total_elevation_gain;
          break;
        case 'time':
          aggregatedData[key].sum += activity.elapsed_time;
          break;
        case 'avgSpeed':
          aggregatedData[key].sum += activity.average_speed * 3.6;
          break;
      }
      aggregatedData[key].count++;
    });

    const values = labels.map(label => {
      const data = aggregatedData[label];
      if (this.selectedMetric === 'avgSpeed') {
        return data.sum / data.count; // Moyenne pour la vitesse
      }
      return data.sum;
    });

    return { labels, values };
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  setPeriod1(endDate: string | Date) {
    const date = typeof endDate === 'string' ? new Date(endDate) : endDate;
    this.period1End = date.toISOString().split('T')[0];
    
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - this.selectedPeriodLength);
    this.period1Start = startDate.toISOString().split('T')[0];
    
    // Ajuster automatiquement la période 2
    const period2End = new Date(startDate);
    period2End.setDate(startDate.getDate() - 1);
    this.period2End = period2End.toISOString().split('T')[0];
    
    const period2Start = new Date(period2End);
    period2Start.setDate(period2End.getDate() - this.selectedPeriodLength);
    this.period2Start = period2Start.toISOString().split('T')[0];
  }

  onPeriodLengthChange(days: number) {
    this.selectedPeriodLength = days;
    
    const endDate = new Date(this.period1End);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days);
    
    this.period1Start = this.formatDate(startDate);
    
    const period2End = new Date(startDate);
    period2End.setDate(startDate.getDate() - 1);
    const period2Start = new Date(period2End);
    period2Start.setDate(period2End.getDate() - days);
    
    this.period2End = this.formatDate(period2End);
    this.period2Start = this.formatDate(period2Start);
  }

  onPeriodSelect(selectedDays: number) {
    // Mettre à jour l'état actif
    this.periodOptions.forEach(option => {
      option.active = option.days === selectedDays;
    });
    
    const endDate = new Date(this.period1End || new Date());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - selectedDays);
    
    // Définir la période 1
    this.period1End = this.formatDate(endDate);
    this.period1Start = this.formatDate(startDate);
    
    // Définir la période 2 (juste avant la période 1)
    const period2End = new Date(startDate);
    period2End.setDate(startDate.getDate() - 1);
    const period2Start = new Date(period2End);
    period2Start.setDate(period2End.getDate() - selectedDays);
    
    this.period2End = this.formatDate(period2End);
    this.period2Start = this.formatDate(period2Start);
  }

  onDateChange() {
    const activePeriod = this.periodOptions.find(o => o.active);
    if (activePeriod) {
      this.onPeriodSelect(activePeriod.days);
    } else {
      // Utiliser la période par défaut si aucune n'est active
      this.onPeriodSelect(30);
    }
  }
}