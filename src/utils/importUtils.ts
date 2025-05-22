
import { Appliance, ImportResult } from "@/types/appliance";

/**
 * Analyse le texte brut copié-collé et tente d'en extraire des appareils
 * Formats supportés :
 * - 4 colonnes : Type, Marque, Référence technique, Référence commerciale
 * - 2 colonnes : Référence technique, Référence commerciale
 */
export function parseClipboardData(data: string): ImportResult {
  const lines = data
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { success: false, appliances: [], errors: ["Aucune donnée valide"] };
  }

  // Déterminer le séparateur et le format des données
  const separators = ["\t", ";", ",", /\s{2,}/] as const;
  let bestSeparator: string | RegExp = "\t"; // Par défaut
  let columnCount = 0;
  let detectedAppliances: Appliance[] = [];

  // Tester chaque séparateur pour trouver celui qui donne le résultat le plus cohérent
  for (const sep of separators) {
    const testAppliances = detectWithSeparator(lines, sep);
    if (testAppliances.length > 0) {
      // Pour chaque séparateur, on compte le nombre de colonnes moyen
      const firstLine = typeof sep === 'string' 
        ? lines[0].split(sep) 
        : lines[0].split(sep);
      
      // Si on obtient plus d'appareils ou plus de colonnes, on considère ce séparateur meilleur
      if (testAppliances.length > detectedAppliances.length || firstLine.length > columnCount) {
        detectedAppliances = testAppliances;
        bestSeparator = sep;
        columnCount = firstLine.length;
      }
    }
  }

  if (detectedAppliances.length === 0) {
    return { 
      success: false, 
      appliances: [], 
      errors: ["Format non reconnu. Veuillez utiliser un format tabulaire avec références et éventuellement marque et type."] 
    };
  }

  // Vérifier le nombre de colonnes pour déterminer s'il s'agit d'un format à 2 ou 4 colonnes
  const isTwoColumnFormat = detectedAppliances.every(app => 
    // Pour le format à 2 colonnes, on a seulement référence et ref commerciale
    app.reference && (app.commercialRef !== undefined) && 
    (!app.brand || app.brand.trim() === "") && (!app.type || app.type.trim() === "")
  );

  // Pour le format à 2 colonnes, on cherche à compléter les données
  if (isTwoColumnFormat) {
    // On retourne les appareils sans demander de compléter
    return {
      success: true,
      appliances: detectedAppliances,
      twoColumnsFormat: true
    };
  } else {
    // Format à 4 colonnes - on vérifie que toutes les infos essentielles sont présentes
    const missingInfo = detectedAppliances.filter(app => !app.brand || !app.type);
    
    if (missingInfo.length > 0) {
      return {
        success: true,
        appliances: detectedAppliances,
        missingInfo: missingInfo
      };
    } else {
      return {
        success: true,
        appliances: detectedAppliances
      };
    }
  }
}

// Détection avec différents séparateurs
function detectWithSeparator(lines: string[], separator: string | RegExp): Appliance[] {
  const appliances: Appliance[] = [];
  
  // On essaie de détecter un en-tête
  let startIndex = 0;
  let typeIndex = -1;
  let brandIndex = -1;
  let referenceIndex = -1;
  let commercialRefIndex = -1;
  
  // Si la première ligne contient des textes comme "référence", "marque", "type", on l'utilise comme en-tête
  const headerLine = lines[0].toLowerCase();
  if (
    headerLine.includes("ref") || 
    headerLine.includes("référence") || 
    headerLine.includes("marque") || 
    headerLine.includes("type")
  ) {
    const headers = typeof separator === 'string' 
      ? headerLine.split(separator)
      : headerLine.split(separator);
    
    // Chercher les indices des colonnes appropriées
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim().toLowerCase();
      if (header.includes("type")) {
        typeIndex = i;
      } else if (header.includes("marque") || header.includes("brand")) {
        brandIndex = i;
      } else if (header.includes("ref") && header.includes("tech")) {
        referenceIndex = i;
      } else if (header.includes("ref") && (header.includes("com") || header.includes("modèle"))) {
        commercialRefIndex = i;
      } else if (header.includes("ref") || header.includes("référence")) {
        // Si on a juste "référence" sans précision, on considère que c'est la référence technique
        if (referenceIndex === -1) {
          referenceIndex = i;
        }
      }
    }
    
    startIndex = 1; // Commencer le traitement à partir de la ligne suivante
  }
  
  // Si on n'a pas détecté les colonnes dans l'en-tête, utiliser un format par défaut
  // En fonction du nombre de colonnes
  if (lines.length > 0) {
    const firstDataLineParts = typeof separator === 'string' 
      ? lines[startIndex].split(separator)
      : lines[startIndex].split(separator);
    
    if (firstDataLineParts.length === 2) {
      // Format 2 colonnes : référence technique et commerciale
      if (referenceIndex === -1) referenceIndex = 0;
      if (commercialRefIndex === -1) commercialRefIndex = 1;
    } else if (firstDataLineParts.length >= 4) {
      // Format 4 colonnes : type, marque, référence technique, commerciale
      if (typeIndex === -1) typeIndex = 0;
      if (brandIndex === -1) brandIndex = 1;
      if (referenceIndex === -1) referenceIndex = 2;
      if (commercialRefIndex === -1) commercialRefIndex = 3;
    } else if (firstDataLineParts.length === 3) {
      // Format 3 colonnes : on suppose marque, référence technique, commerciale
      if (brandIndex === -1) brandIndex = 0;
      if (referenceIndex === -1) referenceIndex = 1;
      if (commercialRefIndex === -1) commercialRefIndex = 2;
    }
  }
  
  // Traiter les lignes
  for (let i = startIndex; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Ignorer les lignes vides
    
    const parts = typeof separator === 'string' 
      ? lines[i].split(separator)
      : lines[i].split(separator);
    
    // Format à deux colonnes (références uniquement)
    if (parts.length === 2 && (referenceIndex === -1 || commercialRefIndex === -1)) {
      appliances.push({
        id: Date.now().toString() + i,
        reference: parts[0].trim(),
        commercialRef: parts[1].trim(),
        brand: "",  // Marque à compléter
        type: "",   // Type à compléter
        dateAdded: new Date().toISOString().split("T")[0],
        source: "clipboard"
      });
      continue;
    }
    
    // S'assurer qu'on a une référence technique
    if (referenceIndex >= 0 && referenceIndex < parts.length && parts[referenceIndex].trim()) {
      const applianceData: Record<string, string> = {
        reference: parts[referenceIndex].trim()
      };
      
      // Ajouter les informations si elles existent
      if (commercialRefIndex >= 0 && commercialRefIndex < parts.length) {
        applianceData.commercialRef = parts[commercialRefIndex].trim();
      }
      
      if (typeIndex >= 0 && typeIndex < parts.length) {
        applianceData.type = parts[typeIndex].trim();
      }
      
      if (brandIndex >= 0 && brandIndex < parts.length) {
        applianceData.brand = parts[brandIndex].trim();
      }
      
      appliances.push({
        id: Date.now().toString() + i,
        reference: applianceData.reference,
        commercialRef: applianceData.commercialRef || "",
        brand: applianceData.brand || "",
        type: applianceData.type || "",
        dateAdded: new Date().toISOString().split("T")[0],
        source: "clipboard"
      });
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
