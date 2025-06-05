import React, { useState, useEffect, useMemo } from "react";
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
import DuplicateDetection from "@/components/DuplicateDetection";
import ImportSessionFilter from "@/components/ImportSessionFilter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { useChunkedPagination } from "@/hooks/useChunkedPagination";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 100;
const CHUNK_SIZE = 5; // 5 pages par chunk

const Appliances: React.FC = () => {
  const {
    appliances: allAppliancesFromHook,
    allAppliances,
    searchQuery: hookSearchQuery,
    setSearchQuery: setHookSearchQuery,
    updateAppliance,
    deleteAppliance,
    clearDatabase,
    knownBrands,
    knownTypes,
    knownPartReferences,
    getPartReferencesForAppliance,
    associateApplicancesToPartReference,
    removeAppliancePartAssociation
  } = useAppliances();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);
  
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
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showLastSessionOnly, setShowLastSessionOnly] = useState(false);

  // Index de recherche optimisé
  const { searchAppliances } = useSearchIndex(allAppliances);

  // Appliances filtrées par recherche
  const searchFilteredAppliances = useMemo(() => {
    return searchAppliances(debouncedSearchQuery);
  }, [searchAppliances, debouncedSearchQuery]);

  // Sessions d'import
  const importSessions = useMemo(() => {
    const sessionMap = new Map<string, { count: number; appliances: Appliance[] }>();
    
    allAppliances.forEach(appliance => {
      const sessionKey = (appliance as any).importSessionId || appliance.dateAdded;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, { count: 0, appliances: [] });
      }
      sessionMap.get(sessionKey)!.count++;
      sessionMap.get(sessionKey)!.appliances.push(appliance);
    });

    return Array.from(sessionMap.entries())
      .map(([sessionId, data]) => ({
        id: sessionId,
        name: sessionId.startsWith('import-') ? 
          `Session ${new Date(parseInt(sessionId.replace('import-', ''))).toLocaleString()}` : 
          `Session du ${sessionId}`,
        dateAdded: sessionId.startsWith('import-') ? 
          new Date(parseInt(sessionId.replace('import-', ''))).toISOString().split('T')[0] :
          sessionId,
        count: data.count,
        appliances: data.appliances
      }))
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }, [allAppliances]);

  // Filtrage par session
  const sessionFilteredAppliances = useMemo(() => {
    if (showLastSessionOnly && importSessions.length > 0) {
      const lastSession = importSessions[0];
      return searchFilteredAppliances.filter(app => {
        const sessionKey = (app as any).importSessionId || app.dateAdded;
        return sessionKey === lastSession.id;
      });
    }
    
    if (selectedSession) {
      return searchFilteredAppliances.filter(app => {
        const sessionKey = (app as any).importSessionId || app.dateAdded;
        return sessionKey === selectedSession;
      });
    }
    
    return searchFilteredAppliances;
  }, [searchFilteredAppliances, selectedSession, showLastSessionOnly, importSessions]);

  // Pagination par chunks
  const {
    currentData: paginatedAppliances,
    currentPage,
    totalPages,
    totalItems,
    availablePages,
    goToPage,
    nextPage,
    prevPage,
    preloadAdjacentChunks,
    reset: resetPagination,
    hasNextPage,
    hasPrevPage
  } = useChunkedPagination({
    data: sessionFilteredAppliances,
    itemsPerPage: ITEMS_PER_PAGE,
    chunkSize: CHUNK_SIZE
  });

  // Précharger les chunks adjacents
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadAdjacentChunks();
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentPage, preloadAdjacentChunks]);

  // Réinitialiser la pagination lors des changements de filtres
  useEffect(() => {
    resetPagination();
  }, [debouncedSearchQuery, selectedSession, showLastSessionOnly, resetPagination]);

  useEffect(() => {
    const count = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]).length;
    setSelectedCount(count);
  }, [selectedAppliances]);

  const hasSelection = selectedCount > 0;
  const allSelected = paginatedAppliances.length > 0 && selectedCount === paginatedAppliances.length;
  const someSelected = selectedCount > 0 && selectedCount < paginatedAppliances.length;

  // Génération de la pagination
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => goToPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => goToPage(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => goToPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => goToPage(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleClearDatabase = async () => {
    try {
      await clearDatabase();
      toast.success("Base de données nettoyée");
    } catch (error) {
      toast.error("Erreur lors du nettoyage");
    }
  };

  const handleMergeDuplicates = (duplicates: Appliance[]) => {
    // Implementation for merging duplicates
    console.log("Merging duplicates:", duplicates);
  };

  const handleEdit = (appliance: Appliance) => {
    setCurrentAppliance(appliance);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCurrentAppliance(allAppliances.find(app => app.id === id) || null);
    setDeleteMultiple(false);
    setDeleteDialogOpen(true);
  };

  const handleToggleSelection = (id: string, selected: boolean) => {
    setSelectedAppliances(prev => ({
      ...prev,
      [id]: selected
    }));
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection: ApplianceSelection = {};
    if (selected) {
      paginatedAppliances.forEach(appliance => {
        newSelection[appliance.id] = true;
      });
    }
    setSelectedAppliances(newSelection);
  };

  const handleUpdateSelection = (field: "brand" | "type") => {
    setUpdateField(field);
    setUpdateValue("");
    setAllowNewValue(false);
    setUpdateSelectionDialogOpen(true);
  };

  const handleDeleteSelection = () => {
    setDeleteMultiple(true);
    setDeleteDialogOpen(true);
  };

  const handleAssociateToPartRef = () => {
    setSelectedPartRef("");
    setNewPartRef("");
    setAssociateDialogOpen(true);
  };

  const handleRemoveAssociation = (applianceId: string, partRef: string) => {
    if (removeAppliancePartAssociation) {
      removeAppliancePartAssociation(applianceId, partRef);
      toast.success("Association supprimée");
    }
  };

  const handleSaveEdit = (appliance: Appliance) => {
    updateAppliance(appliance);
    setEditDialogOpen(false);
    setCurrentAppliance(null);
    toast.success("Appareil modifié");
  };

  const confirmDelete = async () => {
    if (deleteMultiple) {
      const idsToDelete = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
      for (const id of idsToDelete) {
        await deleteAppliance(id);
      }
      setSelectedAppliances({});
      toast.success(`${idsToDelete.length} appareils supprimés`);
    } else if (currentAppliance) {
      await deleteAppliance(currentAppliance.id);
      toast.success("Appareil supprimé");
    }
    setDeleteDialogOpen(false);
    setCurrentAppliance(null);
  };

  const confirmUpdateSelection = async () => {
    const idsToUpdate = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
    
    for (const id of idsToUpdate) {
      const appliance = allAppliances.find(app => app.id === id);
      if (appliance) {
        await updateAppliance({
          ...appliance,
          [updateField]: updateValue
        });
      }
    }
    
    setSelectedAppliances({});
    setUpdateSelectionDialogOpen(false);
    toast.success(`${idsToUpdate.length} appareils mis à jour`);
  };

  const confirmAssociateToPartRef = async () => {
    const idsToAssociate = Object.keys(selectedAppliances).filter(id => selectedAppliances[id]);
    const partRef = selectedPartRef || newPartRef;
    
    if (associateApplicancesToPartReference && partRef) {
      const count = associateApplicancesToPartReference(idsToAssociate, partRef);
      toast.success(`${count} appareils associés à la pièce ${partRef}`);
    }
    
    setSelectedAppliances({});
    setAssociateDialogOpen(false);
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
            <Button 
              variant="destructive" 
              onClick={handleClearDatabase}
              size="sm"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Nettoyer DB
            </Button>
          </div>
        </div>
        
        {/* Recherche optimisée avec debouncing */}
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Référence d'appareil ou de pièce, marque, type..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="max-w-md"
          />
          {totalItems !== allAppliances.length && (
            <p className="text-sm text-gray-500 mt-1">
              {totalItems} résultat(s) sur {allAppliances.length} appareils
            </p>
          )}
        </div>

        {/* Filtrage par session d'import */}
        <div className="mb-4">
          <ImportSessionFilter
            sessions={importSessions}
            selectedSession={selectedSession}
            onSessionChange={setSelectedSession}
            showLastSessionOnly={showLastSessionOnly}
            onToggleLastSession={() => setShowLastSessionOnly(!showLastSessionOnly)}
          />
        </div>

        {/* Détection de doublons */}
        <DuplicateDetection
          appliances={paginatedAppliances}
          onMergeDuplicates={handleMergeDuplicates}
          onUpdateAppliance={updateAppliance}
        />
        
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

        {/* Informations de pagination */}
        {totalPages > 1 && (
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages} • {totalItems} éléments • {ITEMS_PER_PAGE} par page
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={prevPage}
                    className={`cursor-pointer ${!hasPrevPage ? 'pointer-events-none opacity-50' : ''}`}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={nextPage}
                    className={`cursor-pointer ${!hasNextPage ? 'pointer-events-none opacity-50' : ''}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        
        {/* Liste des appareils avec virtualisation */}
        <ApplianceList 
          appliances={paginatedAppliances} 
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
          onRemoveAssociation={handleRemoveAssociation}
        />

        {/* Pagination en bas */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={prevPage}
                    className={`cursor-pointer ${!hasPrevPage ? 'pointer-events-none opacity-50' : ''}`}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={nextPage}
                    className={`cursor-pointer ${!hasNextPage ? 'pointer-events-none opacity-50' : ''}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        
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
                  onCheckedChange={(checked) => setAllowNewValue(checked === true)}
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
