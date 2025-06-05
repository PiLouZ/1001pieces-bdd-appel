
import React, { useState, useMemo, useCallback } from "react";
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
import { FixedSizeList as List } from 'react-window';
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
  onRemoveAssociation?: (applianceId: string, partRef: string) => void;
}

type SortField = "reference" | "commercialRef" | "brand" | "type";
type SortDirection = "asc" | "desc" | null;

const ITEM_HEIGHT = 60;
const CONTAINER_HEIGHT = 500; // Hauteur fixe pour la virtualisation

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
  associateAppliancesToPartReference,
  onRemoveAssociation
}) => {
  const [editableFields, setEditableFields] = useState<Record<string, { brand?: ApplianceEditable; type?: ApplianceEditable }>>({});
  const [currentAppliance, setCurrentAppliance] = useState<Appliance | null>(null);
  const [partReferencesOpen, setPartReferencesOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = useCallback((field: SortField) => {
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
  }, [sortField, sortDirection]);

  const getSortIcon = useCallback((field: SortField) => {
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
  }, [sortField, sortDirection]);

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
      sorted.sort((a, b) => a.reference.localeCompare(b.reference));
    }
    
    return sorted;
  }, [appliances, sortField, sortDirection]);

  const handleStartEdit = useCallback((id: string, field: "brand" | "type", initialValue: string) => {
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
  }, []);

  const handleEditChange = useCallback((id: string, field: "brand" | "type", value: string) => {
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
  }, []);

  const handleSave = useCallback((id: string, field: "brand" | "type") => {
    const updatedValue = editableFields[id]?.[field]?.value || "";
    const appliance = appliances.find(app => app.id === id);
    if (appliance) {
      onEdit({
        ...appliance,
        [field]: updatedValue,
      });
    }
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
  }, [editableFields, appliances, onEdit]);

  const handleCancel = useCallback((id: string, field: "brand" | "type") => {
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
  }, []);

  const getPartReferencesCount = useCallback((applianceId: string) => {
    return getPartReferencesForAppliance ? getPartReferencesForAppliance(applianceId).length : 0;
  }, [getPartReferencesForAppliance]);

  // Composant de ligne virtualisée memoïsé
  const VirtualizedRow = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const appliance = sortedAppliances[index];

    return (
      <div style={style} className="flex items-center border-b hover:bg-gray-50 px-4 py-2">
        {/* Case à cocher */}
        {onToggleSelection && (
          <div className="w-10 flex-shrink-0">
            <Checkbox 
              checked={!!selectedAppliances[appliance.id]} 
              onCheckedChange={(checked) => {
                onToggleSelection(appliance.id, checked === true);
              }}
            />
          </div>
        )}
        
        {/* Référence technique */}
        <div className="flex-1 min-w-0 px-2">
          <div className="font-medium truncate" title={appliance.reference}>
            {appliance.reference}
          </div>
        </div>
        
        {/* Référence commerciale */}
        <div className="flex-1 min-w-0 px-2">
          <div className="text-gray-600 truncate" title={appliance.commercialRef || "—"}>
            {appliance.commercialRef || "—"}
          </div>
        </div>
        
        {/* Marque */}
        <div className="flex-1 min-w-0 px-2">
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
              <span className={`truncate ${!appliance.brand ? "text-red-500 italic" : ""}`}>
                {appliance.brand || "Non spécifié"}
              </span>
              <Pencil className="ml-2 h-3.5 w-3.5 text-gray-400 invisible group-hover:visible flex-shrink-0" />
            </div>
          )}
        </div>
        
        {/* Type */}
        <div className="flex-1 min-w-0 px-2">
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
              <span className={`truncate ${!appliance.type ? "text-red-500 italic" : ""}`}>
                {appliance.type || "Non spécifié"}
              </span>
              <Pencil className="ml-2 h-3.5 w-3.5 text-gray-400 invisible group-hover:visible flex-shrink-0" />
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="w-32 flex justify-end gap-1 flex-shrink-0">
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
      </div>
    );
  });

  VirtualizedRow.displayName = 'VirtualizedRow';

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
      
      {/* En-tête avec tri */}
      <div className="rounded-md border">
        <div className="flex items-center border-b bg-gray-50 px-4 py-3">
          {onToggleSelection && (
            <div className="w-10 flex-shrink-0">
              <Checkbox 
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => {
                  if (onSelectAll && typeof checked === "boolean") {
                    onSelectAll(checked);
                  }
                }}
                disabled={!appliances.length} 
              />
            </div>
          )}
          
          <div className="flex-1 px-2">
            <button 
              className="flex items-center gap-1 font-medium text-sm hover:text-blue-600"
              onClick={() => handleSort("reference")}
            >
              Référence
              {getSortIcon("reference")}
            </button>
          </div>
          
          <div className="flex-1 px-2">
            <button 
              className="flex items-center gap-1 font-medium text-sm hover:text-blue-600"
              onClick={() => handleSort("commercialRef")}
            >
              Référence commerciale
              {getSortIcon("commercialRef")}
            </button>
          </div>
          
          <div className="flex-1 px-2">
            <button 
              className="flex items-center gap-1 font-medium text-sm hover:text-blue-600"
              onClick={() => handleSort("brand")}
            >
              Marque
              {getSortIcon("brand")}
            </button>
          </div>
          
          <div className="flex-1 px-2">
            <button 
              className="flex items-center gap-1 font-medium text-sm hover:text-blue-600"
              onClick={() => handleSort("type")}
            >
              Type
              {getSortIcon("type")}
            </button>
          </div>
          
          <div className="w-32 flex-shrink-0 text-right font-medium text-sm">
            Actions
          </div>
        </div>

        {/* Liste virtualisée */}
        {sortedAppliances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune donnée
          </div>
        ) : (
          <List
            height={Math.min(CONTAINER_HEIGHT, sortedAppliances.length * ITEM_HEIGHT)}
            itemCount={sortedAppliances.length}
            itemSize={ITEM_HEIGHT}
            overscanCount={5}
          >
            {VirtualizedRow}
          </List>
        )}
      </div>
      
      {/* Dialog pour afficher les références de pièces compatibles */}
      {currentAppliance && (
        <PartReferencesDialog
          open={partReferencesOpen}
          onOpenChange={setPartReferencesOpen}
          applianceId={currentAppliance.id}
          appliance={currentAppliance}
          currentPartReferences={getPartReferencesForAppliance ? getPartReferencesForAppliance(currentAppliance.id) : []}
          knownPartReferences={knownPartReferences || []}
          onAssociate={(ids, partRef) => associateAppliancesToPartReference ? associateAppliancesToPartReference(ids, partRef) : 0}
          onRemoveAssociation={onRemoveAssociation || (() => {})}
        />
      )}
    </div>
  );
};

export default ApplianceList;
