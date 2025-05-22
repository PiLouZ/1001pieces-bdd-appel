
export interface Appliance {
  id: string;
  reference: string; // Référence technique
  commercialRef?: string; // Référence commerciale
  brand: string;
  type: string;
  dateAdded: string;
  source?: string; // Pour savoir d'où vient l'information (copié/collé, PDF, saisie manuelle)
  additionalInfo?: string; // Pour stocker des informations supplémentaires si nécessaire
  lastUpdated?: string; // Date de dernière mise à jour
}

export type ImportSource = "clipboard" | "pdf" | "manual";

export interface ImportResult {
  success: boolean;
  appliances: Appliance[];
  errors?: string[];
  missingInfo?: Appliance[]; // Appareils avec informations manquantes
  twoColumnsFormat?: boolean; // Indique si les données sont au format 2 colonnes
}

export interface ExportOptions {
  partReference: string;
  format: "csv" | "html";
  includeHeader?: boolean;
}

// Structure pour stocker temporairement les appareils importés
export interface ImportSession {
  id: string; // Identifiant unique de la session
  name?: string; // Nom optionnel de la session
  partReference?: string; // Référence de pièce associée
  appliances: Appliance[]; // Appareils dans la session
  incompleteAppliances?: Appliance[]; // Appareils avec données manquantes
  createdAt: string; // Date de création
  updatedAt?: string; // Date de dernière modification
}

export interface ApplianceEditable {
  value: string;
  isEditing: boolean;
}

export interface ApplianceSelection {
  [id: string]: boolean;
}

// Association entre un appareil et une référence de pièce
export interface AppliancePartAssociation {
  id: string; // ID unique de l'association
  applianceId: string; // ID de l'appareil
  partReference: string; // Référence de la pièce
  dateAssociated: string; // Date de l'association
}
