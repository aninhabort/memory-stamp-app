import { IoniconsName } from '../utils/stampUtils';

// 'special' is reserved for a future secret-badges category — not
// implemented yet, but the type is shaped so adding it later is a
// one-line change, not a restructure.
export type BadgeCategory = 'exploration' | 'memories' | 'places' | 'journal';

export interface InsigniaProgress {
  current: number;
  target: number;
  unit: string;
}

export interface Insignia {
  id: string;
  name: string;
  category: BadgeCategory;
  /** Badge artwork — a `require`d image module id. Falls back to `ionIcon` when absent. */
  image?: number;
  ionIcon: IoniconsName;
  /** Flavor line shown in quotes in the badge detail view — reads naturally whether earned or not. */
  description: string;
  /** How the badge is earned, e.g. "Visit 3 countries." */
  requirement: string;
  unlocked: boolean;
  /** ISO date (YYYY-MM-DD) the badge was earned, best-effort from stamp history. */
  unlockedDate?: string;
  /** Present only for badges with a measurable, countable requirement. */
  progress?: InsigniaProgress;
  /** Display order within its category and across the full collection. */
  order: number;
}
