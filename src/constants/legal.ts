// Single source of truth for the current Terms of Service / Privacy Policy
// versions. Bump the version string (and the "last updated" date) any time
// the content in src/content/termsContent.ts or privacyContent.ts changes.
//
// These are also what the consent gate compares a stored consent record
// against — a version bump here makes every previously-satisfied session
// require re-acceptance on next launch (see ConsentService.isCurrent).

export const CURRENT_TERMS_VERSION = '0.1.0-draft';
export const CURRENT_PRIVACY_VERSION = '0.1.0-draft';

export const TERMS_LAST_UPDATED = 'Draft — not yet published';
export const PRIVACY_LAST_UPDATED = 'Draft — not yet published';
