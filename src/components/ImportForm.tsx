
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Appliance, ImportSource } from "@/types/appliance";
import { parseClipboardData } from "@/utils/importUtils";
import { exportAppliances, downloadCSV } from "@/utils/exportUtils";
import MissingInfoForm from "./MissingInfoForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileInput } from "@/components/ui/file-input";

interface ImportFormProps {
  onImport: (appliances: Appliance[]) => Appliance[];
  knownBrands: string[];
  knownTypes: string[];
  knownPartReferences: string[];
  getApplianceByReference: (ref: string) => Appliance | undefined;
  suggestBrand: (ref: string) => string | null;
  suggestType: (ref: string, brand: string) => string | null;
  associateAppliancesToPartReference: (applianceIds: string[], partRef: string) => number;
}

const ImportForm: React.FC<ImportFormProps> = ({ 
  onImport, 
  knownBrands, 
  knownTypes, 
  knownPartReferences, 
  getApplianceByReference,
  suggestBrand,
  suggestType,
  associateAppliancesToPartReference
}) => {
  const [clipboardText, setClipboardText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliancesWithMissingInfo, setAppliancesWithMissingInfo] = useState<Appliance[]>([]);
  const [newPartReference, setNewPartReference] = useState("");
  const [selectedPartReference, setSelectedPartReference] = useState("");
  const [importedFileContent, setImportedFileContent] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClipboardImport = async () => {
    if (!clipboardText.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller des données dans la zone de texte"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = parseClipboardData(
        clipboardText, 
        getApplianceByReference,
        suggestBrand,
        suggestType
      );
      
      if (result.success && result.appliances.length > 0) {
        // Format à 2 colonnes détecté
        if (result.twoColumnsFormat) {
          // Vérifier si des informations sont manquantes (marque ou type)
          const needsCompletion = result.appliances.some(app => 
            !app.brand || app.brand.trim() === "" || !app.type || app.type.trim() === "");
          
          if (needsCompletion) {
            // Montrer le formulaire pour compléter les infos manquantes
            setAppliancesWithMissingInfo(result.appliances);
            toast({
              title: "Information",
              description: `${result.appliances.length} appareils ont besoin de compléments d'informations.`
            });
          } else {
            // Toutes les infos sont complètes, importer directement
            const importedAppliances = onImport(result.appliances);
            
            // Si une référence de pièce est fournie, associer ces appareils
            const partRef = selectedPartReference || newPartReference;
            if (partRef && importedAppliances && importedAppliances.length > 0) {
              const applianceIds = importedAppliances.map(app => app.id);
              associateAppliancesToPartReference(applianceIds, partRef);
              
              // Générer et télécharger le CSV
              const csvContent = exportAppliances(importedAppliances, {
                format: "csv",
                includeHeader: true,
                partReference: partRef
              });
              
              const fileName = `export-appareils-compatibles-${partRef}-${new Date().toISOString().split('T')[0]}`;
              downloadCSV(csvContent, fileName);
              
              toast({
                title: "Succès",
                description: `${importedAppliances.length} appareils importés et associés à la référence ${partRef}. Un fichier CSV a été généré.`
              });
            } else {
              toast({
                title: "Succès",
                description: `${result.appliances.length} appareils importés (format à 2 colonnes).`
              });
            }
            
            setClipboardText("");
          }
        } else if (result.missingInfo && result.missingInfo.length > 0) {
          // Format à 4 colonnes mais avec des informations manquantes
          setAppliancesWithMissingInfo(result.missingInfo);
          toast({
            title: "Information",
            description: `${result.missingInfo.length} appareils ont besoin de compléments d'informations.`
          });
          
        } else {
          // Format à 4 colonnes complet
          const importedAppliances = onImport(result.appliances);
          
          // Si une référence de pièce est fournie, associer ces appareils
          const partRef = selectedPartReference || newPartReference;
          if (partRef && importedAppliances && importedAppliances.length > 0) {
            const applianceIds = importedAppliances.map(app => app.id);
            associateAppliancesToPartReference(applianceIds, partRef);
            
            // Générer et télécharger le CSV
            const csvContent = exportAppliances(importedAppliances, {
              format: "csv",
              includeHeader: true,
              partReference: partRef
            });
            
            const fileName = `export-appareils-compatibles-${partRef}-${new Date().toISOString().split('T')[0]}`;
            downloadCSV(csvContent, fileName);
            
            toast({
              title: "Succès",
              description: `${importedAppliances.length} appareils importés et associés à la référence ${partRef}. Un fichier CSV a été généré.`
            });
          } else {
            toast({
              title: "Succès",
              description: `${result.appliances.length} appareils importés avec succès`
            });
          }
          
          setClipboardText("");
        }
      } else {
        toast({
          title: "Erreur",
          description: result.errors?.join(", ") || "Aucun appareil valide trouvé dans les données collées"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter les données : " + (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      setImportedFileContent(text);
      
      // Utiliser le même traitement que pour le copier-coller
      const result = parseClipboardData(
        text, 
        getApplianceByReference,
        suggestBrand,
        suggestType
      );
      
      if (result.success && result.appliances.length > 0) {
        if (result.missingInfo && result.missingInfo.length > 0) {
          setAppliancesWithMissingInfo(result.appliances);
          toast({
            title: "Information",
            description: `${result.missingInfo.length} appareils ont besoin de compléments d'informations.`
          });
        } else {
          const importedAppliances = onImport(result.appliances);
          
          // Si une référence de pièce est fournie, associer ces appareils
          const partRef = selectedPartReference || newPartReference;
          if (partRef && importedAppliances && importedAppliances.length > 0) {
            const applianceIds = importedAppliances.map(app => app.id);
            associateAppliancesToPartReference(applianceIds, partRef);
            
            // Générer et télécharger le CSV
            const csvContent = exportAppliances(importedAppliances, {
              format: "csv",
              includeHeader: true,
              partReference: partRef
            });
            
            const fileName = `export-appareils-compatibles-${partRef}-${new Date().toISOString().split('T')[0]}`;
            downloadCSV(csvContent, fileName);
            
            toast({
              title: "Succès",
              description: `${importedAppliances.length} appareils importés et associés à la référence ${partRef}. Un fichier CSV a été généré.`
            });
          } else {
            toast({
              title: "Succès",
              description: `${importedAppliances.length} appareils importés depuis le fichier`
            });
          }
        }
      } else {
        toast({
          title: "Erreur",
          description: result.errors?.join(", ") || "Aucun appareil valide trouvé dans le fichier"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter le fichier : " + (error as Error).message
      });
    } finally {
      setIsLoading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    toast({
      title: "Information",
      description: "L'importation PDF sera bientôt disponible"
    });
    
    // La logique d'importation PDF sera implémentée ultérieurement
    // Cela nécessitera l'installation d'un package comme pdf.js
    e.target.value = '';
  };

  const handleCompleteMissingInfo = (completedAppliances: Appliance[]) => {
    const importedAppliances = onImport(completedAppliances);
    
    // Si une référence de pièce est fournie, associer ces appareils
    const partRef = selectedPartReference || newPartReference;
    if (partRef && importedAppliances && importedAppliances.length > 0) {
      const applianceIds = importedAppliances.map(app => app.id);
      const count = associateAppliancesToPartReference(applianceIds, partRef);
      
      // Générer et télécharger le CSV
      const csvContent = exportAppliances(importedAppliances, {
        format: "csv",
        includeHeader: true,
        partReference: partRef
      });
      
      const fileName = `export-appareils-compatibles-${partRef}-${new Date().toISOString().split('T')[0]}`;
      downloadCSV(csvContent, fileName);
      
      toast({
        title: "Succès",
        description: `${importedAppliances.length} appareils importés et associés à la référence ${partRef}. Un fichier CSV a été généré.`
      });
    } else {
      toast({
        title: "Succès",
        description: `${importedAppliances.length} appareils importés avec succès`
      });
    }
    
    setAppliancesWithMissingInfo([]);
    setClipboardText("");
    setImportedFileContent(null);
  };

  const handleCancelMissingInfo = () => {
    setAppliancesWithMissingInfo([]);
    setImportedFileContent(null);
    toast({
      title: "Importation annulée",
      description: "Les données n'ont pas été importées"
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
      <Tabs defaultValue="clipboard">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Données des appareils</CardTitle>
          <TabsList>
            <TabsTrigger value="clipboard">Copier/Coller</TabsTrigger>
            <TabsTrigger value="file">Fichier</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {/* Association à une référence de pièce (pour tous les onglets) */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="part-reference">Référence de pièce (optionnel)</Label>
                <div className="flex space-x-2 mt-1">
                  <Select value={selectedPartReference} onValueChange={setSelectedPartReference}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner une référence existante" />
                    </SelectTrigger>
                    <SelectContent>
                      {knownPartReferences.map(ref => (
                        <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center text-sm text-gray-500">ou</span>
                  <Input
                    value={newPartReference}
                    onChange={(e) => setNewPartReference(e.target.value)}
                    placeholder="Nouvelle référence"
                    className="flex-1"
                    disabled={!!selectedPartReference}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Les appareils importés seront automatiquement associés à cette référence de pièce
                </p>
              </div>
            </div>
            
            <TabsContent value="clipboard" className="space-y-4">
              <Textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                rows={8}
                placeholder="Collez ici vos données (tableau Excel, texte structuré...)"
                className="font-mono text-sm"
              />
              
              <Button 
                onClick={handleClipboardImport} 
                disabled={isLoading || !clipboardText.trim()}
                className="w-full"
              >
                {isLoading ? "Importation..." : "Importer les données"}
              </Button>
              
              <div className="p-3 bg-gray-50 border rounded-md text-sm">
                <p className="font-medium">Formats acceptés :</p>
                <ul className="list-disc list-inside pl-2 text-gray-600">
                  <li><strong>Format à 4 colonnes</strong> (pour alimenter la base de données) :</li>
                  <ul className="list-disc list-inside pl-6 text-gray-600">
                    <li>Type de l'appareil</li>
                    <li>Marque de l'appareil</li>
                    <li>Référence technique de l'appareil</li>
                    <li>Référence commerciale de l'appareil</li>
                  </ul>
                  <li className="mt-1"><strong>Format à 2 colonnes</strong> (pour générer un fichier de compatibilité) :</li>
                  <ul className="list-disc list-inside pl-6 text-gray-600">
                    <li>Référence technique de l'appareil</li>
                    <li>Référence commerciale de l'appareil</li>
                  </ul>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Dans le format à 2 colonnes, l'outil complètera automatiquement les marques et types s'il les connaît déjà.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="file">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Sélectionnez un fichier texte ou CSV contenant les informations des appareils
                  </p>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-input"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
                        </p>
                        <p className="text-xs text-gray-500">
                          TXT, CSV (MAX. 10MB)
                        </p>
                      </div>
                      <input 
                        id="file-input" 
                        type="file" 
                        className="hidden" 
                        accept=".txt,.csv,.tsv" 
                        onChange={handleFileImport}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 border rounded-md text-sm">
                  <p className="font-medium">Formats acceptés :</p>
                  <p className="text-sm text-gray-600">
                    Mêmes formats que l'onglet Copier/Coller, mais dans un fichier.
                  </p>
                </div>
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
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ImportForm;
