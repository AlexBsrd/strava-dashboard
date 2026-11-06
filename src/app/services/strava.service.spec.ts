import {testProviders} from '../testing/test-providers';
import { TestBed } from '@angular/core/testing';

import { StravaService } from './strava.service';

describe('StravaService', () => {
  let service: StravaService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: testProviders});
    service = TestBed.inject(StravaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
