import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChallengesDetailComponent } from './challenges-detail.component';

describe('ChallengesDetailComponent', () => {
  let component: ChallengesDetailComponent;
  let fixture: ComponentFixture<ChallengesDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengesDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengesDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
