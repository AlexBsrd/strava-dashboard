import {Component, DestroyRef, HostListener, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ActivityCacheService} from '../../services/activity-cache.service';
import {StravaService} from '../../services/strava.service';
import {Activity} from '../../models/activity';
import {SpinnerComponent} from '../spinner/spinner.component';
import {EARTH_KM, EVEREST_M, latestRecapYear, yearRecap, YearRecap} from '../../utils/highlights';
import {getSportMetadata} from '../../types/sport-config';
import {IconComponent} from '../icon/icon.component';
import {
  display, drawBackdrop, drawBrand, drawStripes, loadFonts, loadIcon, PALETTES,
  roundRect, shareOrDownload, sportIcon, STORY_H, STORY_W, text
} from '../../utils/share-image';

type SlideId = 'intro' | 'distance' | 'elevation' | 'sports' | 'month' | 'longest' | 'summary';

// Orange Strava et vert « allure » du site, en alternance
const SLIDE_COLORS: Record<SlideId, string> = {
  intro: '#fc5200',
  distance: '#fc5200',
  elevation: '#26c48a',
  sports: '#ff6a1f',
  month: '#26c48a',
  longest: '#fc5200',
  summary: '#fc5200'
};

const SLIDE_ICONS: Partial<Record<SlideId, string>> = {
  distance: 'route',
  elevation: 'mountain',
  month: 'calendar-event',
  longest: 'trophy'
};
/** Bilan de l'année en diapos, façon « stories » */
@Component({
  selector: 'app-recap',
  standalone: true,
  imports: [CommonModule, TranslateModule, SpinnerComponent, IconComponent],
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
  year = latestRecapYear();
  /** Année en cours, tant que son bilan n'est pas ouvert (avant le 1er décembre) */
  readonly lockedYear = this.year < new Date().getFullYear() ? new Date().getFullYear() : null;
  recap: YearRecap | null = null;
  slides: SlideId[] = [];
  index = 0;
  loading = true;
  sharing = false;

  ngOnInit() {
    this.cache.activities$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(activities => {
        this.activities = activities;
        this.years = [...new Set(activities.map(a => new Date(a.start_date).getFullYear()))]
          .filter(y => y <= latestRecapYear())
          .sort((a, b) => b - a);
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

  /** Icône de la diapo ; le sport préféré pour l'intro, les sports et le résumé */
  get slideIcon(): string {
    return SLIDE_ICONS[this.slide] ?? this.iconFor(this.recap?.sports[0]?.type);
  }

  iconFor(type?: string): string {
    return type ? sportIcon(getSportMetadata(type).icon) : 'activity';
  }

  /** Un sommet par Everest gravi (10 max), le dernier estompé s'il est partiel */
  get everestPeaks(): number[] {
    const n = Math.min(this.everests, 10);
    const peaks = new Array(Math.floor(n)).fill(1);
    if (n % 1 > 0.05) peaks.push(0.35);
    return peaks;
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
    if (!r || this.sharing) return;
    this.sharing = true;
    try {
      await shareOrDownload(await this.drawShareCard(r), `bilan-${r.year}.png`);
    } finally {
      this.sharing = false;
    }
  }

  private async drawShareCard(r: YearRecap): Promise<HTMLCanvasElement> {
    const t = (key: string, params?: object) => this.translate.instant(`recap.${key}`, params);
    const p = PALETTES.dark;
    const top = r.sports[0];
    const topIcon = this.iconFor(top?.type);
    const rows: [string, string, string][] = [
      ['activity', this.num(r.count), t('summary.activities')],
      ['route', this.num(r.distance), t('summary.distance')],
      ['clock-hour-4', this.hours(r.movingTime), t('summary.time')],
      ['mountain', this.num(r.elevation), t('summary.elevation')],
      ['calendar-event', this.num(r.activeDays), t('summary.active_days')],
      ['flame', this.num(r.longestStreak), t('summary.streak')]
    ];
    const [ghost, badge, ...icons] = await Promise.all([
      loadIcon(topIcon, '#ffffff', 0.5),
      loadIcon(topIcon, '#ffffff'),
      ...rows.map(([icon]) => loadIcon(icon, p.accent)),
      loadFonts()
    ]) as HTMLImageElement[];

    const canvas = document.createElement('canvas');
    canvas.width = STORY_W;
    canvas.height = STORY_H;
    const ctx = canvas.getContext('2d')!;
    drawBackdrop(ctx, p);
    ctx.globalAlpha = 0.09;
    ctx.drawImage(ghost, 420, 160, 900, 900);
    ctx.globalAlpha = 1;
    drawBrand(ctx, p);

    ctx.fillStyle = p.accent;
    ctx.font = text(38, 600);
    ctx.letterSpacing = '8px';
    ctx.fillText(t('share.kicker').toUpperCase(), 96, 380);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = p.ink;
    ctx.font = display(380);
    ctx.fillText(String(r.year), 78, 700);
    drawStripes(ctx, 104, 748, p.bar, [140, 76, 36], 16);

    rows.forEach(([, value, label], i) => {
      const x = 96 + (i % 2) * 464;
      const y = 860 + Math.floor(i / 2) * 260;
      ctx.fillStyle = p.line;
      ctx.fillRect(x, y, 424, 2);
      ctx.drawImage(icons[i], x, y + 36, 50, 50);
      ctx.fillStyle = p.ink;
      ctx.font = display(118);
      ctx.fillText(value, x - 4, y + 196);
      ctx.fillStyle = p.muted;
      ctx.font = text(31);
      ctx.fillText(label, x, y + 240);
    });

    if (top) {
      const y = 1672;
      roundRect(ctx, 96, y, 888, 156, 32);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      roundRect(ctx, 126, y + 30, 96, 96, 24);
      ctx.fillStyle = p.bar;
      ctx.fill();
      ctx.drawImage(badge, 144, y + 48, 60, 60);
      ctx.fillStyle = p.muted;
      ctx.font = text(26, 600);
      ctx.letterSpacing = '5px';
      ctx.fillText(t('share.favorite').toUpperCase(), 254, y + 64);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = p.ink;
      ctx.font = display(64, 600, false);
      ctx.fillText(this.translate.instant(top.labelKey), 252, y + 124);
      ctx.textAlign = 'right';
      ctx.font = display(84);
      ctx.fillText(this.num(top.count), 950, y + 104);
      ctx.fillStyle = p.muted;
      ctx.font = text(26);
      ctx.fillText(t('summary.activities'), 950, y + 136);
      ctx.textAlign = 'left';
    }
    return canvas;
  }
}
