import {testProviders} from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsListComponent } from './stats-list.component';

describe('StatsListComponent', () => {
  let component: StatsListComponent;
  let fixture: ComponentFixture<StatsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsListComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsListComponent);
    component = fixture.componentInstance;
    component.title = 'Course';
    component.stats = {
      averageSpeed: 10, totalDistance: 20, averageDistance: 10, totalElevation: 100,
      averageElevation: 50, totalElapsedTime: 7400, totalMovingTime: 7200, numberOfActivities: 2
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
