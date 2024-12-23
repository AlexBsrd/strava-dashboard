import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Activity} from '../../models/activity';

interface PredictedRace {
  distance: number;
  name: string;
  predictedTime: number;
  predictedPace: number;
}

@Component({
  selector: 'app-race-predictions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-predictions.component.html',
  styleUrls: ['./race-predictions.component.css']
})
export class RacePredictionsComponent implements OnChanges {
  @Input() activities: Activity[] = [];
  @Input() period: 'week' | 'month' | 'current_year' = 'week';

  showPredictions = false;
  races: PredictedRace[] = [];
  confidenceScore = 0;

  private readonly MINIMUM_ACTIVITIES = 10;
  private readonly TARGET_DISTANCES = [
    {distance: 5, name: '5km'},
    {distance: 10, name: '10km'},
    {distance: 21.0975, name: 'Semi-marathon'},
    {distance: 42.195, name: 'Marathon'}
  ];

  ngOnChanges(changes: SimpleChanges) {
    this.updatePredictions();
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes * 60) % 60);

    if (hours > 0) {
      return `${hours}h${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatPace(minutesPerKm: number): string {
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  }

  private updatePredictions() {
    const runningActivities = this.activities.filter(a => a.type === 'Run');

    // Vérifier les conditions d'affichage
    this.showPredictions =
      (this.period === 'current_year' || runningActivities.length >= this.MINIMUM_ACTIVITIES);

    if (!this.showPredictions) return;

    // Calculer le coefficient de forme actuelle
    const recentActivities = this.getRecentActivities(runningActivities);
    const fitnessCoefficient = this.calculateFitnessCoefficient(recentActivities);

    // Calculer la confiance dans les prédictions
    this.confidenceScore = this.calculateConfidenceScore(recentActivities);

    // Générer les prédictions pour chaque distance
    this.races = this.TARGET_DISTANCES.map(target => ({
      distance: target.distance,
      name: target.name,
      predictedTime: this.predictTime(target.distance, fitnessCoefficient),
      predictedPace: this.predictPace(target.distance, fitnessCoefficient)
    }));
  }

  private getRecentActivities(activities: Activity[]): Activity[] {
    // Prendre les 10 dernières activités ou toutes si moins de 10
    return [...activities]
      .sort((a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      )
      .slice(0, 10);
  }

  private calculateFitnessCoefficient(activities: Activity[]): number {
    if (activities.length === 0) return 1;

    // Utiliser une version modifiée de la formule de Riegel
    const coefficients = activities.map(activity => {
      const timeInMinutes = activity.elapsed_time / 60;
      const distanceInKm = activity.distance;
      return Math.pow(timeInMinutes, 1.06) / Math.pow(distanceInKm, 1.06);
    });

    // Moyenne pondérée, donnant plus de poids aux activités récentes
    const weights = activities.map((_, i) => 1 / (i + 1));
    const weightSum = weights.reduce((a, b) => a + b, 0);

    return coefficients.reduce((sum, coef, i) => sum + coef * weights[i], 0) / weightSum;
  }

  private calculateConfidenceScore(activities: Activity[]): number {
    if (activities.length === 0) return 0;

    // Facteurs influençant la confiance
    const activityCountFactor = Math.min(activities.length / this.MINIMUM_ACTIVITIES, 1);

    const distanceVariety = new Set(
      activities.map(a => Math.round(a.distance))
    ).size / this.TARGET_DISTANCES.length;

    const recentActivityFactor = this.getRecentActivityFactor(activities);

    return Math.round((activityCountFactor * 0.4 + distanceVariety * 0.3 + recentActivityFactor * 0.3) * 100);
  }

  private getRecentActivityFactor(activities: Activity[]): number {
    if (activities.length === 0) return 0;

    const mostRecent = new Date(activities[0].start_date);
    const daysSinceLastRun = (new Date().getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);

    return Math.max(0, 1 - (daysSinceLastRun / 30));
  }

  private predictTime(distance: number, coefficient: number): number {
    // Formule de Riegel modifiée avec le coefficient de forme
    return coefficient * distance * Math.pow(distance, 0.06);
  }

  private predictPace(distance: number, coefficient: number): number {
    const timeInMinutes = this.predictTime(distance, coefficient);
    return timeInMinutes / distance;
  }
}
