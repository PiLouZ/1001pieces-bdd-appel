
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

interface MissingInfoFormProps {
  appliances: Appliance[];
  knownBrands: string[];
  knownTypes: string[];
  onComplete: (completedAppliances: Appliance[]) => void;
  onCancel: () => void;
}

const MissingInfoForm: React.FC<MissingInfoFormProps> = ({
  appliances,
  knownBrands,
  knownTypes,
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
                {knownBrands.map((brand) => (
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
                {knownTypes.map((type) => (
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
                      {knownBrands.map((brand) => (
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
                      {knownTypes.map((type) => (
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

export default MissingInfoForm;
