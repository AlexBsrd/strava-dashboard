import {AfterViewInit, Component, ElementRef, Input, ViewChild, inject} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Stats} from '../../models/stats';
import {
  display, drawBackdrop, drawBrand, drawStripes, loadFonts, loadIcon, Palette, PALETTES,
  roundRect, shareOrDownload, sportIcon, STORY_H, STORY_W, text
} from '../../utils/share-image';

export type CardTheme = keyof typeof PALETTES;

/** Story 1080×1920 des stats d'un sport sur la période affichée */
@Component({
  selector: 'app-instagram-card',
  standalone: true,
  templateUrl: './instagram-card.component.html',
  styleUrls: ['./instagram-card.component.css']
})
export class InstagramCardComponent implements AfterViewInit {
  private translate = inject(TranslateService);
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() stats!: Stats;
  @Input() title!: string;
  @Input() period = '';
  @Input() icon?: string;
  @Input() selectedTheme: CardTheme = 'dark';

  private drawId = 0;

  ngAfterViewInit() {
    this.drawCard();
  }

  changeTheme(theme: CardTheme) {
    this.selectedTheme = theme;
    this.drawCard();
  }

  generateAndDownload() {
    return shareOrDownload(this.canvasRef.nativeElement, `strava-stats-${Date.now()}.png`);
  }

  private async drawCard() {
    const id = ++this.drawId;
    const p: Palette = PALETTES[this.selectedTheme] ?? PALETTES.dark;
    const s = this.stats;
    const sport = sportIcon(this.icon);
    const label = (key: string) => this.translate.instant(`metrics.short_labels.${key}`);
    const hours = Math.floor(s.totalMovingTime / 3600);
    const minutes = String(Math.floor(s.totalMovingTime % 3600 / 60)).padStart(2, '0');
    const cells: [string, string, string, string][] = [
      ['clock-hour-4', `${hours}h${minutes}`, '', label('time')],
      ['bolt', this.num(s.averageSpeed, 1), 'km/h', label('speed')],
      ['mountain', this.num(s.totalElevation), 'm', label('elevation')],
      ['activity', this.num(s.numberOfActivities), '', this.translate.instant('recap.summary.activities')]
    ];
    const [ghost, badge, ...icons] = await Promise.all([
      loadIcon(sport, p.ink, 0.5),
      loadIcon(sport, '#ffffff'),
      ...cells.map(([icon]) => loadIcon(icon, p.accent)),
      loadFonts()
    ]) as HTMLImageElement[];
    if (id !== this.drawId) return; // un autre thème a été choisi entre-temps

    const canvas = this.canvasRef.nativeElement;
    canvas.width = STORY_W;
    canvas.height = STORY_H;
    const ctx = canvas.getContext('2d')!;
    drawBackdrop(ctx, p);
    ctx.globalAlpha = this.selectedTheme === 'orange' ? 0.2 : 0.09;
    ctx.drawImage(ghost, 400, 120, 920, 920);
    ctx.globalAlpha = 1;
    drawBrand(ctx, p);

    // Sport et période
    roundRect(ctx, 96, 290, 132, 132, 34);
    ctx.fillStyle = p.bar;
    ctx.fill();
    ctx.drawImage(badge, 120, 314, 84, 84);
    ctx.fillStyle = p.ink;
    ctx.font = text(54, 700);
    ctx.fillText(this.title.toUpperCase(), 264, 348);
    ctx.fillStyle = p.muted;
    ctx.font = text(36);
    ctx.fillText(this.period, 264, 404);

    // Distance en vedette
    ctx.fillStyle = p.accent;
    ctx.font = text(34, 600);
    ctx.letterSpacing = '8px';
    ctx.fillText(label('distance').toUpperCase(), 96, 640);
    ctx.letterSpacing = '0px';
    const distance = this.num(s.totalDistance, 1);
    ctx.fillStyle = p.ink;
    ctx.font = display(this.fit(ctx, distance, 300, 760));
    ctx.fillText(distance, 82, 920);
    const end = 82 + ctx.measureText(distance).width;
    ctx.fillStyle = p.accent;
    ctx.font = display(96, 600, false);
    ctx.fillText('km', end + 24, 920);
    drawStripes(ctx, 104, 974, p.bar, [140, 76, 36], 16);

    // Grille d'instrument 2×2
    cells.forEach(([, value, unit, name], i) => {
      const x = 96 + (i % 2) * 464;
      const y = 1150 + Math.floor(i / 2) * 320;
      ctx.fillStyle = p.line;
      ctx.fillRect(x, y, 424, 2);
      ctx.drawImage(icons[i], x, y + 40, 54, 54);
      ctx.fillStyle = p.ink;
      ctx.font = display(this.fit(ctx, value, 132, unit ? 300 : 410));
      ctx.fillText(value, x - 4, y + 214);
      if (unit) {
        const w = ctx.measureText(value).width;
        ctx.fillStyle = p.muted;
        ctx.font = display(50, 600, false);
        ctx.fillText(unit, x + w + 10, y + 214);
      }
      ctx.fillStyle = p.muted;
      ctx.font = text(32);
      ctx.fillText(name.charAt(0).toUpperCase() + name.slice(1), x, y + 262);
    });
  }

  /** Taille de police qui fait tenir `value` dans `maxWidth` */
  private fit(ctx: CanvasRenderingContext2D, value: string, size: number, maxWidth: number): number {
    ctx.font = display(size);
    return Math.min(size, Math.floor(size * maxWidth / ctx.measureText(value).width));
  }

  private num(value: number, digits = 0): string {
    return value.toLocaleString(this.translate.currentLang || 'fr', {
      minimumFractionDigits: digits, maximumFractionDigits: digits
    });
  }
}
