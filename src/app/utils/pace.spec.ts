import {formatPace, usesPace} from './pace';

describe('formatPace', () => {
  it('convertit une vitesse en allure min/km', () => {
    expect(formatPace(12)).toBe(`5'00"`);
    expect(formatPace(10.9)).toBe(`5'30"`);
  });

  it('ne produit jamais 60 secondes', () => {
    expect(formatPace(3600 / 299.6)).toBe(`5'00"`);
  });

  it('affiche un tiret sans vitesse', () => {
    expect(formatPace(0)).toBe('–');
  });

  it('réserve l\'allure à la course et à la marche', () => {
    expect(usesPace('TrailRun')).toBeTrue();
    expect(usesPace('Hike')).toBeTrue();
    expect(usesPace('Ride')).toBeFalse();
  });
});
