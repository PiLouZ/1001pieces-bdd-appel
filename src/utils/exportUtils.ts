
import { Appliance, ExportOptions } from "@/types/appliance";

/**
 * Exports appliances to CSV, HTML, or JSON format based on options
 */
export function exportAppliances(appliances: Appliance[], options: ExportOptions): string {
  // Ensure appliances is always an array
  const safeAppliances = Array.isArray(appliances) ? appliances : [];
  const { format, includeHeader = true, partReference } = options;
  
  if (format === "csv") {
    // Headers for the CSV - avec référence de pièce en premier si spécifiée
    let headers: string[] = [];
    
    if (partReference && partReference !== "ALL_PARTS") {
      headers = [
        "Référence de la pièce",
        "Type de l'appareil",
        "Marque de l'appareil",
        "Modèle de l'appareil", 
        "Référence technique de l'appareil",
        "Référence commerciale de l'appareil"
      ];
    } else {
      headers = [
        "Type de l'appareil",
        "Marque de l'appareil",
        "Modèle de l'appareil",
        "Référence technique de l'appareil", 
        "Référence commerciale de l'appareil"
      ];
    }
    
    // Start with headers if includeHeader is true
    let csv = includeHeader ? headers.join(";") + "\n" : "";
    
    // Add each appliance as a row
    safeAppliances.forEach(appliance => {
      if (!appliance) return;
      
      // Handle potential undefined values with safe defaults
      const reference = appliance.reference || "";
      const commercialRef = appliance.commercialRef || "";
      const brand = appliance.brand || "";
      const type = appliance.type || "";
      
      // Create the model field by concatenating reference and commercialRef
      const model = `${reference}${commercialRef ? " - " + commercialRef : ""}`;
      
      let row: string[] = [];
      
      if (partReference && partReference !== "ALL_PARTS") {
        row = [
          partReference,
          type,
          brand,
          model,
          reference,
          commercialRef
        ];
      } else {
        row = [
          type,
          brand,
          model,
          reference,
          commercialRef
        ];
      }
      
      csv += row.join(";") + "\n";
    });
    
    return csv;
  } else if (format === "html") {
    // Simple HTML table format
    let html = '<table border="1">';
    
    // Add header row if includeHeader is true
    if (includeHeader) {
      html += '<thead><tr>';
      if (partReference && partReference !== "ALL_PARTS") {
        html += '<th>Référence de la pièce</th>';
      }
      html += '<th>Type de l\'appareil</th>';
      html += '<th>Marque de l\'appareil</th>';
      html += '<th>Modèle de l\'appareil</th>';
      html += '<th>Référence technique de l\'appareil</th>';
      html += '<th>Référence commerciale de l\'appareil</th>';
      html += '</tr></thead>';
    }
    
    // Add data rows
    html += '<tbody>';
    safeAppliances.forEach(appliance => {
      if (!appliance) return;
      
      // Handle potential undefined values with safe defaults
      const reference = appliance.reference || "";
      const commercialRef = appliance.commercialRef || "";
      const brand = appliance.brand || "";
      const type = appliance.type || "";
      
      const model = `${reference}${commercialRef ? " - " + commercialRef : ""}`;
      
      html += '<tr>';
      if (partReference && partReference !== "ALL_PARTS") {
        html += `<td>${partReference}</td>`;
      }
      html += `<td>${type}</td>`;
      html += `<td>${brand}</td>`;
      html += `<td>${model}</td>`;
      html += `<td>${reference}</td>`;
      html += `<td>${commercialRef}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
  } else {
    // Return JSON string for other formats (including "json")
    return JSON.stringify(safeAppliances, null, 2);
  }
}

/**
 * Generates HTML anchor links for brands
 */
export function generateBrandAnchors(appliances: Appliance[]): string {
  // Ensure appliances is always an array
  const safeAppliances = Array.isArray(appliances) ? appliances : [];
  
  // Extract unique brands
  const uniqueBrands = Array.from(new Set(
    safeAppliances
      .map(appliance => appliance?.brand || "")
      .filter(brand => brand !== "")
  )).sort();
  
  // Generate anchor links
  return uniqueBrands
    .map(brand => `<a href="#${brand}">${brand}</a>`)
    .join(" ");
}

/**
 * Generates HTML content grouped by brand
 */
export function generateBrandGroupedHTML(appliances: Appliance[]): string {
  // Ensure appliances is always an array
  const safeAppliances = Array.isArray(appliances) ? appliances : [];
  
  // Extract unique brands
  const uniqueBrands = Array.from(new Set(
    safeAppliances
      .map(appliance => appliance?.brand || "")
      .filter(brand => brand !== "")
  )).sort();
  
  // Group appliances by brand
  const appliancesByBrand: { [key: string]: Appliance[] } = {};
  uniqueBrands.forEach(brand => { appliancesByBrand[brand] = []; });
  
  safeAppliances.forEach(appliance => {
    if (!appliance || !appliance.brand) return;
    if (appliancesByBrand[appliance.brand]) {
      appliancesByBrand[appliance.brand].push(appliance);
    }
  });
  
  // Generate HTML for each brand
  let html = '';
  uniqueBrands.forEach(brand => {
    // Brand header
    html += `<div id="${brand}"><b><u>${brand}</u></b></div>\n`;
    
    // Appliances for this brand
    appliancesByBrand[brand].forEach(appliance => {
      const reference = appliance.reference || "";
      const commercialRef = appliance.commercialRef || "";
      const model = `${reference}${commercialRef ? " - " + commercialRef : ""}`;
      html += `<div>${model}</div>\n`;
    });
    
    // Add space between brands
    html += `<div>&nbsp;</div>\n`;
  });
  
  return html;
}

/**
 * Downloads CSV content as a file
 */
export function downloadCSV(csvContent: string, fileName: string = "export") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a CSV file without downloading it immediately
 * Returns an object with the URL and file name for later use
 */
export function generateCSVFile(csvContent: string, fileName: string = "export"): {url: string, fileName: string} {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  return {
    url,
    fileName: `${fileName}.csv`
  };
}

