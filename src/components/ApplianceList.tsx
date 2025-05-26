
import React, { useState, useMemo } from "react";
import { Appliance, ApplianceSelection, ApplianceEditable } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Settings2,
  Check,
  X,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import PartReferencesDialog from "./PartReferencesDialog";

interface ApplianceListProps {
  appliances: Appliance[];
  onEdit: (appliance: Appliance) => void;
  onDelete: (id: string) => void;
  onToggleSelection?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  selectedAppliances?: ApplianceSelection;
  allSelected?: boolean;
  someSelected?: boolean;
  knownPartReferences?: string[];
  getPartReferencesForAppliance?: (id: string) => string[];
  associateAppliancesToPartReference?: (ids: string[], partRef: string) => number;
}

type SortField = "reference" | "commercialRef" | "brand" | "type";
type SortDirection = "asc" | "desc" | null;

const ApplianceList: React.FC<ApplianceListProps> = ({ 
  appliances, 
  onEdit, 
  onDelete, 
  onToggleSelection,
  onSelectAll,
  selectedAppliances = {},
  allSelected = false,
  someSelected = false,
  knownPartReferences = [],
  getPartReferencesForAppliance,
  associateAppliancesToPartReference
}) => {
  const [editableFields, setEditableFields] = useState<Record<string, { brand?: ApplianceEditable; type?: ApplianceEditable }>>({});
  const [currentAppliance, setCurrentAppliance] = useState<Appliance | null>(null);
  const [partReferencesOpen, setPartReferencesOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const sortedAppliances = useMemo(() => {
    let sorted = [...appliances];
    
    if (sortField && sortDirection) {
      sorted.sort((a, b) => {
        let aValue = "";
        let bValue = "";
        
        switch (sortField) {
          case "reference":
            aValue = a.reference || "";
            bValue = b.reference || "";
            break;
          case "commercialRef":
            aValue = a.commercialRef || "";
            bValue = b.commercialRef || "";
            break;
          case "brand":
            aValue = a.brand || "";
            bValue = b.brand || "";
            break;
          case "type":
            aValue = a.type || "";
            bValue = b.type || "";
            break;
        }
        
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else {
      // Tri par défaut par référence
      sorted.sort((a, b) => a.reference.localeCompare(b.reference));
    }
    
    return sorted;
  }, [appliances, sortField, sortDirection]);

  const handleStartEdit = (id: string, field: "brand" | "type", initialValue: string) => {
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          value: initialValue,
          isEditing: true,
        }
      }
    }));
  };

  const handleEditChange = (id: string, field: "brand" | "type", value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          ...prev[id]?.[field],
          value: value,
        }
      }
    }));
  };

  const handleSave = (id: string, field: "brand" | "type") => {
    const updatedValue = editableFields[id]?.[field]?.value || "";
    onEdit({
      ...appliances.find(app => app.id === id)!,
      [field]: updatedValue,
    });
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          value: "",
          isEditing: false,
        }
      }
    }));
  };

  const handleCancel = (id: string, field: "brand" | "type") => {
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          value: "",
          isEditing: false,
        }
      }
    }));
  };

  const getPartReferencesCount = (applianceId: string) => {
    return getPartReferencesForAppliance ? getPartReferencesForAppliance(applianceId).length : 0;
  };

  const handleSelectAllChange = (checked: boolean | "indeterminate") => {
    if (onSelectAll && typeof checked === "boolean") {
      onSelectAll(checked);
    }
  };

  return (
    <div className="space-y-4">
      {appliances.length === 0 ? (
        <p className="text-center text-gray-500">
          Aucun appareil trouvé. Importez des données pour commencer.
        </p>
      ) : (
        <>
          {appliances.length === 1 && (
            <p className="text-center text-gray-500">
              1 appareil
            </p>
          )}
          {appliances.length > 1 && (
            <p className="text-center text-gray-500">
              {appliances.length} appareils
            </p>
          )}
        </>
      )}
      
      {/* Tableau des appareils avec Table de shadcn/ui */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onToggleSelection && (
                <TableHead className="w-10">
                  <Checkbox 
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={handleSelectAllChange}
                    disabled={!appliances.length} 
                  />
                </TableHead>
              )}
              <TableHead className="cursor-pointer" onClick={() => handleSort("reference")}>
                <div className="flex items-center gap-1">
                  Référence
                  {getSortIcon("reference")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("commercialRef")}>
                <div className="flex items-center gap-1">
                  Référence commerciale
                  {getSortIcon("commercialRef")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("brand")}>
                <div className="flex items-center gap-1">
                  Marque
                  {getSortIcon("brand")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                <div className="flex items-center gap-1">
                  Type
                  {getSortIcon("type")}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAppliances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onToggleSelection ? 6 : 5} className="text-center h-24 text-muted-foreground">
                  Aucune donnée
                </TableCell>
              </TableRow>
            ) : (
              sortedAppliances.map((appliance) => (
                <TableRow key={appliance.id}>
                  {/* Case à cocher pour la sélection */}
                  {onToggleSelection && (
                    <TableCell className="w-10">
                      <Checkbox 
                        checked={!!selectedAppliances[appliance.id]} 
                        onCheckedChange={(checked) => {
                          onToggleSelection(appliance.id, checked === true);
                        }}
                      />
                    </TableCell>
                  )}
                  
                  {/* Référence technique */}
                  <TableCell className="font-medium">{appliance.reference}</TableCell>
                  
                  {/* Référence commerciale */}
                  <TableCell className="text-gray-600">
                    {appliance.commercialRef || "—"}
                  </TableCell>
                  
                  {/* Marque */}
                  <TableCell>
                    {editableFields[appliance.id]?.brand?.isEditing ? (
                      <div className="flex gap-1">
                        <Input
                          value={editableFields[appliance.id]?.brand?.value || appliance.brand}
                          onChange={(e) => handleEditChange(appliance.id, "brand", e.target.value)}
                          className="h-8 w-full"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(appliance.id, "brand");
                            if (e.key === "Escape") handleCancel(appliance.id, "brand");
                          }}
                        />
                        <Button size="sm" onClick={() => handleSave(appliance.id, "brand")} variant="ghost" className="h-8 w-8 p-0">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleCancel(appliance.id, "brand")} variant="ghost" className="h-8 w-8 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center group cursor-pointer"
                        onClick={() => handleStartEdit(appliance.id, "brand", appliance.brand)}
                      >
                        <span className={`${!appliance.brand ? "text-red-500 italic" : ""}`}>
                          {appliance.brand || "Non spécifié"}
                        </span>
                        <Pencil className="ml-2 h-3.5 w-3.5 text-gray-400 invisible group-hover:visible" />
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Type */}
                  <TableCell>
                    {editableFields[appliance.id]?.type?.isEditing ? (
                      <div className="flex gap-1">
                        <Input
                          value={editableFields[appliance.id]?.type?.value || appliance.type}
                          onChange={(e) => handleEditChange(appliance.id, "type", e.target.value)}
                          className="h-8 w-full"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(appliance.id, "type");
                            if (e.key === "Escape") handleCancel(appliance.id, "type");
                          }}
                        />
                        <Button size="sm" onClick={() => handleSave(appliance.id, "type")} variant="ghost" className="h-8 w-8 p-0">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleCancel(appliance.id, "type")} variant="ghost" className="h-8 w-8 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center group cursor-pointer"
                        onClick={() => handleStartEdit(appliance.id, "type", appliance.type)}
                      >
                        <span className={`${!appliance.type ? "text-red-500 italic" : ""}`}>
                          {appliance.type || "Non spécifié"}
                        </span>
                        <Pencil className="ml-2 h-3.5 w-3.5 text-gray-400 invisible group-hover:visible" />
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPartReferencesOpen(true);
                          setCurrentAppliance(appliance);
                        }}
                        className="relative"
                      >
                        <Tag className="h-4 w-4" />
                        {getPartReferencesCount(appliance.id) > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {getPartReferencesCount(appliance.id)}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(appliance)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(appliance.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Dialog pour afficher les références de pièces compatibles */}
      {currentAppliance && (
        <PartReferencesDialog
          open={partReferencesOpen}
          onOpenChange={setPartReferencesOpen}
          applianceId={currentAppliance.id}
          applianceReference={currentAppliance.reference}
          knownPartReferences={knownPartReferences || []}
          getPartReferencesForAppliance={(id) => getPartReferencesForAppliance ? getPartReferencesForAppliance(id) : []}
          associateAppliancesToPartReference={(ids, partRef) => associateAppliancesToPartReference ? associateAppliancesToPartReference(ids, partRef) : 0}
        />
      )}
    </div>
  );
};

export default ApplianceList;
