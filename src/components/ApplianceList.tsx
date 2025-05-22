
// Import statements and types
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Appliance, ApplianceSelection } from "@/types/appliance";
import { toast } from "sonner";
import { Edit, Trash2, Check, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export interface ApplianceListProps {
  appliances: Appliance[];
  onDelete: (id: string) => void;
  onEdit: (updatedAppliance: Appliance) => void;
  onSelect: (id: string, selected: boolean) => void;
  selected: ApplianceSelection;
  onSelectAll: (selected: boolean) => void;
  onBulkUpdate: (field: "source" | "brand" | "type" | "dateAdded" | "reference" | "commercialRef" | "lastUpdated", value: string) => void;
  onBulkDelete: () => void;
  onDuplicatesCheck: () => void;
  onShowDuplicates: () => void;
  duplicatesCount: number;
  knownBrands: string[];
  knownTypes: string[];
}

const ApplianceList: React.FC<ApplianceListProps> = ({ 
  appliances, 
  onDelete, 
  onEdit, 
  onSelect,
  selected,
  onSelectAll,
  onBulkUpdate,
  onBulkDelete,
  onDuplicatesCheck,
  onShowDuplicates,
  duplicatesCount,
  knownBrands,
  knownTypes
}) => {
  const [sortField, setSortField] = useState<keyof Appliance>("reference");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isEditing, setIsEditing] = useState<{[key: string]: boolean}>({});
  const [editValues, setEditValues] = useState<{[key: string]: string}>({});
  
  // Effet pour créer un ID unique pour chaque appareil s'il n'en a pas déjà un
  useEffect(() => {
    appliances.forEach(app => {
      if (!app.id) {
        app.id = `app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
    });
  }, [appliances]);
  
  // Gestion de tri
  const handleSort = (field: keyof Appliance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Tri des appareils
  const sortedAppliances = [...appliances].sort((a, b) => {
    const aValue = String(a[sortField] || "");
    const bValue = String(b[sortField] || "");
    
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
  
  // Gestion des suppressions
  const handleDelete = (id: string) => {
    onDelete(id);
    toast("Appareil supprimé", {
      description: "L'appareil a été supprimé avec succès"
    });
  };
  
  // Edition inline
  const startEditing = (id: string, field: string, value: string) => {
    setIsEditing(prev => ({ ...prev, [`${id}-${field}`]: true }));
    setEditValues(prev => ({ ...prev, [`${id}-${field}`]: value }));
  };
  
  const cancelEditing = (id: string, field: string) => {
    setIsEditing(prev => ({ ...prev, [`${id}-${field}`]: false }));
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[`${id}-${field}`];
      return newValues;
    });
  };
  
  const saveEditing = (id: string, field: string, originalAppliance: Appliance) => {
    const newValue = editValues[`${id}-${field}`];
    if (typeof newValue !== 'undefined') {
      // Vérifier si la valeur a changé
      if (String(originalAppliance[field as keyof Appliance]) !== newValue) {
        // Créer un appareil mis à jour avec la nouvelle valeur
        const updatedAppliance = { ...originalAppliance, [field]: newValue };
        onEdit(updatedAppliance);
        toast("Appareil mis à jour", {
          description: `Le champ ${field} a été mis à jour avec succès`
        });
      }
      // Réinitialiser l'état d'édition
      cancelEditing(id, field);
    }
  };
  
  const handleInputChange = (id: string, field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [`${id}-${field}`]: value }));
  };
  
  // Gestion des sélections
  const isAllSelected = appliances.length > 0 && Object.keys(selected).length === appliances.length && 
    Object.values(selected).every(Boolean);
  
  const isSomeSelected = Object.values(selected).some(Boolean) && !isAllSelected;
  
  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  return (
    <div className="rounded-md border">
      <div className="flex items-center p-4 border-b">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
          indeterminate={isSomeSelected}
          aria-label="Sélectionner tous les appareils"
        />
        <div className="ml-auto flex gap-2">
          {Object.values(selected).some(Boolean) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Actions groupées <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer la sélection
                </DropdownMenuItem>
                {/* Autres actions groupées */}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={onDuplicatesCheck}
          >
            <Filter className="mr-2 h-4 w-4" /> Vérifier les incohérences
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={onShowDuplicates}
          >
            Doublons {duplicatesCount > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 py-1 text-xs text-white">{duplicatesCount}</span>}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("reference")}
            >
              Référence
              {sortField === "reference" && (
                sortDirection === "asc" ? 
                <ChevronUp className="inline-block ml-1 h-4 w-4" /> : 
                <ChevronDown className="inline-block ml-1 h-4 w-4" />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("commercialRef")}
            >
              Référence commerciale
              {sortField === "commercialRef" && (
                sortDirection === "asc" ? 
                <ChevronUp className="inline-block ml-1 h-4 w-4" /> : 
                <ChevronDown className="inline-block ml-1 h-4 w-4" />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("brand")}
            >
              Marque
              {sortField === "brand" && (
                sortDirection === "asc" ? 
                <ChevronUp className="inline-block ml-1 h-4 w-4" /> : 
                <ChevronDown className="inline-block ml-1 h-4 w-4" />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("type")}
            >
              Type
              {sortField === "type" && (
                sortDirection === "asc" ? 
                <ChevronUp className="inline-block ml-1 h-4 w-4" /> : 
                <ChevronDown className="inline-block ml-1 h-4 w-4" />
              )}
            </TableHead>
            <TableHead>Date d'ajout</TableHead>
            <TableHead>Pièces compatibles</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAppliances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Aucun appareil trouvé
              </TableCell>
            </TableRow>
          ) : (
            sortedAppliances.map((appliance) => (
              <TableRow key={appliance.id}>
                <TableCell>
                  <Checkbox 
                    checked={!!selected[appliance.id]} 
                    onCheckedChange={(checked) => onSelect(appliance.id, checked === true)}
                    aria-label="Sélectionner cet appareil"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {isEditing[`${appliance.id}-reference`] ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        className="h-8"
                        value={editValues[`${appliance.id}-reference`]}
                        onChange={(e) => handleInputChange(appliance.id, "reference", e.target.value)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => saveEditing(appliance.id, "reference", appliance)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => cancelEditing(appliance.id, "reference")}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => startEditing(appliance.id, "reference", appliance.reference)}
                    >
                      {appliance.reference}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {/* Commercial ref logic - similar to reference */}
                  {isEditing[`${appliance.id}-commercialRef`] ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        className="h-8"
                        value={editValues[`${appliance.id}-commercialRef`]}
                        onChange={(e) => handleInputChange(appliance.id, "commercialRef", e.target.value)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => saveEditing(appliance.id, "commercialRef", appliance)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => cancelEditing(appliance.id, "commercialRef")}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => startEditing(appliance.id, "commercialRef", appliance.commercialRef || "")}
                    >
                      {appliance.commercialRef || "-"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {/* Brand logic - similar to reference */}
                  {isEditing[`${appliance.id}-brand`] ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        className="h-8"
                        list={`brands-${appliance.id}`}
                        value={editValues[`${appliance.id}-brand`]}
                        onChange={(e) => handleInputChange(appliance.id, "brand", e.target.value)}
                      />
                      <datalist id={`brands-${appliance.id}`}>
                        {knownBrands.map((brand, i) => (
                          <option key={i} value={brand} />
                        ))}
                      </datalist>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => saveEditing(appliance.id, "brand", appliance)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => cancelEditing(appliance.id, "brand")}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => startEditing(appliance.id, "brand", appliance.brand)}
                    >
                      {appliance.brand}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {/* Type logic - similar to reference */}
                  {isEditing[`${appliance.id}-type`] ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        className="h-8"
                        list={`types-${appliance.id}`}
                        value={editValues[`${appliance.id}-type`]}
                        onChange={(e) => handleInputChange(appliance.id, "type", e.target.value)}
                      />
                      <datalist id={`types-${appliance.id}`}>
                        {knownTypes.map((type, i) => (
                          <option key={i} value={type} />
                        ))}
                      </datalist>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => saveEditing(appliance.id, "type", appliance)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => cancelEditing(appliance.id, "type")}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => startEditing(appliance.id, "type", appliance.type)}
                    >
                      {appliance.type}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {appliance.dateAdded ? new Date(appliance.dateAdded).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>
                  {appliance.partReferences ? appliance.partReferences.length : 0}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => onEdit(appliance)}
                      variant="ghost"
                      size="icon"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(appliance.id)}
                      variant="ghost"
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplianceList;
