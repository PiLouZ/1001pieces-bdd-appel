
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import ApplianceList from "@/components/ApplianceList";
import SearchBar from "@/components/SearchBar";
import { useAppliances } from "@/hooks/useAppliances";
import { Database, FileExport } from "lucide-react";

const Appliances: React.FC = () => {
  const { 
    appliances, 
    searchQuery, 
    setSearchQuery, 
    deleteAppliance,
    updateAppliance
  } = useAppliances();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="mr-2 h-6 w-6" />
            Tous les appareils
          </h1>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Appareils enregistrés ({appliances.length})</span>
                <div className="text-sm text-muted-foreground font-normal">
                  <span className="inline-flex items-center">
                    <FileExport className="mr-1 h-4 w-4" />
                    Pour exporter des données, rendez-vous sur la page Export
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApplianceList 
                appliances={appliances} 
                onDelete={deleteAppliance} 
                onEdit={updateAppliance}
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
