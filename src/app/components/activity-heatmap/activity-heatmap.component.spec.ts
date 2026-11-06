import {TestBed} from '@angular/core/testing';
import {ActivityHeatmapComponent} from './activity-heatmap.component';
import {testProviders} from '../../testing/test-providers';
import {Activity} from '../../models/activity';

const activityAt = (date: Date): Activity => ({
  id: date.getTime(), name: '', distance: 5, moving_time: 1800, elapsed_time: 1800,
  total_elevation_gain: 0, start_date: date, average_speed: 10, type: 'Run', sport_type: 'Run'
});

describe('ActivityHeatmapComponent', () => {
  it('compte les activités par jour local et colore selon leur nombre', () => {
    TestBed.configureTestingModule({imports: [ActivityHeatmapComponent], providers: testProviders});
    const fixture = TestBed.createComponent(ActivityHeatmapComponent);
    const component = fixture.componentInstance;

    // Deux sorties aujourd'hui (dont une à 23h30, qui ne doit pas glisser au lendemain), une hier
    const today = new Date();
    const lateEvening = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 30);
    const morning = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0);
    const yesterday = new Date(morning);
    yesterday.setDate(yesterday.getDate() - 1);
    component.activities = [activityAt(lateEvening), activityAt(morning), activityAt(yesterday)];
    component.ngOnChanges();

    const days = component.weeks.flat();
    const todayIndex = days.findIndex(day => day === null) === -1 ? days.length - 1 : days.findIndex(day => day === null) - 1;
    expect(days[todayIndex]?.count).toBe(2);
    expect(days[todayIndex]?.intensity).toBe('intensity-2');
    expect(days[todayIndex - 1]?.count).toBe(1);
    // Un an de semaines complètes, chaque colonne fait 7 cases
    expect(component.weeks.length).toBeGreaterThanOrEqual(53);
    expect(component.weeks.every(week => week.length === 7)).toBeTrue();
  });
});
