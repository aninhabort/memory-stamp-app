import { LegalSection } from './legalTypes';

// DRAFT CONTENT — see the banner rendered by LegalDocumentViewer.
// This is a structural placeholder describing what the app actually does
// today. It has not been reviewed by legal counsel and must not be treated
// as a finished terms document. Every [TODO: ...] marker needs real input
// before launch — see the plan handoff notes for the full list.
export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By creating an account or using Memory Stamp, you agree to be bound by these Terms of Use and the Privacy Policy. If you do not agree, do not create an account or use the app.',
      '[TODO: Insert the legal entity name, address, and jurisdiction operating Memory Stamp.]',
    ],
  },
  {
    title: '2. Accounts',
    paragraphs: [
      'You need an account to use Memory Stamp. You are responsible for keeping your login credentials secure and for all activity under your account.',
      '[TODO: State the minimum age required to create an account.]',
    ],
  },
  {
    title: '3. License',
    paragraphs: [
      'Memory Stamp grants you a limited, non-exclusive, non-transferable, revocable license to use the app for personal, non-commercial purposes in accordance with these terms.',
    ],
  },
  {
    title: '4. User Responsibilities',
    paragraphs: ['You agree to:'],
    bullets: [
      'Use the app only for lawful purposes',
      'Not attempt to reverse engineer, decompile, or disassemble the app',
      'Not use the app in any way that could damage, disable, or impair it or its backend services',
      'Maintain the security of your device, account credentials, and app data',
      'Not upload or share content that infringes on others\' rights',
    ],
  },
  {
    title: '5. Content Ownership',
    paragraphs: [
      'You retain all rights to the content you create in Memory Stamp, including stamps, photos, notes, and other materials. We do not claim ownership of your content.',
      'You are responsible for ensuring you have the necessary rights to any photos or content you add to the app.',
    ],
  },
  {
    title: '6. Device Permissions',
    paragraphs: [
      'The app requests camera and photo library access only at the moment you use a feature that needs them (e.g. "Add Photo" or "Take Photo"), never in advance. You can review or change these permissions at any time in Settings → Privacy & Legal, or in your device system settings.',
    ],
  },
  {
    title: '7. Data and Backups',
    paragraphs: [
      'Your stamps and volumes are synced to our cloud backend so they are not lost if you switch devices, in addition to being cached locally on your device. You are still encouraged to be mindful of what you store, since no service is guaranteed against data loss.',
      'We are not responsible for data loss due to device failure, account deletion, or events outside our control.',
    ],
  },
  {
    title: '8. Account Deletion',
    paragraphs: [
      'You may permanently delete your account and all associated data at any time from Settings → Privacy & Legal → Delete Account. This action is irreversible: once confirmed, your stamps, photos, volumes, and account record are permanently removed.',
    ],
  },
  {
    title: '9. Disclaimer of Warranties',
    paragraphs: [
      'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.',
      'We do not warrant that the app will be error-free, uninterrupted, or free from harmful components.',
    ],
  },
  {
    title: '10. Limitation of Liability',
    paragraphs: [
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, OR DATA, ARISING FROM YOUR USE OF THE APP.',
    ],
  },
  {
    title: '11. Updates and Modifications',
    paragraphs: [
      'We may update, modify, or discontinue the app at any time. We may also modify these Terms of Use; material changes will require you to review and re-accept them before continuing to use the app.',
    ],
  },
  {
    title: '12. Termination',
    paragraphs: [
      'We reserve the right to suspend or terminate your access to the app for violation of these terms. You may stop using the app and delete your account at any time.',
    ],
  },
  {
    title: '13. Governing Law',
    paragraphs: [
      '[TODO: Insert the governing law and jurisdiction for these terms.]',
    ],
  },
  {
    title: '14. Contact Information',
    paragraphs: [
      '[TODO: Insert a real contact method for questions about these Terms. Until then, use Contact Support within the app.]',
    ],
  },
];
