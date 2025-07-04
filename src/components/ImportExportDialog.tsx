import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Copy } from "lucide-react";
import { Appliance } from "@/types/appliance";
import HtmlExportZones from "./HtmlExportZones";
import { exportAppliances, generateCSVFile } from "@/utils/exportUtils";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliances: Appliance[];
  partReference?: string;
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  open,
  onOpenChange,
  appliances,
  partReference
}) => {
  const handleDownloadCsv = () => {
    const csvContent = exportAppliances(appliances, {
      format: "csv",
      includeHeader: true,
      partReference: partReference
    });
    
    const fileName = `export-appareils-compatibles-${partReference || 'import'}-${new Date().toISOString().split('T')[0]}`;
    const csvData = generateCSVFile(csvContent, fileName);
    
    const link = document.createElement("a");
    link.setAttribute("href", csvData.url);
    link.setAttribute("download", csvData.fileName);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(csvData.url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export et zones HTML</DialogTitle>
          <DialogDescription>
            Téléchargez le fichier CSV et copiez les zones HTML pour votre site web.
            {partReference && ` Référence de pièce: ${partReference}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section CSV */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Fichier CSV
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Téléchargez les données d'import au format CSV pour archivage ou traitement.
            </p>
            <Button onClick={handleDownloadCsv} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Télécharger le CSV
            </Button>
          </div>

          {/* Section Zones HTML */}
          <div>
            <h3 className="font-medium mb-3 flex items-center">
              <Copy className="h-4 w-4 mr-2" />
              Zones HTML
            </h3>
            <HtmlExportZones 
              appliances={appliances} 
              partReference={partReference} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExportDialog;