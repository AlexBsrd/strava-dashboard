import {Component, Input, OnChanges} from '@angular/core';
import {iconUrl} from '../../utils/share-image';

/**
 * Icône Tabler en masque CSS : prend la couleur du texte (currentColor) et la taille 1em.
 * `stroke` affine le trait (utile pour les grandes icônes décoratives).
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: '',
  host: {'aria-hidden': 'true', '[style.--icon]': '"url(\\"" + url + "\\")"'},
  styles: [`
    :host {
      display: inline-block;
      flex-shrink: 0;
      width: 1em;
      height: 1em;
      background: currentColor;
      -webkit-mask: var(--icon) center / contain no-repeat;
      mask: var(--icon) center / contain no-repeat;
    }
  `]
})
export class IconComponent implements OnChanges {
  @Input() name = 'activity';
  @Input() stroke?: number;
  url = '';

  async ngOnChanges() {
    this.url = iconUrl(this.name);
    if (!this.stroke) return;
    const svg = (await (await fetch(this.url)).text()).replace(/stroke-width="2"/, `stroke-width="${this.stroke}"`);
    this.url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
}
