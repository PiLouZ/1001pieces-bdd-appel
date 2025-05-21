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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const Import: React.FC = () => {
  const {
    importAppliances,
    knownBrands,
    knownTypes,
    knownPartReferences,
    suggestBrand,
    suggestType,
    associateApplicancesToPartReference
  } = useAppliances();
  const {
    toast
  } = useToast();
  const [partReference, setPartReference] = useState("");
  const [importedAppliances, setImportedAppliances] = useState<Appliance[] | null>(null);
  const [showExportOption, setShowExportOption] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showReferenceDialog, setShowReferenceDialog] = useState(false);
  const [pendingAppliances, setPendingAppliances] = useState<Appliance[]>([]);
  const [isTwoColumnFormat, setIsTwoColumnFormat] = useState(false);
  const processImport = (appliances: Appliance[], isTwoColumns: boolean) => {
    // Pour le format à 2 colonnes, on demande la référence si nécessaire
    if (isTwoColumns) {
      if (!partReference.trim()) {
        setPendingAppliances(appliances);
        setIsTwoColumnFormat(true);
        setShowReferenceDialog(true);
        return;
      }
    }

    // Compléter automatiquement les marques et types si nécessaire
    const completedAppliances = appliances.map(appliance => {
      let updatedAppliance = {
        ...appliance
      };

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

    // Ajouter les appareils complétés à la base de données
    const importedCount = importAppliances(completedAppliances);

    // Si une référence de pièce est fournie, associer les appareils à cette référence
    if (partReference.trim()) {
      // Stocker la référence de la pièce dans une session temporaire
      const importSession: ImportSession = {
        partReference,
        appliances: completedAppliances,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("lastImportSession", JSON.stringify(importSession));

      // Associer tous les appareils importés à la référence de pièce
      const applianceIds = completedAppliances.map(app => app.id);
      associateApplicancesToPartReference(applianceIds, partReference);
      toast({
        title: "Importation réussie",
        description: `${importedCount} nouveaux appareils ajoutés et associés à la référence ${partReference}.`
      });

      // Proposer l'export via une boîte de dialogue
      setImportedAppliances(completedAppliances);
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
    if (importedCount < completedAppliances.length) {
      toast({
        title: "Information",
        description: `${completedAppliances.length - importedCount} appareils étaient déjà dans la base de données.`
      });
    }
  };
  const handleImport = (appliances: Appliance[]) => {
    // Vérifier s'il s'agit d'un format à 2 colonnes
    const is2ColFormat = appliances.every(app => app.reference && app.commercialRef !== undefined && (!app.brand || app.brand.trim() === "") && (!app.type || app.type.trim() === ""));
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
  return <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <ImportIcon className="mr-2 h-6 w-6" />
          Importer des appareils
        </h1>
        
        <div className="mb-6">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="partReference">Référence de la pièce (Optionnel pour format 4 colonnes, Obligatoire pour format 2 colonnes)</Label>
            {knownPartReferences.length > 0 ? <div className="flex gap-2">
                <Select value={partReference} onValueChange={handleSelectPartReference}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Sélectionner ou saisir une référence" />
                  </SelectTrigger>
                  <SelectContent>
                    {knownPartReferences.map(ref => <SelectItem key={ref} value={ref}>{ref}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Ou saisir une nouvelle référence" value={partReference} onChange={e => setPartReference(e.target.value)} className="w-full max-w-sm" />
              </div> : <Input id="partReference" type="text" value={partReference} onChange={e => setPartReference(e.target.value)} placeholder="Ex: XYZ123" className="w-full max-w-sm" />}
            <p className="text-sm text-gray-500">
              Cette référence sera associée aux appareils importés pour la génération de fichiers de compatibilité.
            </p>
          </div>
        </div>
        
        <ImportForm onImport={handleImport} knownBrands={knownBrands} knownTypes={knownTypes} />

        {showExportOption && importedAppliances && importedAppliances.length > 0 && <Card className="mt-6">
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
          </Card>}
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
              <Input id="partRefDialog" value={partReference} onChange={e => setPartReference(e.target.value)} placeholder="Ex: XYZ123" className="col-span-4" />
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
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>;
};
export default Import;