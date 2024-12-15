import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
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
import {Activity} from '../../models/activity';

Chart.register(
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-modern-activity-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modern-activity-chart.component.html',
  styleUrls: ['./modern-activity-chart.component.css']
})
export class ModernActivityChartComponent implements OnChanges {
  @Input() activities: Activity[] = [];
  @Input() period: 'week' | 'month' | 'current_year' = 'week';

  selectedActivityType = 'Run';
  selectedMetrics: string[] = ['speed'];
  chart: Chart | null = null;

  activityTypes: string[] = ['Run', 'Ride', 'Walk/Hike'];
  metrics = [
    {value: 'speed', label: 'Vitesse (km/h)', color: '#2196F3'},
    {value: 'distance', label: 'Distance (km)', color: '#4CAF50'},
    {value: 'elevation', label: 'Dénivelé (m)', color: '#FF9800'},
    {value: 'duration', label: 'Durée (h)', color: '#9C27B0'}
  ];

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['activities'] || changes['period']) && this.activities) {
      this.updateChart();
    }
  }

  onActivityTypeChange(value: string) {
    this.selectedActivityType = value;
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

  private getMetricValue(activity: Activity | null | undefined, metricType: string): number | null {
    if (!activity) return null;

    switch (metricType) {
      case 'speed':
        return activity.average_speed;
      case 'distance':
        return activity.distance;
      case 'elevation':
        return activity.total_elevation_gain;
      case 'duration':
        return activity.elapsed_time / 3600;
      default:
        return null;
    }
  }

  private generateDateLabels(): Date[] {
    const today = new Date();
    const dates: Date[] = [];
    let startDate: Date;

    switch (this.period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        for (let i = 0; i <= 6; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          dates.push(date);
        }
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 29);
        for (let i = 0; i <= 29; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          dates.push(date);
        }
        break;
      case 'current_year':
        startDate = new Date(today.getFullYear(), 0, 1);
        const endDate = new Date();
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
        break;
    }
    return dates;
  }

  private handleLegendClick(e: ChartEvent, legendItem: LegendItem) {
    const index = legendItem.datasetIndex;
    if (index !== undefined && index >= 0 && index < this.selectedMetrics.length) {
      this.toggleMetric(this.selectedMetrics[index]);
    }
  }

  private getFilteredActivities(): Activity[] {
    let filteredActivities = this.activities;

    switch (this.selectedActivityType) {
      case 'Run':
        filteredActivities = this.activities.filter(a => a.type === 'Run');
        break;
      case 'Ride':
        filteredActivities = this.activities.filter(a => a.type === 'Ride');
        break;
      case 'Walk/Hike':
        filteredActivities = this.activities.filter(a => a.type === 'Walk' || a.type === 'Hike');
        break;
    }

    return filteredActivities.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }

  private updateChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas) return;

    const dateLabels = this.generateDateLabels();
    const filteredActivities = this.getFilteredActivities();

    // Map activities to dates
    const activityMap = new Map<string, Activity>();
    filteredActivities.forEach(activity => {
      const activityDate = new Date(activity.start_date);
      activityMap.set(activityDate.toISOString().split('T')[0], activity);
    });

    const datasets = this.selectedMetrics.map(metricType => {
      const metric = this.metrics.find(m => m.value === metricType)!;
      const data = dateLabels.map(date => {
        const dateKey = date.toISOString().split('T')[0];
        const activity = activityMap.get(dateKey);
        return this.getMetricValue(activity, metricType);
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
        segment: {
          borderDash: (ctx: any) => {
            const range = ctx.p1.parsed.x - ctx.p0.parsed.x;
            return range > 1 ? [6, 6] : undefined;
          }
        }
      };
    });

    const data = {
      labels: dateLabels.map(date =>
        date.toLocaleDateString('fr-FR', {
          month: 'short',
          day: 'numeric'
        })
      ),
      datasets
    };

    const scales: any = {
      x: {
        type: 'category',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
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
          text: metric.label
        },
        beginAtZero: true
      };
    });

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
              beforeTitle: (tooltipItems) => {
                const dataIndex = tooltipItems[0].dataIndex;
                const dateKey = dateLabels[dataIndex].toISOString().split('T')[0];
                const activity = activityMap.get(dateKey);
                return activity ? activity.name : 'Pas d\'activité';
              },
              title: (tooltipItems) => {
                const dataIndex = tooltipItems[0].dataIndex;
                return dateLabels[dataIndex].toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                });
              }
            }
          }
        },
        scales
      }
    });
  }
}
