
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { useAppliances } from "@/hooks/useAppliances";
import { downloadCSV, exportAppliances } from "@/utils/exportUtils";
import { FileDown, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const Export: React.FC = () => {
  // Get appliances data with safe fallbacks
  const { 
    appliances: allAppliances = [], 
    knownPartReferences = [],
    getAppliancesByPartReference = () => []
  } = useAppliances();
  
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "html" | "json">("csv");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [selectedPartReference, setSelectedPartReference] = useState("");
  const [exportType, setExportType] = useState<"all" | "by-part-reference">("all");
  const [searchPartRef, setSearchPartRef] = useState(""); 

  // Make sure we have valid appliances
  const safeAppliances = Array.isArray(allAppliances) ? allAppliances : [];
  
  // Initialize an empty array for part references if it's undefined
  const safePartReferences = Array.isArray(knownPartReferences) ? knownPartReferences : [];
  
  // Filtrer les références de pièce selon la recherche
  const filteredPartReferences = React.useMemo(() => {
    if (!searchPartRef || !Array.isArray(safePartReferences)) return safePartReferences;
    
    return safePartReferences.filter(ref => 
      ref && typeof ref === 'string' && ref.toLowerCase().includes(searchPartRef.toLowerCase())
    );
  }, [searchPartRef, safePartReferences]);
  
  // Ensure getCompatibleAppliances always returns an array
  const getCompatibleAppliances = (partRef: string) => {
    if (!getAppliancesByPartReference || !partRef) return [];
    try {
      const result = getAppliancesByPartReference(partRef);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Error getting compatible appliances:", error);
      return [];
    }
  };
  
  const handleExport = () => {
    try {
      if (exportType === "by-part-reference" && !selectedPartReference) {
        toast("Erreur", {
          description: "Veuillez sélectionner une référence de pièce"
        });
        return;
      }

      let appliancesToExport = safeAppliances;
      let fileName = `export-appareils-${new Date().toISOString().split('T')[0]}`;
      
      if (exportType === "by-part-reference" && selectedPartReference) {
        // Use the helper function to ensure we always get an array
        appliancesToExport = getCompatibleAppliances(selectedPartReference);
        fileName = `export-appareils-compatibles-${selectedPartReference}-${new Date().toISOString().split('T')[0]}`;
        
        if (appliancesToExport.length === 0) {
          toast("Information", {
            description: "Aucun appareil n'est compatible avec cette référence de pièce"
          });
          return;
        }
      }
      
      if (appliancesToExport.length === 0) {
        toast("Information", {
          description: "Aucun appareil à exporter"
        });
        return;
      }
      
      if (selectedFormat === "csv") {
        const csvContent = exportAppliances(appliancesToExport, { 
          format: "csv",
          includeHeader: includeHeader,
          partReference: exportType === "by-part-reference" ? selectedPartReference : undefined
        });
        downloadCSV(csvContent, fileName);
        
        toast("Exportation réussie", {
          description: `${appliancesToExport.length} appareils ont été exportés au format CSV`
        });
      } else if (selectedFormat === "html") {
        const htmlContent = exportAppliances(appliancesToExport, { 
          format: "html",
          includeHeader: includeHeader,
          partReference: exportType === "by-part-reference" ? selectedPartReference : undefined
        });
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast("Exportation réussie", {
          description: `${appliancesToExport.length} appareils ont été exportés au format HTML`
        });
      } else {
        const jsonContent = exportAppliances(appliancesToExport, { 
          format: "json",
          partReference: exportType === "by-part-reference" ? selectedPartReference : undefined
        });
        
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast("Exportation réussie", {
          description: `${appliancesToExport.length} appareils ont été exportés au format JSON`
        });
      }
    } catch (error) {
      toast("Erreur d'exportation", {
        description: "Une erreur est survenue lors de l'exportation"
      });
      console.error("Export error:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <FileDown className="mr-2 h-6 w-6" />
          Exporter les données
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'exportation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Type d'exportation</h3>
                <RadioGroup 
                  defaultValue="all" 
                  value={exportType} 
                  onValueChange={(value) => setExportType(value as "all" | "by-part-reference")}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">Tous les appareils ({safeAppliances.length})</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="by-part-reference" id="by-part-reference" />
                    <Label htmlFor="by-part-reference">Par référence de pièce</Label>
                  </div>
                </RadioGroup>
                
                {exportType === "by-part-reference" && (
                  <div className="mt-4 pl-6">
                    <Label htmlFor="part-reference">Référence de la pièce</Label>
                    <div className="mt-2">
                      <div className="flex space-x-2">
                        <Input 
                          type="text"
                          placeholder="Rechercher..." 
                          value={searchPartRef}
                          onChange={(e) => setSearchPartRef(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedPartReference}
                        onChange={(e) => setSelectedPartReference(e.target.value)}
                      >
                        <option value="">Sélectionner une référence de pièce</option>
                        {filteredPartReferences && filteredPartReferences.map((ref) => (
                          <option key={ref} value={ref}>
                            {ref}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Format</h3>
                <Tabs defaultValue="csv" value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as "csv" | "html" | "json")}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="csv">CSV (Excel)</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="csv" className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="include-header" 
                        checked={includeHeader} 
                        onCheckedChange={setIncludeHeader} 
                      />
                      <Label htmlFor="include-header">Inclure en-tête des colonnes</Label>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Format CSV compatible avec Excel et autres tableurs.
                    </p>
                  </TabsContent>
                  <TabsContent value="html" className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="include-header-html" 
                        checked={includeHeader} 
                        onCheckedChange={setIncludeHeader} 
                      />
                      <Label htmlFor="include-header-html">Inclure en-tête des colonnes</Label>
                    </div>
                    <p className="text-sm text-gray-500">
                      Format HTML pour l'affichage dans un navigateur.
                    </p>
                  </TabsContent>
                  <TabsContent value="json" className="pt-4">
                    <p className="text-sm text-gray-500">
                      Format JSON pour intégration avec d'autres applications.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Aperçu et téléchargement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md border h-56 overflow-auto">
                {exportType === "all" ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Database className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-center text-gray-500">
                      {safeAppliances.length === 0 ? (
                        "Aucun appareil à exporter"
                      ) : (
                        `${safeAppliances.length} appareils seront exportés`
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-center text-gray-500">
                      {!selectedPartReference ? (
                        "Sélectionnez une référence de pièce"
                      ) : (
                        getCompatibleAppliances(selectedPartReference).length === 0 ? (
                          "Aucun appareil compatible avec cette référence"
                        ) : (
                          `${getCompatibleAppliances(selectedPartReference).length} appareils compatibles seront exportés`
                        )
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleExport} disabled={safeAppliances.length === 0}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Export;
