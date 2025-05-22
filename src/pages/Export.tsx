
import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppliances } from "@/hooks/useAppliances";
import { toast } from "sonner";
import { downloadFile, generateCSV, generateHTML } from "@/utils/exportUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportOptions } from "@/types/appliance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Export: React.FC = () => {
  const { allAppliances, cleanDatabase, getAppliancesByPartReference, knownPartReferences: appPartRefs } = useAppliances();
  const [partReference, setPartReference] = useState("");
  const [exportFormat, setExportFormat] = useState<"csv" | "html">("csv");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [lastImportedPartRef, setLastImportedPartRef] = useState("");
  const [knownPartReferences, setKnownPartReferences] = useState<string[]>([]);
  const [appliancesCount, setAppliancesCount] = useState(0);

  useEffect(() => {
    // Récupérer la dernière session d'importation
    const lastSessionStr = localStorage.getItem("lastImportSession");
    if (lastSessionStr) {
      try {
        const lastSession = JSON.parse(lastSessionStr);
        setLastImportedPartRef(lastSession.partReference || "");
        setPartReference(lastSession.partReference || "");
        
        // Mettre à jour le compte d'appareils
        if (lastSession.partReference) {
          const compatibleAppliances = getAppliancesByPartReference(lastSession.partReference);
          setAppliancesCount(compatibleAppliances.length);
        }
      } catch (e) {
        console.error("Erreur lors de la récupération de la dernière session:", e);
      }
    }

    // Récupérer toutes les références de pièces connues
    setKnownPartReferences(appPartRefs);
  }, [appPartRefs, getAppliancesByPartReference]);

  // Mettre à jour le nombre d'appareils quand la référence de pièce change
  useEffect(() => {
    if (partReference.trim()) {
      const compatibleAppliances = getAppliancesByPartReference(partReference);
      setAppliancesCount(compatibleAppliances.length);
    } else {
      setAppliancesCount(0);
    }
  }, [partReference, getAppliancesByPartReference]);

  const handlePartReferenceChange = (ref: string) => {
    setPartReference(ref);
    if (ref.trim()) {
      const compatibleAppliances = getAppliancesByPartReference(ref);
      setAppliancesCount(compatibleAppliances.length);
    } else {
      setAppliancesCount(0);
    }
  };

  const handleExportAll = () => {
    try {
      const options: ExportOptions = { 
        partReference: "TOUS",
        format: exportFormat,
        includeHeader
      };
      
      if (exportFormat === "csv") {
        const csvContent = generateCSV(allAppliances, options);
        
        downloadFile(
          csvContent,
          `tous_appareils.csv`,
          "text/csv;charset=utf-8"
        );
      } else {
        const htmlContent = generateHTML(allAppliances, options);
        
        downloadFile(
          htmlContent,
          `tous_appareils.html`,
          "text/html;charset=utf-8"
        );
      }

      toast({
        title: "Exportation réussie",
        description: `Le fichier ${exportFormat.toUpperCase()} de tous les appareils a été généré avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de générer le fichier: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleExportByReference = () => {
    if (!partReference.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier une référence de pièce",
        variant: "destructive",
      });
      return;
    }

    const appliancesForPart = getAppliancesByPartReference(partReference);
    
    if (!appliancesForPart || appliancesForPart.length === 0) {
      toast({
        title: "Information",
        description: "Aucun appareil trouvé pour cette référence de pièce",
      });
      return;
    }

    const options: ExportOptions = {
      partReference,
      format: exportFormat,
      includeHeader,
    };

    try {
      if (exportFormat === "csv") {
        const csvContent = generateCSV(appliancesForPart, options);
        downloadFile(
          csvContent,
          `appareils-compatibles-${partReference.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`,
          "text/csv;charset=utf-8"
        );
      } else {
        const htmlContent = generateHTML(appliancesForPart, options);
        downloadFile(
          htmlContent,
          `appareils-compatibles-${partReference.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
          "text/html;charset=utf-8"
        );
      }

      toast({
        title: "Exportation réussie",
        description: `Le fichier ${exportFormat.toUpperCase()} a été généré avec succès pour ${appliancesForPart.length} appareils.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de générer le fichier: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleCleanDatabase = () => {
    const removedCount = cleanDatabase();
    
    if (removedCount > 0) {
      toast({
        title: "Base de données nettoyée",
        description: `${removedCount} doublons ont été supprimés.`,
      });
    } else {
      toast({
        title: "Information",
        description: "Aucun doublon trouvé dans la base de données.",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Exporter des données</h1>
        
        <Tabs defaultValue="reference" className="mt-6">
          <TabsList className="w-full border-b mb-8">
            <TabsTrigger value="reference">Par référence de pièce</TabsTrigger>
            <TabsTrigger value="all">Tous les appareils</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reference" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Exporter par référence de pièce</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="partReference">Référence de la pièce</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        {knownPartReferences.length > 0 ? (
                          <Select 
                            value={partReference} 
                            onValueChange={handlePartReferenceChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionner une référence de pièce" />
                            </SelectTrigger>
                            <SelectContent>
                              {knownPartReferences.map(ref => (
                                <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            id="partReference" 
                            type="text" 
                            value={partReference} 
                            onChange={e => handlePartReferenceChange(e.target.value)}
                            placeholder="Ex: XYZ123" 
                          />
                        )}
                      </div>
                      
                      {lastImportedPartRef && lastImportedPartRef !== partReference && (
                        <Button 
                          variant="outline" 
                          onClick={() => handlePartReferenceChange(lastImportedPartRef)}
                          className="whitespace-nowrap"
                        >
                          Utiliser dernière importée ({lastImportedPartRef})
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-1.5">
                    <Label htmlFor="exportFormat">Format d'export</Label>
                    <Select
                      value={exportFormat}
                      onValueChange={(value: "csv" | "html") => setExportFormat(value)}
                    >
                      <SelectTrigger id="exportFormat">
                        <SelectValue placeholder="Sélectionner un format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {exportFormat === "csv" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeHeader"
                        checked={includeHeader}
                        onCheckedChange={(checked) => 
                          setIncludeHeader(checked === true)
                        }
                      />
                      <Label htmlFor="includeHeader">
                        Inclure l'en-tête
                      </Label>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleExportByReference} 
                    disabled={!partReference.trim() || appliancesCount === 0}
                  >
                    Exporter les appareils compatibles ({appliancesCount})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Exporter tous les appareils</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="exportFormatAll">Format d'export</Label>
                    <Select
                      value={exportFormat}
                      onValueChange={(value: "csv" | "html") => setExportFormat(value)}
                    >
                      <SelectTrigger id="exportFormatAll">
                        <SelectValue placeholder="Sélectionner un format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {exportFormat === "csv" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeHeaderAll"
                        checked={includeHeader}
                        onCheckedChange={(checked) => 
                          setIncludeHeader(checked === true)
                        }
                      />
                      <Label htmlFor="includeHeaderAll">
                        Inclure l'en-tête
                      </Label>
                    </div>
                  )}
                  
                  <Button onClick={handleExportAll}>
                    Exporter tous les appareils ({allAppliances.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="maintenance" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance de la base de données</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    Votre base de données contient actuellement {allAppliances.length} appareils.
                    Vous pouvez nettoyer la base pour supprimer les doublons.
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleCleanDatabase}
                  >
                    Nettoyer la base de données
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Export;
