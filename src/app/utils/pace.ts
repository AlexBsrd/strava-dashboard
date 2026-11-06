import {getSportMetadata} from '../types/sport-config';

/** Allure au format 5'30" (min/km) à partir d'une vitesse en km/h */
export function formatPace(speedKmh: number): string {
  if (!(speedKmh > 0)) return '–';
  // Arrondi sur le total de secondes pour ne jamais afficher 5'60"
  const totalSeconds = Math.round(3600 / speedKmh);
  return `${Math.floor(totalSeconds / 60)}'${String(totalSeconds % 60).padStart(2, '0')}"`;
}

/** Course et marche se lisent en allure, comme sur Strava ; le reste en km/h */
export function usesPace(sportType: string): boolean {
  const category = getSportMetadata(sportType).category;
  return category === 'running' || category === 'walking';
}
