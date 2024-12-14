import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceDashboardComponent } from './performance-dashboard.component';

describe('PerformanceDashboardComponent', () => {
  let component: PerformanceDashboardComponent;
  let fixture: ComponentFixture<PerformanceDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerformanceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
