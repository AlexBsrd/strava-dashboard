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

  activityTypes: string[] = ['Run', 'Ride', 'Walk', 'Hike'];
  metrics = [
    {value: 'speed', label: 'Vitesse (km/h)', color: '#2196F3'},
    {value: 'distance', label: 'Distance (km)', color: '#4CAF50'},
    {value: 'elevation', label: 'Dénivelé (m)', color: '#FF9800'},
    {value: 'duration', label: 'Durée (h)', color: '#9C27B0'}
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activities'] && this.activities) {
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

  private getMetricValue(activity: Activity, metricType: string): number {
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
        return 0;
    }
  }

  private handleLegendClick(e: ChartEvent, legendItem: LegendItem) {
    const index = legendItem.datasetIndex;
    if (index !== undefined && index >= 0 && index < this.selectedMetrics.length) {
      this.toggleMetric(this.selectedMetrics[index]);
    }
  }

  private getFilteredActivities(activities: Activity[]): Activity[] {
    let cutoffDate = new Date();

    switch (this.period) {
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case 'current_year':
        cutoffDate = new Date(cutoffDate.getFullYear(), 0, 1);
        break;
    }

    return activities
      .filter(a => a.type === this.selectedActivityType)
      .filter(a => new Date(a.start_date) >= cutoffDate)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }

  private updateChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas) return;

    const filteredActivities = this.getFilteredActivities(this.activities);

    const datasets = this.selectedMetrics.map(metricType => {
      const metric = this.metrics.find(m => m.value === metricType)!;
      return {
        label: metric.label,
        data: filteredActivities.map(a => this.getMetricValue(a, metricType)),
        borderColor: metric.color,
        backgroundColor: `${metric.color}33`,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: metricType
      };
    });

    const data = {
      labels: filteredActivities.map(a =>
        new Date(a.start_date).toLocaleDateString('fr-FR', {
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
                return filteredActivities[dataIndex].name;
              },
              title: (tooltipItems) => {
                return new Date(filteredActivities[tooltipItems[0].dataIndex].start_date)
                  .toLocaleDateString('fr-FR', {
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
