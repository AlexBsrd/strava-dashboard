import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type StreakMode = 'days' | 'weeks';

export interface DisplayPreferences {
  showStreaks: boolean;
  showGoals: boolean;
  streakMode: StreakMode;
}

const DEFAULT_PREFERENCES: DisplayPreferences = {
  showStreaks: true,
  showGoals: true,
  streakMode: 'weeks'
};

const STORAGE_KEY = 'dashboard_display_preferences';

@Injectable({
  providedIn: 'root'
})
export class DisplayPreferencesService {
  private preferences$ = new BehaviorSubject<DisplayPreferences>(this.loadPreferences());

  constructor() {}

  getPreferences(): Observable<DisplayPreferences> {
    return this.preferences$.asObservable();
  }

  getCurrentPreferences(): DisplayPreferences {
    return this.preferences$.value;
  }

  setShowStreaks(show: boolean): void {
    const current = this.preferences$.value;
    this.savePreferences({ ...current, showStreaks: show });
  }

  setShowGoals(show: boolean): void {
    const current = this.preferences$.value;
    this.savePreferences({ ...current, showGoals: show });
  }

  setStreakMode(mode: StreakMode): void {
    const current = this.preferences$.value;
    this.savePreferences({ ...current, streakMode: mode });
  }

  private loadPreferences(): DisplayPreferences {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  }

  private savePreferences(preferences: DisplayPreferences): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    this.preferences$.next(preferences);
  }
}
