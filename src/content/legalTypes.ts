// Shared shape for the structured content rendered by LegalDocumentViewer.
// Keeping this as plain data (rather than JSX) lets both the in-app document
// screens and the sign-up/consent-gate modal render identical content
// without duplicating markup.
export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}
