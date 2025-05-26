
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { useAppliances } from "@/hooks/useAppliances";
import { Database, FileDown, Import, Settings2, Trash2, Tag, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Appliance, ApplianceSelection, ApplianceEditable } from "@/types/appliance";
import ApplianceEditDialog from "@/components/ApplianceEditDialog";
import ApplianceList from "@/components/ApplianceList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Appliances: React.FC = () => {
  const {
    appliances,
    allAppliances,
    searchQuery,
    setSearchQuery,
    updateAppliance,
    deleteAppliance,
    knownBrands,
    knownTypes,
    knownPartReferences,
    getPartReferencesForAppliance,
    associateApplicancesToPartReference
  } = useAppliances();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentAppliance, setCurrentAppliance] = useState<Appliance | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMultiple, setDeleteMultiple] = useState(false);
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceSelection>({});
  const [selectedCount, setSelectedCount] = useState(0);
  const [editableFields, setEditableFields] = useState<Record<string, Record<string, ApplianceEditable>>>({});
  const [updateSelectionDialogOpen, setUpdateSelectionDialogOpen] = useState(false);
  const [updateField, setUpdateField] = useState<"brand" | "type">("brand");
  const [updateValue, setUpdateValue] = useState("");
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false);
  const [selectedPartRef, setSelectedPartRef] = useState("");
  const [newPartRef, setNewPartRef] = useState("");
  const [allowNewValue, setAllowNewValue] = useState(false);

  useEffect(() => {
    const count = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]).length;
    setSelectedCount(count);
  }, [selectedAppliances]);

  const hasSelection = selectedCount > 0;
  const allSelected = appliances.length > 0 && selectedCount === appliances.length;
  const someSelected = selectedCount > 0 && selectedCount < appliances.length;

  const handleEdit = (appliance: Appliance) => {
    setCurrentAppliance(appliance);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (appliance: Appliance) => {
    updateAppliance(appliance);
    setEditDialogOpen(false);
    setCurrentAppliance(null);
    toast("Appareil mis à jour avec succès");
  };

  const handleDelete = (id: string) => {
    setCurrentAppliance({ id } as Appliance);
    setDeleteMultiple(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteMultiple) {
      Object.keys(selectedAppliances).forEach(id => {
        if (selectedAppliances[id]) {
          deleteAppliance(id);
        }
      });
      setSelectedAppliances({});
      toast(`${selectedCount} appareils supprimés`);
    } else if (currentAppliance) {
      deleteAppliance(currentAppliance.id);
      toast("Appareil supprimé avec succès");
    }
    setDeleteDialogOpen(false);
    setCurrentAppliance(null);
  };

  const handleToggleSelection = (id: string, selected: boolean) => {
    setSelectedAppliances(prev => ({
      ...prev,
      [id]: selected
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection: ApplianceSelection = {};
      appliances.forEach(appliance => {
        newSelection[appliance.id] = true;
      });
      setSelectedAppliances(newSelection);
    } else {
      setSelectedAppliances({});
    }
  };

  const handleUpdateSelection = (field: "brand" | "type") => {
    setUpdateField(field);
    setUpdateValue("");
    setAllowNewValue(false);
    setUpdateSelectionDialogOpen(true);
  };

  const confirmUpdateSelection = () => {
    const ids = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
    const updates = updateField === "brand" ? { brand: updateValue } : { type: updateValue };
    
    if (ids.length > 0) {
      ids.forEach(id => {
        const appliance = appliances.find(app => app.id === id);
        if (appliance) {
          updateAppliance({
            ...appliance,
            ...updates
          });
        }
      });
      
      toast(`${ids.length} appareils mis à jour avec succès`);
    }
    
    setUpdateSelectionDialogOpen(false);
    setSelectedAppliances({});
  };

  const handleDeleteSelection = () => {
    setDeleteMultiple(true);
    setDeleteDialogOpen(true);
  };

  const handleAssociateToPartRef = () => {
    setAssociateDialogOpen(true);
  };

  const confirmAssociateToPartRef = () => {
    const ids = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
    const partRef = selectedPartRef || newPartRef;

    if (ids.length > 0 && partRef) {
      associateApplicancesToPartReference(ids, partRef);
      toast(`${ids.length} appareils associés à la référence ${partRef}`);
    }

    setAssociateDialogOpen(false);
    setSelectedAppliances({});
    setSelectedPartRef("");
    setNewPartRef("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="mr-2 h-6 w-6" /> 
            Appareils ({allAppliances?.length || 0})
          </h1>
          <div className="flex space-x-2">
            <Button asChild>
              <Link to="/import">
                <Import className="mr-2 h-4 w-4" /> Importer
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/export">
                <FileDown className="mr-2 h-4 w-4" /> Exporter
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Recherche uniquement */}
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Référence d'appareil ou de pièce, marque, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        {/* Zone d'actions groupées */}
        <div className="mb-4">
          {hasSelection && (
            <div className="bg-gray-50 p-4 rounded-md border flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium mr-2">{selectedCount} appareils sélectionnés</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleUpdateSelection("brand")}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Modifier marque
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleUpdateSelection("type")}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Modifier type
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleAssociateToPartRef}
              >
                <Tag className="h-3.5 w-3.5 mr-1" />
                Associer à une pièce
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={handleDeleteSelection}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Supprimer
              </Button>
            </div>
          )}
        </div>
        
        {/* Liste des appareils */}
        <ApplianceList 
          appliances={appliances} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleSelection={handleToggleSelection}
          onSelectAll={handleSelectAll}
          selectedAppliances={selectedAppliances}
          allSelected={allSelected}
          someSelected={someSelected}
          knownPartReferences={knownPartReferences || []}
          getPartReferencesForAppliance={(id) => getPartReferencesForAppliance ? getPartReferencesForAppliance(id) : []}
          associateAppliancesToPartReference={(ids, partRef) => associateApplicancesToPartReference ? associateApplicancesToPartReference(ids, partRef) : 0}
        />
        
        {/* Dialogue de modification */}
        <ApplianceEditDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          appliance={currentAppliance} 
          onSave={handleSaveEdit}
          knownBrands={knownBrands || []}
          knownTypes={knownTypes || []}
        />

        {/* Dialogue de confirmation de suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {deleteMultiple ? selectedCount : 'cet appareil'} ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialogue pour la mise à jour groupée */}
        <Dialog open={updateSelectionDialogOpen} onOpenChange={setUpdateSelectionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Modifier {selectedCount} appareils
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allow-new-value"
                  checked={allowNewValue}
                  onCheckedChange={setAllowNewValue}
                />
                <Label htmlFor="allow-new-value">Créer une nouvelle valeur</Label>
              </div>
              
              {updateField === "brand" && (
                <>
                  <Label htmlFor="brand">Marque</Label>
                  {allowNewValue ? (
                    <Input
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      placeholder="Nouvelle marque"
                    />
                  ) : (
                    <Select value={updateValue} onValueChange={setUpdateValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une marque" />
                      </SelectTrigger>
                      <SelectContent>
                        {knownBrands && knownBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
              {updateField === "type" && (
                <>
                  <Label htmlFor="type">Type</Label>
                  {allowNewValue ? (
                    <Input
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      placeholder="Nouveau type"
                    />
                  ) : (
                    <Select value={updateValue} onValueChange={setUpdateValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {knownTypes && knownTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateSelectionDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={confirmUpdateSelection} disabled={!updateValue}>
                Appliquer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogue pour associer à une référence de pièce */}
        <Dialog open={associateDialogOpen} onOpenChange={setAssociateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Associer {selectedCount} appareils à une pièce
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="existing-part-ref">Référence de pièce existante</Label>
                <Select value={selectedPartRef} onValueChange={setSelectedPartRef}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une référence" />
                  </SelectTrigger>
                  <SelectContent>
                    {knownPartReferences && knownPartReferences.map(ref => (
                      <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="px-2 text-sm text-gray-500">OU</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-part-ref">Nouvelle référence de pièce</Label>
                <Input
                  id="new-part-ref"
                  value={newPartRef}
                  onChange={(e) => setNewPartRef(e.target.value)}
                  disabled={!!selectedPartRef}
                  placeholder="ex: XRT123456"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssociateDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={confirmAssociateToPartRef} 
                disabled={!selectedPartRef && !newPartRef}
              >
                Associer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Appliances;
