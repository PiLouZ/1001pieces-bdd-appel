
import { Appliance, ExportOptions } from "@/types/appliance";

/**
 * Exports appliances to CSV, HTML, or JSON format based on options
 */
export function exportAppliances(appliances: Appliance[], options: ExportOptions): string {
  const { format, includeHeader = true, partReference } = options;
  
  if (format === "csv") {
    // Headers for the CSV
    const headers = ["Référence technique", "Référence commerciale", "Marque", "Type", "Date d'ajout"];
    if (partReference) {
      headers.push("Référence de pièce");
    }
    
    // Start with headers if includeHeader is true
    let csv = includeHeader ? headers.join(";") + "\n" : "";
    
    // Add each appliance as a row
    appliances.forEach(appliance => {
      const row = [
        appliance.reference,
        appliance.commercialRef || "",
        appliance.brand,
        appliance.type,
        appliance.dateAdded
      ];
      
      if (partReference) {
        row.push(partReference);
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
      html += '<th>Référence technique</th>';
      html += '<th>Référence commerciale</th>';
      html += '<th>Marque</th>';
      html += '<th>Type</th>';
      html += '<th>Date d\'ajout</th>';
      if (partReference) {
        html += '<th>Référence de pièce</th>';
      }
      html += '</tr></thead>';
    }
    
    // Add data rows
    html += '<tbody>';
    appliances.forEach(appliance => {
      html += '<tr>';
      html += `<td>${appliance.reference}</td>`;
      html += `<td>${appliance.commercialRef || ""}</td>`;
      html += `<td>${appliance.brand}</td>`;
      html += `<td>${appliance.type}</td>`;
      html += `<td>${appliance.dateAdded}</td>`;
      if (partReference) {
        html += `<td>${partReference}</td>`;
      }
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
