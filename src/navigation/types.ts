import { Stamp } from '../types';

// Abas principais
export type RootTabParamList = {
  Passaporte: undefined;
  Buscar: undefined;
  Criar: undefined;
  'Coleção': undefined;
};

// Stack interno da aba Passaporte
export type PassporteStackParamList = {
  PassaporteHome: undefined;
  StampDetail: { stamp: Stamp };
};

// Stack interno da aba Coleção
export type ColeçãoStackParamList = {
  ColeçãoHome: undefined;
  StampDetail: { stamp: Stamp };
};

// Stack interno da aba Buscar
export type BuscarStackParamList = {
  BuscarHome: undefined;
  StampDetail: { stamp: Stamp };
};
