
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Appliance } from "@/types/appliance";
import { toast } from "sonner";
import { useExcelFill } from "@/hooks/useExcelFill";
import { useTableSorting } from "@/hooks/useTableSorting";
import VirtualizedTable from "./VirtualizedTable";
import QuickEditTable from "./forms/QuickEditTable";

interface QuickEditFormProps {
  appliances: Appliance[];
  onUpdateAppliances: (updatedAppliances: Appliance[], partReference?: string) => void;
  knownBrands: string[];
  knownTypes: string[];
  partReference?: string;
}

const QuickEditForm: React.FC<QuickEditFormProps> = ({
  appliances,
  onUpdateAppliances,
  knownBrands,
  knownTypes,
  partReference,
}) => {
  const [editedAppliances, setEditedAppliances] = useState<Appliance[]>(appliances);
  const [availableBrands, setAvailableBrands] = useState<string[]>(knownBrands);
  const [availableTypes, setAvailableTypes] = useState<string[]>(knownTypes);
  
  const useVirtualized = editedAppliances.length > 1000;

  const { fillDown, autoFill, dragFill } = useExcelFill({
    appliances: editedAppliances,
    onUpdateAppliances: setEditedAppliances
  });

  const { sortField, sortDirection, handleSort } = useTableSorting({
    data: editedAppliances,
    initialData: appliances
  });

  const handleApplianceChange = (index: number, field: keyof Appliance, value: string) => {
    if (index < 0 || index >= editedAppliances.length) {
      console.warn(`Index invalide: ${index}, longueur du tableau: ${editedAppliances.length}`);
      return;
    }
    
    const updated = [...editedAppliances];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAppliances(updated);
  };

  const handleFieldChange = (id: string, field: 'brand' | 'type', value: string) => {
    const index = editedAppliances.findIndex(app => app.id === id);
    if (index !== -1) {
      handleApplianceChange(index, field, value);
    }
  };

  const handleBrandChange = (index: number, value: string) => {
    handleApplianceChange(index, 'brand', value);
  };

  const handleTypeChange = (index: number, value: string) => {
    handleApplianceChange(index, 'type', value);
  };

  const handleNewBrand = (brand: string) => {
    if (brand && !availableBrands.includes(brand)) {
      setAvailableBrands(prev => [...prev, brand].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
    }
  };

  const handleNewType = (type: string) => {
    if (type && !availableTypes.includes(type)) {
      setAvailableTypes(prev => [...prev, type].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
    }
  };

  const handleFillDown = (index: number, field: 'brand' | 'type') => {
    fillDown(index, field);
    toast.success(`Valeur copiée vers les cellules suivantes`);
  };

  const handleAutoFill = (index: number, field: 'brand' | 'type') => {
    autoFill(index, field);
    toast.success(`Valeur copiée automatiquement vers toutes les cellules restantes`);
  };

  const handleDragFill = (fromIndex: number, toIndex: number, field: 'brand' | 'type') => {
    dragFill(fromIndex, toIndex, field);
    const count = toIndex - fromIndex;
    toast.success(`Valeur copiée sur ${count} cellules`);
  };

  const handleSubmit = () => {
    const incomplete = editedAppliances.filter(app => !app.brand || !app.type);
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} appareils ont encore des informations manquantes`);
      return;
    }

    onUpdateAppliances(editedAppliances, partReference);
    toast.success(`${editedAppliances.length} appareils complétés avec succès`);
  };

  const handleCancel = () => {
    window.history.back();
  };

  const handleSortField = (field: 'reference' | 'commercialRef') => {
    handleSort(field, setEditedAppliances);
  };

  if (useVirtualized) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Compléter les informations manquantes</CardTitle>
          <p className="text-sm text-gray-600">
            {editedAppliances.length} appareils nécessitent des informations supplémentaires (Mode virtualisé pour les performances)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <VirtualizedTable
            appliances={editedAppliances}
            onFieldChange={handleFieldChange}
            knownBrands={availableBrands}
            knownTypes={availableTypes}
            onFillDown={handleFillDown}
            onCopyToAll={handleAutoFill}
            onDragFill={handleDragFill}
            height={600}
          />
          
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
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compléter les informations manquantes</CardTitle>
        <p className="text-sm text-gray-600">
          {editedAppliances.length} appareils nécessitent des informations supplémentaires
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <QuickEditTable
          appliances={editedAppliances}
          onApplianceChange={handleApplianceChange}
          availableBrands={availableBrands}
          availableTypes={availableTypes}
          onBrandChange={handleBrandChange}
          onTypeChange={handleTypeChange}
          onFillDown={handleFillDown}
          onAutoFill={handleAutoFill}
          onDragFill={handleDragFill}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSortField}
          onNewBrand={handleNewBrand}
          onNewType={handleNewType}
        />
        
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
