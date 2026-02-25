
export enum AppSection {
  FEATURED = 'FEATURED',
  BUILD = 'BUILD',
  FIX = 'FIX',
  CHAT = 'CHAT'
}

export interface MarketProduct {
  name: string;
  price: number | string;
  retailer: string; // 'Best Buy' | 'Newegg' | 'B&H' | 'Microcenter'
  url: string;
  sku: string;
  rating?: number;
  reviews?: number;
  in_stock_online: boolean;
  image: string;
}

export interface PCPart {
  category: string;
  partName: string;
  price: string | number;
  link: string;
  image: string;
  why: string;
}

export interface FeaturedBuildTemplate {
  id: string;
  name: string;
  useCase: string;
  specs: string;
  heroImage: string;
  baseParts: string[]; // List of part names for query
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isToolCall?: boolean;
  image?: string; // Base64 string for uploaded images
}

export interface SavedBuild {
  id: string;
  name: string;
  createdAt: number;
  messages: ChatMessage[];
}
