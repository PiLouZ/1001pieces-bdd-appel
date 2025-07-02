
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Download, FileText, Code, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppliances } from "@/hooks/useAppliances";
import { exportAppliances, generateCSVFile } from "@/utils/exportUtils";
import { Checkbox } from "@/components/ui/checkbox";
import HtmlExportZones from "@/components/HtmlExportZones";

const Export: React.FC = () => {
  const { 
    allAppliances, 
    knownPartReferences, 
    getAppliancesByPartReference,
    isLoading 
  } = useAppliances();
  
  const [selectedPartReference, setSelectedPartReference] = useState("");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [customFileName, setCustomFileName] = useState("");
  const [selectedColumns, setSelectedColumns] = useState({
    type: true,
    brand: true,
    reference: true,
    commercialRef: true,
    dateAdded: false
  });

  // Appareils filtrés par référence de pièce
  const filteredAppliances = useMemo(() => {
    if (!selectedPartReference) return allAppliances;
    return getAppliancesByPartReference(selectedPartReference);
  }, [selectedPartReference, allAppliances, getAppliancesByPartReference]);

  const handleExportCSV = () => {
    if (filteredAppliances.length === 0) {
      return;
    }

    // Filtrer les appareils selon les colonnes sélectionnées
    const filteredData = filteredAppliances.map(app => {
      const filteredApp: any = {};
      if (selectedColumns.type) filteredApp.type = app.type;
      if (selectedColumns.brand) filteredApp.brand = app.brand;
      if (selectedColumns.reference) filteredApp.reference = app.reference;
      if (selectedColumns.commercialRef) filteredApp.commercialRef = app.commercialRef;
      if (selectedColumns.dateAdded) filteredApp.dateAdded = app.dateAdded;
      return filteredApp;
    });

    const csvContent = exportAppliances(filteredData, {
      format: "csv",
      includeHeader: includeHeaders,
      partReference: selectedPartReference
    });

    const fileName = customFileName || 
      `export-appareils${selectedPartReference ? `-compatibles-${selectedPartReference}` : ''}-${new Date().toISOString().split('T')[0]}`;
    
    const csvData = generateCSVFile(csvContent, fileName);
    
    const link = document.createElement("a");
    link.setAttribute("href", csvData.url);
    link.setAttribute("download", csvData.fileName);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(csvData.url);
  };

  const generatePreview = () => {
    if (filteredAppliances.length === 0) return "";

    const headers = [];
    if (selectedColumns.type) headers.push("Type d'appareil");
    if (selectedColumns.brand) headers.push("Marque");
    if (selectedColumns.reference) headers.push("Référence technique");
    if (selectedColumns.commercialRef) headers.push("Référence commerciale");
    if (selectedColumns.dateAdded) headers.push("Date d'ajout");

    let preview = "";
    if (includeHeaders) {
      preview += headers.join(";") + "\n";
    }

    const previewData = filteredAppliances.slice(0, 5).map(app => {
      const row = [];
      if (selectedColumns.type) row.push(app.type);
      if (selectedColumns.brand) row.push(app.brand);
      if (selectedColumns.reference) row.push(app.reference);
      if (selectedColumns.commercialRef) row.push(app.commercialRef || "");
      if (selectedColumns.dateAdded) row.push(app.dateAdded);
      return row.join(";");
    });

    preview += previewData.join("\n");
    if (filteredAppliances.length > 5) {
      preview += "\n...";
    }

    return preview;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1 container mx-auto py-8 px-4">
          <Card className="w-full">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Chargement des données...</span>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Download className="mr-2 h-6 w-6" />
          Exporter les données
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Configuration de l'export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtrage par référence de pièce */}
              <div>
                <Label htmlFor="part-reference">Filtrer par référence de pièce</Label>
                <Select value={selectedPartReference} onValueChange={setSelectedPartReference}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les pièces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les pièces</SelectItem>
                    {knownPartReferences.map(ref => (
                      <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPartReference ? 
                    `${filteredAppliances.length} appareils compatibles` : 
                    `${allAppliances.length} appareils au total`
                  }
                </p>
              </div>

              {/* Sélection des colonnes */}
              <div>
                <Label>Colonnes à exporter</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-type"
                      checked={selectedColumns.type}
                      onCheckedChange={(checked) => 
                        setSelectedColumns(prev => ({ ...prev, type: !!checked }))
                      }
                    />
                    <Label htmlFor="col-type" className="text-sm">Type d'appareil</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-brand"
                      checked={selectedColumns.brand}
                      onCheckedChange={(checked) => 
                        setSelectedColumns(prev => ({ ...prev, brand: !!checked }))
                      }
                    />
                    <Label htmlFor="col-brand" className="text-sm">Marque</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-reference"
                      checked={selectedColumns.reference}
                      onCheckedChange={(checked) => 
                        setSelectedColumns(prev => ({ ...prev, reference: !!checked }))
                      }
                    />
                    <Label htmlFor="col-reference" className="text-sm">Référence technique</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-commercial"
                      checked={selectedColumns.commercialRef}
                      onCheckedChange={(checked) => 
                        setSelectedColumns(prev => ({ ...prev, commercialRef: !!checked }))
                      }
                    />
                    <Label htmlFor="col-commercial" className="text-sm">Référence commerciale</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-date"
                      checked={selectedColumns.dateAdded}
                      onCheckedChange={(checked) => 
                        setSelectedColumns(prev => ({ ...prev, dateAdded: !!checked }))
                      }
                    />
                    <Label htmlFor="col-date" className="text-sm">Date d'ajout</Label>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-headers"
                  checked={includeHeaders}
                  onCheckedChange={(checked) => setIncludeHeaders(!!checked)}
                />
                <Label htmlFor="include-headers">Inclure les en-têtes de colonnes</Label>
              </div>

              {/* Nom de fichier personnalisé */}
              <div>
                <Label htmlFor="filename">Nom de fichier (optionnel)</Label>
                <Input
                  id="filename"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="export-appareils"
                />
              </div>

              <Button 
                onClick={handleExportCSV} 
                disabled={filteredAppliances.length === 0}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger le fichier CSV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aperçu de l'export</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generatePreview()}
                readOnly
                rows={10}
                className="font-mono text-xs"
                placeholder="Sélectionnez des données à exporter pour voir l'aperçu"
              />
            </CardContent>
          </Card>
        </div>

        {/* Zones HTML */}
        {selectedPartReference && filteredAppliances.length > 0 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="mr-2 h-5 w-5" />
                  Zones HTML pour intégration web
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HtmlExportZones 
                  appliances={filteredAppliances}
                  partReference={selectedPartReference}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Export;
