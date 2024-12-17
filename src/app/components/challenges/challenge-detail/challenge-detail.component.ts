import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {Challenge} from '../../../models/challenge/challenge.model';
import {SpinnerComponent} from "../../spinner/spinner.component";
import {MockChallengeService} from "../../../services/mock-challenge.service";

@Component({
  selector: 'app-challenge-detail',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './challenge-detail.component.html',
  styleUrls: ['./challenge-detail.component.css']
})
export class ChallengeDetailComponent implements OnInit {
  challenge?: Challenge;
  isLoading = true;
  error: string | null = null;
  isOwner = false;
  hasJoined = false;
  currentUserId = localStorage.getItem('strava_athlete_id');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private challengeService: MockChallengeService
  ) {
  }

  ngOnInit(): void {
    const challengeId = this.route.snapshot.paramMap.get('id');
    if (challengeId) {
      this.loadChallenge(challengeId);
    } else {
      this.router.navigate(['/challenges']);
    }
  }

  formatTimeLeft(): string {
    if (!this.challenge) return '';
    const now = new Date();
    const end = new Date(this.challenge.endDate);
    const diff = end.getTime() - now.getTime();

    if (diff < 0) return 'Challenge terminé';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} jours restants`;
  }

  getProgressPercentage(progress: number): number {
    if (!this.challenge) return 0;
    return (progress / this.challenge.goal) * 100;
  }

  joinChallenge(): void {
    if (!this.challenge) return;

    this.challengeService.joinChallenge(this.challenge.id).subscribe({
      next: (updatedChallenge) => {
        this.challenge = updatedChallenge;
        this.hasJoined = true;
      },
      error: (error) => {
        console.error('Error joining challenge:', error);
      }
    });
  }

  shareChallenge(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      // Ici vous pourriez ajouter une notification de succès
      console.log('URL copied to clipboard');
    });
  }

  private loadChallenge(id: string): void {
    this.isLoading = true;
    this.challengeService.getChallengeById(id).subscribe({
      next: (challenge) => {
        this.challenge = challenge;
        this.isOwner = challenge.creatorId === this.currentUserId;
        this.hasJoined = challenge.participants.some(
          p => p.userId === this.currentUserId
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading challenge:', error);
        this.error = 'Impossible de charger le challenge';
        this.isLoading = false;
      }
    });
  }
}
