/**
 * Represents a memory stamp entry in the passport journal.
 * Each stamp captures a moment in time with photos, location, and metadata.
 */
export interface Stamp {
  /** Unique identifier for the stamp */
  id: string;

  /** Display title/name of the memory */
  title: string;

  /** ISO date string (YYYY-MM-DD) of when the memory occurred */
  date: string;

  /** City or location name where the memory took place */
  place: string;

  /** Country or territory (optional) */
  country?: string;

  /** Category classification for the stamp */
  category: 'viagem' | 'show' | 'restaurante' | 'evento' | 'outro';

  /** @deprecated Legacy single photo URI - use `photos` array instead */
  photo?: string;

  /** Array of photo URIs associated with this stamp (current version) */
  photos?: string[];

  /** Hex color code for the stamp's accent color */
  color: string;

  /** Ionicons icon name or custom emoji for the stamp */
  icon: string;

  /** Optional field notes or description of the memory */
  note?: string;

  /** ISO timestamp of when the stamp was created */
  createdAt: string;

  /** ISO timestamp of the last edit. Used to resolve sync conflicts in favor of the most recent write. */
  updatedAt?: string;

  /** Volume/passport ID this stamp belongs to (defaults to 'default' volume when absent) */
  volumeId?: string;

  /**
   * ISO timestamp set when the stamp is deleted. Kept (instead of removing
   * the record outright) as a tombstone so that a sync from another device
   * still holding the pre-deletion copy can't resurrect it — the tombstone's
   * updatedAt always wins the last-write-wins merge. Hidden from the UI.
   */
  deletedAt?: string;
}

/**
 * Represents a volume (passport book) collection of stamps.
 * Volumes help organize stamps into distinct books/journals.
 */
export interface Volume {
  /** Unique identifier for the volume */
  id: string;

  /** Display name of the volume (e.g., "Passaporte", "Travel 2024") */
  name: string;

  /** Formatted volume label in Roman numerals (e.g., "VOLUME I", "VOLUME II") */
  volumeLabel: string;

  /** Establishment year label (e.g., "EST. 2024") */
  year: string;

  /** ISO timestamp of when the volume was created */
  createdAt: string;

  /** ISO timestamp of the last change (creation or deletion). Used to resolve sync conflicts in favor of the most recent write. */
  updatedAt?: string;

  /** ISO timestamp set when the volume is deleted. See `Stamp.deletedAt` for why this is a tombstone rather than an outright removal. */
  deletedAt?: string;
}
