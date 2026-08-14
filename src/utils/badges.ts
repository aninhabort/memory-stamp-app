// ── Expedition Insignia — badge catalog & compute engine ───────────────────────
//
// The 19 "regular" badges (Special/Secret badges are intentionally not
// implemented yet — see BADGE_DEFS below, which only covers Exploration,
// Memories, Places and Journal). Adding a badge later means adding one
// entry to BADGE_DEFS and, if it has a measurable requirement, one entry
// to CALCULATORS — nothing else in the app needs to change.
//
// Three badges cannot be reliably computed from the current data model and
// are intentionally left permanently locked (never fabricated):
//   - CONTINENTAL EXPLORER — Stamp has no continent field, and `country` is
//     free text (not an ISO code), so mapping it to a continent would be
//     an unreliable guess, not a fact derived from the user's data.
//   - LOCAL EXPLORER — Stamp has no "region" concept (only place/country).
//   - LITTLE MOMENTS — "small/personal memory" isn't a field or a
//     derivable property of a Stamp.
// Each is marked `computable: false` below and surfaces in the UI as an
// always-locked badge with its requirement text only, no invented progress.

import { Stamp } from '../types';
import { BadgeCategory, Insignia, InsigniaProgress } from '../types/insignia';
import { IoniconsName } from './stampUtils';

import imgFirstJourney       from '../assets/images/insignias/first-journey.png';
import imgWorldCitizen       from '../assets/images/insignias/world-citizen.png';
import imgGlobetrotter       from '../assets/images/insignias/globe-trotter.png';
import imgContinentalExplorer from '../assets/images/insignias/continental-explorer.png';
import imgOffTheMap          from '../assets/images/insignias/off-the-map.png';
import imgFirstSnapshot      from '../assets/images/insignias/first-snapshot.png';
import imgPicturePerfect     from '../assets/images/insignias/picture-perfect.png';
import imgStoryCollector     from '../assets/images/insignias/story-collector.png';
import imgDearDiary          from '../assets/images/insignias/dear-diary.png';
import imgCityHopper         from '../assets/images/insignias/city-hopper.png';
import imgUrbanExplorer      from '../assets/images/insignias/urban-explorer.png';
import imgLocalExplorer      from '../assets/images/insignias/local-explorer.png';
import imgNewHorizons        from '../assets/images/insignias/new-horizons.png';
import imgTheChronicler      from '../assets/images/insignias/the-chronicler.png';
import imgMemoryLane         from '../assets/images/insignias/memory-lane.png';
import imgTimeTraveler       from '../assets/images/insignias/time-traveler.png';
import imgLittleMoments      from '../assets/images/insignias/little-moments.png';
import imgKeepsake           from '../assets/images/insignias/keepsake.png';
// MEMORY MAKER has no artwork file yet (18 of 19 badges were supplied) —
// it falls back to an Ionicon like any badge without `image` until the
// asset is added; no artwork was generated to fill the gap.

export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  exploration: 'EXPLORATION',
  memories:    'MEMORIES',
  places:      'PLACES',
  journal:     'JOURNAL',
};

export const CATEGORY_ORDER: BadgeCategory[] = ['exploration', 'memories', 'places', 'journal'];

interface BadgeDef {
  id: string;
  name: string;
  category: BadgeCategory;
  image?: number;
  ionIcon: IoniconsName;
  description: string;
  requirement: string;
  order: number;
  /** false = flagged as not reliably computable from the current data model (see header note). */
  computable: boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  // ── Exploration ──────────────────────────────────────────────────────────
  { id: 'first_journey', name: 'First Journey', category: 'exploration', image: imgFirstJourney, ionIcon: 'flag-outline',
    description: 'Your first memory has been recorded.', requirement: 'Create your first Memory Stamp.', order: 1, computable: true },
  { id: 'world_citizen', name: 'World Citizen', category: 'exploration', image: imgWorldCitizen, ionIcon: 'earth-outline',
    description: 'Memories recorded across three different countries.', requirement: 'Record memories in 3 different countries.', order: 2, computable: true },
  { id: 'globetrotter', name: 'Globetrotter', category: 'exploration', image: imgGlobetrotter, ionIcon: 'airplane-outline',
    description: 'See where your memories can take you.', requirement: 'Record memories in 5 different countries.', order: 3, computable: true },
  { id: 'continental_explorer', name: 'Continental Explorer', category: 'exploration', image: imgContinentalExplorer, ionIcon: 'globe-outline',
    description: 'Memories spanning three different continents.', requirement: 'Record memories across 3 different continents.', order: 4, computable: false },
  { id: 'off_the_map', name: 'Off The Map', category: 'exploration', image: imgOffTheMap, ionIcon: 'compass-outline',
    description: 'A new destination, off the beaten path.', requirement: "Record a memory in a destination that hasn't been recorded before.", order: 5, computable: true },

