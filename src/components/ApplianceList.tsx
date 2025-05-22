
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Appliance, ApplianceEditable, ApplianceSelection } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Trash, AlertCircle, FileText, Check, MoreVertical, FileCheck2 } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppliances } from "@/hooks/useAppliances";
import ApplianceEditDialog from "./ApplianceEditDialog";

interface ApplianceListProps {
  appliances: Appliance[];
  onDelete?: (id: string) => void;
  onEdit?: (appliance: Appliance) => void;
  onSelect?: (id: string, selected: boolean) => void;
  selected?: ApplianceSelection;
  onSelectAll?: (selected: boolean) => void;
  onBulkUpdate?: (field: keyof Omit<Partial<Appliance>, "id">, value: string) => void;
  getPartReferencesForAppliance?: (id: string) => string[];
}

const ApplianceList: React.FC<ApplianceListProps> = ({
  appliances,
  onDelete,
  onEdit,
  onSelect,
  selected = {},
  onSelectAll,
  onBulkUpdate,
  getPartReferencesForAppliance
}) => {
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceSelection>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAppliance, setCurrentAppliance] = useState<Appliance | null>(null);
  const [showPartRefDialog, setShowPartRefDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [partReference, setPartReference] = useState("");
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const navigate = useNavigate();
  const { 
    associateApplicancesToPartReference, 
    getPartReferencesForAppliance: getPartRefs,
    cleanDatabase,
    appliances: allAppliances
  } = useAppliances();

  // Identifier les doublons
  useEffect(() => {
    // Utiliser un Set pour identifier les références uniques
    const references = new Set<string>();
    const duplicates = new Set<string>();
    
    allAppliances.forEach(appliance => {
      if (references.has(appliance.reference)) {
        duplicates.add(appliance.reference);
      } else {
        references.add(appliance.reference);
      }
    });
    
    setDuplicatesCount(duplicates.size);
  }, [allAppliances]);

  // Gérer les références de pièces pour chaque appareil
  const [partRefCounts, setPartRefCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const refCounts: Record<string, number> = {};
    
    // Compter les références pour chaque appareil
    appliances.forEach(appliance => {
      const partRefs = getPartReferencesForAppliance 
        ? getPartReferencesForAppliance(appliance.id) 
        : getPartRefs(appliance.id);
      refCounts[appliance.id] = partRefs.length;
    });
    
    setPartRefCounts(refCounts);
  }, [appliances, getPartReferencesForAppliance, getPartRefs]);

  const getAppliancePartRefCount = (id: string) => {
    return partRefCounts[id] || 0;
  };

  const toggleApplianceSelection = (id: string) => {
    if (onSelect) {
      onSelect(id, !selected[id]);
    } else {
      setSelectedAppliances(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }
  };

  const toggleAllApplianceSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAll) {
      onSelectAll(e.target.checked);
    } else {
      const newState: ApplianceSelection = {};
      if (e.target.checked) {
        appliances.forEach(appliance => {
          newState[appliance.id] = true;
        });
      }
      setSelectedAppliances(newState);
    }
  };

  const countSelectedAppliances = () => {
    const selectionToUse = onSelect ? selected : selectedAppliances;
    return Object.values(selectionToUse).filter(Boolean).length;
  };

  const handleEditAppliance = (appliance: Appliance) => {
    setCurrentAppliance(appliance);
    setIsEditDialogOpen(true);
  };

  const handleDeleteAppliance = (id: string) => {
    if (onDelete) {
      onDelete(id);
      toast("Appareil supprimé", {
        description: "L'appareil a été supprimé avec succès"
      });
    }
  };

  const handleAssociateWithPartRef = () => {
    if (!partReference.trim()) {
      toast("Erreur", {
        description: "Veuillez spécifier une référence de pièce",
        variant: "destructive"
      });
      return;
    }

    const selectionToUse = onSelect ? selected : selectedAppliances;
    const selectedIds = Object.keys(selectionToUse).filter(id => selectionToUse[id]);
    
    if (selectedIds.length === 0) {
      toast("Erreur", {
        description: "Veuillez sélectionner au moins un appareil",
        variant: "destructive"
      });
      return;
    }

    associateApplicancesToPartReference(selectedIds, partReference);
    
    // Mettre à jour le nombre de références de pièces pour chaque appareil
    const updatedRefCounts: Record<string, number> = { ...partRefCounts };
    selectedIds.forEach(id => {
      updatedRefCounts[id] = (updatedRefCounts[id] || 0) + 1;
    });
    setPartRefCounts(updatedRefCounts);

    toast("Association réussie", {
      description: `${selectedIds.length} appareils ont été associés à la référence ${partReference}`
    });

    setShowPartRefDialog(false);
    setPartReference("");
  };

  const handleDeleteSelected = () => {
    const selectionToUse = onSelect ? selected : selectedAppliances;
    const selectedIds = Object.keys(selectionToUse).filter(id => selectionToUse[id]);
    
    if (selectedIds.length === 0) {
      toast("Information", {
        description: "Aucun appareil sélectionné"
      });
      return;
    }
    
    setShowDeleteConfirmDialog(true);
  };
  
  const confirmDeleteSelected = () => {
    const selectionToUse = onSelect ? selected : selectedAppliances;
    const selectedIds = Object.keys(selectionToUse).filter(id => selectionToUse[id]);
    
    if (selectedIds.length === 0) {
      return;
    }
    
    let count = 0;
    selectedIds.forEach(id => {
      if (onDelete) {
        onDelete(id);
        count++;
      }
    });
    
    toast("Suppression terminée", {
      description: `${count} appareils ont été supprimés avec succès`
    });
    
    if (onSelect && onSelectAll) {
      onSelectAll(false);
    } else {
      setSelectedAppliances({});
    }
    
    setShowDeleteConfirmDialog(false);
  };
  
  const handleCleanDuplicates = () => {
    const removedCount = cleanDatabase();
    
    if (removedCount > 0) {
      toast("Nettoyage terminé", {
        description: `${removedCount} doublons ont été supprimés.`
      });
      // Mettre à jour le compteur
      setDuplicatesCount(0);
    } else {
      toast("Information", {
        description: "Aucun doublon trouvé dans la base de données."
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {countSelectedAppliances()} sélectionnés sur {appliances.length} appareils
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {duplicatesCount > 0 && (
            <Button variant="outline" className="flex items-center gap-1" onClick={handleCleanDuplicates}>
              <FileCheck2 className="h-4 w-4" />
              Supprimer les doublons ({duplicatesCount})
            </Button>
          )}
          
          {countSelectedAppliances() > 0 && (
            <>
              <Button variant="outline" onClick={() => setShowPartRefDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Associer à une référence de pièce
              </Button>
              
              <Button variant="destructive" onClick={handleDeleteSelected}>
                <Trash className="h-4 w-4 mr-2" />
                Supprimer {countSelectedAppliances()} élément(s)
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  onCheckedChange={toggleAllApplianceSelection}
                  checked={countSelectedAppliances() === appliances.length && appliances.length > 0}
                  aria-label={countSelectedAppliances() > 0 && countSelectedAppliances() < appliances.length ? "Partiellement sélectionné" : "Sélectionner tous les appareils"}
                />
              </TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Référence commerciale</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Pièces compatibles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appliances.length > 0 ? (
              appliances.map((appliance) => (
                <TableRow key={appliance.id}>
                  <TableCell>
                    <Checkbox
                      checked={onSelect ? !!selected[appliance.id] : !!selectedAppliances[appliance.id]}
                      onCheckedChange={() => toggleApplianceSelection(appliance.id)}
                    />
                  </TableCell>
                  <TableCell>{appliance.reference}</TableCell>
                  <TableCell>{appliance.commercialRef || "-"}</TableCell>
                  <TableCell>{appliance.brand || "-"}</TableCell>
                  <TableCell>{appliance.type || "-"}</TableCell>
                  <TableCell>{getAppliancePartRefCount(appliance.id)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditAppliance(appliance)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteAppliance(appliance.id)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Aucun appareil trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isEditDialogOpen && currentAppliance && (
        <ApplianceEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          appliance={currentAppliance}
          onSave={(updatedAppliance) => {
            setIsEditDialogOpen(false);
            if (onEdit) {
              onEdit(updatedAppliance);
            }
          }}
          knownBrands={[]}
          knownTypes={[]}
        />
      )}

      <Dialog open={showPartRefDialog} onOpenChange={setShowPartRefDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associer à une référence de pièce</DialogTitle>
            <DialogDescription>
              Entrez la référence de la pièce compatible avec les appareils sélectionnés.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="partReference">Référence de la pièce</Label>
              <Input
                id="partReference"
                value={partReference}
                onChange={(e) => setPartReference(e.target.value)}
                className="mt-2"
                placeholder="Ex: XYZ123"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {countSelectedAppliances()} appareils seront associés à cette référence de pièce
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartRefDialog(false)}>Annuler</Button>
            <Button onClick={handleAssociateWithPartRef}>Associer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {countSelectedAppliances()} appareils ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDeleteSelected}>
              <Trash className="h-4 w-4 mr-2" />
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplianceList;
