
import React, { useState, useEffect, useRef } from "react";
import { Appliance } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Users, Check, X } from "lucide-react";
import { toast } from "sonner";

interface MassEditFormProps {
  appliances: Appliance[];
  onUpdateAppliances: (updates: { ids: string[]; brand?: string; type?: string }) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const MassEditForm: React.FC<MassEditFormProps> = ({
  appliances,
  onUpdateAppliances,
  knownBrands,
  knownTypes
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState<'brand' | 'type' | null>(null);
  const [editValue, setEditValue] = useState("");
  const [allowNewValue, setAllowNewValue] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  const allSelected = selectedIds.size === appliances.length && appliances.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < appliances.length;

  // Update the indeterminate state when someSelected changes
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const checkboxElement = selectAllCheckboxRef.current.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkboxElement) {
        checkboxElement.indeterminate = someSelected;
      }
    }
  }, [someSelected]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(appliances.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectAppliance = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const startEdit = (field: 'brand' | 'type') => {
    if (selectedIds.size === 0) {
      toast("Veuillez sélectionner au moins un appareil");
      return;
    }
    setEditMode(field);
    setEditValue("");
    setAllowNewValue(false);
  };

  const applyEdit = () => {
    if (!editMode || !editValue.trim() || selectedIds.size === 0) return;

    const updates = {
      ids: Array.from(selectedIds),
      [editMode]: editValue.trim()
    };

    onUpdateAppliances(updates);
    
    // Réinitialiser l'état
    setEditMode(null);
    setEditValue("");
    setSelectedIds(new Set());
    
    toast(`${selectedIds.size} appareils mis à jour`);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditValue("");
    setAllowNewValue(false);
  };

  const getAvailableOptions = () => {
    if (editMode === 'brand') return knownBrands;
    if (editMode === 'type') return knownTypes;
    return [];
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <span>Édition de masse</span>
            {selectedIds.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit('brand')}
              disabled={selectedIds.size === 0}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Marque
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit('type')}
              disabled={selectedIds.size === 0}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Type
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* En-tête de sélection */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allSelected}
              ref={selectAllCheckboxRef}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-sm font-medium">
              Sélectionner tout ({appliances.length} appareils)
            </Label>
          </div>
          
          {selectedIds.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedIds.size} / {appliances.length} sélectionnés
            </div>
          )}
        </div>

        {/* Zone d'édition active */}
        {editMode && (
          <div className="mb-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">
                Modifier {editMode === 'brand' ? 'la marque' : 'le type'} pour {selectedIds.size} appareils
              </h4>
              <div className="flex gap-2">
                <Button size="sm" onClick={applyEdit} disabled={!editValue.trim()}>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Appliquer
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Annuler
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allow-new-value"
                  checked={allowNewValue}
                  onCheckedChange={(checked) => setAllowNewValue(checked === true)}
                />
                <Label htmlFor="allow-new-value" className="text-sm">
                  Créer une nouvelle valeur
                </Label>
              </div>

              {allowNewValue ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={`Nouvelle ${editMode === 'brand' ? 'marque' : 'type'}`}
                  className="max-w-md"
                />
              ) : (
                <Select value={editValue} onValueChange={setEditValue}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder={`Sélectionner ${editMode === 'brand' ? 'une marque' : 'un type'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableOptions().map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {/* Liste des appareils avec cases à cocher */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {appliances.map((appliance) => (
            <div 
              key={appliance.id} 
              className={`flex items-center space-x-3 p-3 rounded border hover:bg-gray-50 ${
                selectedIds.has(appliance.id) ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <Checkbox
                checked={selectedIds.has(appliance.id)}
                onCheckedChange={(checked) => handleSelectAppliance(appliance.id, checked === true)}
              />
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                <div className="font-medium">{appliance.reference}</div>
                <div className="text-gray-600">{appliance.commercialRef || "—"}</div>
                <div className={!appliance.brand ? "text-red-500 italic" : ""}>
                  {appliance.brand || "Non spécifié"}
                </div>
                <div className={!appliance.type ? "text-red-500 italic" : ""}>
                  {appliance.type || "Non spécifié"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {appliances.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun appareil à éditer
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MassEditForm;
