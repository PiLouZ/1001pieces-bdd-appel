
import React, { useState } from "react";
import { Appliance } from "@/types/appliance";
import QuickEditForm from "./QuickEditForm";
import ImportFormBase from "./ImportFormBase";
import { parseClipboardData } from "@/utils/importUtils";
import { exportAppliances, generateCSVFile } from "@/utils/exportUtils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";

interface ImportFormProps {
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

const ImportForm: React.FC<ImportFormProps> = (props) => {
  const [appliancesWithMissingInfo, setAppliancesWithMissingInfo] = useState<Appliance[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [csvExportData, setCsvExportData] = useState<{url: string, fileName: string} | null>(null);

  const handleImportWithValidation = (appliances: Appliance[], partReference?: string) => {
    // Vérifier si des informations sont manquantes
    const needsCompletion = appliances.some(app => 
      !app.brand || app.brand.trim() === "" || !app.type || app.type.trim() === "");
    
    if (needsCompletion) {
      setAppliancesWithMissingInfo(appliances);
      return [];
    } else {
      const imported = props.onImport(appliances, partReference);
      
      // Préparer l'export CSV si référence de pièce fournie
      if (partReference && imported.length > 0) {
        const csvContent = exportAppliances(imported, {
          format: "csv",
          includeHeader: true,
          partReference: partReference
        });
        
        const fileName = `export-appareils-compatibles-${partReference}-${new Date().toISOString().split('T')[0]}`;
        const csvData = generateCSVFile(csvContent, fileName);
        setCsvExportData(csvData);
        setShowExportDialog(true);
      }
      
      return imported;
    }
  };

  const handleCompleteMissingInfo = (completedAppliances: Appliance[]) => {
    const imported = props.onImport(completedAppliances);
    setAppliancesWithMissingInfo([]);
    return imported;
  };

  const handleCancelMissingInfo = () => {
    setAppliancesWithMissingInfo([]);
  };

  const handleDownloadCsv = () => {
    if (csvExportData) {
      const link = document.createElement("a");
      link.setAttribute("href", csvExportData.url);
      link.setAttribute("download", csvExportData.fileName);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(csvExportData.url);
      
      setShowExportDialog(false);
      setCsvExportData(null);
    }
  };

  const handleCloseExportDialog = () => {
    if (csvExportData && csvExportData.url) {
      URL.revokeObjectURL(csvExportData.url);
    }
    setShowExportDialog(false);
    setCsvExportData(null);
  };

  // Si on a des appareils avec des infos manquantes, afficher le formulaire de complétion
  if (appliancesWithMissingInfo.length > 0) {
    return (
      <QuickEditForm
        appliances={appliancesWithMissingInfo}
        onUpdateAppliances={handleCompleteMissingInfo}
        onCancel={handleCancelMissingInfo}
        knownBrands={props.knownBrands || []}
        knownTypes={props.knownTypes || []}
      />
    );
  }

  return (
    <>
      <ImportFormBase
        {...props}
        onImport={handleImportWithValidation}
      />
      
      {/* Dialog pour proposer l'export CSV */}
      <Dialog open={showExportDialog} onOpenChange={handleCloseExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Télécharger les résultats</DialogTitle>
            <DialogDescription>
              L'importation a été effectuée avec succès. Souhaitez-vous télécharger le fichier CSV de compatibilité?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center p-4">
            <FileDown className="h-16 w-16 text-blue-500" />
          </div>
          
          {csvExportData && (
            <p className="text-center text-sm text-gray-500">
              {csvExportData.fileName}
            </p>
          )}
          
          <DialogFooter className="sm:justify-center gap-2 mt-4">
            <Button variant="outline" onClick={handleCloseExportDialog}>
              Plus tard
            </Button>
            <Button onClick={handleDownloadCsv} disabled={!csvExportData}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportForm;
