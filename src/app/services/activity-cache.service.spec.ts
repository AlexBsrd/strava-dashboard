import {ActivityCacheService} from './activity-cache.service';
import {Activity} from '../models/activity';

const activity = (id: number, date: string): Activity => ({
  id, name: '', distance: 1, moving_time: 1, elapsed_time: 1, total_elevation_gain: 0,
  start_date: new Date(date), average_speed: 1, type: 'Run', sport_type: 'Run'
});

describe('ActivityCacheService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('strava_athlete_id', '42');
  });

  afterEach(() => localStorage.clear());

  it('merges incremental syncs, replaces on full load and persists across reloads', () => {
    const cache = new ActivityCacheService();
    cache.setActivities([activity(1, '2026-01-01'), activity(2, '2026-03-01')], 'current_year');
    expect(cache.hasRecentFullLoad()).toBeFalse();

    // Synchro incrémentale : fusion avec dédoublonnage par id
    cache.setActivities([activity(2, '2026-03-01'), activity(3, '2026-04-01')], 'week');
    expect(cache.getAllActivities().map(a => a.id).sort()).toEqual([1, 2, 3]);
    expect(cache.getNewestActivityDate()).toEqual(new Date('2026-04-01'));

    // Chargement complet depuis février : l'activité 2, supprimée sur Strava, disparaît ; la 1 (avant) reste
    cache.setActivities([activity(3, '2026-04-01')], 'current_year', new Date('2026-02-01'));
    expect(cache.getAllActivities().map(a => a.id).sort()).toEqual([1, 3]);
    expect(cache.hasRecentFullLoad()).toBeTrue();

    // Rechargement de la page : le cache localStorage n'expire plus
    const reloaded = new ActivityCacheService();
    expect(reloaded.getAllActivities().length).toBe(2);
    expect(reloaded.hasRecentFullLoad()).toBeTrue();
  });
});
