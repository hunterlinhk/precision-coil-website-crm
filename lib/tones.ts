// Muted studio backdrops. The renders are transparent, so each family and
// industry can sit on its own colour while the products stay true to life.
export type Tone = 'clay' | 'fog' | 'sand' | 'sage' | 'graphite' | 'lilac' | 'steel' | 'mint';

export const familyTone: Record<string, Tone> = {
  'vcm-coils': 'clay',
  'air-core-coils': 'fog',
  'bobbin-coils': 'sand',
  'wireless-charging-coils': 'sage',
  'linear-motors': 'graphite',
  'wireless-chargers': 'lilac',
};

export const appTone: Record<string, Tone> = {
  'smartphone-cameras': 'fog',
  'wireless-power': 'clay',
  'wearables-haptics': 'lilac',
  automotive: 'graphite',
  'industrial-sensing': 'steel',
  'medical-hearing': 'mint',
  'consumer-audio': 'sand',
};

export const toneOf = (category?: string) => (category && familyTone[category]) || undefined;
