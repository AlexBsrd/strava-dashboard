import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Challenge, ChallengeParticipant} from '../models/challenge/challenge.model';
import {ChallengeMetric, ChallengeStatus, ChallengeType} from '../models/challenge/challenge-enums.model';

@Injectable({
  providedIn: 'root'
})
export class MockChallengeService {
  private mockChallenges: Challenge[] = [
    {
      id: '1',
      title: 'Challenge 100km en 7 jours',
      description: 'Courez 100km en une semaine ! Un défi pour tester votre endurance.',
      creatorId: '12345',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-27'),
      type: ChallengeType.DISTANCE,
      goal: 100,
      metric: ChallengeMetric.KILOMETERS,
      status: ChallengeStatus.UPCOMING,
      isPrivate: false,
      participants: [
        {
          userId: '12345',
          currentProgress: 0,
          lastUpdate: new Date(),
          activities: []
        }
      ]
    },
    {
      id: '2',
      title: 'Défi dénivelé du mois',
      description: 'Accumulez 5000m de dénivelé positif en un mois.',
      creatorId: '67890',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      type: ChallengeType.ELEVATION,
      goal: 5000,
      metric: ChallengeMetric.METERS,
      status: ChallengeStatus.ACTIVE,
      isPrivate: false,
      participants: [
        {
          userId: '67890',
          currentProgress: 2100,
          lastUpdate: new Date(),
          activities: ['123', '124', '125']
        },
        {
          userId: '12345',
          currentProgress: 1800,
          lastUpdate: new Date(),
          activities: ['126', '127']
        }
      ]
    },
    {
      id: '3',
      title: 'Marathon en un mois',
      description: 'Courez la distance d\'un marathon (42.2km) en sessions fractionnées sur un mois.',
      creatorId: '12345',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-30'),
      type: ChallengeType.DISTANCE,
      goal: 42.2,
      metric: ChallengeMetric.KILOMETERS,
      status: ChallengeStatus.COMPLETED,
      isPrivate: false,
      participants: [
        {
          userId: '12345',
          currentProgress: 42.2,
          lastUpdate: new Date('2024-11-28'),
          activities: ['120', '121', '122']
        },
        {
          userId: '67890',
          currentProgress: 38.5,
          lastUpdate: new Date('2024-11-30'),
          activities: ['123', '124']
        }
      ]
    },
    {
      id: '4',
      title: 'Challenge du club - 20h de course',
      description: 'Accumulez 20 heures de course à pied ce mois-ci.',
      creatorId: '45678',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      type: ChallengeType.TIME,
      goal: 20,
      metric: ChallengeMetric.HOURS,
      status: ChallengeStatus.ACTIVE,
      isPrivate: true,
      inviteCode: 'CLUB2024',
      participants: [
        {
          userId: '45678',
          currentProgress: 12.5,
          lastUpdate: new Date(),
          activities: ['128', '129', '130']
        }
      ]
    },
    {
      id: '5',
      title: '30 jours de course consécutifs',
      description: 'Relevez le défi de courir tous les jours pendant 30 jours !',
      creatorId: '67890',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      type: ChallengeType.ACTIVITY_COUNT,
      goal: 30,
      metric: ChallengeMetric.ACTIVITIES,
      status: ChallengeStatus.ACTIVE,
      isPrivate: false,
      participants: [
        {
          userId: '67890',
          currentProgress: 15,
          lastUpdate: new Date(),
          activities: Array.from({length: 15}, (_, i) => `act${i}`)
        }
      ]
    }
  ];

  getChallenges(): Observable<Challenge[]> {
    return of(this.mockChallenges);
  }

  getChallengeById(id: string): Observable<Challenge> {
    const challenge = this.mockChallenges.find(c => c.id === id);
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    return of(challenge);
  }

  createChallenge(challenge: Partial<Challenge>): Observable<Challenge> {
    const newChallenge: Challenge = {
      ...challenge,
      id: (this.mockChallenges.length + 1).toString(),
      creatorId: '12345', // ID de l'utilisateur connecté
      status: ChallengeStatus.UPCOMING,
      participants: [{
        userId: '12345',
        currentProgress: 0,
        lastUpdate: new Date(),
        activities: []
      }]
    } as Challenge;

    this.mockChallenges.push(newChallenge);
    return of(newChallenge);
  }

  joinChallenge(challengeId: string): Observable<Challenge> {
    const challenge = this.mockChallenges.find(c => c.id === challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Ajouter l'utilisateur aux participants s'il n'y est pas déjà
    if (!challenge.participants.some(p => p.userId === '12345')) {
      const newParticipant: ChallengeParticipant = {
        userId: '12345',
        currentProgress: 0,
        lastUpdate: new Date(),
        activities: []
      };
      challenge.participants.push(newParticipant);
    }

    return of(challenge);
  }

  updateChallenge(challengeId: string, updatedChallenge: Partial<Challenge>): Observable<Challenge> {
    const index = this.mockChallenges.findIndex(c => c.id === challengeId);
    if (index === -1) {
      throw new Error('Challenge not found');
    }

    this.mockChallenges[index] = {
      ...this.mockChallenges[index],
      ...updatedChallenge
    };

    return of(this.mockChallenges[index]);
  }

  deleteChallenge(challengeId: string): Observable<void> {
    const index = this.mockChallenges.findIndex(c => c.id === challengeId);
    if (index === -1) {
      throw new Error('Challenge not found');
    }

    this.mockChallenges.splice(index, 1);
    return of(void 0);
  }
}
