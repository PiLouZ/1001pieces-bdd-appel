
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Database, Loader2 } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import ApplianceList from "@/components/ApplianceList";
import ApplianceEditDialog from "@/components/ApplianceEditDialog";
import { useAppliances } from "@/hooks/useAppliances";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ImportSessionFilter from "@/components/ImportSessionFilter";
import DuplicateDetection from "@/components/DuplicateDetection";
import MassEditForm from "@/components/MassEditForm";
import ColumnFilters from "@/components/ColumnFilters";
import { Appliance } from "@/types/appliance";

const Appliances: React.FC = () => {
  const {
    appliances,
    allAppliances,
    searchQuery,
    setSearchQuery,
    updateAppliance,
    deleteAppliance,
    needsUpdateCount,
    isLoading,
    migrationReady,
    getAppliancesByPartReference,
    knownPartReferences,
    knownBrands,
    knownTypes,
    recentAppliances,
    getPartReferencesForAppliance,
    associateApplicancesToPartReference,
    removeAppliancePartAssociation,
    updateMultipleAppliances
  } = useAppliances();

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showLastSessionOnly, setShowLastSessionOnly] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [showMassEdit, setShowMassEdit] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    brand: "",
    type: "",
    reference: "",
    commercialRef: ""
  });

  // Simuler des sessions d'import pour la démonstration
  const importSessions = useMemo(() => {
    const sessions = recentAppliances
      .reduce((acc: any[], app) => {
        const dateKey = app.dateAdded;
        const existing = acc.find(s => s.dateAdded === dateKey);
        if (existing) {
          existing.count++;
        } else {
          acc.push({
            id: dateKey,
            name: `Session du ${dateKey}`,
            dateAdded: dateKey,
            count: 1
          });
        }
        return acc;
      }, [])
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    
    return sessions;
  }, [recentAppliances]);

  // Filtrer les appareils selon la session sélectionnée
  const filteredBySession = useMemo(() => {
    if (showLastSessionOnly && importSessions.length > 0) {
      const lastSession = importSessions[0];
      return allAppliances.filter(app => app.dateAdded === lastSession.dateAdded);
    }
    
    if (selectedSession) {
      return allAppliances.filter(app => app.dateAdded === selectedSession);
    }
    
    return appliances;
  }, [appliances, allAppliances, selectedSession, showLastSessionOnly, importSessions]);

  // Améliorer la recherche pour inclure les pièces détachées et les filtres de colonnes
  const enhancedSearch = useMemo(() => {
    let results = filteredBySession;
    
    // Appliquer les filtres de colonnes
    if (columnFilters.brand || columnFilters.type || columnFilters.reference || columnFilters.commercialRef) {
      results = results.filter(appliance => {
        if (columnFilters.brand && !appliance.brand.toLowerCase().includes(columnFilters.brand.toLowerCase())) return false;
        if (columnFilters.type && !appliance.type.toLowerCase().includes(columnFilters.type.toLowerCase())) return false;
        if (columnFilters.reference && !appliance.reference.toLowerCase().includes(columnFilters.reference.toLowerCase())) return false;
        if (columnFilters.commercialRef && !appliance.commercialRef?.toLowerCase().includes(columnFilters.commercialRef.toLowerCase())) return false;
        return true;
      });
    }
    
    // Appliquer la recherche textuelle
    if (searchQuery) {
      // Vérifier si la recherche correspond à une référence de pièce
      if (knownPartReferences.includes(searchQuery)) {
        const appliancesForPart = getAppliancesByPartReference(searchQuery);
        results = appliancesForPart.filter(app => 
          results.some(filteredApp => filteredApp.id === app.id)
        );
      } else {
        // Recherche standard
        results = results.filter(appliance =>
          appliance.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (appliance.commercialRef && appliance.commercialRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
          appliance.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appliance.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }
    
    return results;
  }, [searchQuery, filteredBySession, knownPartReferences, getAppliancesByPartReference, columnFilters]);

  const handleEditAppliance = (appliance: Appliance) => {
    setEditingAppliance(appliance);
    setEditDialogOpen(true);
  };

  const handleSaveAppliance = (updatedAppliance: Appliance) => {
    updateAppliance(updatedAppliance);
    setEditDialogOpen(false);
    setEditingAppliance(null);
  };

  const handleMassEdit = (updates: { ids: string[]; brand?: string; type?: string }) => {
    if (updates.brand || updates.type) {
      const updateData: Partial<Appliance> = {};
      if (updates.brand) updateData.brand = updates.brand;
      if (updates.type) updateData.type = updates.type;
      
      updateMultipleAppliances(updates.ids, updateData);
    }
  };

  const handleMergeDuplicates = (keepId: string, mergeIds: string[], mergedData: Partial<Appliance>) => {
    // Mettre à jour l'appareil conservé avec les nouvelles données
    const keepAppliance = allAppliances.find(a => a.id === keepId);
    if (keepAppliance) {
      updateAppliance({ ...keepAppliance, ...mergedData });
    }
    
    // Supprimer les appareils en doublon
    mergeIds.forEach(id => deleteAppliance(id));
  };

  if (!migrationReady) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1 container mx-auto py-8 px-4">
          <Card className="w-full">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Initialisation de la base de données...</span>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="mr-2 h-6 w-6" />
            Base de données
            {isLoading && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
          </h1>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowMassEdit(!showMassEdit)}
            >
              Édition en masse
            </Button>
            <Badge variant="outline">
              {enhancedSearch.length} appareils
            </Badge>
            {needsUpdateCount > 0 && (
              <Badge variant="destructive">
                {needsUpdateCount} à compléter
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recherche et filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchBar 
                    value={searchQuery} 
                    onChange={setSearchQuery}
                    placeholder="Rechercher par référence, marque, type ou référence de pièce..."
                    knownPartReferences={knownPartReferences}
                  />
                </div>
                <ColumnFilters
                  filters={columnFilters}
                  onFiltersChange={setColumnFilters}
                  knownBrands={knownBrands}
                  knownTypes={knownTypes}
                />
              </div>
              
              {importSessions.length > 0 && (
                <ImportSessionFilter
                  sessions={importSessions}
                  selectedSession={selectedSession}
                  onSessionChange={setSelectedSession}
                  showLastSessionOnly={showLastSessionOnly}
                  onToggleLastSession={() => setShowLastSessionOnly(!showLastSessionOnly)}
                />
              )}
            </CardContent>
          </Card>

          {/* Détection de doublons */}
          <DuplicateDetection 
            appliances={enhancedSearch} 
            onMergeDuplicates={handleMergeDuplicates}
            onUpdateAppliance={updateAppliance}
          />

          {/* Édition en masse */}
          {showMassEdit && (
            <MassEditForm
              appliances={enhancedSearch}
              onUpdateAppliances={handleMassEdit}
              knownBrands={knownBrands}
              knownTypes={knownTypes}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                Liste des appareils
                {isLoading && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    Chargement en cours...
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Chargement des appareils...</span>
                </div>
              ) : (
                <ApplianceList 
                  appliances={enhancedSearch} 
                  onEdit={handleEditAppliance}
                  onDelete={deleteAppliance}
                  knownPartReferences={knownPartReferences}
                  getPartReferencesForAppliance={getPartReferencesForAppliance}
                  associateAppliancesToPartReference={associateApplicancesToPartReference}
                  onRemoveAssociation={removeAppliancePartAssociation}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <ApplianceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        appliance={editingAppliance}
        onSave={handleSaveAppliance}
        knownBrands={knownBrands}
        knownTypes={knownTypes}
      />
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Appliances;
