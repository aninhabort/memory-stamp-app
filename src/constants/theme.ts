// ─── Design System — Memory Stamp App ────────────────────────────────────────
// Inspirado em passaportes físicos e diários de expedição vintage.

// ── Paleta de cores ──────────────────────────────────────────────────────────
export const COLORS = {
  // Paper tones
  background:               '#fef9ed',
  surfaceContainerLow:      '#f8f3e7',
  surfaceContainer:         '#f2ede2',
  surfaceContainerHigh:     '#ede8dc',
  surfaceContainerHighest:  '#e7e2d6',
  surfaceDim:               '#dedace',
  white:                    '#ffffff',

  // Ink tones
  primary:              '#05152b',   // Deep indigo — tinta de caneta-tinteiro
  primaryContainer:     '#1b2a41',
  onPrimaryContainer:   '#8291ad',
  secondary:            '#9b4145',   // Burgundy — selos oficiais
  secondaryContainer:   '#fd8e90',
  tertiary:             '#011a0f',   // Forest green — alfândega
  tertiaryContainer:    '#152f22',
  onTertiaryContainer:  '#7b9887',

  // Text
  onSurface:        '#1d1c15',
  onSurfaceVariant: '#44474d',
  outline:          '#75777e',
  outlineVariant:   '#c5c6ce',

  // States
  error:          '#ba1a1a',
  errorContainer: '#ffdad6',

  // On-primary — light ink/icon colour used over primaryContainer backgrounds
  // (e.g. the book-volume cover in PassportScreen)
  onPrimary: '#d5e3ff',

  // ── Aliases legados — mantidos até migração completa das telas ──────────
  CREAM:      '#fef9ed',   // → background
  NAVY:       '#05152b',   // → primary
  GOLD:       '#9b4145',   // → secondary (burgundy substitui o dourado)
  WHITE:      '#ffffff',   // → white
  GRAY:       '#44474d',   // → onSurfaceVariant
  LIGHT_GRAY: '#c5c6ce',   // → outlineVariant
};

// ── Tipografia ────────────────────────────────────────────────────────────────
// LibreCaslonText — autoridade literária (headline)
// PublicSans      — legibilidade moderna (body)
// CourierPrime    — máquina de escrever vintage (stamps & metadata)
export const FONTS = {
  // Headlines
  displayLg:        'LibreCaslonText_700Bold',
  headlineMd:       'LibreCaslonText_700Bold',   // 600SemiBold inexistente no pacote
  headlineSm:       'LibreCaslonText_400Regular',

  // Body
  bodyLg:    'PublicSans_400Regular',
  bodyMd:    'PublicSans_400Regular',
  labelCaps: 'PublicSans_600SemiBold',

  // Stamps & metadata
  labelStamp:        'CourierPrime_700Bold',
  labelStampRegular: 'CourierPrime_400Regular',

  // ── Aliases legados — apontam para novas fontes ──────────────────────
  regular: 'PublicSans_400Regular',          // era PlayfairDisplay_400Regular
  bold:    'LibreCaslonText_700Bold',        // era PlayfairDisplay_700Bold
};

// ── Escala tipográfica (px) ──────────────────────────────────────────────────
export const FONT_SIZES = {
  displayLg:  32,
  headlineMd: 24,
  headlineSm: 20,
  bodyLg:     18,
  bodyMd:     16,
  labelStamp: 14,
  labelCaps:  12,
  labelXs:    10,
};

// ── Espaçamento ───────────────────────────────────────────────────────────────
export const SPACING = {
  pageMargin:  20,
  elementGap:  16,
  stackTight:   8,
  stackLoose:  32,

  // ── Aliases legados ──
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

// ── Border radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   4,
  md:   8,
  lg:   16,
  xl:   24,
  full: 9999,
};

// ── Sombras ───────────────────────────────────────────────────────────────────
// Sombra estilo papel sobre mesa
export const SHADOW_PAPER = {
  shadowColor:   '#05152b',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius:  16,
  elevation:     4,
};

// Aliases legados
export const SHADOW        = SHADOW_PAPER;
export const SHADOW_STRONG = {
  shadowColor:   '#05152b',
  shadowOffset:  { width: 0, height: 6 },
  shadowOpacity: 0.20,
  shadowRadius:  20,
  elevation:     8,
};

// Cor do padrão de textura de papel granulado (usar como tint em Views decorativas)
export const PAPER_PATTERN_COLOR = 'rgba(222, 218, 206, 0.4)';
