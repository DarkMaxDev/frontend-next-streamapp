export interface Episodio {
  numero: number;
  titulo: string;
  url: string;
  createdAt?: string;
}

export interface Temporada {
  numero: number;
  episodios: Episodio[];
}

export interface Content {
  _id: string;
  titulo: string;
  descripcion: string;
  tipo: 'anime' | 'pelicula' | 'serie';
  imagen: string;
  videoUrl?: string;   
  linkTrailer?: string;
  categorias: string[]; 
  episodios?: Episodio[];
  temporadas?: Temporada[];
  isPremium: boolean;
  status?: 'en_emision' | 'finalizada';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  nombre: string;
  contents?: Content[]; 
}

export interface ActiveSession {
  ip: string;
  deviceName: string;
  lastActive: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  plan: 'free' | 'vip';
  hasAds: boolean;
  subscriptionEnd?: string;
  maxSessions: number;
  activeSessions: ActiveSession[];
  maxScreens: number;
  activeScreens: number;
  favoritos: string[];
  createdAt?: string;
  updatedAt?: string;
}