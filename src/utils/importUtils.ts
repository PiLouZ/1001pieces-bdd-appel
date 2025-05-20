
import { Appliance, ImportResult } from "@/types/appliance";

/**
 * Analyse le texte brut copié-collé et tente d'en extraire des appareils
 * Le format attendu est un tableau avec des colonnes pour les références techniques, 
 * références commerciales, marques et types
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
  
  return {
    success: true,
    appliances: detectedAppliances
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
    if (parts.length >= 3) {
      appliances.push({
        id: Date.now().toString() + i,
        reference: parts[0].trim(),
        commercialRef: parts.length > 3 ? parts[1].trim() : undefined,
        brand: parts.length > 3 ? parts[2].trim() : parts[1].trim(),
        type: parts.length > 3 ? parts[3].trim() : parts[2].trim(),
        dateAdded: new Date().toISOString().split("T")[0],
        source: "clipboard"
      });
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
  let referenceIndex = 0;
  let commercialRefIndex = -1; // -1 signifie non trouvé
  let brandIndex = 1;
  let typeIndex = 2;
  
  // Si la première ligne contient des textes comme "référence", "marque", "type", on l'utilise comme en-tête
  const headerLine = lines[0].toLowerCase();
  if (headerLine.includes("ref") || headerLine.includes("référence") || 
      headerLine.includes("marque") || headerLine.includes("type")) {
    const headers = headerLine.split(separator);
    
    // Chercher les indices des colonnes appropriées
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim().toLowerCase();
      if (header.includes("ref") && header.includes("tech")) {
        referenceIndex = i;
      } else if (header.includes("ref") && header.includes("com")) {
        commercialRefIndex = i;
      } else if (header.includes("marque") || header.includes("brand")) {
        brandIndex = i;
      } else if (header.includes("type")) {
        typeIndex = i;
      }
    }
    
    // Si on n'a pas trouvé explicitement une colonne "référence technique" mais 
    // qu'on a trouvé une colonne "référence" et une "référence commerciale"
    if (commercialRefIndex === -1) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].trim().toLowerCase();
        if (header.includes("ref") && !header.includes("tech") && i !== referenceIndex) {
          commercialRefIndex = i;
          break;
        }
      }
    }
    
    startIndex = 1; // Commencer le traitement à partir de la ligne suivante
  }
  
  // Traiter les lignes
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(separator);
    
    if (parts.length > Math.max(referenceIndex, brandIndex, typeIndex)) {
      const appliance: Appliance = {
        id: Date.now().toString() + i,
        reference: parts[referenceIndex].trim(),
        brand: parts[brandIndex].trim(),
        type: parts[typeIndex].trim(),
        dateAdded: new Date().toISOString().split("T")[0],
        source: "clipboard"
      };
      
      // Ajouter la référence commerciale si elle existe
      if (commercialRefIndex >= 0 && parts.length > commercialRefIndex) {
        appliance.commercialRef = parts[commercialRefIndex].trim();
      }
      
      appliances.push(appliance);
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
