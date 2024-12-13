import {Component, Input} from '@angular/core';
import {Stats} from "../../models/stats";
import {StatsCardComponent} from "../stats-card/stats-card.component";

@Component({
  selector: 'app-stats-list',
  standalone: true,
  imports: [
    StatsCardComponent
  ],
  templateUrl: './stats-list.component.html',
  styleUrl: './stats-list.component.css'
})
export class StatsListComponent {
  @Input() stats!: Stats;
  @Input() title!: string;
}
