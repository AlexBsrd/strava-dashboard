import {ChangeDetectorRef, Component, ElementRef, HostListener, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {
  CategoryScale,
  Chart,
  ChartEvent,
  Filler,
  Legend,
  LegendItem,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import {Activity} from '../../models/activity';
import {FullscreenService} from "../../services/fullscreen.service";
import {PeriodType, isYearPeriod, getYearFromPeriod} from "../../types/period";

Chart.register(
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

interface WeeklyData {
  weekNumber: number;
  weekLabel: string;
  weekStart: Date;
  weekEnd: Date;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  totalElevation: number;
  activitiesCount: number;
  activities: Array<{ name: string, date: Date }>;
}

/** Détail d'un point du graphique, affiché dans un panneau au clic (liste complète, fermable) */
interface ChartDetail {
  title: string;
  subtitle: string;
  listLabel: string;
  activities: { name: string; dateLabel: string }[];
}

interface MonthlyData {
  monthNumber: number;
  monthLabel: string;
  monthStart: Date;
  monthEnd: Date;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  totalElevation: number;
  activitiesCount: number;
  activities: Array<{ name: string, date: Date }>;
}

type GroupingType = 'none' | 'week' | 'month';

@Component({
  selector: 'app-modern-activity-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './modern-activity-chart.component.html',
  styleUrls: ['./modern-activity-chart.component.css']
})
export class ModernActivityChartComponent implements OnChanges, OnInit {
  @Input() activities: Activity[] = [];
  @Input() period: PeriodType = 'week';

  selectedActivityType = 'Run';
  selectedMetrics: string[] = ['distance'];
  // ponytail: Chart<any> — les configs mixtes line/scatter ne passent pas le générique strict de chart.js
  chart: Chart<any> | null = null;
  groupingType: GroupingType = 'none';

  activityTypes: string[] = ['Run', 'Ride', 'Walk/Hike'];
  metrics: Array<{value: string, labelKey: string, color: string}> = [
    {value: 'speed', labelKey: 'chart.metrics.speed', color: '#2196F3'},
    {value: 'distance', labelKey: 'chart.metrics.distance', color: '#4CAF50'},
    {value: 'elevation', labelKey: 'chart.metrics.elevation', color: '#FF9800'},
    {value: 'duration', labelKey: 'chart.metrics.duration', color: '#9C27B0'}
  ];

  @ViewChild('chartContainer') chartContainer!: ElementRef;
  isFullscreen$;
  detail: ChartDetail | null = null;
  /** Écran tactile : pas d'info-bulle (impossible à refermer), le toucher ouvre directement le panneau */
  readonly isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fullscreenService: FullscreenService,
    private translateService: TranslateService
  ) {
    this.isFullscreen$ = this.fullscreenService.isFullscreen$;
  }

  ngOnInit(): void {
    this.translateService.onLangChange.subscribe(() => {
      if (this.chart) {
        this.updateChart();
      }
    });
  }

  private getLocale(): string {
    return this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
  }

  getMetricLabel(metric: {value: string, labelKey: string, color: string}): string {
    return this.translateService.instant(metric.labelKey);
  }

  toggleFullscreen() {
    if (this.chartContainer) {
      this.fullscreenService.toggleFullscreen(this.chartContainer.nativeElement);
    }
  }

  canGroupByWeek(): boolean {
    return this.period === 'month' || this.period === 'current_year' || isYearPeriod(this.period);
  }

  canGroupByMonth(): boolean {
    return this.period === 'current_year' || isYearPeriod(this.period);
  }

  /**
   * Agrégation par défaut adaptée à la période, pour garder un graphique
   * lisible sur mobile (sinon une année = ~140 points illisibles).
   * Semaine → par jour, Mois → par semaine, Année → par mois.
   */
  private getDefaultGrouping(period: PeriodType): GroupingType {
    if (period === 'current_year' || isYearPeriod(period)) {
      return 'month';
    }
    if (period === 'month') {
      return 'week';
    }
    return 'none';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      // Réinitialiser sur l'agrégation recommandée à chaque changement de période
      this.groupingType = this.getDefaultGrouping(this.period);
    }
    if ((changes['activities'] || changes['period']) && this.activities) {
      this.updateChart();
    }
  }

  onActivityTypeChange(value: string) {
    this.selectedActivityType = value;
    this.updateChart();
  }

  onGroupingChange(value: GroupingType) {
    this.groupingType = value;
    this.updateChart();
  }

  toggleMetric(metric: string) {
    const index = this.selectedMetrics.indexOf(metric);
    if (index === -1) {
      this.selectedMetrics.push(metric);
    } else {
      this.selectedMetrics.splice(index, 1);
    }
    this.updateChart();
  }

  isMetricSelected(metric: string): boolean {
    return this.selectedMetrics.includes(metric);
  }

  zoomIn() {
    if (this.chart) {
      this.chart.zoom(1.2);
    }
  }

  zoomOut() {
    if (this.chart) {
      this.chart.zoom(0.8);
    }
  }

  resetZoom() {
    if (this.chart) {
      this.chart.resetZoom();
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // ISO 8601: week starts on Monday, week 1 contains the first Thursday
    const dayOfWeek = d.getDay() || 7; // Convert Sunday (0) to 7
    d.setDate(d.getDate() + 4 - dayOfWeek); // Set to Thursday of this week
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getWeekRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    const day = start.getDay();
    // Monday-based: Sunday (0) → -6, Monday (1) → 0, Tuesday (2) → -1, etc.
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {start, end};
  }

  private groupActivitiesByWeek(activities: Activity[]): WeeklyData[] {
    if (!activities.length) return [];

    const weeklyMap = new Map<number, WeeklyData>();

    activities.forEach(activity => {
      const activityDate = new Date(activity.start_date);
      const weekNumber = this.getWeekNumber(activityDate);
      const weekRange = this.getWeekRange(activityDate);

      if (!weeklyMap.has(weekNumber)) {
        weeklyMap.set(weekNumber, {
          weekNumber,
          weekLabel: `S${weekNumber}`,
          weekStart: weekRange.start,
          weekEnd: weekRange.end,
          totalDistance: 0,
          totalDuration: 0,
          averageSpeed: 0,
          totalElevation: 0,
          activitiesCount: 0,
          activities: []
        });
      }

      const existingData = weeklyMap.get(weekNumber)!;
      existingData.totalDistance += activity.distance;
      existingData.totalDuration += activity.moving_time;
      existingData.totalElevation += activity.total_elevation_gain;
      existingData.activitiesCount += 1;
      existingData.activities.push({
        name: activity.name,
        date: new Date(activity.start_date)
      });
    });

    // Calculer les moyennes et trier les activités par date
    weeklyMap.forEach(week => {
      week.averageSpeed = (week.totalDistance / (week.totalDuration / 3600)) || 0;
      week.activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    return Array.from(weeklyMap.values()).sort((a, b) =>
      a.weekNumber - b.weekNumber
    );
  }

  private groupActivitiesByMonth(activities: Activity[]): MonthlyData[] {
    if (!activities.length) return [];

    const monthlyMap = new Map<number, MonthlyData>();

    activities.forEach(activity => {
      const activityDate = new Date(activity.start_date);
      const monthNumber = activityDate.getMonth(); // 0-11
      const year = activityDate.getFullYear();
      const monthKey = year * 100 + monthNumber; // Unique key per year-month

      if (!monthlyMap.has(monthKey)) {
        const monthStart = new Date(year, monthNumber, 1);
        const monthEnd = new Date(year, monthNumber + 1, 0); // Last day of the month
        const monthLabel = monthStart.toLocaleDateString(this.getLocale(), { month: 'long' });

        monthlyMap.set(monthKey, {
          monthNumber: monthNumber,
          monthLabel: monthLabel,
          monthStart: monthStart,
          monthEnd: monthEnd,
          totalDistance: 0,
          totalDuration: 0,
          averageSpeed: 0,
          totalElevation: 0,
          activitiesCount: 0,
          activities: []
        });
      }

      const existingData = monthlyMap.get(monthKey)!;
      existingData.totalDistance += activity.distance;
      existingData.totalDuration += activity.moving_time;
      existingData.totalElevation += activity.total_elevation_gain;
      existingData.activitiesCount += 1;
      existingData.activities.push({
        name: activity.name,
        date: new Date(activity.start_date)
      });
    });

    // Calculer les moyennes et trier les activités par date
    monthlyMap.forEach(month => {
      month.averageSpeed = (month.totalDistance / (month.totalDuration / 3600)) || 0;
      month.activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    return Array.from(monthlyMap.values()).sort((a, b) =>
      a.monthStart.getTime() - b.monthStart.getTime()
    );
  }

  private getFilteredActivities(): Activity[] {
    if (!this.activities) return [];

    let filteredActivities = [...this.activities];

    switch (this.selectedActivityType) {
      case 'Run':
        filteredActivities = filteredActivities.filter(a => a.type.includes('Run'));
        break;
      case 'Ride':
        filteredActivities = filteredActivities.filter(a => a.type.includes('Ride'));
        break;
      case 'Walk/Hike':
        filteredActivities = filteredActivities.filter(a => a.type.includes('Hike') || a.type.includes('Walk'));
        break;
    }

    return filteredActivities.sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }

  private generateDateLabels(): [Date[], Activity[] | WeeklyData[] | MonthlyData[]] {
    const today = new Date();
    const dates: Date[] = [];
    let data: Activity[] | WeeklyData[] | MonthlyData[] = [];

    if (this.groupingType === 'week') {
      // Déterminer la plage de dates selon la période
      let rangeStart: Date, rangeEnd: Date;
      if (this.period === 'month') {
        rangeStart = new Date(today);
        rangeStart.setDate(today.getDate() - 29);
        rangeEnd = new Date(today);
      } else {
        const targetYear = getYearFromPeriod(this.period) ?? today.getFullYear();
        rangeStart = new Date(targetYear, 0, 1);
        rangeEnd = new Date(targetYear, 11, 31);
      }

      // Ajuster au lundi de la semaine contenant le début de la plage
      const firstMonday = new Date(rangeStart);
      const dow = firstMonday.getDay();
      firstMonday.setDate(firstMonday.getDate() + (dow === 0 ? -6 : 1 - dow));

      // Créer un tableau de toutes les semaines
      const allWeeks: WeeklyData[] = [];
      let currentDate = new Date(firstMonday);

      while (currentDate <= rangeEnd) {
        const weekNumber = this.getWeekNumber(currentDate);
        const weekRange = this.getWeekRange(currentDate);

        allWeeks.push({
          weekNumber,
          weekLabel: `S${weekNumber}`,
          weekStart: new Date(weekRange.start),
          weekEnd: new Date(weekRange.end),
          totalDistance: 0,
          totalDuration: 0,
          averageSpeed: 0,
          totalElevation: 0,
          activitiesCount: 0,
          activities: []
        });

        // Passer à la semaine suivante
        currentDate.setDate(currentDate.getDate() + 7);
      }

      // Intégrer les données d'activités dans les semaines correspondantes
      const filteredActivities = this.getFilteredActivities();
      filteredActivities.forEach(activity => {
        const activityDate = new Date(activity.start_date);
        const weekNumber = this.getWeekNumber(activityDate);
        const weekData = allWeeks.find(w => w.weekNumber === weekNumber);

        if (weekData) {
          weekData.totalDistance += activity.distance;
          weekData.totalDuration += activity.moving_time;
          weekData.totalElevation += activity.total_elevation_gain;
          weekData.activitiesCount += 1;
          weekData.activities.push({
            name: activity.name,
            date: new Date(activity.start_date)
          });
        }
      });

      // Calculer les moyennes et trier les activités
      allWeeks.forEach(week => {
        week.averageSpeed = (week.totalDistance / (week.totalDuration / 3600)) || 0;
        week.activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      });

      dates.push(...allWeeks.map(week => week.weekStart));
      data = allWeeks;
    } else if (this.groupingType === 'month') {
      // Générer tous les mois de l'année
      const targetYear = getYearFromPeriod(this.period) ?? today.getFullYear();
      const allMonths: MonthlyData[] = [];

      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(targetYear, month, 1);
        const monthEnd = new Date(targetYear, month + 1, 0);
        const monthLabel = monthStart.toLocaleDateString(this.getLocale(), { month: 'long' });

        allMonths.push({
          monthNumber: month,
          monthLabel: monthLabel,
          monthStart: monthStart,
          monthEnd: monthEnd,
          totalDistance: 0,
          totalDuration: 0,
          averageSpeed: 0,
          totalElevation: 0,
          activitiesCount: 0,
          activities: []
        });
      }

      // Intégrer les données d'activités dans les mois correspondants
      const filteredActivities = this.getFilteredActivities();
      filteredActivities.forEach(activity => {
        const activityDate = new Date(activity.start_date);
        const monthNumber = activityDate.getMonth();
        const monthData = allMonths.find(m => m.monthNumber === monthNumber);

        if (monthData) {
          monthData.totalDistance += activity.distance;
          monthData.totalDuration += activity.moving_time;
          monthData.totalElevation += activity.total_elevation_gain;
          monthData.activitiesCount += 1;
          monthData.activities.push({
            name: activity.name,
            date: new Date(activity.start_date)
          });
        }
      });

      // Calculer les moyennes et trier les activités
      allMonths.forEach(month => {
        month.averageSpeed = (month.totalDistance / (month.totalDuration / 3600)) || 0;
        month.activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      });

      dates.push(...allMonths.map(month => month.monthStart));
      data = allMonths;
    } else {
      let startDate: Date;
      let endDate = new Date(today);

      switch (this.period) {
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6);
          break;
        case 'month':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 29);
          break;
        case 'current_year':
          startDate = new Date(today.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          // Vérifier si c'est une année spécifique
          const year = getYearFromPeriod(this.period);
          if (year !== null) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
          } else {
            // Fallback pour les périodes inconnues
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
          }
          break;
      }

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      data = this.getFilteredActivities();
    }

    return [dates, data];
  }

  private createDataMap(dates: Date[], rawData: Activity[] | WeeklyData[] | MonthlyData[]): Map<string, Activity | WeeklyData | MonthlyData> {
    const dataMap = new Map<string, Activity | WeeklyData | MonthlyData>();

    if (this.groupingType === 'week') {
      (rawData as WeeklyData[]).forEach(week => {
        dataMap.set(week.weekNumber.toString(), week);
      });
    } else if (this.groupingType === 'month') {
      (rawData as MonthlyData[]).forEach(month => {
        dataMap.set(month.monthNumber.toString(), month);
      });
    } else {
      (rawData as Activity[]).forEach(activity => {
        const activityDate = new Date(activity.start_date);
        // Clé AAAA-MM-JJ en heure locale (toISOString passerait en UTC et décalerait le jour)
        const dateKey = activityDate.toLocaleDateString('sv-SE');
        // Plusieurs activités le même jour : on les cumule au lieu de garder la dernière
        const sameDay = dataMap.get(dateKey) as Activity | undefined;
        dataMap.set(dateKey, sameDay ? this.mergeActivities(sameDay, activity) : activity);
      });
    }

    return dataMap;
  }

  private mergeActivities(a: Activity, b: Activity): Activity {
    const distance = a.distance + b.distance;
    const movingTime = a.moving_time + b.moving_time;
    return {
      ...a,
      name: `${a.name}\n${b.name}`,
      distance,
      moving_time: movingTime,
      elapsed_time: a.elapsed_time + b.elapsed_time,
      total_elevation_gain: a.total_elevation_gain + b.total_elevation_gain,
      average_speed: movingTime ? distance / (movingTime / 3600) : 0
    };
  }

  private formatDuration(hours: number): string {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  }

  private getMetricValue(item: Activity | WeeklyData | MonthlyData | undefined | null, metricType: string): number | null {
    if (!item) return null;

    if ('weekNumber' in item) {
      const weekData = item as WeeklyData;
      switch (metricType) {
        case 'speed':
          return weekData.averageSpeed;
        case 'distance':
          return weekData.totalDistance;
        case 'elevation':
          return weekData.totalElevation;
        case 'duration':
          return weekData.totalDuration / 3600;
        default:
          return null;
      }
    } else if ('monthNumber' in item) {
      const monthData = item as MonthlyData;
      switch (metricType) {
        case 'speed':
          return monthData.averageSpeed;
        case 'distance':
          return monthData.totalDistance;
        case 'elevation':
          return monthData.totalElevation;
        case 'duration':
          return monthData.totalDuration / 3600;
        default:
          return null;
      }
    } else {
      const activityData = item as Activity;
      switch (metricType) {
        case 'speed':
          return activityData.average_speed;
        case 'distance':
          return activityData.distance;
        case 'elevation':
          return activityData.total_elevation_gain;
        case 'duration':
          return activityData.moving_time / 3600;
        default:
          return null;
      }
    }
  }

  private handleLegendClick(e: ChartEvent, legendItem: LegendItem) {
    const index = legendItem.datasetIndex;
    if (index !== undefined && index >= 0 && index < this.selectedMetrics.length) {
      this.toggleMetric(this.selectedMetrics[index]);
    }
  }

  @HostListener('document:keydown.escape')
  closeDetail(): void {
    this.detail = null;
  }

  private updateChart() {
    this.detail = null;
    if (this.chart) {
      this.chart.destroy();
    }

    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas) return;

    const [dateLabels, rawData] = this.generateDateLabels();
    const dataMap = this.createDataMap(dateLabels, rawData);

    const datasets = this.selectedMetrics.map(metricType => {
      const metric = this.metrics.find(m => m.value === metricType)!;
      const data = dateLabels.map(date => {
        if (!date) return null;

        if (this.groupingType === 'week') {
          const weekNum = this.getWeekNumber(date);
          const item = dataMap.get(weekNum.toString());
          return this.getMetricValue(item, metricType);
        } else if (this.groupingType === 'month') {
          const monthNum = date.getMonth();
          const item = dataMap.get(monthNum.toString());
          return this.getMetricValue(item, metricType);
        } else {
          const key = date.toLocaleDateString('sv-SE');
          const item = dataMap.get(key);
          return this.getMetricValue(item, metricType);
        }
      });

      // Adapter l'épaisseur de ligne et les points à la densité de données :
      // beaucoup de points (vue détaillée longue) → ligne fine, points masqués.
      const pointCount = data.filter(value => value !== null).length;
      const dotRadius = pointCount > 40 ? 0 : (pointCount > 20 ? 2 : 3);
      const lineWidth = pointCount > 40 ? 1.5 : 2;

      return {
        label: this.getMetricLabel(metric),
        data: data,
        borderColor: metric.color,
        backgroundColor: `${metric.color}33`,
        borderWidth: lineWidth,
        tension: 0.3,
        fill: false,
        yAxisID: metricType,
        spanGaps: true,
        pointRadius: data.map(value => value === null ? 0 : dotRadius),
        pointHoverRadius: data.map(value => value === null ? 0 : dotRadius + 3),
      };
    });

    const locale = this.getLocale();
    const weekAbbrev = this.translateService.instant('chart.week_abbrev');
    const data = {
      labels: dateLabels.map(date => {
        if (!date) return '';
        if (this.groupingType === 'week') {
          const weekNum = this.getWeekNumber(date);
          return `${weekAbbrev} ${weekNum}`;
        }
        if (this.groupingType === 'month') {
          return date.toLocaleDateString(locale, {month: 'short'});
        }
        return date.toLocaleDateString(locale, {month: 'short', day: 'numeric'});
      }),
      datasets
    };

    const scales: any = {
      x: {
        type: 'category',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          maxTicksLimit: 7,
        }
      }
    };

    this.selectedMetrics.forEach((metricType, index) => {
      const metric = this.metrics.find(m => m.value === metricType)!;
      scales[metricType] = {
        type: 'linear',
        display: true,
        position: index % 2 === 0 ? 'left' : 'right',
        grid: {
          color: `${metric.color}22`
        },
        title: {
          display: true,
          text: this.getMetricLabel(metric)
        },
        beginAtZero: true
      };
    });

    const t = (key: string, params?: object) => this.translateService.instant(key, params);
    const toItems = (activities: { name: string; date: Date }[]) =>
      activities.map(activity => ({name: activity.name, dateLabel: activity.date.toLocaleDateString(locale)}));

    const describe = (date: Date): ChartDetail | null => {
      if (this.groupingType === 'week') {
        const weekData = dataMap.get(this.getWeekNumber(date).toString()) as WeeklyData;
        if (!weekData) return null;
        return {
          title: `${t('chart.week')} ${weekData.weekNumber}`,
          subtitle: `${t('chart.from')} ${weekData.weekStart.toLocaleDateString(locale)} ${t('chart.to')} ${weekData.weekEnd.toLocaleDateString(locale)}`,
          listLabel: `${t('chart.activities_of_week')} (${weekData.activities.length})`,
          activities: toItems(weekData.activities)
        };
      }
      if (this.groupingType === 'month') {
        const monthData = dataMap.get(date.getMonth().toString()) as MonthlyData;
        if (!monthData) return null;
        return {
          title: monthData.monthLabel.charAt(0).toUpperCase() + monthData.monthLabel.slice(1),
          subtitle: `${t('chart.from')} ${monthData.monthStart.toLocaleDateString(locale)} ${t('chart.to')} ${monthData.monthEnd.toLocaleDateString(locale)}`,
          listLabel: `${t('chart.activities_of_month')} (${monthData.activities.length})`,
          activities: toItems(monthData.activities)
        };
      }
      const key = date.toLocaleDateString('sv-SE');
      if (!dataMap.get(key)) return null;
      const dayActivities = this.getFilteredActivities()
        .filter(activity => new Date(activity.start_date).toLocaleDateString('sv-SE') === key)
        .map(activity => ({name: activity.name, date: new Date(activity.start_date)}));
      return {
        title: date.toLocaleDateString(locale, {weekday: 'long', day: 'numeric', month: 'long'}),
        subtitle: '',
        listLabel: '',
        activities: toItems(dayActivities)
      };
    };

    // Info-bulle courte : le détail complet s'ouvre au clic (un mois chargé dépassait du graphique)
    const MAX_LISTED = 5;
    const tooltipTitle = (date: Date) => {
      const detail = describe(date);
      if (!detail) return '';
      const lines = [detail.title];
      if (detail.subtitle) lines.push(detail.subtitle);
      if (detail.listLabel) lines.push('', `${detail.listLabel}:`);
      lines.push(...detail.activities.slice(0, MAX_LISTED).map(a => detail.listLabel ? `- ${a.dateLabel}: ${a.name}` : a.name));
      if (detail.activities.length > MAX_LISTED) {
        lines.push(t('chart.more_activities', {count: detail.activities.length - MAX_LISTED}));
      }
      if (detail.listLabel) lines.push('', t('chart.click_for_details'));
      return lines.join('\n');
    };

    this.chart = new Chart(canvas, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, _elements, chart) => {
          const [point] = chart.getElementsAtEventForMode(event as unknown as Event, 'index', {intersect: false}, true);
          const date = point && dateLabels[point.index];
          const detail = date ? describe(date) : null;
          if (!detail?.activities.length) return;
          this.detail = detail;
          chart.tooltip?.setActiveElements([], {x: 0, y: 0});
          chart.update('none');
          this.cdr.detectChanges();
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            onClick: (e, legendItem) => this.handleLegendClick(e, legendItem)
          },
          tooltip: {
            enabled: !this.isTouch,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#000',
            bodyColor: '#666',
            borderColor: '#ddd',
            borderWidth: 1,
            callbacks: {
              title: (tooltipItems) => {
                const dataIndex = tooltipItems[0].dataIndex;
                if (!dateLabels[dataIndex]) return '';

                return tooltipTitle(dateLabels[dataIndex]);
              },
              label: (context) => {
                const value = context.raw as number;
                const metricType = context.dataset.yAxisID as string;
                if (metricType === 'duration') {
                  return `${context.dataset.label}: ${this.formatDuration(value)}`;
                }
                return `${context.dataset.label}: ${value.toFixed(1)}`;
              }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              modifierKey: 'ctrl',
            },
            zoom: {
              wheel: {
                enabled: true,
                modifierKey: 'ctrl',
              },
              pinch: {
                enabled: true
              },
              mode: 'x',
            },
            limits: {
              x: {min: 'original', max: 'original'},
            }
          }
        },
        scales
      }
    });
  }
}
