import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import ImportForm from "@/components/ImportForm";
import { useAppliances } from "@/hooks/useAppliances";
import { Appliance, ImportSession } from "@/types/appliance";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { generateCSV, downloadFile } from "@/utils/exportUtils";
import { Link } from "react-router-dom";
import { FileText, Import as ImportIcon } from "lucide-react";

const Import: React.FC = () => {
  const { importAppliances, knownBrands, knownTypes, suggestBrand, suggestType } = useAppliances();
  const { toast } = useToast();
  const [partReference, setPartReference] = useState("");
  const [importedAppliances, setImportedAppliances] = useState<Appliance[] | null>(null);
  const [showExportOption, setShowExportOption] = useState(false);

  const handleImport = (appliances: Appliance[]) => {
    if (!partReference.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier une référence de pièce",
        variant: "destructive",
      });
      return;
    }
    
    // Pour le format à 2 colonnes, on essaie de compléter les marques et types
    const isTwoColumnsImport = appliances.some(app => !app.brand || !app.type);
    
    if (isTwoColumnsImport) {
      // Compléter automatiquement les marques et types quand c'est possible
      const completedAppliances = appliances.map(appliance => {
        let updatedAppliance = { ...appliance };
        
        // Si la marque est manquante, essayer de la suggérer
        if (!updatedAppliance.brand || updatedAppliance.brand.trim() === "") {
          const suggestedBrand = suggestBrand(updatedAppliance.reference);
          if (suggestedBrand) {
            updatedAppliance.brand = suggestedBrand;
          }
        }
        
        // Si le type est manquant et qu'on a une marque, essayer de le suggérer
        if ((!updatedAppliance.type || updatedAppliance.type.trim() === "") && updatedAppliance.brand) {
          const suggestedType = suggestType(updatedAppliance.reference, updatedAppliance.brand);
          if (suggestedType) {
            updatedAppliance.type = suggestedType;
          }
        }
        
        return updatedAppliance;
      });
      
      // Stocker la référence de la pièce dans une session temporaire
      const importSession: ImportSession = {
        partReference,
        appliances: completedAppliances,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem("lastImportSession", JSON.stringify(importSession));
      
      // Ajouter les appareils complétés à la base de données
      const importedCount = importAppliances(completedAppliances);
      
      toast({
        title: "Importation réussie",
        description: `${importedCount} nouveaux appareils ajoutés à la base de données.`,
      });
      
      if (importedCount < completedAppliances.length) {
        toast({
          title: "Information",
          description: `${completedAppliances.length - importedCount} appareils étaient déjà dans la base de données.`,
        });
      }
      
      // Proposer l'export pour les données de format à 2 colonnes
      setImportedAppliances(completedAppliances);
      setShowExportOption(true);
    } else {
      // Stocker la référence de la pièce dans une session temporaire (via localStorage)
      const importSession: ImportSession = {
        partReference,
        appliances,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem("lastImportSession", JSON.stringify(importSession));
      
      // Ajouter les appareils à la base de données
      const importedCount = importAppliances(appliances);
      
      toast({
        title: "Importation réussie",
        description: `${importedCount} nouveaux appareils ajoutés à la base de données.`,
      });
      
      if (importedCount < appliances.length) {
        toast({
          title: "Information",
          description: `${appliances.length - importedCount} appareils étaient déjà dans la base de données.`,
        });
      }
      
      // Ne pas proposer l'export pour le format à 4 colonnes
      setImportedAppliances(null);
      setShowExportOption(false);
    }
  };

  const handleExportImported = () => {
    if (!importedAppliances || importedAppliances.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucune donnée à exporter",
        variant: "destructive",
      });
      return;
    }

    const exportOptions = {
      partReference: partReference,
      format: "csv" as const,
      includeHeader: true
    };

    const csvContent = generateCSV(importedAppliances, exportOptions);
    const fileName = `compatibilite_${partReference.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    
    downloadFile(csvContent, fileName, "text/csv;charset=utf-8");
    
    toast({
      title: "Export réussi",
      description: `Le fichier ${fileName} a été généré.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <ImportIcon className="mr-2 h-6 w-6" />
          Importer des appareils
        </h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Information sur la pièce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="partReference">Référence de la pièce</Label>
                <Input
                  id="partReference"
                  type="text"
                  value={partReference}
                  onChange={(e) => setPartReference(e.target.value)}
                  placeholder="Ex: XYZ123"
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Cette référence sera associée aux appareils importés pour la génération de fichiers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ImportForm 
          onImport={handleImport} 
          knownBrands={knownBrands}
          knownTypes={knownTypes}
        />

        {showExportOption && importedAppliances && importedAppliances.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Exporter les données compatibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Vous avez importé des données au format à 2 colonnes. Ces appareils ont été complétés avec leurs marques et types si possible.
                Vous pouvez maintenant exporter ces données au format CSV pour votre liste de compatibilité.
              </p>
              <div className="flex space-x-4">
                <Button onClick={handleExportImported}>
                  Exporter en CSV ({importedAppliances.length} appareils)
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/export">
                    Options d'export avancées
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Import;
