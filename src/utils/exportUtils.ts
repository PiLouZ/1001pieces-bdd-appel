
import { Appliance, ExportOptions } from "@/types/appliance";

/**
 * Exports appliances to CSV, HTML, or JSON format based on options
 */
export function exportAppliances(appliances: Appliance[], options: ExportOptions): string {
  // Ensure appliances is always an array
  const safeAppliances = Array.isArray(appliances) ? appliances : [];
  const { format, includeHeader = true, partReference } = options;
  
  if (format === "csv") {
    // Headers for the CSV - removed "Référence de la pièce" for all appliances and by brand/type exports
    const headers = partReference ? [
      "Référence de la pièce",
      "Type de l'appareil",
      "Marque de l'appareil",
      "Modèle de l'appareil",
      "Référence technique de l'appareil",
      "Référence commerciale de l'appareil"
    ] : [
      "Type de l'appareil",
      "Marque de l'appareil",
      "Modèle de l'appareil",
      "Référence technique de l'appareil",
      "Référence commerciale de l'appareil"
    ];
    
    // Start with headers if includeHeader is true
    let csv = includeHeader ? headers.join("\t") + "\n" : "";
    
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
      
      const row = partReference ? [
        partReference,
        type,
        brand,
        model,
        reference,
        commercialRef
      ] : [
        type,
        brand,
        model,
        reference,
        commercialRef
      ];
      
      csv += row.join("\t") + "\n";
    });
    
    return csv;
  } else if (format === "html") {
    // Simple HTML table format
    let html = '<table border="1">';
    
    // Add header row if includeHeader is true
    if (includeHeader) {
      html += '<thead><tr>';
      if (partReference) {
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
      if (partReference) {
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
