export type RecordGrade = 'M' | 'NM' | 'VG+' | 'VG' | 'G+' | 'G' | 'P';

export interface VinylRecord {
  id: string;
  title: string;
  artist: string;
  label?: string;
  releaseYear?: number;
  genre?: string;
  mediaGrade: RecordGrade;
  sleeveGrade: RecordGrade;
  purchasePrice?: number;
  purchaseDate?: string;
  estimatedValue?: number;
  notes?: string;
  isWishlist: boolean;
  imageUrl?: string;
}

export interface BudgetState {
  monthlyBudget: number;
  overdraftAllowed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  actionExecuted?: {
    type: string;
    details: string;
  };
}
