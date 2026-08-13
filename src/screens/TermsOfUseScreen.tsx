import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { LegalDocumentViewer } from '../components/LegalDocumentViewer';
import { TERMS_SECTIONS } from '../content/termsContent';
import { CURRENT_TERMS_VERSION, TERMS_LAST_UPDATED } from '../constants/legal';

/**
 * Terms of Use screen — thin wrapper around the shared LegalDocumentViewer
 * (also used by SignUpScreen/ConsentGateScreen's Modal, which render outside
 * any NavigationContainer and so can't call useNavigation() themselves).
 */
export function TermsOfUseScreen() {
  const navigation = useNavigation();

  return (
    <LegalDocumentViewer
      title="Terms of Use"
      version={CURRENT_TERMS_VERSION}
      lastUpdated={TERMS_LAST_UPDATED}
      sections={TERMS_SECTIONS}
      onBack={() => navigation.goBack()}
    />
  );
}
