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
 * Optimisé pour traiter de gros volumes de données (100k+ lignes)
 */
export function parseClipboardData(data: string, getApplianceByReference?: (ref: string) => Appliance | undefined, suggestBrand?: (ref: string) => string | null, suggestType?: (ref: string, brand: string) => string | null): ImportResult {
  const startTime = performance.now();
  
  // Optimisation: utiliser des méthodes plus rapides pour les gros volumes
  const lines = data.split("\n").filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return { success: false, appliances: [], errors: ["Aucune donnée valide"] };
  }

  console.log(`Traitement de ${lines.length} lignes`);
  
  // Pour de très gros volumes, on utilise une approche différente
  const isLargeDataset = lines.length > 10000;
  
  if (isLargeDataset) {
    console.log("Détection d'un gros volume de données, optimisation activée");
    return parseClipboardDataOptimized(lines, getApplianceByReference, suggestBrand, suggestType);
  }

  // Traitement normal pour les petits volumes
  const separators = ["\t", ";", ",", /\s{2,}/] as const;
  let bestSeparator: string | RegExp = "\t";
  let columnCount = 0;
  let detectedAppliances: Appliance[] = [];

  // Tester seulement les premières lignes pour déterminer le format
  const sampleSize = Math.min(10, lines.length);
  
  for (const sep of separators) {
    const testAppliances = detectWithSeparator(lines.slice(0, sampleSize), sep);
    if (testAppliances.length > 0) {
      const firstLine = typeof sep === 'string' 
        ? lines[0].split(sep) 
        : lines[0].split(sep);
      
      if (testAppliances.length > detectedAppliances.length || firstLine.length > columnCount) {
        detectedAppliances = detectWithSeparator(lines, sep); // Traiter toutes les lignes avec le bon séparateur
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

  const endTime = performance.now();
  console.log(`Traitement terminé en ${endTime - startTime}ms`);

  const isTwoColumnFormat = detectedAppliances.every(app => 
    app.reference && (app.commercialRef !== undefined) && 
    (!app.brand || app.brand.trim() === "") && (!app.type || app.type.trim() === "")
  );

  if (isTwoColumnFormat && getApplianceByReference && suggestBrand && suggestType) {
    const completedAppliances = detectedAppliances.map(app => {
      const existingApp = getApplianceByReference(app.reference);
      
      if (existingApp) {
        return {
          ...app,
          brand: existingApp.brand || app.brand,
          type: existingApp.type || app.type
        };
      } else {
        const suggestedBrand = suggestBrand(app.reference) || "";
        const suggestedType = suggestType(app.reference, suggestedBrand) || "";
        
        return {
          ...app,
          brand: suggestedBrand,
          type: suggestedType
        };
      }
    });
    
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
    return {
      success: true,
      appliances: detectedAppliances,
      twoColumnsFormat: true
    };
  } else {
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

/**
 * Version optimisée pour les gros volumes de données
 */
function parseClipboardDataOptimized(lines: string[], getApplianceByReference?: (ref: string) => Appliance | undefined, suggestBrand?: (ref: string) => string | null, suggestType?: (ref: string, brand: string) => string | null): ImportResult {
  // Utiliser un Map pour les recherches rapides si on a beaucoup de données existantes
  const existingAppliancesMap = new Map<string, Appliance>();
  
  // Détecter le séparateur sur un échantillon réduit
  const sampleLines = lines.slice(0, Math.min(100, lines.length));
  const separator = detectSeparatorFast(sampleLines);
  
  // Détecter les indices de colonnes
  const columnIndices = detectColumnIndices(lines[0], separator);
  
  // Traitement par lots pour éviter les problèmes de mémoire
  const batchSize = 1000;
  const appliances: Appliance[] = [];
  
  for (let i = 1; i < lines.length; i += batchSize) { // Commencer à 1 pour ignorer l'en-tête
    const batch = lines.slice(i, Math.min(i + batchSize, lines.length));
    const batchAppliances = processBatch(batch, separator, columnIndices);
    appliances.push(...batchAppliances);
    
    // Permettre au navigateur de respirer entre les lots
    if (i % (batchSize * 10) === 0) {
      console.log(`Traité ${i} lignes sur ${lines.length}`);
    }
  }
  
  return {
    success: true,
    appliances: appliances,
    twoColumnsFormat: columnIndices.brandIndex === -1 && columnIndices.typeIndex === -1
  };
}

function detectSeparatorFast(sampleLines: string[]): string | RegExp {
  const separators = ["\t", ";", ","];
  let bestSeparator = "\t";
  let maxConsistency = 0;
  
  for (const sep of separators) {
    const columnCounts = sampleLines.map(line => line.split(sep).length);
    const mostCommonCount = getMostCommonValue(columnCounts);
    const consistency = columnCounts.filter(count => count === mostCommonCount).length;
    
    if (consistency > maxConsistency && mostCommonCount >= 2) {
      maxConsistency = consistency;
      bestSeparator = sep;
    }
  }
  
  return bestSeparator;
}

function getMostCommonValue(arr: number[]): number {
  const counts: { [key: number]: number } = {};
  let maxCount = 0;
  let mostCommon = 0;
  
  for (const val of arr) {
    counts[val] = (counts[val] || 0) + 1;
    if (counts[val] > maxCount) {
      maxCount = counts[val];
      mostCommon = val;
    }
  }
  
  return mostCommon;
}

function detectColumnIndices(headerLine: string, separator: string | RegExp) {
  const headers = typeof separator === 'string' 
    ? headerLine.split(separator)
    : headerLine.split(separator);
  
  let typeIndex = -1;
  let brandIndex = -1;
  let referenceIndex = -1;
  let commercialRefIndex = -1;
  
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
  
  // Si pas détecté dans l'en-tête, utiliser des indices par défaut
  if (headers.length === 2) {
    if (referenceIndex === -1) referenceIndex = 0;
    if (commercialRefIndex === -1) commercialRefIndex = 1;
  } else if (headers.length >= 4) {
    if (typeIndex === -1) typeIndex = 0;
    if (brandIndex === -1) brandIndex = 1;
    if (referenceIndex === -1) referenceIndex = 2;
    if (commercialRefIndex === -1) commercialRefIndex = 3;
  }
  
  return { typeIndex, brandIndex, referenceIndex, commercialRefIndex };
}

function processBatch(lines: string[], separator: string | RegExp, columnIndices: any): Appliance[] {
  const appliances: Appliance[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = typeof separator === 'string' 
      ? line.split(separator)
      : line.split(separator);
    
    if (columnIndices.referenceIndex >= 0 && columnIndices.referenceIndex < parts.length && parts[columnIndices.referenceIndex].trim()) {
      const appliance: Appliance = {
        id: `batch_${Date.now()}_${i}`,
        reference: parts[columnIndices.referenceIndex].trim(),
        commercialRef: columnIndices.commercialRefIndex >= 0 && columnIndices.commercialRefIndex < parts.length ? 
          parts[columnIndices.commercialRefIndex].trim() : "",
        brand: columnIndices.brandIndex >= 0 && columnIndices.brandIndex < parts.length ? 
          parts[columnIndices.brandIndex].trim() : "",
        type: columnIndices.typeIndex >= 0 && columnIndices.typeIndex < parts.length ? 
          parts[columnIndices.typeIndex].trim() : "",
        dateAdded: new Date().toISOString().split("T")[0],
        source: "clipboard"
      };
      
      appliances.push(appliance);
    }
  }
  
  return appliances;
}

// Détection avec différents séparateurs
function detectWithSeparator(lines: string[], separator: string | RegExp): Appliance[] {
  const appliances: Appliance[] = [];
  
  let startIndex = 0;
  let typeIndex = -1;
  let brandIndex = -1;
  let referenceIndex = -1;
  let commercialRefIndex = -1;
  
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
  
  if (lines.length > 0) {
    const firstDataLineParts = typeof separator === 'string' 
      ? lines[startIndex].split(separator)
      : lines[startIndex].split(separator);
    
    if (firstDataLineParts.length === 2) {
      if (referenceIndex === -1) referenceIndex = 0;
      if (commercialRefIndex === -1) commercialRefIndex = 1;
    } else if (firstDataLineParts.length >= 4) {
      if (typeIndex === -1) typeIndex = 0;
      if (brandIndex === -1) brandIndex = 1;
      if (referenceIndex === -1) referenceIndex = 2;
      if (commercialRefIndex === -1) commercialRefIndex = 3;
    } else if (firstDataLineParts.length === 3) {
      if (brandIndex === -1) brandIndex = 0;
      if (referenceIndex === -1) referenceIndex = 1;
      if (commercialRefIndex === -1) commercialRefIndex = 2;
    }
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const parts = typeof separator === 'string' 
      ? lines[i].split(separator)
      : lines[i].split(separator);
    
    if (parts.length === 2 && (referenceIndex === -1 || commercialRefIndex === -1)) {
      appliances.push({
        id: Date.now().toString() + i,
        reference: parts[0].trim(),
        commercialRef: parts[1].trim(),
        brand: "",
        type: "",
        dateAdded: new Date().toISOString().split("T")[0],
        source: "clipboard"
      });
      continue;
    }
    
    if (referenceIndex >= 0 && referenceIndex < parts.length && parts[referenceIndex].trim()) {
      const applianceData: Record<string, string> = {
        reference: parts[referenceIndex].trim()
      };
      
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

    const separators = ["\t", ";", ",", /\s{2,}/] as const;
    let bestSeparator: string | RegExp = "\t";
    let maxColumns = 0;
    let maxValidRows = 0;

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
    
    let startIndex = 0;
    let typeIndex = -1;
    let brandIndex = -1;
    let referenceIndex = -1;
    let commercialRefIndex = -1;
    
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
    
    const processedRows: ProcessedRow[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const parts = typeof bestSeparator === 'string' 
        ? lines[i].split(bestSeparator) 
        : lines[i].split(bestSeparator);
      
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
