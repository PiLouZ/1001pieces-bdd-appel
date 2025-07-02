
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Appliance } from "@/types/appliance";

interface HtmlExportZonesProps {
  appliances: Appliance[];
  partReference?: string;
}

const HtmlExportZones: React.FC<HtmlExportZonesProps> = ({ appliances, partReference }) => {
  const [copiedZones, setCopiedZones] = useState<Record<string, boolean>>({});

  const generateHtmlTable = () => {
    if (appliances.length === 0) return "";
    
    const rows = appliances.map(app => 
      `    <tr>
        <td>${app.type}</td>
        <td>${app.brand}</td>
        <td>${app.reference}</td>
        ${app.commercialRef ? `<td>${app.commercialRef}</td>` : '<td>-</td>'}
      </tr>`
    ).join('\n');

    return `<table class="compatibility-table">
  <thead>
    <tr>
      <th>Type d'appareil</th>
      <th>Marque</th>
      <th>Référence technique</th>
      <th>Référence commerciale</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
  };

  const generateHtmlList = () => {
    if (appliances.length === 0) return "";
    
    const items = appliances.map(app => 
      `  <li>${app.brand} ${app.type} - ${app.reference}${app.commercialRef ? ` (${app.commercialRef})` : ''}</li>`
    ).join('\n');

    return `<ul class="compatibility-list">
${items}
</ul>`;
  };

  const generateCssStyles = () => {
    return `.compatibility-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.compatibility-table th,
.compatibility-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.compatibility-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.compatibility-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.compatibility-list {
  list-style-type: disc;
  padding-left: 2rem;
  margin: 1rem 0;
}

.compatibility-list li {
  margin: 0.25rem 0;
}`;
  };

  const copyToClipboard = async (text: string, zoneId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedZones(prev => ({ ...prev, [zoneId]: true }));
      toast.success("Copié dans le presse-papiers");
      
      // Reset après 2 secondes
      setTimeout(() => {
        setCopiedZones(prev => ({ ...prev, [zoneId]: false }));
      }, 2000);
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  if (appliances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zones HTML</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Importez des appareils pour générer les zones HTML</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Zone HTML - Tableau</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={generateHtmlTable()}
            readOnly
            rows={Math.min(10, appliances.length + 5)}
            className="font-mono text-xs"
          />
          <Button
            variant="outline"
            onClick={() => copyToClipboard(generateHtmlTable(), 'table')}
            className="w-full"
          >
            {copiedZones.table ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier le tableau HTML
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zone HTML - Liste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={generateHtmlList()}
            readOnly
            rows={Math.min(8, appliances.length + 2)}
            className="font-mono text-xs"
          />
          <Button
            variant="outline"
            onClick={() => copyToClipboard(generateHtmlList(), 'list')}
            className="w-full"
          >
            {copiedZones.list ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier la liste HTML
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Styles CSS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={generateCssStyles()}
            readOnly
            rows={12}
            className="font-mono text-xs"
          />
          <Button
            variant="outline"
            onClick={() => copyToClipboard(generateCssStyles(), 'css')}
            className="w-full"
          >
            {copiedZones.css ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier les styles CSS
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HtmlExportZones;
