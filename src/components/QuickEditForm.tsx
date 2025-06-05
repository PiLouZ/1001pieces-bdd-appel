import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Appliance } from "@/types/appliance";
import { toast } from "sonner";
import SearchableSelect from "./SearchableSelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useExcelFill } from "@/hooks/useExcelFill";
import VirtualizedTable from "./VirtualizedTable";

interface QuickEditFormProps {
  appliances: Appliance[];
  onUpdateAppliances: (updatedAppliances: Appliance[]) => void;
  knownBrands: string[];
  knownTypes: string[];
}

type SortField = 'reference' | 'commercialRef';
type SortDirection = 'asc' | 'desc' | null;

const QuickEditForm: React.FC<QuickEditFormProps> = ({
  appliances,
  onUpdateAppliances,
  knownBrands,
  knownTypes,
}) => {
  const [editedAppliances, setEditedAppliances] = useState<Appliance[]>(appliances);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [availableBrands, setAvailableBrands] = useState<string[]>(knownBrands);
  const [availableTypes, setAvailableTypes] = useState<string[]>(knownTypes);
  
  // Utiliser la table virtualisée pour les gros volumes (> 1000 items)
  const useVirtualized = editedAppliances.length > 1000;

  const { fillDown, autoFill, dragFill } = useExcelFill({
    appliances: editedAppliances,
    onUpdateAppliances: setEditedAppliances
  });

  const handleApplianceChange = (index: number, field: keyof Appliance, value: string) => {
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

  const handleSort = (field: SortField) => {
    let newDirection: SortDirection;
    
    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      } else {
        newDirection = 'asc';
      }
    } else {
      newDirection = 'asc';
    }

    setSortField(newDirection ? field : null);
    setSortDirection(newDirection);

    if (newDirection) {
      const sorted = [...editedAppliances].sort((a, b) => {
        const aValue = a[field] || '';
        const bValue = b[field] || '';
        
        if (newDirection === 'asc') {
          return aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' });
        } else {
          return bValue.localeCompare(aValue, 'fr', { sensitivity: 'base' });
        }
      });
      setEditedAppliances(sorted);
    } else {
      // Reset to original order
      setEditedAppliances([...appliances]);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />;
    } else if (sortDirection === 'desc') {
      return <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />;
    } else {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
  };

  const handleBrandChange = (index: number, value: string) => {
    // Si la valeur n'existe pas dans les marques connues, l'ajouter
    if (value && !availableBrands.includes(value)) {
      setAvailableBrands(prev => [...prev, value].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
    }
    handleApplianceChange(index, 'brand', value);
  };

  const handleTypeChange = (index: number, value: string) => {
    // Si la valeur n'existe pas dans les types connus, l'ajouter
    if (value && !availableTypes.includes(value)) {
      setAvailableTypes(prev => [...prev, value].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
    }
    handleApplianceChange(index, 'type', value);
  };

  const handleFillDown = (index: number, field: 'brand' | 'type') => {
    fillDown(index, field);
    toast.success(`Valeur copiée vers les cellules suivantes`);
  };

  const handleAutoFill = (index: number, field: 'brand' | 'type') => {
    autoFill(index, field);
    toast.success(`Valeur copiée automatiquement vers toutes les cellules vides`);
  };

  const handleDragFill = (fromIndex: number, toIndex: number, field: 'brand' | 'type') => {
    dragFill(fromIndex, toIndex, field);
    const count = toIndex - fromIndex;
    toast.success(`Valeur copiée sur ${count} cellules`);
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
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none min-w-[200px]"
                  onClick={() => handleSort('reference')}
                >
                  <div className="flex items-center">
                    Référence technique
                    {getSortIcon('reference')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none min-w-[200px]"
                  onClick={() => handleSort('commercialRef')}
                >
                  <div className="flex items-center">
                    Référence commerciale
                    {getSortIcon('commercialRef')}
                  </div>
                </TableHead>
                <TableHead className="min-w-[250px]">Marque *</TableHead>
                <TableHead className="min-w-[250px]">Type *</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedAppliances.map((appliance, index) => (
                <TableRow key={appliance.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Input 
                      value={appliance.reference} 
                      readOnly 
                      className="bg-gray-50 border-0 focus:ring-0 focus:border-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={appliance.commercialRef || ""} 
                      readOnly 
                      className="bg-gray-50 border-0 focus:ring-0 focus:border-0"
                    />
                  </TableCell>
                  <TableCell>
                    <SearchableSelect
                      value={appliance.brand || ""}
                      onValueChange={(value) => handleBrandChange(index, value)}
                      options={availableBrands}
                      placeholder="Sélectionner une marque"
                      searchPlaceholder="Rechercher ou saisir une marque..."
                      emptyMessage="Aucune marque trouvée"
                      className="w-full border-0 focus:ring-1 focus:ring-blue-500"
                      allowCustomValue={true}
                      showFillHandle={true}
                      onFillDown={() => handleFillDown(index, 'brand')}
                      onDoubleClickFill={() => handleAutoFill(index, 'brand')}
                    />
                  </TableCell>
                  <TableCell>
                    <SearchableSelect
                      value={appliance.type || ""}
                      onValueChange={(value) => handleTypeChange(index, value)}
                      options={availableTypes}
                      placeholder="Sélectionner un type"
                      searchPlaceholder="Rechercher ou saisir un type..."
                      emptyMessage="Aucun type trouvé"
                      className="w-full border-0 focus:ring-1 focus:ring-blue-500"
                      allowCustomValue={true}
                      showFillHandle={true}
                      onFillDown={() => handleFillDown(index, 'type')}
                      onDoubleClickFill={() => handleAutoFill(index, 'type')}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
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
