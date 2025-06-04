
import React, { useState, useRef, useEffect } from "react";
import { Appliance } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, RotateCcw, ArrowDown, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface QuickEditFormProps {
  appliances: Appliance[];
  onUpdateAppliances: (appliances: Appliance[]) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const QuickEditForm: React.FC<QuickEditFormProps> = ({
  appliances,
  onUpdateAppliances,
  knownBrands: initialKnownBrands,
  knownTypes: initialKnownTypes
}) => {
  const [editedAppliances, setEditedAppliances] = useState<Appliance[]>(appliances);
  const [knownBrands, setKnownBrands] = useState<string[]>(initialKnownBrands);
  const [knownTypes, setKnownTypes] = useState<string[]>(initialKnownTypes);
  const [newBrand, setNewBrand] = useState("");
  const [newType, setNewType] = useState("");

  useEffect(() => {
    setEditedAppliances(appliances);
  }, [appliances]);

  useEffect(() => {
    setKnownBrands(initialKnownBrands);
  }, [initialKnownBrands]);

  useEffect(() => {
    setKnownTypes(initialKnownTypes);
  }, [initialKnownTypes]);

  const handleFieldChange = (id: string, field: 'brand' | 'type', value: string) => {
    const updated = editedAppliances.map(app => 
      app.id === id ? { ...app, [field]: value } : app
    );
    setEditedAppliances(updated);
  };

  const addNewBrand = () => {
    if (newBrand.trim() && !knownBrands.includes(newBrand.trim())) {
      setKnownBrands([...knownBrands, newBrand.trim()]);
      toast(`Nouvelle marque "${newBrand.trim()}" ajoutée`);
      setNewBrand("");
    }
  };

  const addNewType = () => {
    if (newType.trim() && !knownTypes.includes(newType.trim())) {
      setKnownTypes([...knownTypes, newType.trim()]);
      toast(`Nouveau type "${newType.trim()}" ajouté`);
      setNewType("");
    }
  };

  const fillDown = (fromIndex: number, field: 'brand' | 'type') => {
    const sourceValue = editedAppliances[fromIndex][field];
    if (!sourceValue) {
      toast("Aucune valeur à copier");
      return;
    }

    const updated = editedAppliances.map((app, index) => {
      if (index > fromIndex && (!app[field] || app[field].trim() === '')) {
        return { ...app, [field]: sourceValue };
      }
      return app;
    });

    setEditedAppliances(updated);
    
    const affectedCount = updated.slice(fromIndex + 1).filter((app, index) => 
      !appliances[index + fromIndex + 1]?.[field] || appliances[index + fromIndex + 1]?.[field]?.trim() === ''
    ).length;
    
    toast(`${affectedCount} cellules remplies vers le bas avec "${sourceValue}"`);
  };

  const copyToAll = (fromIndex: number, field: 'brand' | 'type') => {
    const sourceValue = editedAppliances[fromIndex][field];
    if (!sourceValue) {
      toast("Aucune valeur à copier");
      return;
    }

    const updated = editedAppliances.map((app, index) => {
      if (index !== fromIndex && (!app[field] || app[field].trim() === '')) {
        return { ...app, [field]: sourceValue };
      }
      return app;
    });

    setEditedAppliances(updated);
    
    const affectedCount = updated.filter((app, index) => 
      index !== fromIndex && app[field] === sourceValue
    ).length;
    
    toast(`${affectedCount} cellules mises à jour avec "${sourceValue}"`);
  };

  const resetChanges = () => {
    setEditedAppliances(appliances);
    setKnownBrands(initialKnownBrands);
    setKnownTypes(initialKnownTypes);
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
        {/* Section pour ajouter de nouvelles valeurs */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
          <div>
            <Label htmlFor="new-brand" className="text-sm font-medium">Ajouter une nouvelle marque</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="new-brand"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Nom de la marque..."
                onKeyPress={(e) => e.key === 'Enter' && addNewBrand()}
              />
              <Button 
                size="sm" 
                onClick={addNewBrand}
                disabled={!newBrand.trim() || knownBrands.includes(newBrand.trim())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="new-type" className="text-sm font-medium">Ajouter un nouveau type</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="new-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Nom du type..."
                onKeyPress={(e) => e.key === 'Enter' && addNewType()}
              />
              <Button 
                size="sm" 
                onClick={addNewType}
                disabled={!newType.trim() || knownTypes.includes(newType.trim())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-4">
            💡 <strong>Astuce :</strong> Utilisez les boutons à droite pour copier une valeur vers les cellules vides suivantes ou vers toutes les cellules vides.
          </div>

          {/* En-tête du tableau */}
          <div className="grid grid-cols-6 gap-2 p-3 bg-gray-100 rounded font-medium text-sm">
            <div>Référence technique</div>
            <div>Référence commerciale</div>
            <div>Marque</div>
            <div className="text-center">Actions</div>
            <div>Type</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Lignes de données */}
          {editedAppliances.map((appliance, index) => (
            <div key={appliance.id} className="grid grid-cols-6 gap-2 p-2 border rounded hover:bg-gray-50">
              {/* Référence technique (lecture seule) */}
              <div className="p-2 bg-gray-50 rounded text-sm">
                {appliance.reference}
              </div>

              {/* Référence commerciale (lecture seule) */}
              <div className="p-2 bg-gray-50 rounded text-sm">
                {appliance.commercialRef || "—"}
              </div>

              {/* Marque */}
              <div>
                <Select 
                  value={appliance.brand || ""} 
                  onValueChange={(value) => handleFieldChange(appliance.id, 'brand', value)}
                >
                  <SelectTrigger 
                    className={`h-8 ${!appliance.brand ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {knownBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions pour la marque */}
              <div className="flex gap-1 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fillDown(index, 'brand')}
                  disabled={!appliance.brand}
                  title="Copier vers le bas"
                  className="h-7 w-7 p-0"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToAll(index, 'brand')}
                  disabled={!appliance.brand}
                  title="Copier vers toutes les cellules vides"
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Type */}
              <div>
                <Select 
                  value={appliance.type || ""} 
                  onValueChange={(value) => handleFieldChange(appliance.id, 'type', value)}
                >
                  <SelectTrigger 
                    className={`h-8 ${!appliance.type ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {knownTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions pour le type */}
              <div className="flex gap-1 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fillDown(index, 'type')}
                  disabled={!appliance.type}
                  title="Copier vers le bas"
                  className="h-7 w-7 p-0"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToAll(index, 'type')}
                  disabled={!appliance.type}
                  title="Copier vers toutes les cellules vides"
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
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
