
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { parseImportedFile, ProcessedRow } from "@/utils/importUtils";
import { FileUp, Database, AlertCircle, Check, Import as ImportIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ImportForm from "@/components/ImportForm";
import MissingInfoForm from "@/components/MissingInfoForm";
import { useDropzone } from "react-dropzone";
import { useAppliances } from "@/hooks/useAppliances";
import { Appliance } from "@/types/appliance";

const Import: React.FC = () => {
  const { 
    importAppliances, 
    appliances: allAppliances,
    saveImportSession,
    getImportSession,
    deleteImportSession,
    suggestBrand,
    suggestType,
    knownPartReferences
  } = useAppliances();
  
  const [importStep, setImportStep] = useState<"upload" | "preview" | "complete" | "missingInfo">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedRow[]>([]);
  const [previewData, setPreviewData] = useState<ProcessedRow[]>([]);
  const [selectedPreviewRows, setSelectedPreviewRows] = useState<number>(10);
  const [importedCount, setImportedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [importSessionId, setImportSessionId] = useState("");
  const [partReference, setPartReference] = useState("");
  const [incompleteTotalCount, setIncompleteTotalCount] = useState(0);
  const [currentIncompleteIndex, setCurrentIncompleteIndex] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  
  // State pour les appareils identifiés dans la base comme similaires
  const [identifiedAppliances, setIdentifiedAppliances] = useState<{[key: string]: Appliance | null}>({});

  // Fonction de callback pour le drop de fichier
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    
    // Générer un ID de session
    const sessionId = `import-${Date.now()}`;
    setImportSessionId(sessionId);
    
    // Lire et traiter le fichier
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) return;
        
        const content = e.target.result as string;
        const { processedRows } = await parseImportedFile(content);
        
        // Vérifier si le fichier contient des données
        if (processedRows.length === 0) {
          toast("Erreur", {
            description: "Le fichier ne contient aucune donnée valide",
            variant: "destructive"
          });
          return;
        }
        
        // Rechercher automatiquement les correspondances dans la base de données
        const updatedRows = [...processedRows];
        const identified: {[key: string]: Appliance | null} = {};
        
        updatedRows.forEach((row, index) => {
          if (row.reference) {
            // Chercher un appareil avec la même référence
            const existingAppliance = allAppliances.find(app => app.reference === row.reference);
            identified[index] = existingAppliance || null;
            
            // Si l'appareil existe et qu'il manque des infos dans notre import, les compléter
            if (existingAppliance) {
              if (!row.brand) row.brand = existingAppliance.brand;
              if (!row.type) row.type = existingAppliance.type;
              if (!row.commercialRef) row.commercialRef = existingAppliance.commercialRef || "";
            } else {
              // Suggérer des valeurs si possible
              if (!row.brand) {
                const suggestedBrand = suggestBrand(row.reference);
                if (suggestedBrand) row.brand = suggestedBrand;
              }
              
              if (!row.type && row.brand) {
                const suggestedType = suggestType(row.reference, row.brand);
                if (suggestedType) row.type = suggestedType;
              }
            }
          }
        });
        
        setIdentifiedAppliances(identified);
        setProcessedData(updatedRows);
        setPreviewData(updatedRows.slice(0, selectedPreviewRows));
        
        // Vérifier s'il y a des données incomplètes
        const incompleteRows = updatedRows.filter(
          row => !identified[updatedRows.indexOf(row)] && (
            !row.brand || row.brand.trim() === "" || 
            !row.type || row.type.trim() === ""
          )
        );
        
        if (incompleteRows.length > 0) {
          setIncompleteTotalCount(incompleteRows.length);
          // Sauvegarder la session
          saveImportSession(sessionId, {
            id: sessionId,
            createdAt: new Date().toISOString(),
            appliances: updatedRows.map(row => ({
              reference: row.reference,
              commercialRef: row.commercialRef,
              brand: row.brand,
              type: row.type,
              id: "",
              dateAdded: new Date().toISOString()
            }))
          });
          
          setImportStep("missingInfo");
        } else {
          setImportStep("preview");
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        toast("Erreur", {
          description: "Impossible de lire le fichier. Vérifiez le format.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(uploadedFile);
  }, [allAppliances, saveImportSession, selectedPreviewRows, suggestBrand, suggestType]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    multiple: false
  });

  const handleImport = () => {
    try {
      if (processedData.length === 0) {
        toast("Erreur", {
          description: "Aucune donnée à importer",
          variant: "destructive"
        });
        return;
      }
      
      // Préparer les appareils à importer
      const appliancesToImport: Appliance[] = processedData.map(row => ({
        id: "",  // L'ID sera généré par la fonction importAppliances
        reference: row.reference,
        commercialRef: row.commercialRef,
        brand: row.brand,
        type: row.type,
        dateAdded: new Date().toISOString()
      }));
      
      // Filtrer les doublons déjà présents dans la base
      const existingRefs = new Set(allAppliances.map(app => app.reference));
      const newAppliances = appliancesToImport.filter(app => !existingRefs.has(app.reference));
      const duplicates = appliancesToImport.length - newAppliances.length;
      
      // Importer les appareils
      const importedCount = importAppliances(newAppliances);
      
      setImportedCount(importedCount);
      setDuplicateCount(duplicates);
      
      // Si une référence de pièce est spécifiée, l'associer aux appareils importés
      if (partReference.trim()) {
        // Récupérer les IDs des nouveaux appareils (ils sont générés lors de l'importation)
        const importedRefs = newAppliances.map(app => app.reference);
        const importedApplianceIds = allAppliances
          .filter(app => importedRefs.includes(app.reference))
          .map(app => app.id);
        
        // Associer la référence de pièce
        // associateApplicancesToPartReference(importedApplianceIds, partReference);
      }
      
      toast("Importation réussie", {
        description: `${importedCount} appareils importés (${duplicates} doublons ignorés)`
      });
      
      // Nettoyer la session d'importation
      if (importSessionId) {
        deleteImportSession(importSessionId);
        setImportSessionId("");
      }
      
      setImportStep("complete");
    } catch (error) {
      console.error("Import error:", error);
      toast("Erreur d'importation", {
        description: "Une erreur est survenue lors de l'importation",
        variant: "destructive"
      });
    }
  };
  
  const handleMissingInfoUpdate = (updatedData: ProcessedRow) => {
    // Mettre à jour les données traitées
    const newProcessedData = [...processedData];
    newProcessedData[currentIncompleteIndex] = updatedData;
    setProcessedData(newProcessedData);
    
    // Mettre à jour la session d'importation
    if (importSessionId) {
      const session = getImportSession(importSessionId);
      if (session) {
        const updatedAppliances = [...session.appliances];
        updatedAppliances[currentIncompleteIndex] = {
          ...updatedAppliances[currentIncompleteIndex],
          brand: updatedData.brand,
          type: updatedData.type,
          commercialRef: updatedData.commercialRef
        };
        
        saveImportSession(importSessionId, {
          ...session,
          appliances: updatedAppliances
        });
      }
    }
    
    // Incrémenter le compteur de traitement
    setProcessedCount(prev => prev + 1);
    
    // Passer à la prochaine ligne incomplète
    const incompleteIndices = processedData
      .map((row, index) => (!identifiedAppliances[index] && (!row.brand || !row.type)) ? index : -1)
      .filter(index => index !== -1);
    
    const currentIndexPosition = incompleteIndices.indexOf(currentIncompleteIndex);
    if (currentIndexPosition < incompleteIndices.length - 1) {
      // Passer à la prochaine ligne incomplète
      setCurrentIncompleteIndex(incompleteIndices[currentIndexPosition + 1]);
    } else {
      // Toutes les lignes ont été traitées
      setImportStep("preview");
    }
  };
  
  const handleCompleteImport = () => {
    try {
      if (processedData.length === 0) return;
      
      // Filtrer les doublons
      const existingRefs = new Set(allAppliances.map(app => app.reference));
      const appliancesToImport = processedData
        .filter(row => !existingRefs.has(row.reference))
        .map(row => ({
          reference: row.reference,
          commercialRef: row.commercialRef,
          brand: row.brand,
          type: row.type
        }));
      
      const duplicates = processedData.length - appliancesToImport.length;
      
      // Importer les appareils
      const importCount = importAppliances(appliancesToImport as Appliance[]);
      
      setImportedCount(importCount);
      setDuplicateCount(duplicates);
      
      toast("Importation réussie", {
        description: `${importCount} appareils importés (${duplicates} doublons ignorés)`
      });
      
      // Nettoyer la session d'importation
      if (importSessionId) {
        deleteImportSession(importSessionId);
      }
      
      setImportStep("complete");
    } catch (error) {
      console.error("Import error:", error);
      toast("Erreur", {
        description: "Une erreur est survenue lors de l'importation",
        variant: "destructive"
      });
    }
  };
  
  const resetImport = () => {
    setFile(null);
    setProcessedData([]);
    setPreviewData([]);
    setImportedCount(0);
    setDuplicateCount(0);
    setImportSessionId("");
    setPartReference("");
    setIncompleteTotalCount(0);
    setCurrentIncompleteIndex(0);
    setProcessedCount(0);
    setIdentifiedAppliances({});
    setImportStep("upload");
  };

  // Mettre à jour l'aperçu quand le nombre de lignes change
  useEffect(() => {
    if (processedData.length > 0) {
      setPreviewData(processedData.slice(0, selectedPreviewRows));
    }
  }, [selectedPreviewRows, processedData]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <FileUp className="mr-2 h-6 w-6" />
          Importer des appareils
        </h1>
        
        <div className="mb-6">
          <Tabs value={importStep} onValueChange={(v) => setImportStep(v as any)} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="upload" disabled={importStep !== "upload"}>1. Télécharger un fichier</TabsTrigger>
              <TabsTrigger value="missingInfo" disabled={importStep !== "missingInfo" && importStep !== "preview" && importStep !== "complete"}>2. Compléter les données</TabsTrigger>
              <TabsTrigger value="preview" disabled={importStep !== "preview" && importStep !== "complete"}>3. Aperçu</TabsTrigger>
              <TabsTrigger value="complete" disabled={importStep !== "complete"}>4. Terminé</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionner un fichier à importer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
                    }`}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <div className="space-y-2">
                        <Check className="mx-auto h-10 w-10 text-green-500" />
                        <p className="text-lg font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.size > 1024 * 1024 
                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${(file.size / 1024).toFixed(2)} KB`
                          }
                        </p>
                      </div>
                    ) : isDragActive ? (
                      <div className="space-y-2">
                        <FileUp className="mx-auto h-10 w-10 text-primary animate-bounce" />
                        <p className="text-lg font-medium">Déposez le fichier ici...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileUp className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="text-lg font-medium">
                          Glissez-déposez un fichier ici, ou cliquez pour sélectionner
                        </p>
                        <p className="text-sm text-gray-500">
                          Formats supportés : CSV, Excel, TXT
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="partReference">Référence de pièce (optionnel)</Label>
                      <div className="flex gap-2">
                        {knownPartReferences.length > 0 ? (
                          <Select value={partReference} onValueChange={setPartReference}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Associer à une référence de pièce" />
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
                            placeholder="Ex: XYZ123"
                            value={partReference}
                            onChange={e => setPartReference(e.target.value)}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Si spécifié, tous les appareils importés seront associés à cette référence de pièce
                      </p>
                    </div>
                    
                    <ImportForm />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="missingInfo" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Compléter les informations manquantes</span>
                    <div className="text-sm font-normal text-muted-foreground">
                      {processedCount} / {incompleteTotalCount}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={(processedCount / incompleteTotalCount) * 100} />
                  
                  {processedData[currentIncompleteIndex] && (
                    <MissingInfoForm
                      row={processedData[currentIncompleteIndex]}
                      knownBrands={[]}
                      knownTypes={[]}
                      onSave={handleMissingInfoUpdate}
                      // suggestBrand={suggestBrand}
                      // suggestType={suggestType}
                    />
                  )}
                  
                  <div className="flex justify-end">
                    <Button onClick={handleCompleteImport} variant="outline">
                      Ignorer le reste et passer à l'aperçu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Aperçu des données à importer</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-normal text-muted-foreground">
                        Lignes affichées:
                      </span>
                      <Select 
                        value={selectedPreviewRows.toString()}
                        onValueChange={(value) => setSelectedPreviewRows(Number(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">État</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead>Référence commerciale</TableHead>
                          <TableHead>Marque</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.length > 0 ? (
                          previewData.map((row, index) => {
                            const isComplete = row.brand && row.type;
                            const isDuplicate = allAppliances.some(app => app.reference === row.reference);
                            const rowIndex = processedData.indexOf(row);
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  {isDuplicate ? (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                      Déjà existant
                                    </Badge>
                                  ) : isComplete ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                      Prêt
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                      Incomplet
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{row.reference || "-"}</TableCell>
                                <TableCell>{row.commercialRef || "-"}</TableCell>
                                <TableCell>{row.brand || "-"}</TableCell>
                                <TableCell>{row.type || "-"}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              Aucune donnée à afficher
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <div>
                      <p className="text-sm text-gray-500">
                        {processedData.length} lignes au total
                        {processedData.filter(row => allAppliances.some(app => app.reference === row.reference)).length > 0 && (
                          <> • {processedData.filter(row => allAppliances.some(app => app.reference === row.reference)).length} doublons</>
                        )}
                        {processedData.filter(row => !row.brand || !row.type).length > 0 && (
                          <> • {processedData.filter(row => !row.brand || !row.type).length} incomplets</>
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={resetImport}>Annuler</Button>
                      <Button onClick={handleImport}>
                        <ImportIcon className="mr-2 h-4 w-4" />
                        Importer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="complete" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Importation terminée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Check className="mx-auto h-16 w-16 text-green-500 mb-4" />
                      <h2 className="text-2xl font-bold mb-2">
                        Importation réussie !
                      </h2>
                      <p className="text-gray-500 mb-4">
                        {importedCount} appareils ont été importés dans la base de données.
                        {duplicateCount > 0 && (
                          <> {duplicateCount} doublons ont été ignorés.</>
                        )}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button onClick={resetImport} variant="outline">
                          Nouvelle importation
                        </Button>
                        <Button onClick={() => window.location.href = "/appliances"}>
                          Voir tous les appareils
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Import;
