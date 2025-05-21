
import React, { useState, useRef, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Appliance, ApplianceSelection } from "@/types/appliance";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Tag, Check, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppliances } from "@/hooks/useAppliances";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ApplianceListProps {
  appliances: Appliance[];
  onDelete: (id: string) => void;
  onEdit: (appliance: Appliance) => void;
  onSelect?: (id: string, selected: boolean) => void;
  selected?: ApplianceSelection;
  onSelectAll?: (selected: boolean) => void;
  onBulkUpdate?: (field: "brand" | "type", value: string) => void;
}

type SortField = "reference" | "commercialRef" | "brand" | "type";
type SortDirection = "asc" | "desc";
type EditableField = {id: string, field: "brand" | "type" | "reference" | "commercialRef", value: string};

const ApplianceList: React.FC<ApplianceListProps> = ({ 
  appliances, 
  onDelete, 
  onEdit,
  onSelect,
  selected = {},
  onSelectAll,
  onBulkUpdate
}) => {
  const [sortField, setSortField] = useState<SortField>("reference");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [allSelected, setAllSelected] = useState(false);
  const [bulkUpdateField, setBulkUpdateField] = useState<"brand" | "type" | null>(null);
  const [bulkUpdateValue, setBulkUpdateValue] = useState("");
  const [showCompatibleDialog, setShowCompatibleDialog] = useState(false);
  const [selectedApplianceForParts, setSelectedApplianceForParts] = useState<Appliance | null>(null);
  const [newPartReference, setNewPartReference] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { getPartReferencesForAppliance, knownBrands, knownTypes, associateApplicancesToPartReference, knownPartReferences } = useAppliances();

  useEffect(() => {
    if (editingField && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingField]);

  useEffect(() => {
    if (bulkUpdateField && bulkInputRef.current) {
      bulkInputRef.current.focus();
    }
  }, [bulkUpdateField]);

  useEffect(() => {
    // Vérifier si tous les éléments sont sélectionnés
    const selectedCount = Object.values(selected).filter(Boolean).length;
    setAllSelected(selectedCount > 0 && selectedCount === appliances.length);
  }, [selected, appliances]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAppliances = [...appliances].sort((a, b) => {
    const aValue = (a[sortField] || "").toLowerCase();
    const bValue = (b[sortField] || "").toLowerCase();

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleCellDoubleClick = (appliance: Appliance, field: "brand" | "type" | "reference" | "commercialRef") => {
    setEditingField({ id: appliance.id, field, value: appliance[field] || "" });
  };

  const handleCellEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingField) {
      setEditingField({ ...editingField, value: e.target.value });
    }
  };

  const handleCellEditComplete = () => {
    if (editingField) {
      const updatedAppliance = appliances.find(app => app.id === editingField.id);
      if (updatedAppliance) {
        const newAppliance = { 
          ...updatedAppliance, 
          [editingField.field]: editingField.value,
          lastUpdated: new Date().toISOString()
        };
        onEdit(newAppliance);
        
        toast({
          title: "Mise à jour effectuée",
          description: `La valeur a été mise à jour.`,
        });
      }
      setEditingField(null);
    }
  };

  const handleCellKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCellEditComplete();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const handleCheckAllChange = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
      setAllSelected(checked);
    }
  };

  const handleCheckChange = (id: string, checked: boolean) => {
    if (onSelect) {
      onSelect(id, checked);
    }
  };

  const handleBulkUpdate = () => {
    if (bulkUpdateField && bulkUpdateValue.trim() && onBulkUpdate) {
      onBulkUpdate(bulkUpdateField, bulkUpdateValue);
      setBulkUpdateField(null);
      setBulkUpdateValue("");
    }
  };

  const handleBulkUpdateCancel = () => {
    setBulkUpdateField(null);
    setBulkUpdateValue("");
  };

  const handleShowCompatibleParts = (appliance: Appliance) => {
    setSelectedApplianceForParts(appliance);
    setNewPartReference("");
    setShowCompatibleDialog(true);
  };

  const handleAddCompatiblePart = () => {
    if (!selectedApplianceForParts || !newPartReference.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une référence de pièce valide",
        variant: "destructive",
      });
      return;
    }

    // Associer l'appareil à la nouvelle référence de pièce
    associateApplicancesToPartReference([selectedApplianceForParts.id], newPartReference);
    
    toast({
      title: "Pièce compatible ajoutée",
      description: `L'appareil ${selectedApplianceForParts.reference} est maintenant compatible avec la pièce ${newPartReference}.`,
    });

    setNewPartReference("");
    // Actualiser le dialogue
    setSelectedApplianceForParts({...selectedApplianceForParts});
  };

  const getCompatiblePartsCount = (applianceId: string): number => {
    const references = getPartReferencesForAppliance(applianceId);
    return references.length;
  };

  const compatiblePartReferences = selectedApplianceForParts 
    ? getPartReferencesForAppliance(selectedApplianceForParts.id)
    : [];

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            {appliances.length === 0 && (
              <TableCaption>Aucun appareil enregistré.</TableCaption>
            )}
            <TableHeader>
              <TableRow>
                {onSelect && (
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={allSelected} 
                      onCheckedChange={handleCheckAllChange} 
                      aria-label="Sélectionner tous les appareils"
                    />
                  </TableHead>
                )}
                <TableHead onClick={() => handleSort("reference")} className="cursor-pointer">
                  Référence technique
                  {sortField === "reference" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort("commercialRef")} className="cursor-pointer">
                  Référence commerciale
                  {sortField === "commercialRef" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort("brand")} className="cursor-pointer">
                  Marque
                  {sortField === "brand" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                  Type
                  {sortField === "type" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="text-center">
                  Pièces compatibles
                </TableHead>
                <TableHead className="text-right w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulkUpdateField && (
                <TableRow>
                  {onSelect && <TableCell></TableCell>}
                  <TableCell colSpan={3} className="font-medium">
                    Modifier en masse : {bulkUpdateField === "brand" ? "Marque" : "Type"}
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={bulkUpdateValue}
                      onChange={(e) => setBulkUpdateValue(e.target.value)}
                      placeholder={`Entrer ${bulkUpdateField === "brand" ? "une marque" : "un type"}`}
                      ref={bulkInputRef}
                      list={bulkUpdateField === "brand" ? "bulk-brands-list" : "bulk-types-list"}
                    />
                    <datalist id="bulk-brands-list">
                      {knownBrands.map(brand => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                    <datalist id="bulk-types-list">
                      {knownTypes.map(type => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell className="text-center">
                    -
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={handleBulkUpdate}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleBulkUpdateCancel}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {sortedAppliances.map((appliance) => (
                <TableRow key={appliance.id} className={
                  (!appliance.brand || !appliance.type) ? "bg-amber-50" : ""
                }>
                  {onSelect && (
                    <TableCell>
                      <Checkbox 
                        checked={!!selected[appliance.id]}
                        onCheckedChange={(checked) => handleCheckChange(appliance.id, !!checked)}
                        aria-label={`Sélectionner ${appliance.reference}`}
                      />
                    </TableCell>
                  )}
                  <TableCell 
                    className="cursor-pointer font-medium" 
                    onDoubleClick={() => handleCellDoubleClick(appliance, "reference")}
                  >
                    {editingField && editingField.id === appliance.id && editingField.field === "reference" ? (
                      <Input
                        value={editingField.value}
                        onChange={handleCellEdit}
                        onBlur={handleCellEditComplete}
                        onKeyDown={handleCellKeyPress}
                        ref={editInputRef}
                        className="min-w-[100px]"
                      />
                    ) : (
                      appliance.reference
                    )}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer" 
                    onDoubleClick={() => handleCellDoubleClick(appliance, "commercialRef")}
                  >
                    {editingField && editingField.id === appliance.id && editingField.field === "commercialRef" ? (
                      <Input
                        value={editingField.value}
                        onChange={handleCellEdit}
                        onBlur={handleCellEditComplete}
                        onKeyDown={handleCellKeyPress}
                        ref={editInputRef}
                        className="min-w-[100px]"
                      />
                    ) : (
                      appliance.commercialRef || "-"
                    )}
                  </TableCell>
                  <TableCell 
                    className={`cursor-pointer ${!appliance.brand ? "text-amber-600" : ""}`} 
                    onDoubleClick={() => handleCellDoubleClick(appliance, "brand")}
                  >
                    {editingField && editingField.id === appliance.id && editingField.field === "brand" ? (
                      <Input
                        value={editingField.value}
                        onChange={handleCellEdit}
                        onBlur={handleCellEditComplete}
                        onKeyDown={handleCellKeyPress}
                        ref={editInputRef}
                        list="known-brands"
                        className="min-w-[100px]"
                      />
                    ) : (
                      appliance.brand || <span className="italic text-amber-600">À compléter</span>
                    )}
                    <datalist id="known-brands">
                      {knownBrands.map(brand => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell 
                    className={`cursor-pointer ${!appliance.type ? "text-amber-600" : ""}`} 
                    onDoubleClick={() => handleCellDoubleClick(appliance, "type")}
                  >
                    {editingField && editingField.id === appliance.id && editingField.field === "type" ? (
                      <Input
                        value={editingField.value}
                        onChange={handleCellEdit}
                        onBlur={handleCellEditComplete}
                        onKeyDown={handleCellKeyPress}
                        ref={editInputRef}
                        list="known-types"
                        className="min-w-[100px]"
                      />
                    ) : (
                      appliance.type || <span className="italic text-amber-600">À compléter</span>
                    )}
                    <datalist id="known-types">
                      {knownTypes.map(type => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleShowCompatibleParts(appliance)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {getCompatiblePartsCount(appliance.id) || 0}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleShowCompatibleParts(appliance)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showCompatibleDialog} onOpenChange={setShowCompatibleDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pièces compatibles</DialogTitle>
              <DialogDescription>
                {selectedApplianceForParts && (
                  <span>
                    Gérer les pièces compatibles avec l'appareil <strong>{selectedApplianceForParts.brand} {selectedApplianceForParts.reference}</strong>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="newPartReference" className="mb-1 block">Ajouter une référence de pièce</Label>
                  <Input
                    id="newPartReference"
                    value={newPartReference}
                    onChange={(e) => setNewPartReference(e.target.value)}
                    placeholder="Ex: XYZ123"
                    list="known-parts"
                  />
                  <datalist id="known-parts">
                    {knownPartReferences.map(ref => (
                      <option key={ref} value={ref} />
                    ))}
                  </datalist>
                </div>
                <Button onClick={handleAddCompatiblePart} className="mb-px">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              
              {compatiblePartReferences.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Références de pièces compatibles:</h3>
                  <div className="flex flex-wrap gap-2">
                    {compatiblePartReferences.map(ref => (
                      <Badge key={ref} variant="outline">{ref}</Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  Aucune pièce compatible trouvée pour cet appareil.
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowCompatibleDialog(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ApplianceList;