  // ── Memories ─────────────────────────────────────────────────────────────
  { id: 'first_snapshot', name: 'First Snapshot', category: 'memories', image: imgFirstSnapshot, ionIcon: 'camera-outline',
    description: 'Your first photograph, kept forever.', requirement: 'Add the first photo to a Memory Stamp.', order: 6, computable: true },
  { id: 'memory_maker', name: 'Memory Maker', category: 'memories', ionIcon: 'images-outline',
    description: 'Ten photographs, ten memories made.', requirement: 'Collect 10 photos.', order: 7, computable: true },
  { id: 'picture_perfect', name: 'Picture Perfect', category: 'memories', image: imgPicturePerfect, ionIcon: 'image-outline',
    description: 'Twenty-five photographs — a gallery of memories.', requirement: 'Collect 25 photos.', order: 8, computable: true },
  { id: 'story_collector', name: 'Story Collector', category: 'memories', image: imgStoryCollector, ionIcon: 'albums-outline',
    description: 'Ten entries, ten stories collected.', requirement: 'Create 10 Memory Stamp entries.', order: 9, computable: true },
  { id: 'dear_diary', name: 'Dear Diary', category: 'memories', image: imgDearDiary, ionIcon: 'book-outline',
    description: 'Your own words, kept alongside the memories.', requirement: 'Add notes to 3 Memory Stamp entries.', order: 10, computable: true },

  // ── Places ───────────────────────────────────────────────────────────────
  { id: 'city_hopper', name: 'City Hopper', category: 'places', image: imgCityHopper, ionIcon: 'business-outline',
    description: 'Three cities, three sets of memories.', requirement: 'Record memories in 3 different cities.', order: 11, computable: true },
  { id: 'urban_explorer', name: 'Urban Explorer', category: 'places', image: imgUrbanExplorer, ionIcon: 'map-outline',
    description: 'Five cities explored and recorded.', requirement: 'Record memories in 5 different cities.', order: 12, computable: true },
  { id: 'local_explorer', name: 'Local Explorer', category: 'places', image: imgLocalExplorer, ionIcon: 'location-outline',
    description: 'More than one corner of the same region, explored.', requirement: 'Record multiple places within the same region.', order: 13, computable: false },
  { id: 'new_horizons', name: 'New Horizons', category: 'places', image: imgNewHorizons, ionIcon: 'sunny-outline',
    description: 'A new city on the map.', requirement: "Record a memory in a city that hasn't been recorded before.", order: 14, computable: true },

  // ── Journal ──────────────────────────────────────────────────────────────
  { id: 'the_chronicler', name: 'The Chronicler', category: 'journal', image: imgTheChronicler, ionIcon: 'create-outline',
    description: 'Ten entries, each with a story of its own.', requirement: 'Create 10 Memory Stamp entries containing notes.', order: 15, computable: true },
  { id: 'memory_lane', name: 'Memory Lane', category: 'journal', image: imgMemoryLane, ionIcon: 'calendar-outline',
    description: 'A stroll down memory lane, month after month.', requirement: 'Record memories across 3 different months.', order: 16, computable: true },
  { id: 'time_traveler', name: 'Time Traveler', category: 'journal', image: imgTimeTraveler, ionIcon: 'time-outline',
    description: 'Memories that span across the years.', requirement: 'Record memories across 2 different years.', order: 17, computable: true },
  { id: 'little_moments', name: 'Little Moments', category: 'journal', image: imgLittleMoments, ionIcon: 'heart-outline',
    description: 'The small moments, remembered too.', requirement: 'Collect multiple small, personal memories.', order: 18, computable: false },
  { id: 'keepsake', name: 'Keepsake', category: 'journal', image: imgKeepsake, ionIcon: 'ribbon-outline',
    description: 'One entry, every detail kept.', requirement: 'Create a Memory Stamp with a photo, a note, and a location.', order: 19, computable: true },
];

