import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';

interface TimeValues {
  hours: number;
  minutes: number;
}

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.css', './stats-card.animations.css']
})
export class StatsCardComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() unit: string = '';
  @Input() isTime: boolean = false;

  currentValue: number = 0;
  animationFrameId: number | null = null;
  readonly ANIMATION_DURATION = 2000; // 2 secondes
  hasAnimated: boolean = false;
  private startTime: number | null = null;
  private observer: IntersectionObserver | null = null;

  constructor(private elementRef: ElementRef) {
  }

  get timeValues(): TimeValues {
    if (!this.isTime) return {hours: 0, minutes: 0};

    const totalSeconds = this.currentValue;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return {hours, minutes};
  }

  get formattedValue(): string {
    if (this.isTime) return '';
    return this.currentValue.toFixed(1);
  }

  ngOnInit() {
    // Ne pas démarrer l'animation ici
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange) {
      // Pour les mises à jour de valeur après l'initialisation
      this.startAnimation();
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1 // Déclenche quand 10% de la carte est visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasAnimated) {
          this.startAnimation();
          this.hasAnimated = true;
        }
      });
    }, options);

    this.observer.observe(this.elementRef.nativeElement);
  }

  private startAnimation() {
    // Annuler l'animation précédente si elle existe
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const startValue = this.currentValue;
    const endValue = this.value;
    this.startTime = null;

    const animate = (currentTime: number) => {
      if (this.startTime === null) {
        this.startTime = currentTime;
      }

      const elapsed = currentTime - this.startTime;
      const progress = Math.min(elapsed / this.ANIMATION_DURATION, 1);

      // Fonction d'easing pour une animation plus naturelle
      const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);
      const easedProgress = easeOutQuart(progress);

      this.currentValue = startValue + (endValue - startValue) * easedProgress;

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.currentValue = endValue;
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}
