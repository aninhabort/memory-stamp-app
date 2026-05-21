/**
 * Shared stamp utilities — single source of truth for helpers that were
 * previously duplicated across StampCard, StampDetailScreen, CollectionScreen,
 * and SearchScreen.
 */

import type React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { Stamp } from '../types';

// ── Type alias ────────────────────────────────────────────────────────────────
export type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ── Category maps ─────────────────────────────────────────────────────────────

/** Human-readable category labels in Portuguese */
export const CATEGORY_LABELS: Record<Stamp['category'], string> = {
  viagem:      'Viagem',
  show:        'Show',
  restaurante: 'Restaurante',
  evento:      'Evento',
  outro:       'Outro',
};

/** Human-readable category labels in English (Search screen / itinerary style) */
export const CATEGORY_LABELS_EN: Record<Stamp['category'], string> = {
  viagem:      'Expedition',
  show:        'Performance',
  restaurante: 'Gastronomy',
  evento:      'Event',
  outro:       'Miscellaneous',
};

/** Default Ionicons icon per category */
export const CATEGORY_ICONS: Record<Stamp['category'], IoniconsName> = {
  viagem:      'airplane-outline',
  show:        'musical-notes-outline',
  restaurante: 'restaurant-outline',
  evento:      'calendar-outline',
  outro:       'star-outline',
};

// ── Photo helpers ─────────────────────────────────────────────────────────────

/**
 * Returns all photo URIs for a stamp, supporting both the current `photos[]`
 * array and the legacy `photo` string field.
 */
export function resolvePhotos(stamp: Stamp): string[] {
  if (stamp.photos && stamp.photos.length > 0) return stamp.photos;
  if (stamp.photo) return [stamp.photo];
  return [];
}

/**
 * Returns the first (cover) photo URI, or undefined if none exists.
 * Handles both `photos[]` and the legacy `photo` field.
 */
export function resolveCoverPhoto(stamp: Stamp): string | undefined {
  return stamp.photos?.[0] ?? stamp.photo;
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

/**
 * Resolves the Ionicons icon name for a stamp.
 * Uses the stamp's `icon` field if it is a valid Ionicons name; falls back to
 * the default category icon otherwise.
 */
export function resolveStampIcon(stamp: Stamp): IoniconsName {
  if (stamp.icon && /^[a-z][a-z0-9-]+$/.test(stamp.icon)) {
    return stamp.icon as IoniconsName;
  }
  return CATEGORY_ICONS[stamp.category];
}

// ── Date formatters ───────────────────────────────────────────────────────────

// Private month arrays — not exported; use the formatter functions instead.
const MONTHS_SHORT_EN = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTHS_ABBR_PT  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_LONG_PT  = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];

/**
 * "2024-01-20" → "Jan 2024"
 * Used by StampCard for compact date labels.
 */
export function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${MONTHS_ABBR_PT[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

/**
 * "2024-01-20" → "20.JAN.24"
 * Passport arrival-stamp style used in StampDetailScreen.
 */
export function formatArrivalDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${MONTHS_SHORT_EN[parseInt(parts[1], 10) - 1]}.${parts[0].slice(-2)}`;
}

/**
 * "2024-01-20" → "20 de janeiro de 2024"
 * Long-form Portuguese date used in StampDetailScreen metadata.
 */
export function formatDateLong(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[2], 10)} de ${MONTHS_LONG_PT[parseInt(parts[1], 10) - 1]} de ${parts[0]}`;
}

/**
 * Formats a Date object as the decorative header code used in CreateStampScreen.
 * Example: new Date('2026-05-20') → "MS-2026-MAY-20"
 *
 * Called at component-mount time (not module-load) so the date is always fresh.
 */
export function formatDecoDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  return `MS-${date.getFullYear()}-${MONTHS_SHORT_EN[date.getMonth()]}-${day}`;
}

// ── Stamp identity helpers ────────────────────────────────────────────────────

/**
 * Generates a short entry code from a stamp's country/place and year.
 * Example: { country: 'Portugal', date: '2026-05-20' } → "PT-2026"
 */
export function getEntryCode(stamp: Stamp): string {
  const source = (stamp.country || stamp.place).trim();
  const prefix = source.slice(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
  const year   = stamp.date.split('-')[0];
  return `${prefix}-${year}`;
}

/**
 * Returns a deterministic card rotation string between -2° and +2°,
 * derived from the stamp id. Gives the passport/scrapbook tilt effect.
 */
export function getCardRotation(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `${(sum % 5) - 2}deg`;
}

/**
 * Returns a deterministic 3-digit "negative number" for the photo caption
 * ("Negative #042 — Silver Halide Print"), derived from the stamp id.
 */
export function getNegativeNumber(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return String((sum % 900) + 100).padStart(3, '0');
}

// ── User / profile helpers ────────────────────────────────────────────────────

/** Derives up to 2 uppercase initials from a display name. */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** Returns a deterministic document-style number derived from the user's name. */
export function getDocNo(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `DOC-${(hash % 9000) + 1000}`;
}
