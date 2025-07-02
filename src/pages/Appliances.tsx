
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
    removeAppliancePartAssociation
  } = useAppliances();

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showLastSessionOnly, setShowLastSessionOnly] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

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

  // Améliorer la recherche pour inclure les pièces détachées
  const enhancedSearch = useMemo(() => {
    if (!searchQuery) return filteredBySession;
    
    // Vérifier si la recherche correspond à une référence de pièce
    if (knownPartReferences.includes(searchQuery)) {
      const appliancesForPart = getAppliancesByPartReference(searchQuery);
      return appliancesForPart.filter(app => 
        filteredBySession.some(filteredApp => filteredApp.id === app.id)
      );
    }
    
    // Recherche standard
    return filteredBySession.filter(appliance =>
      appliance.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appliance.commercialRef && appliance.commercialRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      appliance.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appliance.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, filteredBySession, knownPartReferences, getAppliancesByPartReference]);

  const handleEditAppliance = (appliance: Appliance) => {
    setEditingAppliance(appliance);
    setEditDialogOpen(true);
  };

  const handleSaveAppliance = (updatedAppliance: Appliance) => {
    updateAppliance(updatedAppliance);
    setEditDialogOpen(false);
    setEditingAppliance(null);
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
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
                placeholder="Rechercher par référence, marque, type ou référence de pièce..."
                knownPartReferences={knownPartReferences}
              />
              
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
