import {testProviders} from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModernActivityChartComponent } from './modern-activity-chart.component';
import { Activity } from '../../models/activity';

describe('ModernActivityChartComponent', () => {
  let component: ModernActivityChartComponent;
  let fixture: ComponentFixture<ModernActivityChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModernActivityChartComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModernActivityChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ouvre au clic un panneau avec toutes les activités du mois, puis le ferme', async () => {
    // 12 sorties en mars 2025 : l'info-bulle n'en liste que 5, le panneau doit toutes les montrer
    const activities: Activity[] = Array.from({length: 12}, (_, i) => ({
      id: i, name: `Sortie ${i + 1}`, distance: 10, moving_time: 3600, elapsed_time: 3600,
      total_elevation_gain: 50, start_date: new Date(2025, 2, i + 1, 18), average_speed: 10,
      type: 'Run', sport_type: 'Run'
    }));
    fixture.componentRef.setInput('activities', activities);
    fixture.componentRef.setInput('period', '2025');
    fixture.detectChanges();

    const chart = (component as any).chart;
    const canvas: HTMLCanvasElement = chart.canvas;
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new MouseEvent('click', {
      clientX: rect.left + chart.scales.x.getPixelForValue(2), // mars
      clientY: rect.top + chart.chartArea.top + 20,
      bubbles: true
    }));
    // Chart.js traite les événements à l'image suivante
    await new Promise(resolve => requestAnimationFrame(resolve));
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(component.detail?.activities.length).toBe(12);
    expect(element.querySelectorAll('.chart-detail li').length).toBe(12);

    (element.querySelector('.chart-detail-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelector('.chart-detail')).toBeNull();
  });
});
