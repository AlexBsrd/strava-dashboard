import { TestBed } from '@angular/core/testing';

import { StatsService } from './stats.service';
import { Activity } from '../models/activity';

const activity = (distance: number, movingTime: number): Activity => ({
  id: Math.random(), name: '', distance, moving_time: movingTime, elapsed_time: movingTime,
  total_elevation_gain: 0, start_date: new Date(), average_speed: distance / (movingTime / 3600),
  type: 'Run', sport_type: 'Run'
});

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('pondère la vitesse moyenne par le temps : distance totale / temps en mouvement', () => {
    // 2 km en 10 min (12 km/h) + 40 km en 4h (10 km/h) : 42 km en 4h10 ≈ 10,1 km/h, pas 11
    const stats = service.calculateStats([activity(2, 600), activity(40, 14400)]);
    expect(stats.averageSpeed).toBe(10.1);
  });

  it('ignore les activités sans distance pour la vitesse', () => {
    const stats = service.calculateStats([activity(10, 3600), activity(0, 3600)]);
    expect(stats.averageSpeed).toBe(10);
  });
});
