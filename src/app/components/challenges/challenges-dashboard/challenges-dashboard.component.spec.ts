import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChallengesDashboardComponent } from './challenges-dashboard.component';

describe('ChallengesDashboardComponent', () => {
  let component: ChallengesDashboardComponent;
  let fixture: ComponentFixture<ChallengesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengesDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
