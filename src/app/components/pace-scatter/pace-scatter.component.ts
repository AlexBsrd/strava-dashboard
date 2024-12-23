import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Activity} from '../../models/activity';
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ScatterController,
  Title,
  Tooltip
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(
  LinearScale,
  CategoryScale,
  ScatterController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

interface ScatterPoint {
  x: number;
  y: number;
  date: Date;
  name: string;
}

@Component({
  selector: 'app-pace-scatter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pace-scatter.component.html',
  styleUrls: ['./pace-scatter.component.css']
})
export class PaceScatterComponent implements OnChanges {
  @Input() activities: Activity[] = [];

  selectedActivityType = 'Run';
  chart: Chart | null = null;

  activityTypes: string[] = ['Run', 'Ride', 'Walk/Hike'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activities'] && this.activities) {
      this.updateChart();
    }
  }

  onActivityTypeChange(value: string) {
    this.selectedActivityType = value;
    this.updateChart();
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

  private roundDistance(distance: number): number {
    return Math.round(distance * 10) / 10;
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

  private convertSpeedToPace(speedKmh: number): number {
    return 60 / speedKmh;
  }

  private formatPace(minutesPerKm: number): string {
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  }

  private calculateTrendLine(points: ScatterPoint[]): { slope: number; intercept: number } {
    const n = points.length;
    if (n < 2) return {slope: 0, intercept: 0};

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {slope, intercept};
  }

  private generateTrendLineData(points: ScatterPoint[]): ScatterPoint[] {
    if (points.length < 2) return [];

    const {slope, intercept} = this.calculateTrendLine(points);
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));

    return [
      {x: minX, y: slope * minX + intercept, date: new Date(), name: 'Trend'},
      {x: maxX, y: slope * maxX + intercept, date: new Date(), name: 'Trend'}
    ];
  }

  private updateChart() {
    const canvas = document.getElementById('paceScatterChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const filteredActivities = this.getFilteredActivities();
    const scatterData: ScatterPoint[] = filteredActivities.map(activity => ({
      x: this.roundDistance(activity.distance),
      y: this.selectedActivityType === 'Ride' ? activity.average_speed : this.convertSpeedToPace(activity.average_speed),
      date: new Date(activity.start_date),
      name: activity.name
    }));

    const trendLineData = this.generateTrendLineData(scatterData);
    const yAxisLabel = this.selectedActivityType === 'Ride' ? 'Vitesse (km/h)' : 'Allure (min/km)';

    this.chart = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this.selectedActivityType,
            data: scatterData,
            backgroundColor: 'rgba(33, 150, 243, 0.6)',
            borderColor: 'rgba(33, 150, 243, 1)',
            borderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Tendance',
            data: trendLineData,
            type: 'line',
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Distance (km)',
            },
            min: 0,
          },
          y: {
            title: {
              display: true,
              text: yAxisLabel,
            },
            reverse: this.selectedActivityType !== 'Ride',
            ticks: {
              stepSize: this.selectedActivityType === 'Ride' ? undefined : 1,
              callback: (value: any) => {
                if (this.selectedActivityType === 'Ride') {
                  return `${value} km/h`;
                } else {
                  return this.formatPace(Number(value));
                }
              }
            }
          }
        },
        plugins: {
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context: any) => {
                // Ne pas afficher de tooltip pour la ligne de tendance
                if (context.datasetIndex === 1) return '';

                const point = scatterData[context.dataIndex];
                let label = `${point.name}\n`;
                label += `Distance: ${point.x.toFixed(1)} km\n`;

                if (this.selectedActivityType === 'Ride') {
                  label += `Vitesse: ${point.y.toFixed(1)} km/h`;
                } else {
                  label += `Allure: ${this.formatPace(point.y)}/km`;
                }
                label += `\nDate: ${point.date.toLocaleDateString()}`;
                return label;
              }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy',
            }
          }
        }
      }
    });
  }
}
