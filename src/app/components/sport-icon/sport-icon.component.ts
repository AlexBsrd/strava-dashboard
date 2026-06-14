import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Icône de sport réutilisable rendue en SVG inline.
 * Évite la dépendance aux polices emoji (qui ne s'affichent pas sur toutes
 * les plateformes) et garantit un rendu cohérent et net partout.
 *
 * `icon` accepte les identifiants définis dans sport-config (run, bike, walk,
 * hike, weight, swim, ski, …). Les valeurs inconnues retombent sur une icône
 * générique d'activité.
 */
@Component({
  selector: 'app-sport-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container [ngSwitch]="iconKey">
      <svg *ngSwitchCase="'run'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="13" cy="4" r="2"/>
        <path d="M7 21l3-8 3 2 1 6"/>
        <path d="M10 13l-2-3 4-3 3 3 3 1"/>
      </svg>
      <svg *ngSwitchCase="'bike'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5"/>
        <circle cx="18.5" cy="17.5" r="3.5"/>
        <path d="M12 17.5V14l-3-3 4-3 3 4h2"/>
        <circle cx="15" cy="5" r="1"/>
      </svg>
      <svg *ngSwitchCase="'walk'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="13" cy="4" r="2"/>
        <path d="M9 21l3-7 1 3 3 2"/>
        <path d="M12 14l-1-5 4 1 1 4"/>
      </svg>
      <svg *ngSwitchCase="'hike'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 20h18"/>
        <path d="M5 20l5-9 4 5 2-3 3 7"/>
        <path d="M10 11l2-4"/>
      </svg>
      <svg *ngSwitchCase="'weight'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6.5 6.5v11"/>
        <path d="M17.5 6.5v11"/>
        <path d="M3.5 9v6"/>
        <path d="M20.5 9v6"/>
        <line x1="6.5" y1="12" x2="17.5" y2="12"/>
      </svg>
      <svg *ngSwitchCase="'swim'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="15" cy="7" r="1.6"/>
        <path d="M5 13l4-2 3 2 4-3"/>
        <path d="M2 18c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0"/>
      </svg>
      <svg *ngSwitchCase="'ski'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="13" cy="4.5" r="1.6"/>
        <path d="M8 9l4-2 2 4 3 1"/>
        <path d="M4 20l16-5"/>
        <path d="M10 12l-1 6"/>
      </svg>
      <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12h3l2-5 4 10 2-5h7"/>
      </svg>
    </ng-container>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    svg {
      width: 60%;
      height: 60%;
    }
  `]
})
export class SportIconComponent {
  @Input() icon: string | undefined;

  /** Réduit l'identifiant d'icône brut à l'une des familles dessinées. */
  get iconKey(): string {
    switch (this.icon) {
      case 'run':
      case 'trail':
      case 'workout':
        return 'run';
      case 'bike':
      case 'mtb':
      case 'ebike':
      case 'gravel':
        return 'bike';
      case 'walk':
        return 'walk';
      case 'hike':
        return 'hike';
      case 'weight':
      case 'crossfit':
        return 'weight';
      case 'swim':
      case 'rowing':
      case 'kayak':
      case 'canoe':
      case 'paddle':
      case 'surf':
        return 'swim';
      case 'ski':
      case 'nordic':
      case 'snowboard':
      case 'skate':
        return 'ski';
      default:
        return 'default';
    }
  }
}
