import {Injectable} from '@angular/core';
import {AthleteProfile, AthleteSummary} from './athlete.service';
import {BehaviorSubject, Observable} from 'rxjs';

interface ProfileCache {
  profile: AthleteProfile | null;
  summary: AthleteSummary | null;
  lastUpdate: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileCacheService {
  private cache: ProfileCache = {
    profile: null,
    summary: null,
    lastUpdate: null
  };

  private profileSubject = new BehaviorSubject<ProfileCache>(this.cache);

  setProfileData(profile: AthleteProfile, summary: AthleteSummary) {
    this.cache = {
      profile,
      summary,
      lastUpdate: new Date()
    };
    this.profileSubject.next(this.cache);
  }

  setProfileOnly(profile: AthleteProfile) {
    this.cache = {
      ...this.cache,
      profile,
      lastUpdate: this.cache.lastUpdate || new Date()
    };
    this.profileSubject.next(this.cache);
  }

  getProfileData$(): Observable<ProfileCache> {
    return this.profileSubject.asObservable();
  }

  needsRefresh(): boolean {
    if (!this.cache.lastUpdate || !this.cache.profile || !this.cache.summary) {
      return true;
    }

    // Rafraîchir si la dernière mise à jour date de plus de 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.cache.lastUpdate < thirtyMinutesAgo;
  }

  clear() {
    this.cache = {
      profile: null,
      summary: null,
      lastUpdate: null
    };
    this.profileSubject.next(this.cache);
  }
}
