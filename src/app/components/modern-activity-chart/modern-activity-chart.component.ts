import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
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
import {PeriodType} from "../../types/period";

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

@Component({
  selector: 'app-modern-activity-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modern-activity-chart.component.html',
  styleUrls: ['./modern-activity-chart.component.css']
})
export class ModernActivityChartComponent implements OnChanges {
  @Input() activities: Activity[] = [];
  @Input() period: PeriodType = 'week';

  selectedActivityType = 'Run';
  selectedMetrics: string[] = ['speed'];
  chart: Chart | null = null;
  isGroupedByWeek = false;

  activityTypes: string[] = ['Run', 'Ride', 'Walk/Hike'];
  metrics = [
    {value: 'speed', label: 'Vitesse (km/h)', color: '#2196F3'},
    {value: 'distance', label: 'Distance (km)', color: '#4CAF50'},
    {value: 'elevation', label: 'Dénivelé (m)', color: '#FF9800'},
    {value: 'duration', label: 'Durée (h)', color: '#9C27B0'}
  ];

  @ViewChild('chartContainer') chartContainer!: ElementRef;
  isFullscreen$;

  constructor(
    private fullscreenService: FullscreenService
  ) {
    this.isFullscreen$ = this.fullscreenService.isFullscreen$;
  }

  toggleFullscreen() {
    if (this.chartContainer) {
      this.fullscreenService.toggleFullscreen(this.chartContainer.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['activities'] || changes['period']) && this.activities) {
      this.updateChart();
    }
  }

  onActivityTypeChange(value: string) {
    this.selectedActivityType = value;
    this.updateChart();
  }

  onGroupingChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.isGroupedByWeek = checkbox.checked;
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
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getWeekRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1);
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
      existingData.totalDuration += activity.elapsed_time;
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

  private generateDateLabels(): [Date[], Activity[] | WeeklyData[]] {
    const today = new Date();
    const dates: Date[] = [];
    let data: Activity[] | WeeklyData[] = [];

    if (this.period === 'current_year' && this.isGroupedByWeek) {
      // Générer toutes les semaines de l'année
      const currentYear = today.getFullYear();
      const firstDayOfYear = new Date(currentYear, 0, 1);
      const lastDayOfYear = new Date(currentYear, 11, 31);

      // Ajuster au premier lundi de l'année
      const firstMonday = new Date(firstDayOfYear);
      firstMonday.setDate(firstMonday.getDate() + (8 - firstMonday.getDay()) % 7);

      // Créer un tableau de toutes les semaines
      const allWeeks: WeeklyData[] = [];
      let currentDate = new Date(firstMonday);

      while (currentDate <= lastDayOfYear) {
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
          weekData.totalDuration += activity.elapsed_time;
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
        case '2024':
          startDate = new Date(2024, 0, 1);
          endDate = new Date(2024, 11, 31);
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

  private createDataMap(dates: Date[], rawData: Activity[] | WeeklyData[]): Map<string, Activity | WeeklyData> {
    const dataMap = new Map<string, Activity | WeeklyData>();

    if (this.period === 'current_year' && this.isGroupedByWeek) {
      (rawData as WeeklyData[]).forEach(week => {
        dataMap.set(week.weekNumber.toString(), week);
      });
    } else {
      (rawData as Activity[]).forEach(activity => {
        const activityDate = new Date(activity.start_date);
        const dateKey = activityDate.toISOString().split('T')[0];
        dataMap.set(dateKey, activity);
      });
    }

    return dataMap;
  }

  private formatDuration(hours: number): string {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  }

  private getMetricValue(item: Activity | WeeklyData | undefined | null, metricType: string): number | null {
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
          return activityData.elapsed_time / 3600;
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

  private updateChart() {
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

        if (this.period === 'current_year' && this.isGroupedByWeek) {
          const weekNum = this.getWeekNumber(date);
          const item = dataMap.get(weekNum.toString());
          return this.getMetricValue(item, metricType);
        } else {
          const key = date.toISOString().split('T')[0];
          const item = dataMap.get(key);
          return this.getMetricValue(item, metricType);
        }
      });

      return {
        label: metric.label,
        data: data,
        borderColor: metric.color,
        backgroundColor: `${metric.color}33`,
        borderWidth: 2,
        tension: 0.1,
        fill: false,
        yAxisID: metricType,
        spanGaps: true,
        pointRadius: data.map(value => value === null ? 0 : 3),
      };
    });

    const data = {
      labels: dateLabels.map(date => {
        if (!date) return '';
        if (this.period === 'current_year' && this.isGroupedByWeek) {
          const weekNum = this.getWeekNumber(date);
          return `Sem. ${weekNum}`;
        }
        return date.toLocaleDateString('fr-FR', {month: 'short', day: 'numeric'});
      }),
      datasets
    };

    const scales: any = {
      x: {
        type: 'category',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
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
          text: metric.label
        },
        beginAtZero: true
      };
    });

    const generateTitle = (date: Date, dataMap: Map<string, Activity | WeeklyData>) => {
      if (this.period === 'current_year' && this.isGroupedByWeek) {
        const weekNum = this.getWeekNumber(date);
        const weekData = dataMap.get(weekNum.toString()) as WeeklyData;
        if (!weekData) return '';

        let title = `Semaine ${weekData.weekNumber}\n`;
        title += `Du ${weekData.weekStart.toLocaleDateString('fr-FR')} au ${weekData.weekEnd.toLocaleDateString('fr-FR')}\n\n`;
        title += 'Activités de la semaine:\n';
        weekData.activities.forEach(activity => {
          title += `- ${activity.date.toLocaleDateString('fr-FR')}: ${activity.name}\n`;
        });
        return title;
      } else {
        const key = date.toISOString().split('T')[0];
        const activity = dataMap.get(key) as Activity;
        if (!activity) return '';

        return `${date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })}\n${activity.name}`;
      }
    };

    this.chart = new Chart(canvas, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            onClick: (e, legendItem) => this.handleLegendClick(e, legendItem)
          },
          tooltip: {
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

                return generateTitle(dateLabels[dataIndex], dataMap);
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
