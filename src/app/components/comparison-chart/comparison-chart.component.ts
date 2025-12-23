import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Activity } from '../../models/activity';
import { ComparisonPeriod } from '../../types/comparison';

Chart.register(...registerables, zoomPlugin);

type MetricType = 'distance' | 'speed' | 'elevation';

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparison-chart.component.html',
  styleUrls: ['./comparison-chart.component.css']
})
export class ComparisonChartComponent implements OnChanges {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() activities1: Activity[] = [];
  @Input() activities2: Activity[] = [];
  @Input() period1: ComparisonPeriod | null = null;
  @Input() period2: ComparisonPeriod | null = null;
  @Input() activityType: string = 'Run';
  @Input() groupColor?: string;

  selectedMetric: MetricType = 'distance';
  chart: Chart | null = null;

  // Détection du type d'appareil pour adapter les messages d'aide
  isMobile = this.detectMobileDevice();

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['activities1'] || changes['activities2']) && this.activities1.length && this.activities2.length) {
      setTimeout(() => this.createChart(), 0);
    }
  }

  selectMetric(metric: MetricType) {
    this.selectedMetric = metric;
    this.createChart();
  }

  private createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.chartCanvas?.nativeElement) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare data aligned by day-of-year
    const alignedData = this.prepareAlignedChartData(this.activities1, this.activities2, this.period1, this.period2);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: alignedData.labels,
        datasets: [
          {
            label: this.period1?.label || 'Période 1',
            data: alignedData.data1,
            borderColor: 'rgba(156, 163, 175, 0.8)',
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            spanGaps: true
          },
          {
            label: this.period2?.label || 'Période 2',
            data: alignedData.data2,
            borderColor: 'rgba(252, 76, 2, 0.8)',
            backgroundColor: 'rgba(252, 76, 2, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
              font: {
                size: 12,
                weight: 500
              },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: (context) => {
                // Show activity number
                return context[0].label;
              },
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const value = context.parsed.y;
                if (value === null) {
                  label += 'Pas de données';
                } else {
                  label += this.formatValue(value);
                }
                return label;
              },
              afterLabel: (context) => {
                // Show actual date for the activity
                const dataIndex = context.dataIndex;
                const datasetIndex = context.datasetIndex;

                const activities = datasetIndex === 0 ? this.activities1 : this.activities2;
                if (activities[dataIndex]) {
                  const date = new Date(activities[dataIndex].start_date);
                  return `Date: ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
                }
                return '';
              }
            }
          },
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
                modifierKey: 'ctrl'
              },
              pinch: {
                enabled: true
              },
              mode: 'x'
            },
            pan: {
              enabled: true,
              mode: 'x'
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              autoSkipPadding: 15,
              maxTicksLimit: 20
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
              font: {
                size: 11
              },
              callback: (value) => this.formatValue(Number(value))
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private prepareAlignedChartData(
    activities1: Activity[],
    activities2: Activity[],
    period1: ComparisonPeriod | null,
    period2: ComparisonPeriod | null
  ): { labels: string[], data1: (number | null)[], data2: (number | null)[] } {
    if (!period1 || !period2) {
      return { labels: [], data1: [], data2: [] };
    }

    // Sort activities by date
    const sorted1 = [...activities1].sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    const sorted2 = [...activities2].sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    // Calculate cumulative values per activity
    const cumulativeData1 = this.calculateCumulativeValues(sorted1);
    const cumulativeData2 = this.calculateCumulativeValues(sorted2);

    // Create a map of day-of-year -> cumulative value for each period
    const map1 = new Map<number, { date: Date, value: number }>();
    const map2 = new Map<number, { date: Date, value: number }>();

    sorted1.forEach((activity, index) => {
      const date = new Date(activity.start_date);
      const dayOfYear = this.getDayOfYear(date);
      map1.set(dayOfYear, { date, value: cumulativeData1[index] });
    });

    sorted2.forEach((activity, index) => {
      const date = new Date(activity.start_date);
      const dayOfYear = this.getDayOfYear(date);
      map2.set(dayOfYear, { date, value: cumulativeData2[index] });
    });

    // Get all unique days from both periods
    const allDays = new Set([...map1.keys(), ...map2.keys()]);
    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Create aligned data arrays
    const labels: string[] = [];
    const data1: (number | null)[] = [];
    const data2: (number | null)[] = [];

    let lastValue1 = 0;
    let lastValue2 = 0;

    sortedDays.forEach(day => {
      // Use any date to create the label (we only care about day/month, not year)
      const entry1 = map1.get(day);
      const entry2 = map2.get(day);

      const refDate = entry1?.date || entry2?.date || new Date();
      const label = refDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
      labels.push(label);

      // Add values or carry forward last value for cumulative charts
      if (entry1) {
        lastValue1 = entry1.value;
        data1.push(lastValue1);
      } else {
        data1.push(lastValue1); // Carry forward (flat line until next activity)
      }

      if (entry2) {
        lastValue2 = entry2.value;
        data2.push(lastValue2);
      } else {
        data2.push(lastValue2); // Carry forward (flat line until next activity)
      }
    });

    return { labels, data1, data2 };
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  private calculateCumulativeValues(activities: Activity[]): number[] {
    const values: number[] = [];
    let cumulative = 0;

    activities.forEach(activity => {
      switch (this.selectedMetric) {
        case 'distance':
          cumulative += activity.distance;
          break;
        case 'speed':
          // For speed, we calculate running weighted average
          const totalDist = activities.slice(0, activities.indexOf(activity) + 1)
            .reduce((sum, a) => sum + a.distance, 0);
          const weightedSpeed = activities.slice(0, activities.indexOf(activity) + 1)
            .reduce((sum, a) => sum + (a.average_speed * a.distance), 0);
          cumulative = totalDist > 0 ? weightedSpeed / totalDist : 0;
          break;
        case 'elevation':
          cumulative += activity.total_elevation_gain;
          break;
      }
      values.push(cumulative);
    });

    return values;
  }

  private prepareChartData(activities: Activity[], period: ComparisonPeriod | null): { labels: string[], values: number[] } {
    const sorted = [...activities].sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    if (!period) {
      return { labels: [], values: [] };
    }

    // Show activity dates in DD/MM format
    const labels = sorted.map(a => {
      const activityDate = new Date(a.start_date);
      return activityDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    });

    let values: number[] = [];

    switch (this.selectedMetric) {
      case 'distance':
        // Cumulative distance
        let cumulativeDistance = 0;
        values = sorted.map(a => {
          cumulativeDistance += a.distance;
          return cumulativeDistance;
        });
        break;

      case 'speed':
        // Running average speed (weighted by distance)
        let totalDistance = 0;
        let weightedSpeed = 0;
        values = sorted.map(a => {
          totalDistance += a.distance;
          weightedSpeed += a.average_speed * a.distance;
          return totalDistance > 0 ? weightedSpeed / totalDistance : 0;
        });
        break;

      case 'elevation':
        // Cumulative elevation
        let cumulativeElevation = 0;
        values = sorted.map(a => {
          cumulativeElevation += a.total_elevation_gain;
          return cumulativeElevation;
        });
        break;

      default:
        values = sorted.map(() => 0);
    }

    return { labels, values };
  }

  private formatValue(value: number): string {
    switch (this.selectedMetric) {
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'speed':
        return `${value.toFixed(1)} km/h`;
      case 'elevation':
        return `${value.toFixed(0)} m`;
      default:
        return value.toString();
    }
  }

  resetZoom() {
    if (this.chart) {
      this.chart.resetZoom();
    }
  }

  private detectMobileDevice(): boolean {
    // Détection basée sur le User Agent
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Détection basée sur la largeur d'écran
    const mobileScreenSize = window.innerWidth <= 768;

    // Retourne true si l'une des deux conditions est vraie
    return mobileUserAgent || mobileScreenSize;
  }
}
