
import { Appliance, ExportOptions } from "@/types/appliance";

/**
 * Exports appliances to CSV or HTML format based on options
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
  } else {
    // Return JSON string for other formats
    return JSON.stringify(appliances, null, 2);
  }
}

/**
 * Downloads CSV content as a file
 */
export function downloadCSV(csvContent: string, fileName: string = "export.csv") {
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