// ── Date helpers — best-effort "earned on" dates derived from the stamp
// history itself, never a separately persisted unlock timestamp. ────────────

function dateOfNth(byDate: Stamp[], n: number): string | undefined {
  return byDate[n - 1]?.date;
}

function dateOfFirstMatch(byDate: Stamp[], predicate: (s: Stamp) => boolean): string | undefined {
  return byDate.find(predicate)?.date;
}

function dateWhenDistinctReaches(
  byDate: Stamp[],
  keyOf: (s: Stamp) => string | undefined,
  threshold: number,
): string | undefined {
  const seen = new Set<string>();
  for (const s of byDate) {
    const key = keyOf(s);
    if (key) seen.add(key);
    if (seen.size >= threshold) return s.date;
  }
  return undefined;
}

function dateWhenCountReaches(
  byDate: Stamp[],
  predicate: (s: Stamp) => boolean,
  threshold: number,
): string | undefined {
  let count = 0;
  for (const s of byDate) {
    if (predicate(s)) {
      count++;
      if (count >= threshold) return s.date;
    }
  }
  return undefined;
}

function dateWhenCumulativeReaches(
  byDate: Stamp[],
  valueOf: (s: Stamp) => number,
  threshold: number,
): string | undefined {
  let sum = 0;
  for (const s of byDate) {
    sum += valueOf(s);
    if (sum >= threshold) return s.date;
  }
  return undefined;
}

// ── Shared field readers ────────────────────────────────────────────────────

const photoCountOf  = (s: Stamp) => s.photos?.length ?? (s.photo ? 1 : 0);
const hasPhoto       = (s: Stamp) => photoCountOf(s) > 0;
const hasNote        = (s: Stamp) => !!s.note?.trim();
const countryKey     = (s: Stamp) => s.country || undefined;
const cityKey        = (s: Stamp) => s.place || undefined;
const monthKey       = (s: Stamp) => s.date.slice(0, 7);      // YYYY-MM
const yearKey        = (s: Stamp) => s.date.slice(0, 4);      // YYYY

interface CalcResult {
  unlocked: boolean;
  unlockedDate?: string;
  progress?: InsigniaProgress;
}

type Calculator = (stamps: Stamp[], byDate: Stamp[]) => CalcResult;

function distinctCalculator(
  keyOf: (s: Stamp) => string | undefined,
  target: number,
  unit: string,
): Calculator {
  return (stamps, byDate) => {
    const distinct = new Set(stamps.map(keyOf).filter((v): v is string => !!v));
    const current = Math.min(distinct.size, target);
    return {
      unlocked: distinct.size >= target,
      unlockedDate: distinct.size >= target ? dateWhenDistinctReaches(byDate, keyOf, target) : undefined,
      progress: { current, target, unit },
    };
  };
}

function countCalculator(
  predicate: (s: Stamp) => boolean,
  target: number,
  unit: string,
): Calculator {
  return (stamps, byDate) => {
    const count = stamps.filter(predicate).length;
    const current = Math.min(count, target);
    return {
      unlocked: count >= target,
      unlockedDate: count >= target ? dateWhenCountReaches(byDate, predicate, target) : undefined,
      progress: { current, target, unit },
    };
  };
}

function cumulativeCalculator(
  valueOf: (s: Stamp) => number,
  target: number,
  unit: string,
): Calculator {
  return (stamps, byDate) => {
    const total = stamps.reduce((acc, s) => acc + valueOf(s), 0);
    const current = Math.min(total, target);
    return {
      unlocked: total >= target,
      unlockedDate: total >= target ? dateWhenCumulativeReaches(byDate, valueOf, target) : undefined,
      progress: { current, target, unit },
    };
  };
}

