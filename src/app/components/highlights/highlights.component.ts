import {Component, DestroyRef, inject, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ActivityCacheService} from '../../services/activity-cache.service';
import {GoalProgress} from '../../models/goal';
import {IconComponent} from '../icon/icon.component';
import {
  EARTH_KM, EVEREST_M, latestRecapYear, nextDistanceStep, RecentRecord, recentRecords, Totals, totals, weekSummary
} from '../../utils/highlights';

/** Bloc d'accueil du tableau de bord : la semaine, les records récents et les paliers de l'année */
@Component({
  selector: 'app-highlights',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, IconComponent],
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.css']
})
export class HighlightsComponent implements OnInit {
  @Input() goals: GoalProgress[] = [];

  private cache = inject(ActivityCacheService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly year = new Date().getFullYear();
  /** Le bilan de l'année est mis en avant en décembre, et celui de l'année passée en janvier */
  readonly recapYear = latestRecapYear();
  readonly showRecapTeaser = [0, 11].includes(new Date().getMonth());

  week!: { current: Totals; previous: Totals };
  records: RecentRecord[] = [];
  yearTotals!: Totals;
  nextStep = 0;
  allTimeDistance: number | null = null;

  ngOnInit() {
    this.cache.activities$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(activities => {
        this.week = weekSummary(activities);
        this.yearTotals = totals(activities.filter(a => new Date(a.start_date).getFullYear() === this.year));
        this.nextStep = nextDistanceStep(this.yearTotals.distance);
        // Records et total « depuis le début » faussés tant que l'historique n'est pas complet
        const complete = this.cache.isHistoryComplete();
        this.records = complete ? recentRecords(activities, new Date(Date.now() - 7 * 24 * 3600 * 1000)) : [];
        this.allTimeDistance = complete ? totals(activities).distance : null;
      });
  }

  get weekDelta(): number {
    return this.week.current.distance - this.week.previous.distance;
  }

  /** Objectif en cours le plus proche d'être atteint */
  get closestGoal(): GoalProgress | null {
    return this.goals.filter(g => !g.isCompleted).sort((a, b) => b.percentage - a.percentage)[0] ?? null;
  }

  get everests(): number {
    return this.yearTotals.elevation / EVEREST_M;
  }

  get earthPercent(): number {
    return (this.allTimeDistance ?? 0) / EARTH_KM * 100;
  }

  get stepProgress(): number {
    return Math.min(100, this.yearTotals.distance / this.nextStep * 100);
  }

  num(value: number, digits = 0): string {
    return value.toLocaleString(this.translate.currentLang || 'fr', {maximumFractionDigits: digits});
  }

  duration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
  }

  recordValue(r: RecentRecord): string {
    return r.kind === 'distance' ? `${this.num(r.value, 1)} km` : `${this.num(r.value)} m`;
  }

  recordPrevious(r: RecentRecord): string {
    return r.kind === 'distance' ? `${this.num(r.previous, 1)} km` : `${this.num(r.previous)} m`;
  }
}
