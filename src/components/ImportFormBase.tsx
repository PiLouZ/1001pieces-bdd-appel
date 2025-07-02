
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Appliance } from "@/types/appliance";
import { parseClipboardData } from "@/utils/importUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ImportFormBaseProps {
  onImport: (appliances: Appliance[], partReference?: string) => Appliance[];
  knownBrands: string[];
  knownTypes: string[];
  knownPartReferences: string[];
  getApplianceByReference: (ref: string) => Appliance | undefined;
  getApplianceByCommercialRef: (ref: string) => Appliance | undefined;
  suggestBrand: (ref: string) => string | null;
  suggestType: (ref: string, brand: string) => string | null;
  associateAppliancesToPartReference: (applianceIds: string[], partRef: string) => number;
  isLoading?: boolean;
}

const ImportFormBase: React.FC<ImportFormBaseProps> = ({ 
  onImport, 
  knownBrands, 
  knownTypes, 
  knownPartReferences, 
  getApplianceByReference,
  getApplianceByCommercialRef,
  suggestBrand,
  suggestType,
  associateAppliancesToPartReference,
  isLoading = false
}) => {
  const [clipboardText, setClipboardText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [newPartReference, setNewPartReference] = useState("");
  const [selectedPartReference, setSelectedPartReference] = useState("");
  const [importedAppliances, setImportedAppliances] = useState<Appliance[]>([]);
  const { toast } = useToast();

  const handleClipboardImport = async () => {
    if (!clipboardText.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller des données dans la zone de texte"
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = parseClipboardData(
        clipboardText, 
        getApplianceByReference,
        getApplianceByCommercialRef,
        suggestBrand,
        suggestType
      );
      
      if (result.success && result.appliances.length > 0) {
        const partRef = selectedPartReference || newPartReference || undefined;
        console.log("🎯 Import avec référence de pièce:", partRef);
        
        const imported = onImport(result.appliances, partRef);
        setImportedAppliances(imported);
        
        // Association automatique si référence de pièce fournie
        if (partRef && imported.length > 0) {
          const applianceIds = imported.map(app => app.id);
          const associatedCount = associateAppliancesToPartReference(applianceIds, partRef);
          
          toast({
            title: "Import réussi",
            description: `${imported.length} appareils importés et ${associatedCount} associations créées avec la pièce ${partRef}`
          });
        } else {
          toast({
            title: "Import réussi",
            description: `${imported.length} appareils importés`
          });
        }
        
        setClipboardText("");
      } else {
        toast({
          title: "Erreur",
          description: result.errors?.join(", ") || "Aucun appareil valide trouvé"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter les données : " + (error as Error).message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = parseClipboardData(
        text, 
        getApplianceByReference,
        getApplianceByCommercialRef,
        suggestBrand,
        suggestType
      );
      
      if (result.success && result.appliances.length > 0) {
        const partRef = selectedPartReference || newPartReference || undefined;
        const imported = onImport(result.appliances, partRef);
        setImportedAppliances(imported);
        
        if (partRef && imported.length > 0) {
          const applianceIds = imported.map(app => app.id);
          const associatedCount = associateAppliancesToPartReference(applianceIds, partRef);
          
          toast({
            title: "Import réussi",
            description: `${imported.length} appareils importés et ${associatedCount} associations créées`
          });
        } else {
          toast({
            title: "Import réussi",
            description: `${imported.length} appareils importés`
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter le fichier"
      });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Chargement des données...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <Tabs defaultValue="clipboard">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Importer des appareils</CardTitle>
          <TabsList>
            <TabsTrigger value="clipboard">Copier/Coller</TabsTrigger>
            <TabsTrigger value="file">Fichier</TabsTrigger>
          </TabsList>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Référence de pièce */}
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
            </div>
            
            <TabsContent value="clipboard" className="space-y-4">
              <Textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                rows={8}
                placeholder="Collez ici vos données (2, 3 ou 4 colonnes supportées)"
                className="font-mono text-sm"
              />
              
              <Button 
                onClick={handleClipboardImport} 
                disabled={isImporting || !clipboardText.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importation...
                  </>
                ) : (
                  "Importer les données"
                )}
              </Button>
              
              <div className="p-3 bg-gray-50 border rounded-md text-sm">
                <p className="font-medium">Formats acceptés :</p>
                <ul className="list-disc list-inside pl-2 text-gray-600 space-y-1">
                  <li><strong>2 colonnes :</strong> Référence technique + Référence commerciale</li>
                  <li><strong>3 colonnes :</strong> Référence technique + Marque + Type</li>
                  <li><strong>4 colonnes :</strong> Type + Marque + Référence technique + Référence commerciale</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="file" className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500">TXT, CSV (MAX. 10MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".txt,.csv,.tsv" 
                    onChange={handleFileImport}
                  />
                </label>
              </div>
            </TabsContent>
          </div>
        </CardContent>
      </Tabs>
      
      {/* Affichage des résultats d'import */}
      {importedAppliances.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Appareils importés ({importedAppliances.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Référence</th>
                    <th className="text-left py-2">Marque</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Ref. commerciale</th>
                  </tr>
                </thead>
                <tbody>
                  {importedAppliances.map(app => (
                    <tr key={app.id} className="border-b">
                      <td className="py-1">{app.reference}</td>
                      <td className="py-1">{app.brand}</td>
                      <td className="py-1">{app.type}</td>
                      <td className="py-1">{app.commercialRef || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </Card>
  );
};

export default ImportFormBase;
