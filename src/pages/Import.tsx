import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { Check, File, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppliances } from "@/hooks/useAppliances";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastWithProgress } from "@/components/ui/sonner";
import { useNavigate } from 'react-router-dom';

interface ProcessedRow {
  reference: string;
  brand: string;
  type: string;
  commercialRef: string;
  needsCompletion: boolean;
  isExisting: boolean;
}

const ImportPage: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<{
    complete: ProcessedRow[];
    incomplete: ProcessedRow[];
  }>({ complete: [], incomplete: [] });
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionData, setCompletionData] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [partReference, setPartReference] = useState<string>("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const { addAppliance, importAppliances, suggestBrand, suggestType, associateApplicancesToPartReference, saveImportSession } = useAppliances();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const csvText = reader.result as string;
      const parsedData = parseCSV(csvText);
      setCsvData(parsedData.data);
      setHeaders(parsedData.headers);
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const parseCSV = (csvText: string) => {
    const lines = csvText.split("\n");
    const headers = lines[0]?.split(",").map((header) => header.trim()) || [];
    const data: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]?.split(",").map((cell) => cell.trim()) || [];
      if (row.length > 0 && row.some(cell => cell !== "")) {
        data.push(row);
      }
    }

    return { headers, data };
  };

  const handleCsvData = async (csvData: string[][], headers: string[], partRef?: string) => {
    // Identify columns
    const referenceIndex = headers.findIndex(h => 
      h.toLowerCase().includes('reference') || 
      h.toLowerCase().includes('ref') ||
      h.toLowerCase().includes('modele')
    );
    
    const brandIndex = headers.findIndex(h => 
      h.toLowerCase().includes('marque') || 
      h.toLowerCase().includes('brand')
    );
    
    const typeIndex = headers.findIndex(h => 
      h.toLowerCase().includes('type') || 
      h.toLowerCase().includes('categorie') ||
      h.toLowerCase().includes('appareil')
    );
    
    const commercialRefIndex = headers.findIndex(h => 
      h.toLowerCase().includes('commerciale') || 
      h.toLowerCase().includes('commercial')
    );
    
    // Check if part reference was passed or found in headers
    let partReferenceValue = partRef || "";
    
    if (!partReferenceValue) {
      const partRefIndex = headers.findIndex(h => 
        h.toLowerCase().includes('piece') || 
        h.toLowerCase().includes('part')
      );
      if (partRefIndex !== -1 && csvData[0] && csvData[0][partRefIndex]) {
        partReferenceValue = csvData[0][partRefIndex];
      }
    }
    
    setPartReference(partReferenceValue);
    
    // Process rows and check for existing matches in the database
    const { allAppliances } = useAppliances();
    const existingRefMap = new Map(allAppliances.map(app => [app.reference.toLowerCase(), app]));
    
    const processedRows = csvData.map(row => {
      if (referenceIndex === -1 || !row[referenceIndex]) return null;
      
      const reference = row[referenceIndex].trim();
      const lowerRef = reference.toLowerCase();
      
      // Check if this reference already exists in the database
      if (existingRefMap.has(lowerRef)) {
        const existingAppliance = existingRefMap.get(lowerRef);
        // Return the existing appliance data to avoid asking for completion
        return {
          reference,
          brand: existingAppliance.brand,
          type: existingAppliance.type,
          commercialRef: commercialRefIndex !== -1 ? row[commercialRefIndex]?.trim() : existingAppliance.commercialRef || "",
          needsCompletion: false,
          isExisting: true
        };
      }
      
      // For new appliances, collect all available data
      let brand = brandIndex !== -1 ? row[brandIndex]?.trim() : "";
      let type = typeIndex !== -1 ? row[typeIndex]?.trim() : "";
      const commercialRef = commercialRefIndex !== -1 ? row[commercialRefIndex]?.trim() : "";
      
      // Check if brand is missing or empty
      const needsBrand = !brand || brand.length === 0;
      
      // Check if type is missing or empty
      const needsType = !type || type.length === 0;
      
      // If brand is missing, try to suggest one based on the reference
      if (needsBrand) {
        const { suggestBrand } = useAppliances();
        const suggestedBrand = suggestBrand(reference);
        if (suggestedBrand) {
          brand = suggestedBrand;
        }
      }
      
      // If type is missing and we have a brand, try to suggest one
      if (needsType && brand) {
        const { suggestType } = useAppliances();
        const suggestedType = suggestType(reference, brand);
        if (suggestedType) {
          type = suggestedType;
        }
      }
      
      return {
        reference,
        brand,
        type,
        commercialRef,
        needsCompletion: needsBrand || needsType,
        isExisting: false
      };
    }).filter(Boolean) as ProcessedRow[];
    
    // Save the processed data and set the relevant states
    const incompleteRows = processedRows.filter(row => row.needsCompletion);
    const completeRows = processedRows.filter(row => !row.needsCompletion);
    
    setProcessedData({
      complete: completeRows,
      incomplete: incompleteRows
    });
    
    // If there are incomplete rows, show the completion dialog
    if (incompleteRows.length > 0) {
      setShowCompletionDialog(true);
    } else {
      // If all rows are complete, proceed directly to finalizing the import
      handleFinalizeImport([...completeRows]);
    }
    
    // Create an import session for later resumption
    if (processedRows.length > 0) {
      const sessionId = `import-${Date.now()}`;
      const session = {
        id: sessionId,
        date: new Date().toISOString(),
        totalRows: processedRows.length,
        incompleteRows: incompleteRows.length,
        partReference: partReferenceValue,
        data: processedRows
      };
      
      saveImportSession(sessionId, session);
      setCurrentSessionId(sessionId);
      
      toastWithProgress({
        title: "Session d'importation créée",
        description: `La session ${sessionId} a été sauvegardée et peut être reprise ultérieurement.`,
      });
    }
  };

  const handleHeaderSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleCsvData(csvData, headers, partReference);
  };

  const handleCompletionChange = (
    reference: string,
    field: string,
    value: string
  ) => {
    setCompletionData((prev) => ({
      ...prev,
      [reference + "-" + field]: value,
    }));
  };

  const handleFinalizeImport = (rows: ProcessedRow[]) => {
    setIsImporting(true);
    
    // Préparer les données à importer
    const appliancesToImport = rows.map(row => ({
      reference: row.reference,
      brand: row.brand,
      type: row.type,
      commercialRef: row.commercialRef
    }));
    
    // Importer les appareils
    const importedCount = importAppliances(appliancesToImport);
    
    // Associer les appareils à la référence de pièce
    if (partReference) {
      const importedApplianceRefs = appliancesToImport.map(app => app.reference);
      
      // Récupérer les appareils importés pour obtenir leurs IDs
      const { allAppliances } = useAppliances();
      const importedAppliances = allAppliances.filter(app => importedApplianceRefs.includes(app.reference));
      const importedApplianceIds = importedAppliances.map(app => app.id);
      
      // Associer les appareils à la référence de pièce
      associateApplicancesToPartReference(importedApplianceIds, partReference);
    }

    setIsImporting(false);
    setShowCompletionDialog(false);
    
    toastWithProgress({
      title: "Importation terminée",
      description: `${importedCount} appareils importés avec succès.`,
    });
    
    // Rediriger vers la page des appareils
    navigate('/appliances');
  };

  const applyCompletionData = () => {
    const completedRows = processedData.incomplete.map((row) => {
      const brand =
        completionData[row.reference + "-brand"] || row.brand || "";
      const type = completionData[row.reference + "-type"] || row.type || "";
      return {
        ...row,
        brand: brand,
        type: type,
        needsCompletion: false,
      };
    });

    handleFinalizeImport(completedRows);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Importation des données</h1>
      <p className="text-gray-500 mb-6">
        Importer des appareils à partir d'un fichier CSV
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Importer un fichier CSV</CardTitle>
          <CardDescription>
            Importer les données d'un fichier CSV pour ajouter de nouveaux
            appareils à la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-md p-4 cursor-pointer"
          >
            <input {...getInputProps()} />
            {csvFile ? (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <p className="text-sm">{csvFile.name}</p>
                <Badge variant="secondary">{csvFile.type}</Badge>
              </div>
            ) : isDragActive ? (
              <p className="text-center text-gray-500">
                Déposer le fichier ici...
              </p>
            ) : (
              <p className="text-center text-gray-500">
                Glisser-déposer un fichier CSV ici, ou cliquer pour sélectionner
                un fichier
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {csvData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configuration de l'importation</CardTitle>
            <CardDescription>
              Veuillez vérifier les en-têtes de colonnes et spécifier la
              référence de la pièce si nécessaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleHeaderSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partReference">Référence de la pièce</Label>
                <Input
                  id="partReference"
                  placeholder="Entrez la référence de la pièce"
                  value={partReference}
                  onChange={(e) => setPartReference(e.target.value)}
                />
              </div>
              <div>
                <Table>
                  <TableCaption>En-têtes de colonnes détectés</TableCaption>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index}>
                          {header || (
                            <span className="italic text-gray-500">
                              Colonne {index + 1}
                            </span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableCell key={index}>
                          <Input
                            type="text"
                            value={header}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[index] = e.target.value;
                              setHeaders(newHeaders);
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <Button type="submit">
                <Check className="h-4 w-4 mr-2" />
                Valider les en-têtes
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Compléter les informations</DialogTitle>
            <DialogDescription>
              Certains appareils nécessitent des informations supplémentaires.
              Veuillez compléter les champs manquants.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Marque</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.incomplete.map((row) => (
                  <TableRow key={row.reference}>
                    <TableCell className="font-medium">
                      {row.reference}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Marque"
                        value={
                          completionData[row.reference + "-brand"] || row.brand
                        }
                        onChange={(e) =>
                          handleCompletionChange(
                            row.reference,
                            "brand",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Type"
                        value={
                          completionData[row.reference + "-type"] || row.type
                        }
                        onChange={(e) =>
                          handleCompletionChange(
                            row.reference,
                            "type",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={applyCompletionData} disabled={isImporting}>
              {isImporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Importation...
                </>
              ) : (
                "Finaliser l'importation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportPage;
