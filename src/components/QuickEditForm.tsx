
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Appliance } from "@/types/appliance";
import { toast } from "sonner";
import SearchableSelect from "./SearchableSelect";

interface QuickEditFormProps {
  appliances: Appliance[];
  onUpdateAppliances: (updatedAppliances: Appliance[]) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const QuickEditForm: React.FC<QuickEditFormProps> = ({
  appliances,
  onUpdateAppliances,
  knownBrands,
  knownTypes,
}) => {
  const [editedAppliances, setEditedAppliances] = useState<Appliance[]>(appliances);

  const handleApplianceChange = (index: number, field: keyof Appliance, value: string) => {
    const updated = [...editedAppliances];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAppliances(updated);
  };

  const handleSubmit = () => {
    // Vérifier que tous les champs obligatoires sont remplis
    const incomplete = editedAppliances.filter(app => !app.brand || !app.type);
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} appareils ont encore des informations manquantes`);
      return;
    }

    onUpdateAppliances(editedAppliances);
    toast.success(`${editedAppliances.length} appareils complétés avec succès`);
  };

  const handleCancel = () => {
    // Revenir à la liste d'import ou fermer le formulaire
    window.history.back();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compléter les informations manquantes</CardTitle>
        <p className="text-sm text-gray-600">
          {editedAppliances.length} appareils nécessitent des informations supplémentaires
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {editedAppliances.map((appliance, index) => (
          <div key={appliance.id} className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Référence technique</Label>
                <Input 
                  value={appliance.reference} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Référence commerciale</Label>
                <Input 
                  value={appliance.commercialRef || ""} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`brand-${index}`}>Marque *</Label>
                <SearchableSelect
                  value={appliance.brand || ""}
                  onValueChange={(value) => handleApplianceChange(index, 'brand', value)}
                  options={knownBrands}
                  placeholder="Sélectionner une marque"
                  searchPlaceholder="Rechercher une marque..."
                  emptyMessage="Aucune marque trouvée"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor={`type-${index}`}>Type *</Label>
                <SearchableSelect
                  value={appliance.type || ""}
                  onValueChange={(value) => handleApplianceChange(index, 'type', value)}
                  options={knownTypes}
                  placeholder="Sélectionner un type"
                  searchPlaceholder="Rechercher un type..."
                  emptyMessage="Aucun type trouvé"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Valider l'importation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickEditForm;
