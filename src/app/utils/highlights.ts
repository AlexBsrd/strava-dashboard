import {Activity} from '../models/activity';
import {getSportMetadata, SportCategory} from '../types/sport-config';

/** Altitude officielle de l'Everest (relevé sino-népalais de 2020) */
export const EVEREST_M = 8849;
/** Circonférence de la Terre à l'équateur */
export const EARTH_KM = 40075;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface Totals {
  count: number;
  distance: number;   // km
  movingTime: number; // s
  elevation: number;  // m
}

export function totals(activities: Activity[]): Totals {
  return activities.reduce((t, a) => ({
    count: t.count + 1,
    distance: t.distance + (a.distance || 0),
    movingTime: t.movingTime + (a.moving_time || 0),
    elevation: t.elevation + (a.total_elevation_gain || 0)
  }), {count: 0, distance: 0, movingTime: 0, elevation: 0});
}

/** Jour local au format YYYY-MM-DD */
export const dayKey = (date: Date | string) => new Date(date).toLocaleDateString('sv-SE');

const between = (activities: Activity[], from: Date, to: Date) =>
  activities.filter(a => {
    const t = new Date(a.start_date);
    return t >= from && t <= to;
  });

/** Lundi 00:00 de la semaine en cours */
export function startOfWeek(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return d;
}

/** Semaine en cours (depuis lundi) et semaine dernière arrêtée au même moment, pour une comparaison juste */
export function weekSummary(activities: Activity[], now = new Date()) {
  const start = startOfWeek(now);
  return {
    current: totals(between(activities, start, now)),
    previous: totals(between(activities, new Date(start.getTime() - 7 * DAY_MS), new Date(now.getTime() - 7 * DAY_MS)))
  };
}

export type RecordKind = 'distance' | 'elevation';
const RECORD_CATEGORIES: SportCategory[] = ['running', 'cycling', 'walking'];

export interface RecentRecord {
  activity: Activity;
  category: SportCategory;
  kind: RecordKind;
  value: number;
  previous: number;
}

/**
 * Activités depuis `since` qui battent toutes les précédentes de leur catégorie (distance ou dénivelé).
 * La toute première activité d'une catégorie n'est pas un record. Un seul record par catégorie et type : le dernier.
 */
export function recentRecords(activities: Activity[], since: Date): RecentRecord[] {
  const sorted = [...activities].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const best = new Map<string, number>();
  const records = new Map<string, RecentRecord>();

  for (const activity of sorted) {
    const category = getSportMetadata(activity.sport_type || activity.type).category;
    if (!RECORD_CATEGORIES.includes(category)) continue;

    for (const [kind, value] of [['distance', activity.distance], ['elevation', activity.total_elevation_gain]] as [RecordKind, number][]) {
      const key = `${category}-${kind}`;
      const previous = best.get(key);
      if (previous !== undefined && value > previous && new Date(activity.start_date) >= since) {
        records.set(key, {activity, category, kind, value, previous});
      }
      if (previous === undefined || value > previous) best.set(key, value || 0);
    }
  }
  return [...records.values()];
}

const DISTANCE_STEPS = [100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000];

/** Prochain palier de distance (km) au-dessus de `distance` */
export function nextDistanceStep(distance: number): number {
  return DISTANCE_STEPS.find(s => s > distance) ?? Math.ceil((distance + 1) / 5000) * 5000;
}

/** Plus longue suite de jours consécutifs avec au moins une activité */
export function longestStreak(activities: Activity[]): number {
  const days = [...new Set(activities.map(a => dayKey(a.start_date)))].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    const expected = previous ? new Date(`${previous}T12:00`) : null;
    expected?.setDate(expected.getDate() + 1);
    run = expected && dayKey(expected) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

export interface YearRecap extends Totals {
  year: number;
  activeDays: number;
  longestStreak: number;
  bestMonth: { month: number; distance: number } | null;
  sports: { type: string; labelKey: string; count: number; distance: number }[];
  longest: Activity | null;
  biggestClimb: Activity | null;
}

export function yearRecap(activities: Activity[], year: number): YearRecap {
  const list = activities.filter(a => new Date(a.start_date).getFullYear() === year);

  const months = new Array(12).fill(0);
  list.forEach(a => months[new Date(a.start_date).getMonth()] += a.distance || 0);
  const bestMonthIndex = months.indexOf(Math.max(...months));

  const sports = new Map<string, { type: string; labelKey: string; count: number; distance: number }>();
  for (const a of list) {
    const type = a.sport_type || a.type;
    const entry = sports.get(type) ?? {type, labelKey: getSportMetadata(type).labelKey, count: 0, distance: 0};
    entry.count++;
    entry.distance += a.distance || 0;
    sports.set(type, entry);
  }

  const max = (key: 'distance' | 'total_elevation_gain') =>
    list.reduce<Activity | null>((best, a) => (a[key] || 0) > (best?.[key] || 0) ? a : best, null);

  return {
    year,
    ...totals(list),
    activeDays: new Set(list.map(a => dayKey(a.start_date))).size,
    longestStreak: longestStreak(list),
    bestMonth: months[bestMonthIndex] > 0 ? {month: bestMonthIndex, distance: months[bestMonthIndex]} : null,
    sports: [...sports.values()].sort((a, b) => b.count - a.count),
    longest: max('distance'),
    biggestClimb: max('total_elevation_gain')
  };
}
