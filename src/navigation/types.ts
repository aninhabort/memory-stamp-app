import { Stamp } from '../types';

// Main tabs
export type RootTabParamList = {
  Passport: undefined;
  Search: undefined;
  Create: undefined;
  Collection: undefined;
};

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
  PassportHome: undefined;
  StampDetail: { stamp: Stamp };
  EditStamp: { stamp: Stamp };
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
