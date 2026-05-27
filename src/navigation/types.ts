import { Stamp } from '../types';

// Main tabs
export type RootTabParamList = {
  Passport: undefined;
  Search: undefined;
  Create: undefined;
  Collection: undefined;
};

// Passport tab stack
export type PassportStackParamList = {
  PassportHome: undefined;
  StampDetail: { stamp: Stamp };
};

// Collection tab stack
export type CollectionStackParamList = {
  CollectionHome: undefined;
  StampDetail: { stamp: Stamp };
};

// Search tab stack
export type SearchStackParamList = {
  SearchHome: undefined;
  StampDetail: { stamp: Stamp };
};
