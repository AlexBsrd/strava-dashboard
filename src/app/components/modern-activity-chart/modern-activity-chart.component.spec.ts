import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModernActivityChartComponent } from './modern-activity-chart.component';

describe('ModernActivityChartComponent', () => {
  let component: ModernActivityChartComponent;
  let fixture: ComponentFixture<ModernActivityChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModernActivityChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModernActivityChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
