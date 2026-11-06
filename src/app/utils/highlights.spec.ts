import {Activity} from '../models/activity';
import {longestStreak, nextDistanceStep, recentRecords, weekSummary, yearRecap} from './highlights';

const act = (date: string, distance: number, sport = 'Run', elevation = 0): Activity => ({
  id: Math.random(), name: `${sport} ${date}`, distance, moving_time: 3600, elapsed_time: 3600,
  total_elevation_gain: elevation, start_date: new Date(date), average_speed: 10, type: sport, sport_type: sport
});

describe('highlights', () => {
  it('compares the current week with last week at the same point', () => {
    const now = new Date('2026-11-04T18:00'); // mercredi
    const summary = weekSummary([
      act('2026-11-02T08:00', 10),  // lundi : semaine en cours
      act('2026-11-04T07:00', 5),
      act('2026-10-27T08:00', 8),   // mardi dernier : avant le même moment
      act('2026-10-30T08:00', 20),  // vendredi dernier : après, exclu
      act('2026-11-01T08:00', 3)    // dimanche : semaine dernière, exclu
    ], now);
    expect(summary.current.count).toBe(2);
    expect(summary.current.distance).toBe(15);
    expect(summary.previous.distance).toBe(8);
  });

  it('flags recent records per sport, never the first activity', () => {
    const records = recentRecords([
      act('2026-01-01T08:00', 10),
      act('2026-11-03T08:00', 12),            // record course
      act('2026-11-04T08:00', 50, 'Ride', 300) // premier vélo : pas un record
    ], new Date('2026-10-30'));
    expect(records.length).toBe(1);
    expect(records[0].kind).toBe('distance');
    expect(records[0].previous).toBe(10);
  });

  it('finds the next distance step', () => {
    expect(nextDistanceStep(0)).toBe(100);
    expect(nextDistanceStep(1000)).toBe(1500);
    expect(nextDistanceStep(21000)).toBe(25000);
  });

  it('counts consecutive days across months', () => {
    expect(longestStreak([
      act('2026-01-30T08:00', 1), act('2026-01-31T08:00', 1), act('2026-01-31T18:00', 1),
      act('2026-02-01T08:00', 1), act('2026-02-05T08:00', 1)
    ])).toBe(3);
  });

  it('builds a year recap', () => {
    const recap = yearRecap([
      act('2026-03-01T08:00', 10), act('2026-03-02T08:00', 30, 'Ride', 500),
      act('2026-05-01T08:00', 5), act('2025-12-31T08:00', 100)
    ], 2026);
    expect(recap.count).toBe(3);
    expect(recap.bestMonth).toEqual({month: 2, distance: 40});
    expect(recap.sports[0].type).toBe('Run');
    expect(recap.longest?.distance).toBe(30);
    expect(recap.biggestClimb?.total_elevation_gain).toBe(500);
    expect(recap.longestStreak).toBe(2);
  });
});
