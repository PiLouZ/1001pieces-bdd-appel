
import { Appliance, ExportOptions } from "@/types/appliance";

/**
 * Génère un CSV à partir des appareils
 */
export function generateCSV(appliances: Appliance[], options: ExportOptions): string {
  const { partReference, includeHeader = true } = options;
  let csv = "";
  
  // Ajout de l'en-tête
  if (includeHeader) {
    csv += "reference_technique,reference_commerciale,marque,type,reference_piece\n";
  }
  
  // Ajout des données
  appliances.forEach(appliance => {
    const row = [
      escapeCSV(appliance.reference),
      escapeCSV(appliance.commercialRef || ""),
      escapeCSV(appliance.brand),
      escapeCSV(appliance.type),
      escapeCSV(partReference)
    ];
    csv += row.join(",") + "\n";
  });
  
  return csv;
}

/**
 * Génère du HTML à partir des appareils
 */
export function generateHTML(appliances: Appliance[], options: ExportOptions): string {
  const { partReference } = options;
  
  let html = `
<div class="compatible-appliances">
  <h3>Appareils compatibles avec la pièce ${partReference}</h3>
  <table class="compatibility-table">
    <thead>
      <tr>
        <th>Marque</th>
        <th>Type</th>
        <th>Référence</th>
      </tr>
    </thead>
    <tbody>
`;

  // Grouper les appareils par marque
  const appliancesByBrand = appliances.reduce((groups, appliance) => {
    if (!groups[appliance.brand]) {
      groups[appliance.brand] = [];
    }
    groups[appliance.brand].push(appliance);
    return groups;
  }, {} as Record<string, Appliance[]>);

  // Construire les lignes du tableau groupées par marque
  Object.entries(appliancesByBrand).forEach(([brand, brandAppliances]) => {
    html += `
      <tr class="brand-row">
        <td rowspan="${brandAppliances.length}">${brand}</td>
        <td>${brandAppliances[0].type}</td>
        <td>${brandAppliances[0].reference}</td>
      </tr>
    `;

    // Lignes suivantes pour cette marque (sans répéter la marque)
    for (let i = 1; i < brandAppliances.length; i++) {
      const appliance = brandAppliances[i];
      html += `
      <tr>
        <td>${appliance.type}</td>
        <td>${appliance.reference}</td>
      </tr>
      `;
    }
  });

  html += `
    </tbody>
  </table>
</div>
  `;

  return html;
}

/**
 * Échappe les caractères spéciaux pour le CSV
 */
function escapeCSV(value: string): string {
  if (!value) return "";
  const needsQuotes = value.includes(",") || value.includes("\"") || value.includes("\n");
  
  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * Prépare un fichier à télécharger
 */
export function downloadFile(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  URL.revokeObjectURL(url);
}
