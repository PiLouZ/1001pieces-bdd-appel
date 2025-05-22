
import { Appliance, ExportOptions } from "@/types/appliance";

/**
 * Exports appliances to CSV, HTML, or JSON format based on options
 */
export function exportAppliances(appliances: Appliance[], options: ExportOptions): string {
  const { format, includeHeader = true, partReference } = options;
  
  if (format === "csv") {
    // Headers for the CSV with the new format
    const headers = [
      "Référence de la pièce",
      "Type de l'appareil",
      "Marque de l'appareil",
      "Modèle de l'appareil", // This will be a concatenation
      "Référence technique de l'appareil",
      "Référence commerciale de l'appareil"
    ];
    
    // Start with headers if includeHeader is true
    let csv = includeHeader ? headers.join("\t") + "\n" : "";
    
    // Add each appliance as a row
    appliances.forEach(appliance => {
      // Create the model field by concatenating reference and commercialRef
      const model = `${appliance.reference}${appliance.commercialRef ? " - " + appliance.commercialRef : ""}`;
      
      const row = [
        partReference || "",
        appliance.type || "",
        appliance.brand || "",
        model,
        appliance.reference,
        appliance.commercialRef || ""
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
      html += '<th>Référence de la pièce</th>';
      html += '<th>Type de l\'appareil</th>';
      html += '<th>Marque de l\'appareil</th>';
      html += '<th>Modèle de l\'appareil</th>';
      html += '<th>Référence technique de l\'appareil</th>';
      html += '<th>Référence commerciale de l\'appareil</th>';
      html += '</tr></thead>';
    }
    
    // Add data rows
    html += '<tbody>';
    appliances.forEach(appliance => {
      const model = `${appliance.reference}${appliance.commercialRef ? " - " + appliance.commercialRef : ""}`;
      
      html += '<tr>';
      html += `<td>${partReference || ""}</td>`;
      html += `<td>${appliance.type || ""}</td>`;
      html += `<td>${appliance.brand || ""}</td>`;
      html += `<td>${model}</td>`;
      html += `<td>${appliance.reference}</td>`;
      html += `<td>${appliance.commercialRef || ""}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
  } else {
    // Return JSON string for other formats (including "json")
    return JSON.stringify(appliances, null, 2);
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
