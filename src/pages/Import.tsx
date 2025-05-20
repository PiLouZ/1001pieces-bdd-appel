
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import ImportForm from "@/components/ImportForm";
import { useAppliances } from "@/hooks/useAppliances";
import { Appliance } from "@/types/appliance";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Import: React.FC = () => {
  const { importAppliances } = useAppliances();
  const { toast } = useToast();
  const [partReference, setPartReference] = useState("");

  const handleImport = (appliances: Appliance[]) => {
    if (!partReference.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier une référence de pièce",
        variant: "destructive",
      });
      return;
    }
    
    // Stocker la référence de la pièce dans une session temporaire (via localStorage)
    const importSession = {
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
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Importer des appareils</h1>
        
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
        
        <ImportForm onImport={handleImport} />
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Import;
