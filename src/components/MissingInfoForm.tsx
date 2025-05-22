
import React, { useState } from "react";
import { Appliance } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ProcessedRow } from "@/utils/importUtils";

interface MissingInfoFormProps {
  appliances: Appliance[];
  knownBrands: string[];
  knownTypes: string[];
  onComplete: (completedAppliances: Appliance[]) => void;
  onCancel: () => void;
}

interface MissingInfoRowProps {
  row: ProcessedRow;
  knownBrands: string[];
  knownTypes: string[];
  onSave: (updatedData: ProcessedRow) => void;
}

const MissingInfoForm: React.FC<MissingInfoFormProps> = ({
  appliances,
  knownBrands = [],
  knownTypes = [],
  onComplete,
  onCancel
}) => {
  const [editedAppliances, setEditedAppliances] = useState<Appliance[]>(appliances);

  const handleChange = (index: number, field: keyof Appliance, value: string) => {
    const updatedAppliances = [...editedAppliances];
    updatedAppliances[index] = { ...updatedAppliances[index], [field]: value };
    setEditedAppliances(updatedAppliances);
  };

  const handleComplete = () => {
    onComplete(editedAppliances);
  };

  const applyToAll = (field: keyof Appliance, value: string) => {
    const updatedAppliances = editedAppliances.map(appliance => ({
      ...appliance,
      [field]: value
    }));
    setEditedAppliances(updatedAppliances);
  };

  const handleApplyBrand = (value: string) => applyToAll('brand', value);
  const handleApplyType = (value: string) => applyToAll('type', value);

  const isMissingInfo = editedAppliances.some(app => !app.brand || !app.type);

  // Protection contre les tableaux null ou undefined
  const safeKnownBrands = knownBrands || [];
  const safeKnownTypes = knownTypes || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compléter les informations manquantes ({editedAppliances.length} appareils)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Appliquer une marque à tous</label>
            <div className="flex space-x-2">
              <Input
                list="knownBrandsList"
                placeholder="Sélectionner une marque"
                className="flex-1"
                onChange={(e) => handleApplyBrand(e.target.value)}
              />
              <datalist id="knownBrandsList">
                {safeKnownBrands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Appliquer un type à tous</label>
            <div className="flex space-x-2">
              <Input
                list="knownTypesList"
                placeholder="Sélectionner un type"
                className="flex-1"
                onChange={(e) => handleApplyType(e.target.value)}
              />
              <datalist id="knownTypesList">
                {safeKnownTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf. technique</TableHead>
                <TableHead>Réf. commerciale</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedAppliances.map((appliance, index) => (
                <TableRow key={index} className={(!appliance.brand || !appliance.type) ? "bg-amber-50" : ""}>
                  <TableCell>{appliance.reference}</TableCell>
                  <TableCell>{appliance.commercialRef || "-"}</TableCell>
                  <TableCell>
                    <Input
                      value={appliance.brand || ""}
                      onChange={(e) => handleChange(index, "brand", e.target.value)}
                      list={`brands-${index}`}
                      className={!appliance.brand ? "border-amber-500" : ""}
                    />
                    <datalist id={`brands-${index}`}>
                      {safeKnownBrands.map((brand) => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={appliance.type || ""}
                      onChange={(e) => handleChange(index, "type", e.target.value)}
                      list={`types-${index}`}
                      className={!appliance.type ? "border-amber-500" : ""}
                    />
                    <datalist id={`types-${index}`}>
                      {safeKnownTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button 
          onClick={handleComplete} 
          disabled={isMissingInfo}
        >
          Compléter et importer
        </Button>
      </CardFooter>
    </Card>
  );
};

// Add the single row version for processing in Import.tsx
export const MissingInfoRowForm: React.FC<MissingInfoRowProps> = ({
  row,
  knownBrands = [],
  knownTypes = [],
  onSave
}) => {
  const [editedData, setEditedData] = useState<ProcessedRow>(row);

  const handleChange = (field: keyof ProcessedRow, value: string) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleSave = () => {
    onSave(editedData);
  };

  const isMissingInfo = !editedData.brand || !editedData.type;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compléter les informations pour: {editedData.reference}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Référence technique</label>
              <Input value={editedData.reference} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Référence commerciale</label>
              <Input 
                value={editedData.commercialRef || ""} 
                onChange={(e) => handleChange("commercialRef", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Marque</label>
              <Input
                list="knownBrandsList"
                value={editedData.brand || ""}
                onChange={(e) => handleChange("brand", e.target.value)}
                className={!editedData.brand ? "border-amber-500" : ""}
              />
              <datalist id="knownBrandsList">
                {knownBrands.map((brand, i) => (
                  <option key={i} value={brand} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input
                list="knownTypesList"
                value={editedData.type || ""}
                onChange={(e) => handleChange("type", e.target.value)}
                className={!editedData.type ? "border-amber-500" : ""}
              />
              <datalist id="knownTypesList">
                {knownTypes.map((type, i) => (
                  <option key={i} value={type} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isMissingInfo}>
          Enregistrer
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MissingInfoForm;
