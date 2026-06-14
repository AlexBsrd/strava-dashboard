import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DisplayPreferences {
  showGoals: boolean;
}

const DEFAULT_PREFERENCES: DisplayPreferences = {
  showGoals: true
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

  setShowGoals(show: boolean): void {
    const current = this.preferences$.value;
    this.savePreferences({ ...current, showGoals: show });
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
