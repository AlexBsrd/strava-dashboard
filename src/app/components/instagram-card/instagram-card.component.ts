import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Stats} from '../../models/stats';

interface Theme {
  value: string;
  label: string;
  colors: {
    background: string[];
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentGradient: string[];
  };
}

@Component({
  selector: 'app-instagram-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instagram-card.component.html',
  styleUrls: ['./instagram-card.component.css']
})
export class InstagramCardComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() stats!: Stats;
  @Input() title!: string;
  @Input() period: string = '7 derniers jours';
  @Input() selectedTheme = 'modern';

  themes: { value: string; label: string; }[] = [
    {value: 'modern', label: 'Moderne'},
    {value: 'minimal', label: 'Minimal'},
    {value: 'dark', label: 'Sombre'}
  ];

  private readonly CANVAS_WIDTH = 1080;
  private readonly CANVAS_HEIGHT = 1920;

  private themeConfigs: { [key: string]: Theme } = {
    modern: {
      value: 'modern',
      label: 'Moderne',
      colors: {
        background: ['#F8F9FF', '#E8EFFF'],
        card: '#FFFFFF',
        cardBorder: 'rgba(147, 157, 255, 0.2)',
        text: '#1E2243',
        textSecondary: '#626894',
        accent: '#5B6CFF',
        accentGradient: ['#5B6CFF', '#8595FF']
      }
    },
    minimal: {
      value: 'minimal',
      label: 'Minimal',
      colors: {
        background: ['#FFFFFF', '#F5F5F5'],
        card: '#FFFFFF',
        cardBorder: 'rgba(0, 0, 0, 0.1)',
        text: '#2C2C2C',
        textSecondary: '#757575',
        accent: '#2196F3',
        accentGradient: ['#2196F3', '#64B5F6']
      }
    },
    dark: {
      value: 'dark',
      label: 'Sombre',
      colors: {
        background: ['#13141C', '#1C1E2C'],
        card: '#242736',
        cardBorder: 'rgba(255, 255, 255, 0.1)',
        text: '#FFFFFF',
        textSecondary: '#A0A5BD',
        accent: '#7C85FF',
        accentGradient: ['#7C85FF', '#5B6CFF']
      }
    }
  };

  ngAfterViewInit() {
    this.drawCard();
  }

  changeTheme(theme: string) {
    this.selectedTheme = theme;
    this.drawCard();
  }

  generateAndDownload() {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = `strava-stats-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private createRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private drawCard() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const theme = this.themeConfigs[this.selectedTheme];

    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
    bgGradient.addColorStop(0, theme.colors.background[0]);
    bgGradient.addColorStop(1, theme.colors.background[1]);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

    // Add subtle texture
    this.drawTexture(ctx, theme);

    // Draw header with logo
    this.drawHeader(ctx, theme);

    // Draw stats
    this.drawStats(ctx, theme);

    // Draw footer
    this.drawFooter(ctx, theme);
  }

  private drawTexture(ctx: CanvasRenderingContext2D, theme: Theme) {
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < this.CANVAS_HEIGHT; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.CANVAS_WIDTH, i);
      ctx.strokeStyle = theme.colors.text;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawHeader(ctx: CanvasRenderingContext2D, theme: Theme) {
    // Draw decorative circles
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = theme.colors.accent;
    ctx.beginPath();
    ctx.arc(100, 100, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.CANVAS_WIDTH - 150, 250, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw title
    ctx.save();
    ctx.font = 'bold 92px Inter';
    ctx.fillStyle = theme.colors.text;
    ctx.textAlign = 'center';
    ctx.fillText(this.title.toUpperCase(), this.CANVAS_WIDTH / 2, 200);

    // Draw period
    ctx.font = '40px Inter';
    ctx.fillStyle = theme.colors.textSecondary;
    ctx.fillText(this.period, this.CANVAS_WIDTH / 2, 280);
    ctx.restore();
  }

  private drawStats(ctx: CanvasRenderingContext2D, theme: Theme) {
    const stats = [
      {label: 'Distance', value: this.formatDistance(this.stats.totalDistance), icon: '🏃'},
      {label: 'Temps', value: this.formatDuration(this.stats.totalElapsedTime), icon: '⏱️'},
      {label: 'Vitesse', value: this.formatSpeed(this.stats.averageSpeed), icon: '⚡'},
      {label: 'Dénivelé', value: this.formatElevation(this.stats.totalElevation), icon: '⛰️'}
    ];

    const startY = 500;
    const cardHeight = 220;
    const gap = 40;

    stats.forEach((stat, index) => {
      const y = startY + (cardHeight + gap) * index;

      // Draw card background
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;

      this.createRoundRect(ctx, 120, y, this.CANVAS_WIDTH - 240, cardHeight, 30);
      ctx.fillStyle = theme.colors.card;
      ctx.fill();

      // Draw card border
      ctx.strokeStyle = theme.colors.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw icon background
      ctx.save();
      const iconX = 180;
      const iconY = y + cardHeight / 2 - 30;
      const iconGradient = ctx.createLinearGradient(iconX, iconY, iconX, iconY + 60);
      iconGradient.addColorStop(0, theme.colors.accentGradient[0]);
      iconGradient.addColorStop(1, theme.colors.accentGradient[1]);

      this.createRoundRect(ctx, iconX, iconY, 60, 60, 15);
      ctx.fillStyle = iconGradient;
      ctx.fill();
      ctx.restore();

      // Draw icon
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stat.icon, iconX + 30, iconY + 30);

      // Draw stat value
      ctx.font = 'bold 64px Inter';
      ctx.fillStyle = theme.colors.text;
      ctx.textAlign = 'right';
      ctx.fillText(stat.value, this.CANVAS_WIDTH - 180, y + cardHeight / 2 - 10);

      // Draw stat label
      ctx.font = '32px Inter';
      ctx.fillStyle = theme.colors.textSecondary;
      ctx.fillText(stat.label, this.CANVAS_WIDTH - 180, y + cardHeight / 2 + 40);
    });
  }

  private drawFooter(ctx: CanvasRenderingContext2D, theme: Theme) {
    ctx.font = '32px Inter';
    ctx.fillStyle = theme.colors.textSecondary;
    ctx.textAlign = 'center';

    const footerY = this.CANVAS_HEIGHT - 100;

    // Draw logo and text
    ctx.save();
    const gradient = ctx.createLinearGradient(
      this.CANVAS_WIDTH / 2 - 100, footerY,
      this.CANVAS_WIDTH / 2 + 100, footerY
    );
    gradient.addColorStop(0, theme.colors.accentGradient[0]);
    gradient.addColorStop(1, theme.colors.accentGradient[1]);

    ctx.fillStyle = gradient;
    ctx.font = 'bold 36px Inter';
    ctx.fillText('STRAVA DASHBOARD', this.CANVAS_WIDTH / 2, footerY);
    ctx.restore();
  }

  private formatDistance(km: number): string {
    return `${km.toFixed(1)} km`;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }

  private formatSpeed(kmh: number): string {
    return `${kmh.toFixed(1)} km/h`;
  }

  private formatElevation(meters: number): string {
    return `${Math.round(meters)}m`;
  }
}
