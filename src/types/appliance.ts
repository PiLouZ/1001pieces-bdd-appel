
export interface Appliance {
  id: string;
  reference: string;
  brand: string;
  type: string;
  dateAdded: string;
  source?: string; // Pour savoir d'où vient l'information (copié/collé, PDF, saisie manuelle)
  additionalInfo?: string; // Pour stocker des informations supplémentaires si nécessaire
}

export type ImportSource = "clipboard" | "pdf" | "manual";

export interface ImportResult {
  success: boolean;
  appliances: Appliance[];
  errors?: string[];
}
