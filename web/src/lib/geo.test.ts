import { describe, expect, it } from 'vitest';
import { countryCounts, matchCountryName } from './geo';

describe('geo', () => {
  it('aggregates visit points by normalized country', () => {
    const pts = [
      { lat: 0, lon: 0, city: 'Lisbon', country: 'Portugal', at: 'x' },
      { lat: 0, lon: 0, city: 'Porto', country: 'Portugal', at: 'x' },
      { lat: 0, lon: 0, city: 'NYC', country: 'United States', at: 'x' },
    ];
    const c = countryCounts(pts as any);
    expect(c.get(matchCountryName('Portugal'))).toBe(2);
    // topojson name variant maps to the same key as the GeoLite2 name
    expect(matchCountryName('United States of America')).toBe(matchCountryName('United States'));
  });

  it('normalizes case and whitespace', () => {
    expect(matchCountryName('  Portugal  ')).toBe(matchCountryName('portugal'));
    expect(matchCountryName('PORTUGAL')).toBe(matchCountryName('portugal'));
  });

  it('maps common GeoLite2/topojson mismatches to the same key', () => {
    expect(matchCountryName('Russian Federation')).toBe(matchCountryName('Russia'));
    expect(matchCountryName('Republic of Korea')).toBe(matchCountryName('South Korea'));
    expect(matchCountryName('Czech Republic')).toBe(matchCountryName('Czechia'));
  });

  it('defaults to normalized input for unknown names', () => {
    expect(matchCountryName('Wakanda')).toBe('wakanda');
  });
});
