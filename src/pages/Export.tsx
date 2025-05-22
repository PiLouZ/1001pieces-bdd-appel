import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppliances } from "@/hooks/useAppliances";
import { generateCSV, generateHTML, downloadFile } from "@/utils/exportUtils";
import { FileText } from "lucide-react";

const ExportPage: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<"csv" | "html">("csv");
  const [selectedPartReference, setSelectedPartReference] = useState<string>("");
  const { toast } = useToast();
  const { knownPartReferences, getAppliancesByPartReference } = useAppliances();

  const handleExportAll = () => {
    // TODO: Implement export all functionality
    toast({
      title: "Not implemented",
      description: "This feature is not implemented yet.",
    });
  };

  const handleExportByPart = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPartReference) {
      toast({
        title: "Error",
        description: "Please select a part reference.",
        variant: "destructive",
      });
      return;
    }

    const appliances = getAppliancesByPartReference(selectedPartReference);
    if (appliances.length === 0) {
      toast({
        title: "No appliances found",
        description: "No appliances found for this part reference.",
        variant: "destructive",
      });
      return;
    }

    let content: string;
    let fileName: string;
    let contentType: string;

    if (exportFormat === "csv") {
      content = generateCSV(appliances, { 
        partReference: selectedPartReference, 
        format: exportFormat, 
        includeHeader: true 
      });
      fileName = `appliances_for_${selectedPartReference}.csv`;
      contentType = "text/csv";
    } else {
      content = generateHTML(appliances, { 
        partReference: selectedPartReference, 
        format: exportFormat 
      });
      fileName = `appliances_for_${selectedPartReference}.html`;
      contentType = "text/html";
    }

    downloadFile(content, fileName, contentType);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Exportation des données</h1>
      <p className="text-gray-500 mb-6">
        Générer des fichiers CSV ou HTML à partir de votre base de données d'appareils
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exporter par référence de pièce</CardTitle>
            <CardDescription>
              Générer un fichier contenant tous les appareils compatibles avec une référence de pièce spécifique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleExportByPart}>
              <div className="space-y-2">
                <Label htmlFor="partReference">Référence de la pièce</Label>
                <div className="flex gap-2">
                  <Select onValueChange={setSelectedPartReference} value={selectedPartReference}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner une référence" />
                    </SelectTrigger>
                    <SelectContent>
                      {knownPartReferences.map(ref => (
                        <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={exportFormat === "csv" ? "default" : "outline"}
                    onClick={() => setExportFormat("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant={exportFormat === "html" ? "default" : "outline"}
                    onClick={() => setExportFormat("html")}
                  >
                    HTML
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={!selectedPartReference}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exporter toute la base de données</CardTitle>
            <CardDescription>
              Générer un fichier contenant tous les appareils enregistrés dans la base de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleExportAll}>
              <div className="space-y-2">
                <Label>Format</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={exportFormat === "csv" ? "default" : "outline"}
                    onClick={() => setExportFormat("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant={exportFormat === "html" ? "default" : "outline"}
                    onClick={() => setExportFormat("html")}
                  >
                    HTML
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportPage;
