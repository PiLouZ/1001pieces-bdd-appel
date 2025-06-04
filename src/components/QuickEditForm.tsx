
import React, { useState, useRef, useEffect } from "react";
import { Appliance } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface QuickEditFormProps {
  appliances: Appliance[];
  onUpdateAppliances: (appliances: Appliance[]) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const QuickEditForm: React.FC<QuickEditFormProps> = ({
  appliances,
  onUpdateAppliances,
  knownBrands,
  knownTypes
}) => {
  const [editedAppliances, setEditedAppliances] = useState<Appliance[]>(appliances);
  const [draggedValue, setDraggedValue] = useState<{ field: 'brand' | 'type'; value: string } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    setEditedAppliances(appliances);
  }, [appliances]);

  const handleFieldChange = (id: string, field: 'brand' | 'type', value: string) => {
    const updated = editedAppliances.map(app => 
      app.id === id ? { ...app, [field]: value } : app
    );
    setEditedAppliances(updated);
  };

  const handleDragStart = (field: 'brand' | 'type', value: string) => {
    setDraggedValue({ field, value });
  };

  const handleDrop = (targetId: string) => {
    if (!draggedValue) return;

    const targetIndex = editedAppliances.findIndex(app => app.id === targetId);
    const sourceValue = draggedValue.value;
    
    // Appliquer la valeur à tous les éléments suivants jusqu'à la fin ou jusqu'à un élément rempli
    const updated = editedAppliances.map((app, index) => {
      if (index >= targetIndex && (!app[draggedValue.field] || app[draggedValue.field].trim() === '')) {
        return { ...app, [draggedValue.field]: sourceValue };
      }
      return app;
    });

    setEditedAppliances(updated);
    setDraggedValue(null);
    
    const affectedCount = updated.slice(targetIndex).filter((app, index) => 
      index + targetIndex >= targetIndex && (!appliances[index + targetIndex]?.[draggedValue.field] || appliances[index + targetIndex]?.[draggedValue.field]?.trim() === '')
    ).length;
    
    toast(`${affectedCount} cellules mises à jour avec "${sourceValue}"`);
  };

  const fillDown = (fromIndex: number, field: 'brand' | 'type') => {
    const sourceValue = editedAppliances[fromIndex][field];
    if (!sourceValue) return;

    const updated = editedAppliances.map((app, index) => {
      if (index > fromIndex && (!app[field] || app[field].trim() === '')) {
        return { ...app, [field]: sourceValue };
      }
      return app;
    });

    setEditedAppliances(updated);
    
    const affectedCount = updated.slice(fromIndex + 1).filter(app => app[field] === sourceValue).length;
    toast(`${affectedCount} cellules remplies vers le bas avec "${sourceValue}"`);
  };

  const resetChanges = () => {
    setEditedAppliances(appliances);
    toast("Modifications annulées");
  };

  const applyChanges = () => {
    onUpdateAppliances(editedAppliances);
    toast(`${editedAppliances.length} appareils mis à jour`);
  };

  const hasChanges = JSON.stringify(editedAppliances) !== JSON.stringify(appliances);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Édition rapide (style Excel)</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={applyChanges}
              disabled={!hasChanges}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Appliquer ({editedAppliances.length})
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-4">
            💡 <strong>Astuce :</strong> Glissez une cellule remplie vers une cellule vide pour recopier la valeur vers le bas, 
            ou double-cliquez sur le coin d'une cellule pour remplir automatiquement.
          </div>

          {/* En-tête du tableau */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-gray-100 rounded font-medium text-sm">
            <div>Référence technique</div>
            <div>Référence commerciale</div>
            <div>Marque</div>
            <div>Type</div>
          </div>

          {/* Lignes de données */}
          {editedAppliances.map((appliance, index) => (
            <div key={appliance.id} className="grid grid-cols-4 gap-2 p-2 border rounded hover:bg-gray-50">
              {/* Référence technique (lecture seule) */}
              <div className="p-2 bg-gray-50 rounded text-sm">
                {appliance.reference}
              </div>

              {/* Référence commerciale (lecture seule) */}
              <div className="p-2 bg-gray-50 rounded text-sm">
                {appliance.commercialRef || "—"}
              </div>

              {/* Marque */}
              <div className="relative">
                <Select 
                  value={appliance.brand || ""} 
                  onValueChange={(value) => handleFieldChange(appliance.id, 'brand', value)}
                >
                  <SelectTrigger 
                    className={`h-8 ${!appliance.brand ? 'border-red-300 bg-red-50' : ''}`}
                    draggable={!!appliance.brand}
                    onDragStart={() => appliance.brand && handleDragStart('brand', appliance.brand)}
                    onDrop={() => handleDrop(appliance.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDoubleClick={() => fillDown(index, 'brand')}
                  >
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {knownBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {appliance.brand && (
                  <Copy 
                    className="absolute right-1 top-1 h-3 w-3 text-gray-400 cursor-grab" 
                    title="Glisser pour recopier"
                  />
                )}
              </div>

              {/* Type */}
              <div className="relative">
                <Select 
                  value={appliance.type || ""} 
                  onValueChange={(value) => handleFieldChange(appliance.id, 'type', value)}
                >
                  <SelectTrigger 
                    className={`h-8 ${!appliance.type ? 'border-red-300 bg-red-50' : ''}`}
                    draggable={!!appliance.type}
                    onDragStart={() => appliance.type && handleDragStart('type', appliance.type)}
                    onDrop={() => handleDrop(appliance.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDoubleClick={() => fillDown(index, 'type')}
                  >
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {knownTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {appliance.type && (
                  <Copy 
                    className="absolute right-1 top-1 h-3 w-3 text-gray-400 cursor-grab" 
                    title="Glisser pour recopier"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {editedAppliances.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun appareil à éditer
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickEditForm;
