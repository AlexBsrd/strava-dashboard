import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChallengesCreateComponent } from './challenges-create.component';

describe('ChallengesCreateComponent', () => {
  let component: ChallengesCreateComponent;
  let fixture: ComponentFixture<ChallengesCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengesCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengesCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
