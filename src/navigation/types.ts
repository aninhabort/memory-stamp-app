import { NavigatorScreenParams } from '@react-navigation/native';
import { Stamp } from '../types';

// Settings and the screens reachable from it. Shared by any stack that wants
// to expose the profile/settings area (e.g. Passport and Collection tabs).
export type SettingsStackParamList = {
  Settings: undefined;
  ContactSupport: undefined;
  FAQ: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
};

// Passport tab stack
export type PassportStackParamList = SettingsStackParamList & {
  PassportHome: { autoOpen?: boolean } | undefined;
  StampDetail: { stamp: Stamp };
  EditStamp: { stamp: Stamp };
};

// Main tabs
export type RootTabParamList = {
  Passport: NavigatorScreenParams<PassportStackParamList> | undefined;
  Search: undefined;
  Create: undefined;
  Collection: undefined;
};

// Collection tab stack
export type CollectionStackParamList = SettingsStackParamList & {
  CollectionHome: undefined;
  StampDetail: { stamp: Stamp };
  EditStamp: { stamp: Stamp };
};

// Search tab stack
export type SearchStackParamList = {
  SearchHome: undefined;
  StampDetail: { stamp: Stamp };
  EditStamp: { stamp: Stamp };
};
