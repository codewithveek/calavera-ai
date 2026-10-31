/**
 * Design tokens. A candle-lit night palette drawn from the ofrenda:
 * cempasúchil orange, rosa mexicano, papel picado purple and bone parchment.
 */
export const colors = {
  night: '#120D1A',
  nightRaised: '#1C1527',
  nightSunken: '#0B0811',
  border: '#2E2440',
  marigold: '#FF9F1C',
  marigoldDeep: '#E07A00',
  rosa: '#E4007C',
  purple: '#6B2D8C',
  turquoise: '#2EC4B6',
  candle: '#FFD166',
  bone: '#F3E6C8',
  boneMuted: '#B8AC94',
  textMuted: '#9C90AE',
  danger: '#FF5D73',
  success: '#7BD389',
  parchment: '#F4E7C5',
  parchmentInk: '#3B2A1A',
  parchmentEdge: '#B5651D',
  scrim: 'rgba(11, 8, 17, 0.72)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const fontSizes = {
  caption: 12,
  label: 14,
  body: 16,
  heading: 20,
  title: 28,
  display: 36,
} as const;

/** Android maps `serif` to Noto Serif: an elegant face with zero bundle cost. */
export const fonts = {
  serif: 'serif',
} as const;

/** Minimum touch target from the Material accessibility guidelines. */
export const MIN_TOUCH = 48;
