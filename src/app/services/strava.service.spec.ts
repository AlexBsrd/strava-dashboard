import { TestBed } from '@angular/core/testing';

import { StravaService } from './strava.service';

describe('StravaService', () => {
  let service: StravaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StravaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
