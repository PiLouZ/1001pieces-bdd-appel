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

  useEffect(() => {
    const count = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]).length;
    setSelectedCount(count);
  }, [selectedAppliances]);

  const hasSelection = selectedCount > 0;

  const handleEdit = (appliance: Appliance) => {
    setCurrentAppliance(appliance);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (appliance: Appliance) => {
    updateAppliance(appliance);
    setEditDialogOpen(false);
    setCurrentAppliance(null);
    toast({
      title: "Succès",
      description: "Appareil mis à jour avec succès"
    });
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
      toast({
        title: "Succès",
        description: `${selectedCount} appareils supprimés`
      });
    } else if (currentAppliance) {
      deleteAppliance(currentAppliance.id);
      toast({
        title: "Succès",
        description: "Appareil supprimé avec succès"
      });
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

  const handleUpdateSelection = (field: "brand" | "type") => {
    setUpdateField(field);
    setUpdateSelectionDialogOpen(true);
  };

  const confirmUpdateSelection = () => {
    const ids = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
    const updates = updateField === "brand" ? { brand: updateValue } : { type: updateValue };
    
    if (ids.length > 0) {
      associateApplicancesToPartReference(ids, newPartRef);
      toast({
        title: "Succès",
        description: `${ids.length} appareils mis à jour avec succès`
      });
    }
    
    setUpdateSelectionDialogOpen(false);
    setSelectedAppliances({});
  };

  const handleDeleteSelection = () => {
    setDeleteMultiple(true);
    setDeleteDialogOpen(true);
  };

  const handleStartEdit = (id: string, field: string, value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          value,
          isEditing: true
        }
      }
    }));
  };

  const handleEditChange = (id: string, field: string, value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          ...prev[id]?.[field],
          value
        }
      }
    }));
  };

  const handleSave = (id: string, field: string) => {
    const value = editableFields[id]?.[field]?.value || "";
    const updatedAppliance = { ...appliances.find(app => app.id === id), [field]: value };
    updateAppliance(updatedAppliance as Appliance);
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          value,
          isEditing: false
        }
      }
    }));
  };

  const handleCancel = (id: string, field: string) => {
    setEditableFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: {
          ...prev[id]?.[field],
          isEditing: false
        }
      }
    }));
  };

  const SearchBar = ({ value, onChange, knownBrands, knownTypes }: { value: string, onChange: (value: string) => void, knownBrands: string[], knownTypes: string[] }) => (
    <div className="flex flex-col space-y-2">
      <Input
        type="search"
        placeholder="Rechercher par référence, marque ou type..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex space-x-2">
        {knownBrands.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Marques ({knownBrands.length})</CardTitle>
            </CardHeader>
            <CardContent className="h-32 overflow-auto">
              {knownBrands.map(brand => (
                <div key={brand} className="text-sm">{brand}</div>
              ))}
            </CardContent>
          </Card>
        )}
        {knownTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Types ({knownTypes.length})</CardTitle>
            </CardHeader>
            <CardContent className="h-32 overflow-auto">
              {knownTypes.map(type => (
                <div key={type} className="text-sm">{type}</div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const handleAssociateToPartRef = () => {
    setAssociateDialogOpen(true);
  };

  const confirmAssociateToPartRef = () => {
    const ids = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
    const partRef = selectedPartRef || newPartRef;

    if (ids.length > 0 && partRef) {
      associateApplicancesToPartReference(ids, partRef);
      toast({
        title: "Succès",
        description: `${ids.length} appareils associés à la référence ${partRef}`
      });
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
        
        {/* Recherche et filtres */}
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          knownBrands={knownBrands || []} 
          knownTypes={knownTypes || []} 
        />
        
        {/* Zone d'actions groupées */}
        <div className="mb-4 mt-4">
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
          selectedAppliances={selectedAppliances}
          knownPartReferences={knownPartReferences || []}
          getPartReferencesForAppliance={(id) => getPartReferencesForAppliance ? getPartReferencesForAppliance(id) : []}
          associateAppliancesToPartReference={(ids, partRef) => associateApplicancesToPartReference ? associateApplicancesToPartReference(ids, partRef) : 0}
        />
        
        {/* Dialogue de modification */}
        <ApplianceEditDialog 
          isOpen={editDialogOpen} 
          appliance={currentAppliance} 
          onClose={() => setEditDialogOpen(false)}
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
              {updateField === "brand" && (
                <>
                  <Label htmlFor="brand">Marque</Label>
                  <select 
                    id="brand"
                    className="w-full p-2 border rounded-md"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {knownBrands && knownBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </>
              )}
              {updateField === "type" && (
                <>
                  <Label htmlFor="type">Type</Label>
                  <select 
                    id="type"
                    className="w-full p-2 border rounded-md"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {knownTypes && knownTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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
