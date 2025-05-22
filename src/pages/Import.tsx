import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import ImportForm from "@/components/ImportForm";
import { useAppliances } from "@/hooks/useAppliances";
import { Appliance, ImportSession } from "@/types/appliance";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { generateCSV, downloadFile } from "@/utils/exportUtils";
import { Link } from "react-router-dom";
import { FileText, Import as ImportIcon, Save, Clock, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const Import: React.FC = () => {
  const {
    appliances,
    importAppliances,
    knownBrands,
    knownTypes,
    knownPartReferences,
    suggestBrand,
    suggestType,
    associateApplicancesToPartReference,
    saveImportSession,
    getImportSession,
    deleteImportSession
  } = useAppliances();
  
  const [partReference, setPartReference] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [importedAppliances, setImportedAppliances] = useState<Appliance[] | null>(null);
  const [incompleteAppliances, setIncompleteAppliances] = useState<Appliance[]>([]);
  const [showExportOption, setShowExportOption] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showReferenceDialog, setShowReferenceDialog] = useState(false);
  const [showSaveSessionDialog, setShowSaveSessionDialog] = useState(false);
  const [pendingAppliances, setPendingAppliances] = useState<Appliance[]>([]);
  const [isTwoColumnFormat, setIsTwoColumnFormat] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [savedSessions, setSavedSessions] = useState<ImportSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ImportSession | null>(null);

  // Charger les sessions sauvegardées
  useEffect(() => {
    const sessionsData = localStorage.getItem("importSessions");
    if (sessionsData) {
      try {
        const sessions = JSON.parse(sessionsData);
        setSavedSessions(Object.values(sessions));
      } catch (e) {
        console.error("Erreur lors du chargement des sessions:", e);
      }
    }
  }, []);

  const processImport = (appliances: Appliance[], isTwoColumns: boolean) => {
    // Pour le format à 2 colonnes, on demande la référence si nécessaire
    if (isTwoColumns && !partReference.trim()) {
      setPendingAppliances(appliances);
      setIsTwoColumnFormat(true);
      setShowReferenceDialog(true);
      return;
    }

    // Préparer les appareils qui nécessitent des informations supplémentaires
    let appliancesToComplete: Appliance[] = [];
    let appliancesToImport: Appliance[] = [];
    
    appliances.forEach(appliance => {
      let updatedAppliance = { ...appliance };
      let isComplete = true;
      let foundInDatabase = false;
      
      // NOUVEAU: Rechercher si l'appareil existe déjà dans la base
      const existingAppliance = appliances.find(a => a.reference === updatedAppliance.reference);
      
      if (existingAppliance) {
        // Si l'appareil existe, utiliser ses informations
        updatedAppliance.brand = existingAppliance.brand;
        updatedAppliance.type = existingAppliance.type;
        foundInDatabase = true;
      } else {
        // Si la marque est manquante, essayer de la suggérer
        if (!updatedAppliance.brand || updatedAppliance.brand.trim() === "") {
          const suggestedBrand = suggestBrand(updatedAppliance.reference);
          if (suggestedBrand) {
            updatedAppliance.brand = suggestedBrand;
          } else {
            isComplete = false;
          }
        }

        // Si le type est manquant et qu'on a une marque, essayer de le suggérer
        if ((!updatedAppliance.type || updatedAppliance.type.trim() === "") && updatedAppliance.brand) {
          const suggestedType = suggestType(updatedAppliance.reference, updatedAppliance.brand);
          if (suggestedType) {
            updatedAppliance.type = suggestedType;
          } else {
            isComplete = false;
          }
        }
      }

      // Ajouter l'appareil dans la catégorie appropriée
      if (foundInDatabase || isComplete) {
        appliancesToImport.push(updatedAppliance);
      } else {
        appliancesToComplete.push(updatedAppliance);
      }
    });

    // S'il reste des appareils incomplets, montrer le formulaire pour les compléter
    if (appliancesToComplete.length > 0) {
      setIncompleteAppliances(appliancesToComplete);
      toast({
        title: "Information",
        description: `${appliancesToComplete.length} appareils ont besoin de compléments d'informations.`,
      });
      
      // Si on a des appareils complets, les traiter immédiatement
      if (appliancesToImport.length > 0) {
        handleDirectImport(appliancesToImport);
      }
      return;
    }

    // Tous les appareils sont complets, les importer
    handleDirectImport(appliancesToImport);
  };
  
  // Nouvelle fonction pour gérer l'importation directe
  const handleDirectImport = (appliancesToImport: Appliance[]) => {
    // Ajouter les appareils complétés à la base de données
    const importedCount = importAppliances(appliancesToImport);

    // Si une référence de pièce est fournie, associer les appareils à cette référence
    if (partReference.trim()) {
      // Stocker la référence de la pièce dans une session temporaire
      const importSession: ImportSession = {
        id: `session_${Date.now()}`,
        partReference,
        appliances: appliancesToImport,
        createdAt: new Date().toISOString()
      };
      
      // Sauvegarder temporairement pour l'export actuel
      localStorage.setItem("lastImportSession", JSON.stringify(importSession));

      // IMPORTANT: Pour corriger le problème d'association, on doit récupérer les IDs des appareils après importation
      const applianceRefs = appliancesToImport.map(app => app.reference);
      // Trouver les appareils correspondants dans la base de données (pour avoir les bons IDs)
      const matchingAppliances = appliances.filter(app => applianceRefs.includes(app.reference));
      // Extraire seulement les IDs pour l'association
      const applianceIds = matchingAppliances.map(app => app.id);
      
      // Associer tous les appareils importés à la référence de pièce avec les IDs corrects
      associateApplicancesToPartReference(applianceIds, partReference);
      
      toast({
        title: "Importation réussie",
        description: `${importedCount} nouveaux appareils ajoutés et ${matchingAppliances.length} appareils associés à la référence ${partReference}.`
      });

      // Proposer l'export via une boîte de dialogue
      setImportedAppliances(appliancesToImport);
      setShowExportDialog(true); // Afficher la boîte de dialogue d'abord
      setShowExportOption(true); // Puis conserver l'option en bas de page
    } else {
      toast({
        title: "Importation réussie",
        description: `${importedCount} nouveaux appareils ajoutés à la base de données.`
      });
      setImportedAppliances(null);
      setShowExportOption(false);
    }
    
    if (importedCount < appliancesToImport.length) {
      toast({
        title: "Information",
        description: `${appliancesToImport.length - importedCount} appareils étaient déjà dans la base de données.`
      });
    }
  };

  const handleImport = (appliances: Appliance[]) => {
    // Vérifier s'il s'agit d'un format à 2 colonnes
    const is2ColFormat = appliances.every(app => 
      app.reference && app.commercialRef !== undefined && 
      (!app.brand || app.brand.trim() === "") && 
      (!app.type || app.type.trim() === "")
    );
    
    setIsTwoColumnFormat(is2ColFormat);
    processImport(appliances, is2ColFormat);
  };

  const confirmPartReference = () => {
    if (!partReference.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier une référence de pièce",
        variant: "destructive"
      });
      return;
    }
    setShowReferenceDialog(false);
    processImport(pendingAppliances, isTwoColumnFormat);
  };

  const handleExportImported = () => {
    if (!importedAppliances || importedAppliances.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucune donnée à exporter",
        variant: "destructive"
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
      description: `Le fichier ${fileName} a été généré.`
    });
    
    setShowExportDialog(false);
  };

  const handleSelectPartReference = (value: string) => {
    setPartReference(value);
  };
  
  const handleSaveSession = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom à cette session",
        variant: "destructive"
      });
      return;
    }
    
    // Créer une nouvelle session
    const newSession: ImportSession = {
      id: `session_${Date.now()}`,
      name: sessionName,
      partReference,
      appliances: importedAppliances || [],
      incompleteAppliances: incompleteAppliances,
      createdAt: new Date().toISOString()
    };
    
    // Sauvegarder la session
    saveImportSession(newSession.id, newSession);
    
    toast({
      title: "Session sauvegardée",
      description: `La session "${sessionName}" a été sauvegardée et pourra être reprise ultérieurement.`
    });
    
    // Mettre à jour la liste des sessions
    const sessionsData = localStorage.getItem("importSessions");
    if (sessionsData) {
      try {
        const sessions = JSON.parse(sessionsData);
        setSavedSessions(Object.values(sessions));
      } catch (e) {
        console.error("Erreur lors du chargement des sessions:", e);
      }
    }
    
    setShowSaveSessionDialog(false);
  };
  
  const handleLoadSession = (session: ImportSession) => {
    setCurrentSession(session);
    
    // Restaurer les données de la session
    if (session.partReference) {
      setPartReference(session.partReference);
    }
    
    if (session.appliances && session.appliances.length > 0) {
      setImportedAppliances(session.appliances);
      setShowExportOption(true);
    }
    
    if (session.incompleteAppliances && session.incompleteAppliances.length > 0) {
      setIncompleteAppliances(session.incompleteAppliances);
    }
    
    setShowSessionsDialog(false);
    
    toast({
      title: "Session chargée",
      description: `La session "${session.name || session.id}" a été restaurée.`
    });
  };
  
  const handleDeleteSession = (sessionId: string, sessionName: string | undefined) => {
    deleteImportSession(sessionId);
    
    // Mettre à jour la liste des sessions
    const sessionsData = localStorage.getItem("importSessions");
    if (sessionsData) {
      try {
        const sessions = JSON.parse(sessionsData);
        setSavedSessions(Object.values(sessions));
      } catch (e) {
        console.error("Erreur lors du chargement des sessions:", e);
      }
    }
    
    toast({
      title: "Session supprimée",
      description: `La session "${sessionName || sessionId}" a été supprimée.`
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold flex items-center">
            <ImportIcon className="mr-2 h-6 w-6" />
            Importer des appareils
          </h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSessionsDialog(true)}
              className="flex items-center gap-1"
            >
              <Clock className="h-4 w-4" />
              Sessions sauvegardées
            </Button>
            
            {(importedAppliances?.length > 0 || incompleteAppliances.length > 0) && (
              <Button
                variant="outline"
                onClick={() => setShowSaveSessionDialog(true)}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                Sauvegarder la session
              </Button>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="partReference">Référence de la pièce (Optionnel pour format 4 colonnes, Obligatoire pour format 2 colonnes)</Label>
            {knownPartReferences.length > 0 ? (
              <div className="flex gap-2">
                <Select value={partReference} onValueChange={handleSelectPartReference}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Sélectionner ou saisir une référence" />
                  </SelectTrigger>
                  <SelectContent>
                    {knownPartReferences.map(ref => (
                      <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Ou saisir une nouvelle référence" 
                  value={partReference} 
                  onChange={e => setPartReference(e.target.value)} 
                  className="w-full max-w-sm" 
                />
              </div>
            ) : (
              <Input 
                id="partReference" 
                type="text" 
                value={partReference} 
                onChange={e => setPartReference(e.target.value)} 
                placeholder="Ex: XYZ123" 
                className="w-full max-w-sm" 
              />
            )}
            <p className="text-sm text-gray-500">
              Cette référence sera associée aux appareils importés pour la génération de fichiers de compatibilité.
            </p>
          </div>
        </div>
        
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
                Les appareils ont été importés et associés à la référence de pièce {partReference}.
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
        
        {currentSession && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="mr-2 h-5 w-5" />
                Session en cours: {currentSession.name || currentSession.id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 mb-4">
                <p>Date de création: {new Date(currentSession.createdAt).toLocaleString()}</p>
                {currentSession.partReference && (
                  <p>Référence de pièce: {currentSession.partReference}</p>
                )}
              </div>
              
              <Tabs defaultValue="imported">
                <TabsList>
                  <TabsTrigger value="imported">
                    Appareils importés ({currentSession.appliances?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="incomplete">
                    Données incomplètes ({currentSession.incompleteAppliances?.length || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="imported">
                  <div className="rounded-md border max-h-64 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Référence commerciale</TableHead>
                          <TableHead>Marque</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSession.appliances?.map((app, index) => (
                          <TableRow key={app.id || index}>
                            <TableCell>{app.reference}</TableCell>
                            <TableCell>{app.commercialRef}</TableCell>
                            <TableCell>{app.brand}</TableCell>
                            <TableCell>{app.type}</TableCell>
                          </TableRow>
                        ))}
                        {(!currentSession.appliances || currentSession.appliances.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">Aucun appareil importé</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="incomplete">
                  <div className="rounded-md border max-h-64 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Référence commerciale</TableHead>
                          <TableHead>Marque</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSession.incompleteAppliances?.map((app, index) => (
                          <TableRow key={app.id || index}>
                            <TableCell>{app.reference}</TableCell>
                            <TableCell>{app.commercialRef}</TableCell>
                            <TableCell>{app.brand || "Manquant"}</TableCell>
                            <TableCell>{app.type || "Manquant"}</TableCell>
                          </TableRow>
                        ))}
                        {(!currentSession.incompleteAppliances || currentSession.incompleteAppliances.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">Aucun appareil avec données incomplètes</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentSession(null)}
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Dialog open={showReferenceDialog} onOpenChange={setShowReferenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Référence de pièce requise</DialogTitle>
            <DialogDescription>
              Vous importez des données au format 2 colonnes. Veuillez spécifier une référence de pièce pour ces appareils.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="partRefDialog" className="col-span-4">
                Référence de la pièce
              </Label>
              <Input 
                id="partRefDialog" 
                value={partReference} 
                onChange={e => setPartReference(e.target.value)} 
                placeholder="Ex: XYZ123" 
                className="col-span-4" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReferenceDialog(false)}>Annuler</Button>
            <Button onClick={confirmPartReference}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportation disponible</DialogTitle>
            <DialogDescription>
              Les appareils ont été importés et associés à la référence de pièce <strong>{partReference}</strong>.
              Voulez-vous exporter la liste de compatibilité maintenant?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {importedAppliances?.length || 0} appareils sont prêts à être exportés.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>Plus tard</Button>
            <Button onClick={handleExportImported}>
              Exporter ({importedAppliances?.length || 0} appareils)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSaveSessionDialog} onOpenChange={setShowSaveSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder la session</DialogTitle>
            <DialogDescription>
              Donnez un nom à cette session pour pouvoir la retrouver plus tard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sessionName" className="col-span-4">
                Nom de la session
              </Label>
              <Input 
                id="sessionName" 
                value={sessionName} 
                onChange={e => setSessionName(e.target.value)} 
                placeholder="Ex: Import Mai 2025" 
                className="col-span-4" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveSessionDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveSession}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Sessions sauvegardées</DialogTitle>
            <DialogDescription>
              Reprenez une session d'importation précédente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {savedSessions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Appareils</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedSessions.map(session => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.name || "Sans nom"}
                        </TableCell>
                        <TableCell>
                          {new Date(session.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {session.partReference || "—"}
                        </TableCell>
                        <TableCell>
                          {session.appliances?.length || 0} importés, {session.incompleteAppliances?.length || 0} incomplets
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleLoadSession(session)}
                            >
                              Charger
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteSession(session.id, session.name)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune session sauvegardée</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionsDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Import;
