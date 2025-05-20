
import { Appliance, ImportResult } from "@/types/appliance";

/**
 * Analyse le texte brut copié-collé et tente d'en extraire des appareils
 * Le format attendu est un tableau avec des colonnes pour:
 * - Type (facultatif)
 * - Marque (facultatif)
 * - Référence technique
 * - Référence commerciale
 */
export function parseClipboardData(data: string): ImportResult {
  const lines = data
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { success: false, appliances: [], errors: ["Aucune donnée valide"] };
  }

  const appliances: Appliance[] = [];
  const missingInfo: Appliance[] = [];
  const errors: string[] = [];
  
  // Différentes stratégies d'analyse
  let detectedAppliances = detectTabSeparated(lines);
  
  if (detectedAppliances.length === 0) {
    detectedAppliances = detectSpaceSeparated(lines);
  }
  
  if (detectedAppliances.length === 0) {
    detectedAppliances = detectSemicolonSeparated(lines);
  }
  
  if (detectedAppliances.length === 0) {
    detectedAppliances = detectCommaSeparated(lines);
  }
  
  if (detectedAppliances.length === 0) {
    return { 
      success: false, 
      appliances: [], 
      errors: ["Format non reconnu. Veuillez utiliser un format tabulaire avec références, marque et type."] 
    };
  }

  // Vérifier pour les informations manquantes
  detectedAppliances.forEach(appliance => {
    if (!appliance.brand || !appliance.type) {
      missingInfo.push(appliance);
    }
    appliances.push(appliance);
  });
  
  return {
    success: true,
    appliances,
    missingInfo: missingInfo.length > 0 ? missingInfo : undefined
  };
}

function detectTabSeparated(lines: string[]): Appliance[] {
  return detectWithSeparator(lines, "\t");
}

function detectSpaceSeparated(lines: string[]): Appliance[] {
  // On utilise une regex qui détecte les espaces multiples comme séparateur
  const appliances: Appliance[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(/\s{2,}/);
    if (parts.length >= 2) {
      // Format attendu: type, marque, référence technique, référence commerciale
      // Mais type et marque peuvent être absents
      const applianceData: Record<string, string> = {};
      
      if (parts.length >= 4) {
        // On a toutes les colonnes
        applianceData.type = parts[0].trim();
        applianceData.brand = parts[1].trim();
        applianceData.reference = parts[2].trim();
        applianceData.commercialRef = parts[3].trim();
      } else if (parts.length === 3) {
        // On a probablement marque, ref technique, ref commerciale
        applianceData.brand = parts[0].trim();
        applianceData.reference = parts[1].trim();
        applianceData.commercialRef = parts[2].trim();
      } else if (parts.length === 2) {
        // On a uniquement les références
        applianceData.reference = parts[0].trim();
        applianceData.commercialRef = parts[1].trim();
      }
      
      // Vérifier qu'on a au moins une référence technique
      if (applianceData.reference) {
        appliances.push({
          id: Date.now().toString() + i,
          reference: applianceData.reference,
          commercialRef: applianceData.commercialRef || undefined,
          brand: applianceData.brand || "",
          type: applianceData.type || "",
          dateAdded: new Date().toISOString().split("T")[0],
          source: "clipboard"
        });
      }
    }
  }
  
  return appliances;
}

function detectSemicolonSeparated(lines: string[]): Appliance[] {
  return detectWithSeparator(lines, ";");
}

function detectCommaSeparated(lines: string[]): Appliance[] {
  return detectWithSeparator(lines, ",");
}

function detectWithSeparator(lines: string[], separator: string): Appliance[] {
  const appliances: Appliance[] = [];
  
  // On essaie de détecter un en-tête
  let startIndex = 0;
  let typeIndex = -1;
  let brandIndex = -1;
  let referenceIndex = 2; // Position par défaut de la référence technique
  let commercialRefIndex = 3; // Position par défaut de la référence commerciale
  
  // Si la première ligne contient des textes comme "référence", "marque", "type", on l'utilise comme en-tête
  const headerLine = lines[0].toLowerCase();
  if (
    headerLine.includes("ref") || 
    headerLine.includes("référence") || 
    headerLine.includes("marque") || 
    headerLine.includes("type")
  ) {
    const headers = headerLine.split(separator);
    
    // Chercher les indices des colonnes appropriées
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim().toLowerCase();
      if (header.includes("type")) {
        typeIndex = i;
      } else if (header.includes("marque") || header.includes("brand")) {
        brandIndex = i;
      } else if (header.includes("ref") && header.includes("tech")) {
        referenceIndex = i;
      } else if (header.includes("ref") && header.includes("com")) {
        commercialRefIndex = i;
      }
    }
    
    startIndex = 1; // Commencer le traitement à partir de la ligne suivante
  }
  
  // Traiter les lignes
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(separator);
    
    // Vérifier qu'on a suffisamment de colonnes pour les références
    const minColumns = Math.max(referenceIndex, commercialRefIndex) + 1;
    if (parts.length >= minColumns) {
      const applianceData: Record<string, string> = {
        reference: parts[referenceIndex].trim()
      };
      
      // Ajouter les informations si elles existent
      if (commercialRefIndex >= 0 && parts.length > commercialRefIndex) {
        applianceData.commercialRef = parts[commercialRefIndex].trim();
      }
      
      if (typeIndex >= 0 && parts.length > typeIndex) {
        applianceData.type = parts[typeIndex].trim();
      }
      
      if (brandIndex >= 0 && parts.length > brandIndex) {
        applianceData.brand = parts[brandIndex].trim();
      }
      
      // Vérifier qu'on a au moins une référence technique
      if (applianceData.reference) {
        appliances.push({
          id: Date.now().toString() + i,
          reference: applianceData.reference,
          commercialRef: applianceData.commercialRef || undefined,
          brand: applianceData.brand || "",
          type: applianceData.type || "",
          dateAdded: new Date().toISOString().split("T")[0],
          source: "clipboard"
        });
      }
    }
  }
  
  return appliances;
}

// Cette fonction sera implémentée plus tard pour l'importation PDF
export async function parsePdfData(file: File): Promise<ImportResult> {
  // Placeholder
  return {
    success: false,
    appliances: [],
    errors: ["Fonctionnalité d'importation PDF non implémentée"]
  };
}
