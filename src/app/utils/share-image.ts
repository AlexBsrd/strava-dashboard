/**
 * Briques communes aux images partagées (bilan de l'année, story de stats) :
 * icônes Tabler (assets/icons/tabler, licence MIT), polices, fond « Race Instrument »
 * et partage natif. Format story 1080×1920.
 */

export const STORY_W = 1080;
export const STORY_H = 1920;

const SPORT_ICONS: Record<string, string> = {
  run: 'run', trail: 'run', walk: 'walk', hike: 'trekking', nordic: 'trekking',
  bike: 'bike', mtb: 'bike', ebike: 'bike',
  swim: 'swimming', kayak: 'kayak', canoe: 'kayak', rowing: 'kayak', paddle: 'kayak',
  weight: 'barbell', crossfit: 'barbell', workout: 'barbell', yoga: 'yoga',
  ski: 'ski-jumping', snowboard: 'ski-jumping'
};

/** Icône Tabler correspondant à un identifiant d'icône de sport-config */
export const sportIcon = (id?: string): string => SPORT_ICONS[id ?? ''] ?? 'activity';

export const iconUrl = (name: string): string => `assets/icons/tabler/${name}.svg`;

/** Charge une icône SVG recolorée, prête pour drawImage (rendu vectoriel net à toute taille) */
export async function loadIcon(name: string, color: string, strokeWidth = 1.75): Promise<HTMLImageElement> {
  const svg = (await (await fetch(iconUrl(name))).text())
    .replace(/currentColor/g, color)
    .replace(/stroke-width="2"/, `stroke-width="${strokeWidth}"`);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  return img;
}

/** Le canvas n'attend pas les polices web : on les force avant de dessiner */
export async function loadFonts(): Promise<void> {
  await Promise.all([
    "italic 700 100px 'Barlow Semi Condensed'",
    "600 100px 'Barlow Semi Condensed'",
    '500 40px Inter',
    '600 40px Inter',
    '700 40px Inter'
  ].map(f => document.fonts.load(f).catch(() => undefined)));
}

export const display = (size: number, weight = 700, italic = true) =>
  `${italic ? 'italic ' : ''}${weight} ${size}px 'Barlow Semi Condensed', Inter, sans-serif`;
export const text = (size: number, weight = 500) => `${weight} ${size}px Inter, sans-serif`;

export interface Palette {
  bg: string;
  glow: string;       // halo coloré en haut à droite
  glow2: string;      // contre-halo en bas à gauche
  ink: string;        // texte principal
  muted: string;      // texte secondaire
  line: string;       // filets
  accent: string;     // icônes, kicker
  bar: string;        // accent « vélocité »
}

export const PALETTES: Record<'dark' | 'light' | 'orange', Palette> = {
  dark: {
    bg: '#0e0f12', glow: 'rgba(252, 82, 0, 0.55)', glow2: 'rgba(38, 196, 138, 0.16)',
    ink: '#ffffff', muted: 'rgba(255, 255, 255, 0.58)', line: 'rgba(255, 255, 255, 0.12)',
    accent: '#ff6a1f', bar: '#fc5200'
  },
  light: {
    bg: '#f6f5f2', glow: 'rgba(252, 82, 0, 0.28)', glow2: 'rgba(15, 157, 110, 0.14)',
    ink: '#111827', muted: 'rgba(17, 24, 39, 0.55)', line: 'rgba(17, 24, 39, 0.1)',
    accent: '#fc5200', bar: '#fc5200'
  },
  orange: {
    bg: '#fc5200', glow: 'rgba(255, 170, 110, 0.7)', glow2: 'rgba(122, 41, 0, 0.55)',
    ink: '#ffffff', muted: 'rgba(255, 255, 255, 0.75)', line: 'rgba(255, 255, 255, 0.28)',
    accent: '#ffffff', bar: '#111827'
  }
};

/** Fond : aplat, deux halos et grain léger */
export function drawBackdrop(ctx: CanvasRenderingContext2D, p: Palette) {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  const halo = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STORY_W, STORY_H);
  };
  halo(STORY_W + 80, -120, 1100, p.glow);
  halo(-200, STORY_H + 100, 1000, p.glow2);
}

/** Barres inclinées, signature « vélocité » du site */
export function drawStripes(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, widths = [120], h = 14) {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  widths.forEach((w, i) => {
    ctx.globalAlpha = 1 - i * 0.3;
    const skew = h * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx + skew, y);
    ctx.lineTo(cx + w + skew, y);
    ctx.lineTo(cx + w, y + h);
    ctx.lineTo(cx, y + h);
    ctx.closePath();
    ctx.fill();
    cx += w + h * 1.2;
  });
  ctx.restore();
}

/** Marque en tête : trois barres inclinées + nom de l'app */
export function drawBrand(ctx: CanvasRenderingContext2D, p: Palette, y = 132) {
  drawStripes(ctx, 96, y - 22, p.bar, [34, 22, 12], 22);
  ctx.save();
  ctx.fillStyle = p.ink;
  ctx.font = text(30, 700);
  ctx.letterSpacing = '6px';
  ctx.textBaseline = 'middle';
  ctx.fillText('STRAVA DASHBOARD', 240, y - 10);
  ctx.restore();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Partage natif sur mobile (Instagram, WhatsApp...), téléchargement sinon */
export async function shareOrDownload(canvas: HTMLCanvasElement, filename: string) {
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const file = new File([blob], filename, {type: 'image/png'});
  if (navigator.canShare?.({files: [file]})) {
    await navigator.share({files: [file]}).catch(() => undefined); // annulation par l'utilisateur
    return;
  }
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
