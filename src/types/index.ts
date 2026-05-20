export interface Stamp {
  id: string;
  title: string;
  date: string;
  place: string;
  country?: string;
  category: 'viagem' | 'show' | 'restaurante' | 'evento' | 'outro';
  photo?: string;      // legado — preferir photos
  photos?: string[];   // array de URIs (versão atual)
  color: string;
  icon: string;
  note?: string;
  createdAt: string;
}
