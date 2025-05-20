
export interface Appliance {
  id: string;
  reference: string; // Référence technique
  commercialRef?: string; // Référence commerciale
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
  missingInfo?: Appliance[]; // Appareils avec informations manquantes
}

export interface ExportOptions {
  partReference: string;
  format: "csv" | "html";
  includeHeader?: boolean;
}

// Structure pour stocker temporairement les appareils importés
export interface ImportSession {
  partReference: string;
  appliances: Appliance[];
  createdAt: string;
}
