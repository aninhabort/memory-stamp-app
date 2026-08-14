import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storage';
import { Insignia } from '../types/insignia';

/**
 * Detects badges that unlocked since the user last saw them and surfaces
 * one at a time as a subtle toast — "a new passport stamp arrived", not a
 * gaming achievement popup. The first computation each session only seeds
 * the "seen" set silently (so re-opening the app never re-toasts badges
 * earned in a previous session).
 */
export function useBadgeUnlockToast(badges: Insignia[], stampsLoading: boolean) {
  const { userId } = useAuth();
  const [toastBadge, setToastBadge] = useState<Insignia | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    // Wait for the real stamp history to load — otherwise the first pass
    // sees an empty/stale list, "seeds" against it, and every badge the
    // account already had unlocked reads as newly-unlocked once the real
    // data arrives a moment later.
    if (!userId || stampsLoading) return;

    (async () => {
      const seen = new Set(await StorageService.getSeenBadgeIds(userId) ?? []);
      const unlockedIds = badges.filter(b => b.unlocked).map(b => b.id);

      if (!seededRef.current) {
        seededRef.current = true;
        if (seen.size === 0 && unlockedIds.length > 0) {
          await StorageService.setSeenBadgeIds(userId, unlockedIds);
        }
        return;
      }

      const newlyUnlocked = badges.find(b => b.unlocked && !seen.has(b.id));
      if (newlyUnlocked) {
        setToastBadge(newlyUnlocked);
        await StorageService.setSeenBadgeIds(userId, unlockedIds);
      }
    })();
    // stampsLoading is read above but intentionally left out of the deps:
    // when it flips to false, `badges` (computed from the newly-loaded
    // stamps) changes in lockstep and already re-triggers this effect.
  }, [badges, userId]);

  return { toastBadge, dismissToast: () => setToastBadge(null) };
}
