
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
import ImportExportDialog from "./ImportExportDialog";

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
  const [showImportExportDialog, setShowImportExportDialog] = useState(false);
  const [lastImportData, setLastImportData] = useState<{appliances: Appliance[], partReference?: string} | null>(null);

  const handleImportWithValidation = (appliances: Appliance[], partReference?: string) => {
    // Vérifier si des informations sont manquantes
    const needsCompletion = appliances.some(app => 
      !app.brand || app.brand.trim() === "" || !app.type || app.type.trim() === "");
    
    if (needsCompletion) {
      setAppliancesWithMissingInfo(appliances);
      return [];
    } else {
      const imported = props.onImport(appliances, partReference);
      
      // Afficher le dialog d'export si on a des appareils importés
      if (imported.length > 0) {
        setLastImportData({ appliances: imported, partReference });
        setShowImportExportDialog(true);
      }
      
      return imported;
    }
  };

  const handleCompleteMissingInfo = (completedAppliances: Appliance[], partReference?: string) => {
    const imported = props.onImport(completedAppliances, partReference);
    setAppliancesWithMissingInfo([]);
    
    // Afficher le dialog d'export après complétion
    if (imported.length > 0) {
      setLastImportData({ appliances: imported, partReference });
      setShowImportExportDialog(true);
    }
    
    return imported;
  };

  const handleCancelMissingInfo = () => {
    setAppliancesWithMissingInfo([]);
  };


  // Si on a des appareils avec des infos manquantes, afficher le formulaire de complétion
  if (appliancesWithMissingInfo.length > 0) {
    return (
      <QuickEditForm
        appliances={appliancesWithMissingInfo}
        onUpdateAppliances={handleCompleteMissingInfo}
        knownBrands={props.knownBrands || []}
        knownTypes={props.knownTypes || []}
        partReference={lastImportData?.partReference}
      />
    );
  }

  return (
    <>
      <ImportFormBase
        {...props}
        onImport={handleImportWithValidation}
      />
      
      {/* Dialog d'import/export */}
      {lastImportData && (
        <ImportExportDialog
          open={showImportExportDialog}
          onOpenChange={setShowImportExportDialog}
          appliances={lastImportData.appliances}
          partReference={lastImportData.partReference}
        />
      )}
    </>
  );
};

export default ImportForm;
