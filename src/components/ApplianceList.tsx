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
  Tag
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PartReferencesDialog from "./PartReferencesDialog";

interface ApplianceListProps {
  appliances: Appliance[];
  onEdit: (appliance: Appliance) => void;
  onDelete: (id: string) => void;
  onToggleSelection?: (id: string, selected: boolean) => void;
  selectedAppliances?: ApplianceSelection;
  knownPartReferences?: string[];
  getPartReferencesForAppliance?: (id: string) => string[];
  associateAppliancesToPartReference?: (ids: string[], partRef: string) => number;
}

const ApplianceList: React.FC<ApplianceListProps> = ({ 
  appliances, 
  onEdit, 
  onDelete, 
  onToggleSelection,
  selectedAppliances = {},
  knownPartReferences = [],
  getPartReferencesForAppliance,
  associateAppliancesToPartReference
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMultiple, setDeleteMultiple] = useState(false);
  const [applianceToDelete, setApplianceToDelete] = useState<string | null>(null);
  const [editableFields, setEditableFields] = useState<Record<string, { brand?: ApplianceEditable; type?: ApplianceEditable }>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentAppliance, setCurrentAppliance] = useState<Appliance | null>(null);
  const [updateSelectionDialogOpen, setUpdateSelectionDialogOpen] = useState(false);
  const [updateField, setUpdateField] = useState<"brand" | "type" | null>(null);
  const [updateValue, setUpdateValue] = useState("");
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false);
  const [selectedPartRef, setSelectedPartRef] = useState("");
  const [newPartRef, setNewPartRef] = useState("");
  const [partReferencesOpen, setPartReferencesOpen] = useState(false);

  const hasSelection = useMemo(() => Object.keys(selectedAppliances).some(key => selectedAppliances[key]), [selectedAppliances]);
  const selectedCount = useMemo(() => Object.keys(selectedAppliances).filter(key => selectedAppliances[key]).length, [selectedAppliances]);

  const sortedAppliances = useMemo(() => {
    return [...appliances].sort((a, b) => a.reference.localeCompare(b.reference));
  }, [appliances]);

  const confirmDelete = () => {
    if (deleteMultiple) {
      Object.keys(selectedAppliances).forEach(id => {
        if (selectedAppliances[id]) {
          onDelete(id);
        }
      });
    } else if (applianceToDelete) {
      onDelete(applianceToDelete);
    }
    setDeleteDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setApplianceToDelete(id);
    setDeleteMultiple(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSelection = () => {
    setApplianceToDelete(null);
    setDeleteMultiple(true);
    setDeleteDialogOpen(true);
  };

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

  const handleEdit = (appliance: Appliance) => {
    setCurrentAppliance(appliance);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (appliance: Appliance) => {
    onEdit(appliance);
    setEditDialogOpen(false);
  };

  const handleUpdateSelection = (field: "brand" | "type") => {
    setUpdateField(field);
    setUpdateValue("");
    setUpdateSelectionDialogOpen(true);
  };

  const confirmUpdateSelection = () => {
    if (updateField && updateValue) {
      const ids = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
      ids.forEach(id => {
        onEdit({
          ...appliances.find(app => app.id === id)!,
          [updateField]: updateValue,
        });
      });
      setUpdateSelectionDialogOpen(false);
    }
  };

  const confirmAssociateToPartRef = () => {
    const partRef = selectedPartRef || newPartRef;
    if (partRef) {
      const ids = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
      associateAppliancesToPartReference!(ids, partRef);
      setAssociateDialogOpen(false);
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
      
      {/* Tableau des appareils */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* En-tête du tableau */}
          <thead>
            <tr>
              {onToggleSelection && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox disabled={!appliances.length} />
                </th>
              )}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Référence
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Référence commerciale
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marque
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'ajout
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          {/* Corps du tableau */}
          <tbody>
            {sortedAppliances.map((appliance) => (
              <tr 
                key={appliance.id} 
                className="hover:bg-gray-50"
              >
                {/* Case à cocher pour la sélection */}
                {onToggleSelection && (
                  <td className="px-4 py-2 text-center">
                    <Checkbox 
                      checked={!!selectedAppliances[appliance.id]} 
                      onCheckedChange={(checked) => {
                        onToggleSelection(appliance.id, checked === true);
                      }}
                    />
                  </td>
                )}
                
                {/* Référence technique */}
                <td className="px-4 py-2 font-medium">{appliance.reference}</td>
                
                {/* Référence commerciale */}
                <td className="px-4 py-2 text-gray-600">
                  {appliance.commercialRef || "—"}
                </td>
                
                {/* Marque */}
                <td className="px-4 py-2">
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
                      className="flex items-center group"
                      onClick={() => handleStartEdit(appliance.id, "brand", appliance.brand)}
                    >
                      <span className={`${!appliance.brand ? "text-red-500 italic" : ""}`}>
                        {appliance.brand || "Non spécifié"}
                      </span>
                      <Pencil className="ml-2 h-3.5 w-3.5 text-gray-400 invisible group-hover:visible" />
                    </div>
                  )}
                </td>
                
                {/* Type */}
                <td className="px-4 py-2">
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
                      className="flex items-center group"
                      onClick={() => handleStartEdit(appliance.id, "type", appliance.type)}
                    >
                      <span className={`${!appliance.type ? "text-red-500 italic" : ""}`}>
                        {appliance.type || "Non spécifié"}
                      </span>
                      <Pencil className="ml-2 h-3.5 w-3.5 text-gray-400 invisible group-hover:visible" />
                    </div>
                  )}
                </td>
                
                {/* Date d'ajout */}
                <td className="px-4 py-2 text-gray-600">
                  {new Date(appliance.dateAdded).toLocaleDateString()}
                </td>
                
                {/* Actions */}
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPartReferencesOpen(true);
                        setCurrentAppliance(appliance);
                      }}
                    >
                      <Tag className="h-4 w-4" />
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
