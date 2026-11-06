import {AfterViewInit, Component, DestroyRef, ElementRef, inject, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Activity} from '../../models/activity';

interface HeatmapDay {
  count: number;
  title: string;
  intensity: string;
}

/** Calendrier des 12 derniers mois : une colonne par semaine (lundi en haut), une case par jour */
@Component({
  selector: 'app-activity-heatmap',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './activity-heatmap.component.html',
  styleUrl: './activity-heatmap.component.css'
})
export class ActivityHeatmapComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() activities: Activity[] = [];
  @ViewChild('scroller') private scroller?: ElementRef<HTMLElement>;

  weeks: (HeatmapDay | null)[][] = [];
  monthLabels: { label: string; weekIndex: number }[] = [];
  weekdays: string[] = [];

  private translateService = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.build());
  }

  ngAfterViewInit(): void {
    // Sur mobile, afficher d'abord les semaines les plus récentes
    const el = this.scroller?.nativeElement;
    if (el) el.scrollLeft = el.scrollWidth;
  }

  ngOnChanges(): void {
    this.build();
  }

  private build(): void {
    const locale = this.translateService.currentLang === 'en' ? 'en-US' : 'fr-FR';
    // Jour en heure locale (AAAA-MM-JJ) : toISOString décalerait les sorties nocturnes
    const dayKey = (date: Date) => date.toLocaleDateString('sv-SE');
    const counts = new Map<string, number>();
    for (const activity of this.activities) {
      const key = dayKey(new Date(activity.start_date));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - (start.getDay() + 6) % 7); // lundi de la première semaine

    const noActivity = this.translateService.instant('heatmap.no_activity');
    this.weeks = [];
    this.monthLabels = [];
    for (const date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
      if ((date.getDay() + 6) % 7 === 0) {
        this.weeks.push([]);
        // Libellé du mois sur la semaine qui contient le 1er
        if (date.getDate() <= 7) {
          this.monthLabels.push({
            label: date.toLocaleDateString(locale, {month: 'short'}),
            weekIndex: this.weeks.length - 1
          });
        }
      }
      const count = counts.get(dayKey(date)) ?? 0;
      const dateLabel = date.toLocaleDateString(locale, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
      const countLabel = count === 0
        ? noActivity
        : `${count} ${this.translateService.instant(count === 1 ? 'common.plurals.activity_one' : 'common.plurals.activity_other')}`;
      this.weeks[this.weeks.length - 1].push({
        count,
        title: `${dateLabel} - ${countLabel}`,
        intensity: `intensity-${Math.min(count, 3)}`
      });
    }
    // Un libellé collé au bord droit déborderait de la grille (et créerait un défilement inutile)
    this.monthLabels = this.monthLabels.filter(month => month.weekIndex <= this.weeks.length - 3);

    // Dernière semaine incomplète : cases futures masquées
    const lastWeek = this.weeks[this.weeks.length - 1];
    while (lastWeek.length < 7) lastWeek.push(null);

    // Lundi 1er janvier 2024 : sert à générer les noms de jours dans la langue courante
    this.weekdays = Array.from({length: 7}, (_, i) =>
      new Date(2024, 0, i + 1).toLocaleDateString(locale, {weekday: 'short'}));
  }
}
