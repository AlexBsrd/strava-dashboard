import {Component, DestroyRef, HostListener, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ActivityCacheService} from '../../services/activity-cache.service';
import {StravaService} from '../../services/strava.service';
import {Activity} from '../../models/activity';
import {SpinnerComponent} from '../spinner/spinner.component';
import {EARTH_KM, EVEREST_M, yearRecap, YearRecap} from '../../utils/highlights';

type SlideId = 'intro' | 'distance' | 'elevation' | 'sports' | 'month' | 'longest' | 'summary';

const SLIDE_COLORS: Record<SlideId, string> = {
  intro: '#fc5200',
  distance: '#2563eb',
  elevation: '#0f9d6e',
  sports: '#9333ea',
  month: '#e11d48',
  longest: '#ea580c',
  summary: '#fc5200'
};

/** Bilan de l'année en diapos, façon « stories » */
@Component({
  selector: 'app-recap',
  standalone: true,
  imports: [CommonModule, TranslateModule, SpinnerComponent],
  templateUrl: './recap.component.html',
  styleUrls: ['./recap.component.css']
})
export class RecapComponent implements OnInit {
  private cache = inject(ActivityCacheService);
  private strava = inject(StravaService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private activities: Activity[] = [];
  years: number[] = [];
  year = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
  recap: YearRecap | null = null;
  slides: SlideId[] = [];
  index = 0;
  loading = true;

  ngOnInit() {
    this.cache.activities$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(activities => {
        this.activities = activities;
        this.years = [...new Set(activities.map(a => new Date(a.start_date).getFullYear()))].sort((a, b) => b - a);
        if (activities.length) {
          this.loading = false;
          this.build();
        }
      });

    // Arrivée directe sur la page sans cache local
    if (!this.cache.getAllActivities().length) {
      this.strava.loadAllRecentActivities().subscribe({
        next: () => this.loading = false,
        error: () => this.loading = false
      });
    }
  }

  get slide(): SlideId {
    return this.slides[this.index];
  }

  get color(): string {
    return SLIDE_COLORS[this.slide] ?? SLIDE_COLORS.intro;
  }

  selectYear(year: number) {
    this.year = year;
    this.index = 0;
    this.build();
  }

  private build() {
    const r = yearRecap(this.activities, this.year);
    this.recap = r;
    this.slides = r.count === 0 ? ['intro'] : ([
      'intro',
      r.distance > 0 && 'distance',
      r.elevation > 0 && 'elevation',
      'sports',
      r.bestMonth && 'month',
      r.longest && 'longest',
      'summary'
    ].filter(Boolean) as SlideId[]);
    this.index = Math.min(this.index, this.slides.length - 1);
  }

  /** Toucher le tiers gauche revient en arrière, le reste avance */
  onTap(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const x = event.clientX - target.getBoundingClientRect().left;
    x < target.clientWidth / 3 ? this.prev() : this.next();
  }

  @HostListener('document:keydown.arrowright') next() {
    this.index = Math.min(this.index + 1, this.slides.length - 1);
  }

  @HostListener('document:keydown.arrowleft') prev() {
    this.index = Math.max(this.index - 1, 0);
  }

  @HostListener('document:keydown.escape') close() {
    this.router.navigate(['/']);
  }

  restart() {
    this.index = 0;
  }

  get earthPercent(): number {
    return (this.recap?.distance ?? 0) / EARTH_KM * 100;
  }

  get everests(): number {
    return (this.recap?.elevation ?? 0) / EVEREST_M;
  }

  get topSportShare(): number {
    return this.recap?.sports[0]?.count ?? 1;
  }

  private get locale(): string {
    return this.translate.currentLang || 'fr';
  }

  num(value: number, digits = 0): string {
    return value.toLocaleString(this.locale, {maximumFractionDigits: digits});
  }

  hours(seconds: number): string {
    return this.num(Math.round(seconds / 3600));
  }

  monthName(month: number): string {
    const name = new Date(2000, month, 1).toLocaleString(this.locale, {month: 'long'});
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  date(activity: Activity): string {
    return new Date(activity.start_date).toLocaleDateString(this.locale, {day: 'numeric', month: 'long'});
  }

  /** Carte 1080×1920 partagée via le menu natif du téléphone, ou téléchargée */
  async share(event: Event) {
    event.stopPropagation();
    const r = this.recap;
    if (!r) return;
    const t = (key: string, params?: object) => this.translate.instant(`recap.${key}`, params);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#fc5200');
    bg.addColorStop(0.55, '#7a2900');
    bg.addColorStop(1, '#111827');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    const font = (size: number, weight = 700) => `${weight} ${size}px 'Barlow Semi Condensed', Inter, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = font(56, 600);
    ctx.globalAlpha = 0.8;
    ctx.fillText(t('share.kicker').toUpperCase(), 96, 220);
    ctx.globalAlpha = 1;
    ctx.font = font(260, 800);
    ctx.fillText(String(r.year), 84, 470);

    const rows: [string, string][] = [
      [this.num(r.count), t('summary.activities')],
      [this.num(r.distance), t('summary.distance')],
      [this.hours(r.movingTime), t('summary.time')],
      [this.num(r.elevation), t('summary.elevation')],
      [this.num(r.activeDays), t('summary.active_days')],
      [this.num(r.longestStreak), t('summary.streak')]
    ];
    rows.forEach(([value, label], i) => {
      const y = 720 + i * 180;
      ctx.font = font(110, 800);
      ctx.fillText(value, 96, y);
      ctx.font = font(44, 500);
      ctx.globalAlpha = 0.75;
      ctx.fillText(label, 96, y + 56);
      ctx.globalAlpha = 1;
    });

    if (r.sports[0]) {
      ctx.font = font(48, 600);
      ctx.fillText(`${t('share.favorite')} ${this.translate.instant(r.sports[0].labelKey)}`, 96, 1800);
    }

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const file = new File([blob], `bilan-${r.year}.png`, {type: 'image/png'});
    if (navigator.canShare?.({files: [file]})) {
      await navigator.share({files: [file]}).catch(() => undefined); // annulation par l'utilisateur
      return;
    }
    const link = document.createElement('a');
    link.download = file.name;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}
