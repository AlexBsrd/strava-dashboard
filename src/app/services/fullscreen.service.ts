import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FullscreenService {
  private isFullscreenSubject = new BehaviorSubject<boolean>(false);
  isFullscreen$ = this.isFullscreenSubject.asObservable();

  toggleFullscreen(element: HTMLElement) {
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Erreur lors du passage en plein écran : ${err.message}`);
      });
      this.isFullscreenSubject.next(true);

      // On écoute si l'utilisateur quitte le mode plein écran
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    } else {
      document.exitFullscreen();
      this.isFullscreenSubject.next(false);
    }
  }

  private handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      this.isFullscreenSubject.next(false);
    }
  }
}
