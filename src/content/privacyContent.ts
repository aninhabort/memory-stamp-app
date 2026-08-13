import { LegalSection } from './legalTypes';

// DRAFT CONTENT — see the banner rendered by LegalDocumentViewer.
// This is a structural placeholder describing what the app actually does
// today. It has not been reviewed by legal counsel and must not be treated
// as a finished policy. Every [TODO: ...] marker needs real input before
// launch — see the plan handoff notes for the full list.
export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Introduction',
    paragraphs: [
      'Memory Stamp ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains what information the app collects, how it is stored, and how it is used.',
      '[TODO: Insert the legal entity name, address, and jurisdiction operating Memory Stamp.]',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: [
      'When you create an account, we collect:',
    ],
    bullets: [
      'Your email address and password (handled by our authentication provider, Supabase)',
      'The name you enter when signing up',
      'Stamps you create (titles, places, dates, categories, notes)',
      'Photos you choose to add to your stamps or profile',
      'Volume (collection) information',
      'A record of your acceptance of these Terms and this Privacy Policy, including the version accepted and the date',
    ],
  },
  {
    title: '3. Where Your Data Is Stored',
    paragraphs: [
      'Your data is stored in two places: locally on your device (so the app works offline), and in our cloud backend (Supabase, running on PostgreSQL and object storage) so your stamps and volumes stay in sync across devices.',
      'Photos you add are uploaded to a private storage bucket associated with your account. Only your account can read or write your own stamps, photos, and volumes — this is enforced at the database level (Row Level Security), not just in the app.',
      '[TODO: Confirm the physical/region location of the Supabase project and whether any sub-processors beyond Supabase are used.]',
    ],
  },
  {
    title: '4. How We Use Your Information',
    paragraphs: ['Your information is used solely to provide the app\'s functionality:'],
    bullets: [
      'To display and sync your stamps and volumes across your devices',
      'To show your name and profile photo within the app',
      'To let you sign in with a password or with Google',
      'To keep a record of your consent to these documents',
    ],
  },
  {
    title: '5. Device Permissions',
    paragraphs: [
      'Memory Stamp only asks for device permissions at the moment you use a feature that needs them — never in advance and never during onboarding.',
    ],
    bullets: [
      'Photo Library — requested only when you tap "Add Photo," so you can choose an existing picture for a stamp or your profile.',
      'Camera — requested only when you tap "Take Photo," so you can capture a new picture for a stamp.',
    ],
  },
  {
    title: '6. Data Sharing',
    paragraphs: [
      'We do not sell your data. We do not use advertising or analytics trackers. Your data is shared only with the service providers required to run the app:',
    ],
    bullets: [
      'Supabase — authentication, database, and file storage',
      'Google — only if you choose to sign in with Google',
    ],
  },
  {
    title: "7. Children's Privacy",
    paragraphs: [
      '[TODO: State the minimum age required to use Memory Stamp and whether the app is directed at children, per applicable law (e.g. COPPA, GDPR-K).]',
    ],
  },
  {
    title: '8. Your Rights',
    paragraphs: ['You can, at any time from within the app:'],
    bullets: [
      'View, edit, or delete any stamp or volume',
      'Change your profile photo and display name',
      'Review the Terms of Service and Privacy Policy versions you accepted',
      'Permanently delete your account and all associated data from Settings → Privacy & Legal → Delete Account',
    ],
  },
  {
    title: '9. Data Retention',
    paragraphs: [
      '[TODO: State how long data is retained after account deletion (e.g. immediate purge vs. a grace/backup window) and any legal basis for retaining specific records.]',
    ],
  },
  {
    title: '10. Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. Material changes will require you to review and re-accept the updated policy before continuing to use the app, and the version/date at the top of this page will reflect the change.',
    ],
  },
  {
    title: '11. Contact Us',
    paragraphs: [
      '[TODO: Insert a real contact method (email/address) for privacy questions and data requests. Until then, use Contact Support within the app.]',
    ],
  },
];
