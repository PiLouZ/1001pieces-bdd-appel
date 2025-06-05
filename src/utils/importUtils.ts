
import { Appliance, ImportSource } from "@/types/appliance";

export interface ProcessedRow {
  reference: string;
  commercialRef?: string;
  brand?: string;
  type?: string;
}

// Fonction utilitaire pour détecter et parser les séparateurs
const detectAndParseLine = (line: string): string[] => {
  // Essayer d'abord avec les tabulations
  const tabParts = line.split('\t').map(part => part.trim()).filter(Boolean);
  if (tabParts.length > 1) {
    return tabParts;
  }
  
  // Essayer ensuite avec les points-virgules
  const semicolonParts = line.split(';').map(part => part.trim()).filter(Boolean);
  if (semicolonParts.length > 1) {
    return semicolonParts;
  }
  
  // Si aucun séparateur trouvé, retourner la ligne entière
  return [line.trim()];
};

export const parseClipboardData = (
  clipboardText: string,
  getApplianceByReference?: (ref: string) => Appliance | undefined,
  getApplianceByCommercialRef?: (ref: string) => Appliance | undefined,
  suggestBrand?: (ref: string) => string | null,
  suggestType?: (ref: string, brand: string) => string | null
): {
  success: boolean;
  appliances: Appliance[];
  errors?: string[];
  missingInfo?: Appliance[];
  twoColumnsFormat?: boolean;
} => {
  console.log("Traitement de", clipboardText.split('\n').length, "lignes");
  const startTime = performance.now();
  
  try {
    const lines = clipboardText.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { success: false, appliances: [], errors: ["Aucune donnée trouvée"] };
    }

    // Détecter le format en analysant la première ligne
    const firstLine = lines[0];
    const parsedFirstLine = detectAndParseLine(firstLine);
    const columns = parsedFirstLine.length;

    console.log(`Format détecté: ${columns} colonnes`);
    console.log(`Séparateur détecté: ${firstLine.includes('\t') ? 'tabulation' : firstLine.includes(';') ? 'point-virgule' : 'aucun'}`);

    if (columns === 2) {
      // Format à 2 colonnes : Référence technique, Référence commerciale
      return parseTwoColumnFormat(lines, getApplianceByReference, getApplianceByCommercialRef, suggestBrand, suggestType);
    } else if (columns >= 4) {
      // Format à 4 colonnes : Type, Marque, Référence technique, Référence commerciale
      return parseFourColumnFormat(lines);
    } else {
      return { 
        success: false, 
        appliances: [], 
        errors: [`Format non reconnu. ${columns} colonnes détectées. Formats acceptés : 2 ou 4 colonnes.`] 
      };
    }
  } catch (error) {
    console.error("Erreur lors du parsing:", error);
    return { 
      success: false, 
      appliances: [], 
      errors: [`Erreur lors de l'analyse des données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`] 
    };
  } finally {
    const endTime = performance.now();
    console.log(`Traitement terminé en ${endTime - startTime}ms`);
  }
};

