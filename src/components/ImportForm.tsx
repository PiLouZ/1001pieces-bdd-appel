import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Appliance, ImportSource } from "@/types/appliance";
import { parseClipboardData } from "@/utils/importUtils";
import MissingInfoForm from "./MissingInfoForm";

interface ImportFormProps {
  onImport: (appliances: Appliance[]) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const ImportForm: React.FC<ImportFormProps> = ({ onImport, knownBrands, knownTypes }) => {
  const [clipboardText, setClipboardText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliancesWithMissingInfo, setAppliancesWithMissingInfo] = useState<Appliance[]>([]);
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
        // Format à 2 colonnes détecté
        if (result.twoColumnsFormat) {
          onImport(result.appliances);
          toast({
            title: "Succès",
            description: `${result.appliances.length} appareils importés (format à 2 colonnes). Les marques et types seront complétés automatiquement si possible.`,
          });
          setClipboardText("");
          
        } else if (result.missingInfo && result.missingInfo.length > 0) {
          // Format à 4 colonnes mais avec des informations manquantes
          setAppliancesWithMissingInfo(result.missingInfo);
          toast({
            title: "Information",
            description: `${result.missingInfo.length} appareils ont besoin de compléments d'informations.`,
          });
          
        } else {
          // Format à 4 colonnes complet
          onImport(result.appliances);
          toast({
            title: "Succès",
            description: `${result.appliances.length} appareils importés avec succès`,
          });
          setClipboardText("");
        }
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

  const handleCompleteMissingInfo = (completedAppliances: Appliance[]) => {
    onImport(completedAppliances);
    setAppliancesWithMissingInfo([]);
    setClipboardText("");
    toast({
      title: "Succès",
      description: `${completedAppliances.length} appareils importés avec succès`,
    });
  };

  const handleCancelMissingInfo = () => {
    setAppliancesWithMissingInfo([]);
    toast({
      title: "Importation annulée",
      description: "Les données n'ont pas été importées",
    });
  };

  // Si on a des appareils avec des infos manquantes, on affiche le formulaire pour les compléter
  if (appliancesWithMissingInfo.length > 0) {
    return (
      <MissingInfoForm
        appliances={appliancesWithMissingInfo}
        knownBrands={knownBrands || []}
        knownTypes={knownTypes || []}
        onComplete={handleCompleteMissingInfo}
        onCancel={handleCancelMissingInfo}
      />
    );
  }

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
                  Collez vos données tabulaires dans l'un des formats suivants :
                </p>
                <div className="mb-4 p-3 bg-gray-50 border rounded-md text-sm">
                  <p className="font-medium">Format à 4 colonnes (pour alimenter la base de données) :</p>
                  <ul className="list-disc list-inside pl-2 text-gray-600">
                    <li>Type de l'appareil</li>
                    <li>Marque de l'appareil</li>
                    <li>Référence technique de l'appareil</li>
                    <li>Référence commerciale de l'appareil</li>
                  </ul>
                  <p className="font-medium mt-2">Format à 2 colonnes (pour générer un fichier de compatibilité) :</p>
                  <ul className="list-disc list-inside pl-2 text-gray-600">
                    <li>Référence technique de l'appareil</li>
                    <li>Référence commerciale de l'appareil</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Dans le format à 2 colonnes, l'outil complètera automatiquement les marques et types s'il les connaît déjà.
                  </p>
                </div>
                <Textarea
                  value={clipboardText}
                  onChange={(e) => setClipboardText(e.target.value)}
                  rows={8}
                  placeholder="Collez ici vos données (tableau Excel, texte structuré...)"
                  className="font-mono text-sm"
                />
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
