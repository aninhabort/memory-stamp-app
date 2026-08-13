import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { LegalDocumentViewer } from '../components/LegalDocumentViewer';
import { PRIVACY_SECTIONS } from '../content/privacyContent';
import { CURRENT_PRIVACY_VERSION, PRIVACY_LAST_UPDATED } from '../constants/legal';

/**
 * Privacy Policy screen — thin wrapper around the shared LegalDocumentViewer
 * (also used by SignUpScreen/ConsentGateScreen's Modal, which render outside
 * any NavigationContainer and so can't call useNavigation() themselves).
 */
export function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <LegalDocumentViewer
      title="Privacy Policy"
      version={CURRENT_PRIVACY_VERSION}
      lastUpdated={PRIVACY_LAST_UPDATED}
      sections={PRIVACY_SECTIONS}
      onBack={() => navigation.goBack()}
    />
  );
}
