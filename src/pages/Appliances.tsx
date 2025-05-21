
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import ApplianceList from "@/components/ApplianceList";
import SearchBar from "@/components/SearchBar";
import { useAppliances } from "@/hooks/useAppliances";
import { Database, FileText, Filter } from "lucide-react";
import { ApplianceSelection } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Appliances: React.FC = () => {
  const { 
    appliances, 
    searchQuery, 
    setSearchQuery, 
    deleteAppliance,
    updateAppliance,
    updateMultipleAppliances,
    appliancesNeedingUpdate,
    needsUpdateCount,
    knownPartReferences
  } = useAppliances();
  
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceSelection>({});
  const [showNeedingUpdate, setShowNeedingUpdate] = useState(false);
  const { toast } = useToast();

  const displayedAppliances = showNeedingUpdate ? appliancesNeedingUpdate : appliances;
  const selectedCount = Object.values(selectedAppliances).filter(Boolean).length;
  
  const handleSelectAppliance = (id: string, selected: boolean) => {
    setSelectedAppliances(prev => ({
      ...prev,
      [id]: selected
    }));
  };
  
  const handleSelectAll = (selected: boolean) => {
    const newSelection: ApplianceSelection = {};
    displayedAppliances.forEach(app => {
      newSelection[app.id] = selected;
    });
    setSelectedAppliances(newSelection);
  };
  
  const handleBulkUpdate = (field: keyof Omit<Partial<{
    brand: string;
    type: string;
  }>, "id">, value: string) => {
    const selectedIds = Object.entries(selectedAppliances)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);
    
    if (selectedIds.length === 0) {
      toast({
        title: "Aucun appareil sélectionné",
        description: "Veuillez sélectionner au moins un appareil à modifier.",
        variant: "destructive",
      });
      return;
    }
    
    const updateCount = updateMultipleAppliances(selectedIds, { [field]: value });
    
    toast({
      title: "Mise à jour effectuée",
      description: `${updateCount} appareils ont été mis à jour.`,
    });
    
    // Réinitialiser les sélections
    setSelectedAppliances({});
  };
  
  const toggleUpdateFilter = () => {
    setShowNeedingUpdate(!showNeedingUpdate);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="mr-2 h-6 w-6" />
            Tous les appareils
          </h1>
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder={knownPartReferences.length > 0 
              ? "Rechercher par référence, marque, type ou référence de pièce..." 
              : "Rechercher par référence, marque ou type..."}
          />
        </div>
        
        <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant={showNeedingUpdate ? "default" : "outline"} 
              size="sm"
              onClick={toggleUpdateFilter}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Besoins de mise à jour
              {needsUpdateCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {needsUpdateCount}
                </Badge>
              )}
            </Button>
          </div>
          
          {selectedCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm">{selectedCount} appareils sélectionnés</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleSelectAll(false)}
              >
                Désélectionner tout
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Appareils {showNeedingUpdate ? "à mettre à jour" : "enregistrés"} ({displayedAppliances.length})</span>
                <div className="text-sm text-muted-foreground font-normal">
                  <span className="inline-flex items-center">
                    <FileText className="mr-1 h-4 w-4" />
                    Double-cliquez sur une cellule pour la modifier directement
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApplianceList 
                appliances={displayedAppliances} 
                onDelete={deleteAppliance} 
                onEdit={updateAppliance}
                onSelect={handleSelectAppliance}
                selected={selectedAppliances}
                onSelectAll={handleSelectAll}
                onBulkUpdate={handleBulkUpdate}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Appliances;
