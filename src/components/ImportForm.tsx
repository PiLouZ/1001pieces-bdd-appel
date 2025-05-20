
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Appliance, ImportSource } from "@/types/appliance";
import { parseClipboardData } from "@/utils/importUtils";

interface ImportFormProps {
  onImport: (appliances: Appliance[]) => void;
}

const ImportForm: React.FC<ImportFormProps> = ({ onImport }) => {
  const [clipboardText, setClipboardText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClipboardImport = async () => {
    if (!clipboardText.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller des données dans la zone de texte",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = parseClipboardData(clipboardText);
      
      if (result.success && result.appliances.length > 0) {
        onImport(result.appliances);
        toast({
          title: "Succès",
          description: `${result.appliances.length} appareils importés avec succès`,
        });
        setClipboardText("");
      } else {
        toast({
          title: "Erreur",
          description: result.errors?.join(", ") || "Aucun appareil valide trouvé dans les données collées",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter les données : " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    toast({
      title: "Information",
      description: "L'importation PDF sera bientôt disponible",
    });
    
    // La logique d'importation PDF sera implémentée ultérieurement
    // Cela nécessitera l'installation d'un package comme pdf.js
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Données des appareils</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clipboard">
          <TabsList className="mb-4">
            <TabsTrigger value="clipboard">Copier/Coller</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clipboard">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Collez vos données tabulaires (colonnes attendues: référence technique, référence commerciale, marque, type)
                </p>
                <Textarea
                  value={clipboardText}
                  onChange={(e) => setClipboardText(e.target.value)}
                  rows={6}
                  placeholder="Collez ici vos données (tableau Excel, texte structuré...)"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'ordre des colonnes sera automatiquement détecté si la première ligne contient des en-têtes.
                </p>
              </div>
              <Button 
                onClick={handleClipboardImport} 
                disabled={isLoading || !clipboardText.trim()}
                className="w-full"
              >
                {isLoading ? "Importation..." : "Importer les données"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="pdf">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Sélectionnez un fichier PDF contenant les informations des appareils
                </p>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="pdf-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF (MAX. 10MB)
                      </p>
                    </div>
                    <input 
                      id="pdf-file" 
                      type="file" 
                      className="hidden" 
                      accept=".pdf" 
                      onChange={handlePdfImport}
                    />
                  </label>
                </div>
              </div>
              <p className="text-xs text-amber-600 italic">
                Note: La fonctionnalité d'importation PDF est en cours de développement.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImportForm;
