import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import ApplianceList from "@/components/ApplianceList";
import SearchBar from "@/components/SearchBar";
import { useAppliances } from "@/hooks/useAppliances";
import { Database, FileText, Filter, AlertCircle, Plus, Tag } from "lucide-react";
import { Appliance, ApplianceSelection } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Inconsistency {
  reference: string;
  appliances: Appliance[];
  type: "brand" | "type" | "both";
}

const Appliances: React.FC = () => {
  const { 
    appliances, 
    searchQuery, 
    setSearchQuery, 
    deleteAppliance,
    updateAppliance,
    updateMultipleAppliances,
    appliancesNeedingUpdate,
    needsUpdateCount,
    knownPartReferences,
    knownBrands,
    knownTypes,
    allAppliances,
    associateApplicancesToPartReference,
    getPartReferencesForAppliance,
    cleanDatabase
  } = useAppliances();
  
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceSelection>({});
  const [showNeedingUpdate, setShowNeedingUpdate] = useState(false);
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  const [showInconsistenciesDialog, setShowInconsistenciesDialog] = useState(false);
  const [currentInconsistencyIndex, setCurrentInconsistencyIndex] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState<{[reference: string]: string}>({});
  
  // État pour la gestion de l'association de pièces
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);
  const [newPartReference, setNewPartReference] = useState("");
  const [selectedPartReference, setSelectedPartReference] = useState("");
  
  // État pour suivre le nombre de doublons
  const [duplicatesCount, setDuplicatesCount] = useState(0);

  const displayedAppliances = showNeedingUpdate ? appliancesNeedingUpdate : appliances;
  const selectedCount = Object.values(selectedAppliances).filter(Boolean).length;
  const selectedIds = Object.entries(selectedAppliances)
    .filter(([_, selected]) => selected)
    .map(([id]) => id);
  
  // Fonction pour détecter les doublons
  useEffect(() => {
    if (allAppliances.length > 0) {
      // Utiliser un Set pour identifier les références uniques
      const references = new Set<string>();
      const duplicates = new Set<string>();
      
      allAppliances.forEach(appliance => {
        if (references.has(appliance.reference)) {
          duplicates.add(appliance.reference);
        } else {
          references.add(appliance.reference);
        }
      });
      
      setDuplicatesCount(duplicates.size);
    }
  }, [allAppliances]);
  
  // Fonction pour détecter les incohérences
  useEffect(() => {
    if (allAppliances.length > 0) {
      detectInconsistencies();
    }
  }, [allAppliances]);

  const detectInconsistencies = () => {
    const referenceMap: { [key: string]: Appliance[] } = {};
    
    // Regrouper les appareils par référence technique
    allAppliances.forEach(appliance => {
      if (!referenceMap[appliance.reference]) {
        referenceMap[appliance.reference] = [];
      }
      referenceMap[appliance.reference].push(appliance);
    });
    
    const foundInconsistencies: Inconsistency[] = [];
    
    // Analyser chaque groupe pour trouver les incohérences
    Object.entries(referenceMap).forEach(([reference, applianceGroup]) => {
      if (applianceGroup.length > 1) {
        // Vérifier s'il y a des marques ou des types différents
        const brands = new Set(applianceGroup.map(app => app.brand));
        const types = new Set(applianceGroup.map(app => app.type));
        
        if (brands.size > 1 && types.size > 1) {
          foundInconsistencies.push({
            reference,
            appliances: applianceGroup,
            type: "both"
          });
        } else if (brands.size > 1) {
          foundInconsistencies.push({
            reference,
            appliances: applianceGroup,
            type: "brand"
          });
        } else if (types.size > 1) {
          foundInconsistencies.push({
            reference,
            appliances: applianceGroup,
            type: "type"
          });
        }
      }
    });
    
    setInconsistencies(foundInconsistencies);
  };

  const handleCheckInconsistencies = () => {
    detectInconsistencies();
    
    if (inconsistencies.length > 0) {
      setCurrentInconsistencyIndex(0);
      setShowInconsistenciesDialog(true);
    } else {
      toast("Base de données cohérente", {
        description: "Aucune incohérence n'a été détectée dans la base de données.",
      });
    }
  };

  const currentInconsistency = inconsistencies[currentInconsistencyIndex];

  const handleResolveInconsistency = () => {
    if (!currentInconsistency) return;
    
    const { reference, appliances, type } = currentInconsistency;
    const selectedId = selectedResolution[reference];
    const selectedAppliance = appliances.find(app => app.id === selectedId);
    
    if (!selectedAppliance) {
      toast("Erreur", {
        description: "Veuillez sélectionner une option à conserver.",
      });
      return;
    }
    
    // Obtenir les IDs de tous les appareils à mettre à jour (sauf celui qui est sélectionné)
    const applianceIdsToUpdate = appliances
      .filter(app => app.id !== selectedId)
      .map(app => app.id);
    
    if (type === "brand" || type === "both") {
      updateMultipleAppliances(applianceIdsToUpdate, { brand: selectedAppliance.brand });
    }
    
    if (type === "type" || type === "both") {
      updateMultipleAppliances(applianceIdsToUpdate, { type: selectedAppliance.type });
    }
    
    toast("Incohérence résolue", {
      description: `Les appareils avec la référence ${reference} ont été mis à jour.`,
    });
    
    // Passer à la prochaine incohérence ou fermer la boîte de dialogue
    if (currentInconsistencyIndex < inconsistencies.length - 1) {
      setCurrentInconsistencyIndex(currentInconsistencyIndex + 1);
      // Réinitialiser la sélection pour la nouvelle incohérence
      setSelectedResolution({});
    } else {
      setShowInconsistenciesDialog(false);
      // Réinitialiser l'état
      setCurrentInconsistencyIndex(0);
      setSelectedResolution({});
      // Actualiser la liste des incohérences
      detectInconsistencies();
    }
  };

  const handleMergeInconsistencies = () => {
    if (!currentInconsistency) return;
    
    const { reference, appliances } = currentInconsistency;
    const selectedId = selectedResolution[reference];
    const selectedAppliance = appliances.find(app => app.id === selectedId);
    
    if (!selectedAppliance) {
      toast("Erreur", {
        description: "Veuillez sélectionner une option à conserver.",
      });
      return;
    }
    
    // Obtenir les IDs de tous les appareils à supprimer (sauf celui qui est sélectionné)
    const applianceIdsToDelete = appliances
      .filter(app => app.id !== selectedId)
      .map(app => app.id);
    
    // Supprimer les appareils en double
    applianceIdsToDelete.forEach(id => deleteAppliance(id));
    
    toast("Fusion effectuée", {
      description: `Les doublons avec la référence ${reference} ont été supprimés.`,
    });
    
    // Passer à la prochaine incohérence ou fermer la boîte de dialogue
    if (currentInconsistencyIndex < inconsistencies.length - 1) {
      setCurrentInconsistencyIndex(currentInconsistencyIndex + 1);
      // Réinitialiser la sélection pour la nouvelle incohérence
      setSelectedResolution({});
    } else {
      setShowInconsistenciesDialog(false);
      // Réinitialiser l'état
      setCurrentInconsistencyIndex(0);
      setSelectedResolution({});
      // Actualiser la liste des incohérences
      detectInconsistencies();
    }
  };

  const handleNextInconsistency = () => {
    if (currentInconsistencyIndex < inconsistencies.length - 1) {
      setCurrentInconsistencyIndex(currentInconsistencyIndex + 1);
      // Réinitialiser la sélection pour la nouvelle incohérence
      setSelectedResolution({});
    }
  };

  const handleSelectAppliance = (id: string, selected: boolean) => {
    setSelectedAppliances(prev => ({
      ...prev,
      [id]: selected
    }));
  };
  
  const handleSelectAll = (selected: boolean) => {
    const newSelection: ApplianceSelection = {};
    displayedAppliances.forEach(app => {
      newSelection[app.id] = selected;
    });
    setSelectedAppliances(newSelection);
  };
  
  const handleBulkUpdate = (field: keyof Omit<Partial<Appliance>, "id">, value: string) => {
    if (selectedIds.length === 0) {
      toast("Aucun appareil sélectionné", {
        description: "Veuillez sélectionner au moins un appareil à modifier."
      });
      return;
    }
    
    const updateCount = updateMultipleAppliances(selectedIds, { [field]: value });
    
    toast("Mise à jour effectuée", {
      description: `${updateCount} appareils ont été mis à jour.`
    });
    
    // Réinitialiser les sélections
    setSelectedAppliances({});
  };
  
  const toggleUpdateFilter = () => {
    setShowNeedingUpdate(!showNeedingUpdate);
  };
  
  const handleOpenAddPartDialog = () => {
    if (selectedIds.length === 0) {
      toast("Aucun appareil sélectionné", {
        description: "Veuillez sélectionner au moins un appareil pour associer une référence de pièce."
      });
      return;
    }
    setShowAddPartDialog(true);
  };
  
  const handleAddPartReference = () => {
    const partRef = selectedPartReference || newPartReference;
    
    if (!partRef.trim()) {
      toast("Erreur", {
        description: "Veuillez spécifier une référence de pièce"
      });
      return;
    }
    
    if (selectedIds.length === 0) {
      toast("Aucun appareil sélectionné", {
        description: "Veuillez sélectionner au moins un appareil"
      });
      return;
    }
    
    const count = associateApplicancesToPartReference(selectedIds, partRef);
    
    toast("Association réussie", {
      description: `${count} appareils ont été associés à la référence de pièce ${partRef}`
    });
    
    setShowAddPartDialog(false);
    setNewPartReference("");
    setSelectedPartReference("");
  };

  const handleCleanDuplicates = () => {
    const removedCount = cleanDatabase();
    
    if (removedCount > 0) {
      toast("Nettoyage terminé", {
        description: `${removedCount} doublons ont été supprimés.`
      });
      // Mettre à jour le compteur
      setDuplicatesCount(0);
    } else {
      toast("Information", {
        description: "Aucun doublon trouvé dans la base de données."
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="mr-2 h-6 w-6" />
            Tous les appareils
          </h1>
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder={knownPartReferences.length > 0 
              ? "Rechercher par référence, marque, type ou référence de pièce..." 
              : "Rechercher par référence, marque ou type..."}
          />
        </div>
        
        <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant={showNeedingUpdate ? "default" : "outline"} 
              size="sm"
              onClick={toggleUpdateFilter}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Besoins de mise à jour
              {needsUpdateCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {needsUpdateCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckInconsistencies}
              className="flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4" />
              Vérifier les incohérences
              {inconsistencies.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {inconsistencies.length}
                </Badge>
              )}
            </Button>
            
            {duplicatesCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanDuplicates}
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Supprimer les doublons
                <Badge variant="destructive" className="ml-1">
                  {duplicatesCount}
                </Badge>
              </Button>
            )}
            
            {selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddPartDialog}
                className="flex items-center gap-1"
              >
                <Tag className="h-4 w-4" />
                Associer à une référence de pièce
              </Button>
            )}
          </div>
          
          {selectedCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm">{selectedCount} appareils sélectionnés</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleSelectAll(false)}
              >
                Désélectionner tout
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Appareils {showNeedingUpdate ? "à mettre à jour" : "enregistrés"} ({displayedAppliances.length})</span>
                <div className="text-sm text-muted-foreground font-normal">
                  <span className="inline-flex items-center">
                    <FileText className="mr-1 h-4 w-4" />
                    Double-cliquez sur une cellule pour la modifier directement
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApplianceList 
                appliances={displayedAppliances} 
                onDelete={deleteAppliance} 
                onEdit={updateAppliance}
                onSelect={handleSelectAppliance}
                selected={selectedAppliances}
                onSelectAll={handleSelectAll}
                onBulkUpdate={handleBulkUpdate}
                onBulkDelete={() => {
                  // Add bulk delete functionality
                  const selectedIds = Object.entries(selectedAppliances)
                    .filter(([_, selected]) => selected)
                    .map(([id]) => id);
                  
                  if (selectedIds.length === 0) {
                    toast("Aucun appareil sélectionné", {
                      description: "Veuillez sélectionner au moins un appareil à supprimer."
                    });
                    return;
                  }
                  
                  selectedIds.forEach(id => deleteAppliance(id));
                  
                  toast("Appareils supprimés", {
                    description: `${selectedIds.length} appareil(s) ont été supprimés.`
                  });
                  
                  // Clear selections
                  setSelectedAppliances({});
                }}
                onDuplicatesCheck={handleCheckInconsistencies}
                onShowDuplicates={handleCleanDuplicates}
                duplicatesCount={duplicatesCount}
                knownBrands={knownBrands}
                knownTypes={knownTypes}
                getPartReferencesForAppliance={getPartReferencesForAppliance}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Dialog open={showInconsistenciesDialog} onOpenChange={setShowInconsistenciesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Résoudre les incohérences</DialogTitle>
            <DialogDescription>
              {inconsistencies.length > 0 && (
                <div className="text-sm">
                  Incohérence {currentInconsistencyIndex + 1} sur {inconsistencies.length} : 
                  La référence <strong>{currentInconsistency?.reference}</strong> apparaît plusieurs fois avec
                  {currentInconsistency?.type === "brand" && " des marques différentes."}
                  {currentInconsistency?.type === "type" && " des types d'appareil différents."}
                  {currentInconsistency?.type === "both" && " des marques et des types d'appareil différents."}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {currentInconsistency && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Choix</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Référence commerciale</TableHead>
                    <TableHead>Marque</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInconsistency.appliances.map(app => (
                    <TableRow key={app.id} className={
                      selectedResolution[currentInconsistency.reference] === app.id ? "bg-blue-50" : ""
                    }>
                      <TableCell>
                        <RadioGroup
                          value={selectedResolution[currentInconsistency.reference]}
                          onValueChange={(value) => setSelectedResolution({
                            ...selectedResolution,
                            [currentInconsistency.reference]: value
                          })}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={app.id} id={`radio-${app.id}`} />
                          </div>
                        </RadioGroup>
                      </TableCell>
                      <TableCell className="font-medium">{app.reference}</TableCell>
                      <TableCell>{app.commercialRef || "-"}</TableCell>
                      <TableCell>{app.brand || "-"}</TableCell>
                      <TableCell>{app.type || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-gray-600">
                <p className="mb-2">Options de résolution :</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Corriger</strong> : Conserver tous les appareils mais uniformiser les données (marque/type) en fonction de l'option sélectionnée.</li>
                  <li><strong>Fusionner</strong> : Conserver uniquement l'appareil sélectionné et supprimer les doublons.</li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex space-x-2 mt-2 sm:mt-0">
              <Button variant="outline" onClick={() => setShowInconsistenciesDialog(false)}>
                Annuler
              </Button>
              {inconsistencies.length > 1 && currentInconsistencyIndex < inconsistencies.length - 1 && (
                <Button variant="outline" onClick={handleNextInconsistency}>
                  Ignorer / Suivant
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleResolveInconsistency}>
                Corriger
              </Button>
              <Button variant="destructive" onClick={handleMergeInconsistencies}>
                Fusionner
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showAddPartDialog} onOpenChange={setShowAddPartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associer à une référence de pièce</DialogTitle>
            <DialogDescription>
              Associer les {selectedIds.length} appareils sélectionnés à une référence de pièce.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <Tabs defaultValue="select">
                <TabsList className="w-full">
                  <TabsTrigger value="select" className="flex-1">Référence existante</TabsTrigger>
                  <TabsTrigger value="new" className="flex-1">Nouvelle référence</TabsTrigger>
                </TabsList>
                <TabsContent value="select" className="space-y-4 pt-2">
                  {knownPartReferences.length > 0 ? (
                    <Select value={selectedPartReference} onValueChange={setSelectedPartReference}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une référence existante" />
                      </SelectTrigger>
                      <SelectContent>
                        {knownPartReferences.map(ref => (
                          <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Aucune référence de pièce existante. Créez-en une nouvelle.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="new" className="space-y-4 pt-2">
                  <Label htmlFor="newPartReference">Nouvelle référence de pièce</Label>
                  <Input 
                    id="newPartReference"
                    value={newPartReference}
                    onChange={e => setNewPartReference(e.target.value)}
                    placeholder="Ex: XYZ123"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPartDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddPartReference}>
              Associer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Appliances;
