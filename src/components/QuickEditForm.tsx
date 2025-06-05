
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Appliance } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, RotateCcw, Plus, ChevronUp, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import VirtualizedTable from "./VirtualizedTable";
import { usePagination } from "@/hooks/usePagination";
import { useTableSort } from "@/hooks/useTableSort";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface QuickEditFormProps {
  appliances: Appliance[];
  onUpdateAppliances: (appliances: Appliance[]) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const ITEMS_PER_PAGE = 50;
const VIRTUAL_HEIGHT = 400;

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
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce la recherche pour améliorer les performances
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filtrage des données basé sur la recherche
  const filteredAppliances = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return editedAppliances;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return editedAppliances.filter(appliance => 
      appliance.reference.toLowerCase().includes(query) ||
      (appliance.commercialRef && appliance.commercialRef.toLowerCase().includes(query)) ||
      (appliance.brand && appliance.brand.toLowerCase().includes(query)) ||
      (appliance.type && appliance.type.toLowerCase().includes(query))
    );
  }, [editedAppliances, debouncedSearchQuery]);

  // Tri des données
  const { sortedData, handleSort, getSortIcon } = useTableSort(filteredAppliances);

  // Pagination
  const {
    currentData,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    reset: resetPagination
  } = usePagination({
    data: sortedData,
    itemsPerPage: ITEMS_PER_PAGE
  });

  useEffect(() => {
    setEditedAppliances(appliances);
    resetPagination();
  }, [appliances, resetPagination]);

  useEffect(() => {
    setKnownBrands(initialKnownBrands);
  }, [initialKnownBrands]);

  useEffect(() => {
    setKnownTypes(initialKnownTypes);
  }, [initialKnownTypes]);

  useEffect(() => {
    resetPagination();
  }, [debouncedSearchQuery, resetPagination]);

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
    const sourceAppliance = currentData[fromIndex];
    const sourceValue = sourceAppliance[field];
    if (!sourceValue) {
      toast("Aucune valeur à copier");
      return;
    }

    const updated = editedAppliances.map((app, index) => {
      const applianceIndex = editedAppliances.findIndex(a => a.id === app.id);
      const sourceApplianceIndex = editedAppliances.findIndex(a => a.id === sourceAppliance.id);
      
      if (applianceIndex > sourceApplianceIndex && (!app[field] || app[field].trim() === '')) {
        return { ...app, [field]: sourceValue };
      }
      return app;
    });

    setEditedAppliances(updated);
    
    const affectedCount = updated.filter(app => app[field] === sourceValue).length - 1;
    toast(`${affectedCount} cellules remplies vers le bas avec "${sourceValue}"`);
  };

  const copyToAll = (fromIndex: number, field: 'brand' | 'type') => {
    const sourceAppliance = currentData[fromIndex];
    const sourceValue = sourceAppliance[field];
    if (!sourceValue) {
      toast("Aucune valeur à copier");
      return;
    }

    const updated = editedAppliances.map((app) => {
      if (app.id !== sourceAppliance.id && (!app[field] || app[field].trim() === '')) {
        return { ...app, [field]: sourceValue };
      }
      return app;
    });

    setEditedAppliances(updated);
    
    const affectedCount = updated.filter(app => app[field] === sourceValue).length - 1;
    toast(`${affectedCount} cellules mises à jour avec "${sourceValue}"`);
  };

  const handleDragFill = (fromIndex: number, toIndex: number, field: 'brand' | 'type') => {
    const sourceAppliance = currentData[fromIndex];
    const sourceValue = sourceAppliance[field];
    if (!sourceValue) {
      toast("Aucune valeur à copier");
      return;
    }

    const appliancesToUpdate = currentData.slice(fromIndex + 1, toIndex + 1);
    
    const updated = editedAppliances.map(app => {
      if (appliancesToUpdate.some(updateApp => updateApp.id === app.id)) {
        return { ...app, [field]: sourceValue };
      }
      return app;
    });

    setEditedAppliances(updated);
    toast(`${appliancesToUpdate.length} cellules remplies par glisser-déposer avec "${sourceValue}"`);
  };

  const resetChanges = () => {
    setEditedAppliances(appliances);
    setKnownBrands(initialKnownBrands);
    setKnownTypes(initialKnownTypes);
    setSearchQuery("");
    resetPagination();
    toast("Modifications annulées");
  };

  const applyChanges = () => {
    onUpdateAppliances(editedAppliances);
    toast(`${editedAppliances.length} appareils mis à jour`);
  };

  const hasChanges = JSON.stringify(editedAppliances) !== JSON.stringify(appliances);

  // Génération des liens de pagination
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
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
      // Logique pour pagination avec ellipses
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

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
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

      if (currentPage < totalPages - 2) {
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

        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par référence technique, commerciale, marque ou type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Informations et tri */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            {totalItems} élément(s) • Page {currentPage} sur {totalPages}
            {debouncedSearchQuery && ` • Recherche: "${debouncedSearchQuery}"`}
          </div>
          
          <div className="flex gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('reference')}
              className="flex items-center gap-1"
            >
              Référence technique
              {getSortIcon('reference') === 'asc' && <ChevronUp className="h-3 w-3" />}
              {getSortIcon('reference') === 'desc' && <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('commercialRef')}
              className="flex items-center gap-1"
            >
              Référence commerciale
              {getSortIcon('commercialRef') === 'asc' && <ChevronUp className="h-3 w-3" />}
              {getSortIcon('commercialRef') === 'desc' && <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          💡 <strong>Astuce :</strong> Utilisez les poignées bleues en coin de cellule pour glisser-déposer, ou les boutons pour copier rapidement.
        </div>

        {/* Tableau virtualisé */}
        {currentData.length > 0 ? (
          <VirtualizedTable
            appliances={currentData}
            onFieldChange={handleFieldChange}
            knownBrands={knownBrands}
            knownTypes={knownTypes}
            onFillDown={fillDown}
            onCopyToAll={copyToAll}
            onDragFill={handleDragFill}
            height={VIRTUAL_HEIGHT}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            {debouncedSearchQuery ? 'Aucun résultat trouvé' : 'Aucun appareil à éditer'}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4">
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
      </CardContent>
    </Card>
  );
};

export default QuickEditForm;