const parseTwoColumnFormat = (
  lines: string[],
  getApplianceByReference?: (ref: string) => Appliance | undefined,
  getApplianceByCommercialRef?: (ref: string) => Appliance | undefined,
  suggestBrand?: (ref: string) => string | null,
  suggestType?: (ref: string, brand: string) => string | null
) => {
  const appliances: Appliance[] = [];
  const errors: string[] = [];
  const needsUserInput: Appliance[] = [];
  
  lines.forEach((line, index) => {
    const parts = detectAndParseLine(line);
    
    if (parts.length >= 2) {
      const reference = parts[0];
      const commercialRef = parts[1];
      
      console.log(`🔍 Recherche de correspondance pour référence technique: ${reference}, commerciale: ${commercialRef}`);
      
      // Étape 1: Chercher d'abord une correspondance exacte par référence technique
      let exactMatch = getApplianceByReference ? getApplianceByReference(reference) : undefined;
      
      if (exactMatch) {
        console.log(`✅ Correspondance exacte trouvée par référence technique: ${reference} -> ${exactMatch.brand} ${exactMatch.type}`);
      } else {
        console.log(`❌ Aucune correspondance par référence technique: ${reference}`);
        
        // Étape 2: Si pas trouvé par référence technique, chercher par référence commerciale
        if (commercialRef && getApplianceByCommercialRef) {
          exactMatch = getApplianceByCommercialRef(commercialRef);
          if (exactMatch) {
            console.log(`✅ Correspondance exacte trouvée par référence commerciale: ${commercialRef} -> ${exactMatch.brand} ${exactMatch.type}`);
          } else {
            console.log(`❌ Aucune correspondance par référence commerciale: ${commercialRef}`);
          }
        }
      }
      
      let brand = "";
      let type = "";
      let needsCompletion = false;
      
      if (exactMatch) {
        // Correspondance exacte trouvée, utiliser les données existantes
        brand = exactMatch.brand || "";
        type = exactMatch.type || "";
        console.log(`📋 Utilisation des données existantes: ${brand} ${type}`);
      } else {
        // Aucune correspondance exacte, demander à l'utilisateur
        console.log(`⚠️ Aucune correspondance exacte pour ${reference}/${commercialRef}, demande d'intervention utilisateur`);
        needsCompletion = true;
        
        // On peut suggérer mais ne pas auto-compléter
        const suggestedBrand = suggestBrand ? suggestBrand(reference) : null;
        const suggestedType = suggestedBrand && suggestType ? suggestType(reference, suggestedBrand) : null;
        
        // Les suggestions seront présentées à l'utilisateur, mais pas auto-appliquées
        if (suggestedBrand) {
          console.log(`💡 Suggestion de marque pour ${reference}: ${suggestedBrand}`);
        }
        if (suggestedType) {
          console.log(`💡 Suggestion de type pour ${reference}: ${suggestedType}`);
        }
      }
      
      const appliance: Appliance = {
        id: `${Date.now()}-${index}`,
        type,
        brand,
        reference,
        commercialRef,
        dateAdded: new Date().toISOString().split('T')[0],
        source: "clipboard",
        lastUpdated: new Date().toISOString()
      };
      
      if (needsCompletion) {
        needsUserInput.push(appliance);
      } else {
        appliances.push(appliance);
      }
    } else {
      errors.push(`Ligne ${index + 1}: Format incorrect (${parts.length} colonnes au lieu de 2)`);
    }
  });
  
  // Si tous les appareils ont besoin d'une saisie utilisateur, retourner cela
  if (needsUserInput.length > 0) {
    return {
      success: true,
      appliances: needsUserInput,
      missingInfo: needsUserInput,
      twoColumnsFormat: true,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  return {
    success: true,
    appliances,
    twoColumnsFormat: true,
    errors: errors.length > 0 ? errors : undefined
  };
};

const parseFourColumnFormat = (lines: string[]) => {
  const appliances: Appliance[] = [];
  const errors: string[] = [];
  
  lines.forEach((line, index) => {
    const parts = detectAndParseLine(line);
    
    if (parts.length >= 4) {
      const type = parts[0];
      const brand = parts[1];
      const reference = parts[2];
      const commercialRef = parts[3];
      
      const appliance: Appliance = {
        id: `${Date.now()}-${index}`,
        type,
        brand,
        reference,
        commercialRef,
        dateAdded: new Date().toISOString().split('T')[0],
        source: "clipboard",
        lastUpdated: new Date().toISOString()
      };
      appliances.push(appliance);
    } else {
      errors.push(`Ligne ${index + 1}: Format incorrect (${parts.length} colonnes au lieu de 4)`);
    }
  });
  
  return {
    success: true,
    appliances,
    errors: errors.length > 0 ? errors : undefined
  };
};

export const validateAppliance = (appliance: Appliance): string[] => {
  const errors: string[] = [];
  if (!appliance.type) {
    errors.push("Le type d'appareil est obligatoire");
  }
  if (!appliance.brand) {
    errors.push("La marque de l'appareil est obligatoire");
  }
  if (!appliance.reference) {
    errors.push("La référence technique de l'appareil est obligatoire");
  }
  return errors;
};
