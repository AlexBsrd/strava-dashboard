import {TranslateModule} from '@ngx-translate/core';
import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Stats} from '../../models/stats';
import {CardTheme, InstagramCardComponent} from '../instagram-card/instagram-card.component';
import {IconComponent} from '../icon/icon.component';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, InstagramCardComponent, TranslateModule, IconComponent],
  templateUrl: './share-modal.component.html',
  styleUrls: ['./share-modal.component.css']
})
export class ShareModalComponent {
  @ViewChild(InstagramCardComponent) instagramCard!: InstagramCardComponent;

  @Input() isOpen = false;
  @Input() stats!: Stats;
  @Input() title!: string;
  @Input() period!: string;
  @Input() icon?: string;

  @Output() closeModal = new EventEmitter<void>();

  selectedTheme: CardTheme = 'dark';
  themes: CardTheme[] = ['dark', 'light', 'orange'];

  close() {
    this.closeModal.emit();
  }

  changeTheme(theme: CardTheme) {
    this.selectedTheme = theme;
    if (this.instagramCard) {
      setTimeout(() => {
        this.instagramCard.changeTheme(theme);
      });
    }
  }

  download() {
    if (this.instagramCard) {
      this.instagramCard.generateAndDownload();
    }
  }
}