const CALCULATORS: Record<string, Calculator> = {
  first_journey: (stamps, byDate) => ({
    unlocked: stamps.length >= 1,
    unlockedDate: dateOfNth(byDate, 1),
  }),
  world_citizen: distinctCalculator(countryKey, 3, 'COUNTRIES'),
  globetrotter:  distinctCalculator(countryKey, 5, 'COUNTRIES'),
  // "not previously recorded" — read as reaching your 2nd distinct country,
  // i.e. the first time a memory lands somewhere other than your original spot.
  off_the_map: (stamps, byDate) => {
    const distinctCountries = new Set(stamps.map(countryKey).filter((v): v is string => !!v));
    const unlocked = distinctCountries.size >= 2;
    return { unlocked, unlockedDate: unlocked ? dateWhenDistinctReaches(byDate, countryKey, 2) : undefined };
  },

  first_snapshot: (stamps, byDate) => {
    const unlocked = stamps.some(hasPhoto);
    return { unlocked, unlockedDate: unlocked ? dateOfFirstMatch(byDate, hasPhoto) : undefined };
  },
  memory_maker:    cumulativeCalculator(photoCountOf, 10, 'PHOTOS'),
  picture_perfect: cumulativeCalculator(photoCountOf, 25, 'PHOTOS'),
  story_collector: countCalculator(() => true, 10, 'ENTRIES'),
  dear_diary:      countCalculator(hasNote, 3, 'ENTRIES'),

  city_hopper:    distinctCalculator(cityKey, 3, 'CITIES'),
  urban_explorer: distinctCalculator(cityKey, 5, 'CITIES'),
  // Same "not previously recorded" reading as OFF THE MAP, but city-level.
  new_horizons: (stamps, byDate) => {
    const distinctCities = new Set(stamps.map(cityKey).filter((v): v is string => !!v));
    const unlocked = distinctCities.size >= 2;
    return { unlocked, unlockedDate: unlocked ? dateWhenDistinctReaches(byDate, cityKey, 2) : undefined };
  },

  the_chronicler: countCalculator(hasNote, 10, 'ENTRIES'),
  memory_lane:    distinctCalculator(monthKey, 3, 'MONTHS'),
  time_traveler:  distinctCalculator(yearKey, 2, 'YEARS'),
  keepsake: (stamps, byDate) => {
    const complete = (s: Stamp) => hasPhoto(s) && hasNote(s) && !!s.place?.trim();
    const unlocked = stamps.some(complete);
    return { unlocked, unlockedDate: unlocked ? dateOfFirstMatch(byDate, complete) : undefined };
  },
};

// ── Public API ───────────────────────────────────────────────────────────────

export function computeBadges(stamps: Stamp[]): Insignia[] {
  const byDate = stamps.slice().sort((a, b) => a.date.localeCompare(b.date));

  return BADGE_DEFS
    .map((def): Insignia => {
      const calc = def.computable ? CALCULATORS[def.id]?.(stamps, byDate) : undefined;
      return {
        id: def.id,
        name: def.name,
        category: def.category,
        image: def.image,
        ionIcon: def.ionIcon,
        description: def.description,
        requirement: def.requirement,
        order: def.order,
        unlocked: calc?.unlocked ?? false,
        unlockedDate: calc?.unlockedDate,
        progress: calc?.progress,
      };
    })
    .sort((a, b) => a.order - b.order);
}

// Badges featured on the Profile screen's compact grid — a curated subset,
// not the full 19, entirely data-driven (no hardcoded "headline" ids so it
// can never go stale as badges are earned):
//   1. Unlocked badges, in catalog order — the user's actual collection so far.
//   2. Locked badges with measurable progress, closest-to-unlocking first —
//      what's within reach next.
//   3. Remaining locked badges (no measurable progress), in catalog order.
export function curateProfileBadges(badges: Insignia[], limit = 8): Insignia[] {
  const unlocked = badges
    .filter(b => b.unlocked)
    .sort((a, b) => a.order - b.order);

  const locked = badges.filter(b => !b.unlocked);

  const lockedWithProgress = locked
    .filter((b): b is Insignia & { progress: InsigniaProgress } => !!b.progress)
    .sort((a, b) => {
      const ratioA = a.progress.current / a.progress.target;
      const ratioB = b.progress.current / b.progress.target;
      if (ratioB !== ratioA) return ratioB - ratioA; // closest to unlocking first
      return a.order - b.order;
    });

  const lockedWithoutProgress = locked
    .filter(b => !b.progress)
    .sort((a, b) => a.order - b.order);

  return [...unlocked, ...lockedWithProgress, ...lockedWithoutProgress].slice(0, limit);
}
