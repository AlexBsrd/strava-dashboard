import {Component, Input, OnChanges, ViewChild, ElementRef, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Chart, registerables} from 'chart.js';

// Enregistrer tous les composants nécessaires de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-activity-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-chart.component.html',
  styleUrls: ['./activity-chart.component.css']
})
export class ActivityChartComponent implements OnChanges, OnDestroy {
  @Input() data: any[] = [];
  @Input() period: 'week' | 'month' | 'current_year' = 'week';
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  private chart: Chart | null = null;

  ngOnChanges() {
    // Attendre le prochain cycle pour s'assurer que le canvas est prêt
    setTimeout(() => {
      this.updateChart();
    }, 0);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private updateChart() {
    if (!this.chartCanvas?.nativeElement) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    console.log("data", this.data);

    const formatter = new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      day: 'numeric',
    });

    const config: any = {
      type: 'line',
      data: {
        labels: this.data.map(d => formatter.format(new Date(d.start_date))),
        datasets: [
          {
            label: 'Vitesse (km/h)',
            data: this.data.map(d => d.average_speed),
            borderColor: '#2196F3',
            backgroundColor: '#2196F3',
            tension: 0.4,
            yAxisID: 'y-speed'
          },
          {
            label: 'Dénivelé (m)',
            data: this.data.map(d => d.total_elevation_gain),
            borderColor: '#4CAF50',
            backgroundColor: '#4CAF50',
            tension: 0.4,
            yAxisID: 'y-elevation'
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
          tooltip: {
            enabled: true
          }
        },
        scales: {
          'y-speed': {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Vitesse (km/h)'
            },
            beginAtZero: true,
            grid: {
              color: '#2196F333'
            }
          },
          'y-elevation': {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Dénivelé (m)'
            },
            beginAtZero: true,
            grid: {
              color: '#4CAF5033'
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}
