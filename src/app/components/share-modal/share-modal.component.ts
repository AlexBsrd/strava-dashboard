import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Stats} from '../../models/stats';
import {InstagramCardComponent} from '../instagram-card/instagram-card.component';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, InstagramCardComponent],
  templateUrl: './share-modal.component.html',
  styleUrls: ['./share-modal.component.css']
})
export class ShareModalComponent {
  @ViewChild(InstagramCardComponent) instagramCard!: InstagramCardComponent;

  @Input() isOpen = false;
  @Input() stats!: Stats;
  @Input() title!: string;
  @Input() period!: string;

  @Output() closeModal = new EventEmitter<void>();

  selectedTheme = 'modern';
  themes = [
    {value: 'modern', label: 'Moderne'},
    {value: 'minimal', label: 'Minimal'},
    {value: 'dark', label: 'Sombre'}
  ];

  close() {
    this.closeModal.emit();
  }

  changeTheme(theme: string) {
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
