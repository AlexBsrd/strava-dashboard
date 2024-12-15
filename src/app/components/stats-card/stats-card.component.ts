import {Component, Input} from '@angular/core';
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
  styleUrls: ['./stats-card.component.css']
})
export class StatsCardComponent {
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() unit: string = '';
  @Input() isTime: boolean = false;

  get timeValues(): TimeValues {
    if (!this.isTime) return {hours: 0, minutes: 0};

    const hours = Math.floor(this.value / 3600);
    const minutes = Math.floor((this.value % 3600) / 60);
    return {hours, minutes};
  }

  get formattedValue(): string {
    if (this.isTime) return '';
    return this.value.toFixed(1);
  }
}
