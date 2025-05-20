
import { Appliance, ExportOptions } from "@/types/appliance";

/**
 * Génère un CSV à partir des appareils
 */
export function generateCSV(appliances: Appliance[], options: ExportOptions): string {
  const { partReference, includeHeader = true } = options;
  let csv = "";
  
  // Ajout de l'en-tête
  if (includeHeader) {
    csv += "reference_piece,type,marque,modele,reference_technique,reference_commerciale\n";
  }
  
  // Ajout des données
  appliances.forEach(appliance => {
    // Concaténation pour le modèle: "Référence technique - Référence commerciale"
    const modele = appliance.commercialRef 
      ? `${appliance.reference} - ${appliance.commercialRef}`
      : appliance.reference;
    
    const row = [
      escapeCSV(partReference),
      escapeCSV(appliance.type),
      escapeCSV(appliance.brand),
      escapeCSV(modele),
      escapeCSV(appliance.reference),
      escapeCSV(appliance.commercialRef || "")
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
        <th>Modèle</th>
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
    // Trier par type
    const sortedByType = [...brandAppliances].sort((a, b) => a.type.localeCompare(b.type));
    
    html += `
      <tr class="brand-row">
        <td rowspan="${sortedByType.length}">${brand}</td>
        <td>${sortedByType[0].type}</td>
        <td>${sortedByType[0].commercialRef 
          ? `${sortedByType[0].reference} - ${sortedByType[0].commercialRef}` 
          : sortedByType[0].reference}</td>
      </tr>
    `;

    // Lignes suivantes pour cette marque (sans répéter la marque)
    for (let i = 1; i < sortedByType.length; i++) {
      const appliance = sortedByType[i];
      html += `
      <tr>
        <td>${appliance.type}</td>
        <td>${appliance.commercialRef 
          ? `${appliance.reference} - ${appliance.commercialRef}` 
          : appliance.reference}</td>
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
