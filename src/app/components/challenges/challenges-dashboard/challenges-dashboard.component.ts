import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Challenge} from '../../../models/challenge/challenge.model';
import {ChallengeStatus} from '../../../models/challenge/challenge-enums.model';
import {Router} from '@angular/router';
import {MockChallengeService} from "../../../services/mock-challenge.service";

@Component({
  selector: 'app-challenges-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenges-dashboard.component.html',
  styleUrls: ['./challenges-dashboard.component.css']
})
export class ChallengesDashboardComponent implements OnInit {
  challenges: Challenge[] = [];
  currentFilter: string = 'En cours';
  filters = ['En cours', 'À venir', 'Terminés'];

  constructor(
    private challengeService: MockChallengeService,
    private router: Router
  ) {
  }

  get filteredChallenges() {
    return this.challenges.filter(challenge => {
      switch (this.currentFilter) {
        case 'En cours':
          return challenge.status === ChallengeStatus.ACTIVE;
        case 'À venir':
          return challenge.status === ChallengeStatus.UPCOMING;
        case 'Terminés':
          return challenge.status === ChallengeStatus.COMPLETED;
        default:
          return true;
      }
    });
  }

  ngOnInit() {
    this.loadChallenges();
  }

  createNewChallenge() {
    this.router.navigate(['/challenges/create']);
  }

  viewChallenge(challenge: Challenge) {
    this.router.navigate(['/challenges', challenge.id]);
  }

  setFilter(filter: string) {
    this.currentFilter = filter;
  }

  private loadChallenges() {
    this.challengeService.getChallenges().subscribe({
      next: (challenges) => {
        this.challenges = challenges;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
      }
    });
  }
}
