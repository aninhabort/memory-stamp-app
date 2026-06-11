// Design System — Memory Stamp App
// Inspired by physical passports and vintage expedition journals

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Volume/passport book card on the PassportScreen shelf — sized so a
// single passport fills most of the screen width (one card per "page").
export const VOLUME_CARD_WIDTH  = Math.min(SCREEN_WIDTH - 96, 320);
export const VOLUME_CARD_HEIGHT = VOLUME_CARD_WIDTH * (240 / 180);

// Horizontal padding needed on each side of the shelf so the focused
// passport card sits centered on screen.
export const VOLUME_SHELF_SIDE_PADDING = (SCREEN_WIDTH - VOLUME_CARD_WIDTH) / 2;

// Color Palette
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
};

// Typography
// LibreCaslonText — literary authority (headlines)
// PublicSans      — modern legibility (body)
// CourierPrime    — vintage typewriter (stamps & metadata)
export const FONTS = {
  // Headlines
  displayLg:        'LibreCaslonText_700Bold',
  headlineMd:       'LibreCaslonText_700Bold',   // 600SemiBold not available in package
  headlineSm:       'LibreCaslonText_400Regular',

  // Body
  bodyLg:    'PublicSans_400Regular',
  bodyMd:    'PublicSans_400Regular',
  labelCaps: 'PublicSans_600SemiBold',

  // Stamps & metadata
  labelStamp:        'CourierPrime_700Bold',
  labelStampRegular: 'CourierPrime_400Regular',

  // Legacy aliases for backward compatibility
  regular: 'PublicSans_400Regular',          // was PlayfairDisplay_400Regular
  bold:    'LibreCaslonText_700Bold',        // was PlayfairDisplay_700Bold
};

// Typographic Scale (px)
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

// Spacing
export const SPACING = {
  pageMargin:  20,
  elementGap:  16,
  stackTight:   8,
  stackLoose:  32,

  // Legacy aliases
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

// Border Radius
export const RADIUS = {
  sm:   4,
  md:   8,
  lg:   16,
  xl:   24,
  full: 9999,
};

// Shadows
// Paper-on-desk style shadow
export const SHADOW_PAPER = {
  shadowColor:   '#05152b',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius:  16,
  elevation:     4,
};

// Legacy aliases
export const SHADOW        = SHADOW_PAPER;
export const SHADOW_STRONG = {
  shadowColor:   '#05152b',
  shadowOffset:  { width: 0, height: 6 },
  shadowOpacity: 0.20,
  shadowRadius:  20,
  elevation:     8,
};

// Grainy paper texture pattern color (use as tint in decorative Views)
export const PAPER_PATTERN_COLOR = 'rgba(222, 218, 206, 0.4)';
