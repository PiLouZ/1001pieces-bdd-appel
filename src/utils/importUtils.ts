import { Appliance, ImportResult } from "@/types/appliance";

// Define the ProcessedRow type for importing
export interface ProcessedRow {
  reference: string;
  commercialRef: string;
  brand: string;
  type: string;
}

/**
 * Analyse le texte brut copié-collé et tente d'en extraire des appareils
 * Formats supportés :
 * - 4 colonnes : Type, Marque, Référence technique, Référence commerciale
 * - 2 colonnes : Référence technique, Référence commerciale
 */
export function parseClipboardData(data: string, getApplianceByReference?: (ref: string) => Appliance | undefined, suggestBrand?: (ref: string) => string | null, suggestType?: (ref: string, brand: string) => string | null): ImportResult {
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
  if (isTwoColumnFormat && getApplianceByReference && suggestBrand && suggestType) {
    // Essayer de compléter les données manquantes
    const completedAppliances = detectedAppliances.map(app => {
      // Vérifier si cet appareil existe déjà dans la base de données
      const existingApp = getApplianceByReference(app.reference);
      
      if (existingApp) {
        // Si l'appareil existe déjà, utiliser ses informations
        return {
          ...app,
          brand: existingApp.brand || app.brand,
          type: existingApp.type || app.type
        };
      } else {
        // Sinon, essayer de suggérer les valeurs manquantes
        const suggestedBrand = suggestBrand(app.reference) || "";
        const suggestedType = suggestType(app.reference, suggestedBrand) || "";
        
        return {
          ...app,
          brand: suggestedBrand,
          type: suggestedType
        };
      }
    });
    
    // Vérifier si on a pu compléter toutes les données
    const stillNeedingInfo = completedAppliances.filter(app => !app.brand || !app.type);
    
    if (stillNeedingInfo.length > 0) {
      return {
        success: true,
        appliances: completedAppliances,
        missingInfo: stillNeedingInfo,
        twoColumnsFormat: true
      };
    } else {
      return {
        success: true,
        appliances: completedAppliances,
        twoColumnsFormat: true
      };
    }
  } else if (isTwoColumnFormat) {
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

/**
 * Parse le contenu d'un fichier importé (CSV, Excel, etc.) et extrait les données des appareils
 */
export async function parseImportedFile(content: string): Promise<{ processedRows: ProcessedRow[] }> {
  try {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return { processedRows: [] };
    }

    // Déterminer le séparateur et le format des données
    const separators = ["\t", ";", ",", /\s{2,}/] as const;
    let bestSeparator: string | RegExp = "\t"; // Par défaut
    let maxColumns = 0;
    let maxValidRows = 0;

    // Tester chaque séparateur pour trouver celui qui donne le résultat le plus cohérent
    for (const sep of separators) {
      const firstLine = typeof sep === 'string' 
        ? lines[0].split(sep) 
        : lines[0].split(sep);
      
      if (firstLine.length >= 2) {
        let validRows = 0;
        for (let i = 1; i < Math.min(lines.length, 10); i++) {
          const testLine = typeof sep === 'string' 
            ? lines[i].split(sep) 
            : lines[i].split(sep);
          
          if (testLine.length === firstLine.length) {
            validRows++;
          }
        }
        
        if (validRows > maxValidRows || (validRows === maxValidRows && firstLine.length > maxColumns)) {
          bestSeparator = sep;
          maxColumns = firstLine.length;
          maxValidRows = validRows;
        }
      }
    }
    
    if (maxColumns < 2) {
      return { processedRows: [] };
    }
    
    // Déterminer les indices des colonnes
    let startIndex = 0;
    let typeIndex = -1;
    let brandIndex = -1;
    let referenceIndex = -1;
    let commercialRefIndex = -1;
    
    // Chercher un en-tête
    const headerLine = lines[0].toLowerCase();
    if (
      headerLine.includes("ref") || 
      headerLine.includes("référence") || 
      headerLine.includes("marque") || 
      headerLine.includes("type")
    ) {
      const headers = typeof bestSeparator === 'string' 
        ? headerLine.split(bestSeparator)
        : headerLine.split(bestSeparator);
      
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
          if (referenceIndex === -1) {
            referenceIndex = i;
          }
        }
      }
      
      startIndex = 1;
    }
    
    // Si on n'a pas détecté les colonnes, utiliser un format par défaut
    if (maxColumns === 2) {
      if (referenceIndex === -1) referenceIndex = 0;
      if (commercialRefIndex === -1) commercialRefIndex = 1;
    } else if (maxColumns >= 4) {
      if (typeIndex === -1) typeIndex = 0;
      if (brandIndex === -1) brandIndex = 1;
      if (referenceIndex === -1) referenceIndex = 2;
      if (commercialRefIndex === -1) commercialRefIndex = 3;
    } else if (maxColumns === 3) {
      if (brandIndex === -1) brandIndex = 0;
      if (referenceIndex === -1) referenceIndex = 1;
      if (commercialRefIndex === -1) commercialRefIndex = 2;
    }
    
    // Extraire les données
    const processedRows: ProcessedRow[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const parts = typeof bestSeparator === 'string' 
        ? lines[i].split(bestSeparator) 
        : lines[i].split(bestSeparator);
      
      // S'assurer qu'on a une référence technique
      if (referenceIndex >= 0 && referenceIndex < parts.length && parts[referenceIndex].trim()) {
        const row: ProcessedRow = {
          reference: parts[referenceIndex].trim(),
          commercialRef: commercialRefIndex >= 0 && commercialRefIndex < parts.length ? 
            parts[commercialRefIndex].trim() : "",
          brand: brandIndex >= 0 && brandIndex < parts.length ? 
            parts[brandIndex].trim() : "",
          type: typeIndex >= 0 && typeIndex < parts.length ? 
            parts[typeIndex].trim() : ""
        };
        
        processedRows.push(row);
      }
    }
    
    return { processedRows };
  } catch (error) {
    console.error("Error parsing file:", error);
    return { processedRows: [] };
  }
}
