
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
import { useToast } from "@/hooks/use-toast";
import { downloadFile, generateCSV, generateHTML } from "@/utils/exportUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportOptions } from "@/types/appliance";

const Export: React.FC = () => {
  const { allAppliances, cleanDatabase } = useAppliances();
  const { toast } = useToast();
  const [partReference, setPartReference] = useState("");
  const [exportFormat, setExportFormat] = useState<"csv" | "html">("csv");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [lastImportedPartRef, setLastImportedPartRef] = useState("");

  useEffect(() => {
    // Récupérer la dernière session d'importation
    const lastSessionStr = localStorage.getItem("lastImportSession");
    if (lastSessionStr) {
      try {
        const lastSession = JSON.parse(lastSessionStr);
        setLastImportedPartRef(lastSession.partReference || "");
        setPartReference(lastSession.partReference || "");
      } catch (e) {
        console.error("Erreur lors de la récupération de la dernière session:", e);
      }
    }
  }, []);

  const handleExport = () => {
    if (!partReference.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier une référence de pièce",
        variant: "destructive",
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
        const csvContent = generateCSV(allAppliances, options);
        downloadFile(
          csvContent,
          `appareils-compatibles-${partReference}.csv`,
          "text/csv;charset=utf-8"
        );
      } else {
        const htmlContent = generateHTML(allAppliances, options);
        downloadFile(
          htmlContent,
          `appareils-compatibles-${partReference}.html`,
          "text/html;charset=utf-8"
        );
      }

      toast({
        title: "Exportation réussie",
        description: `Le fichier ${exportFormat.toUpperCase()} a été généré avec succès.`,
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
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Générer un fichier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="partReference">Référence de la pièce</Label>
                  <Input
                    id="partReference"
                    value={partReference}
                    onChange={(e) => setPartReference(e.target.value)}
                    placeholder="Ex: XYZ123"
                  />
                  {lastImportedPartRef && (
                    <p className="text-xs text-gray-500">
                      Dernière référence importée: {lastImportedPartRef}
                    </p>
                  )}
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
                
                <Button onClick={handleExport}>
                  Exporter ({allAppliances.length} appareils)
                </Button>
              </div>
            </CardContent>
          </Card>
          
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
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Export;
