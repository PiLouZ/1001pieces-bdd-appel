
import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import ApplianceForm from "@/components/ApplianceForm";
import ApplianceList from "@/components/ApplianceList";
import SearchBar from "@/components/SearchBar";
import ImportForm from "@/components/ImportForm";
import { useAppliances } from "@/hooks/useAppliances";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { 
    appliances, 
    searchQuery, 
    setSearchQuery, 
    addAppliance,
    importAppliances, 
    deleteAppliance, 
    knownBrands, 
    knownTypes,
    suggestBrand,
    suggestType
  } = useAppliances();
  const [activeTab, setActiveTab] = useState("list");
  const { toast } = useToast();

  // Handler pour l'importation
  const handleImport = (importedAppliances: any[]) => {
    const count = importAppliances(importedAppliances);
    if (count > 0) {
      toast({
        title: "Import réussi",
        description: `${count} nouveaux appareils ont été ajoutés à la base de données.`,
      });
      setActiveTab("list");
    } else {
      toast({
        title: "Attention",
        description: "Aucun nouvel appareil n'a été importé (références déjà existantes).",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Base de données des appareils électroménagers</h2>
          <p className="text-gray-600 mb-4">
            Cet outil vous permet de gérer une base de données d'appareils électroménagers.
            L'application suggérera automatiquement la marque et le type en fonction des références similaires déjà enregistrées.
          </p>
          <div className="w-full flex justify-end mb-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Tabs defaultValue="add">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="add" className="flex-1">Ajouter</TabsTrigger>
                <TabsTrigger value="import" className="flex-1" id="import">Importer</TabsTrigger>
              </TabsList>
              
              <TabsContent value="add">
                <ApplianceForm 
                  knownBrands={knownBrands}
                  knownTypes={knownTypes}
                  onSubmit={addAppliance}
                  suggestBrand={suggestBrand}
                  suggestType={suggestType}
                />
              </TabsContent>
              
              <TabsContent value="import">
                <ImportForm onImport={handleImport} />
              </TabsContent>
            </Tabs>
            
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">Total appareils</p>
                    <p className="text-2xl font-bold">{appliances.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-700">Marques</p>
                    <p className="text-2xl font-bold">{knownBrands.length}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-md">
                    <p className="text-sm text-purple-700">Types</p>
                    <p className="text-2xl font-bold">{knownTypes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="list">Liste</TabsTrigger>
                <TabsTrigger value="info" id="help">Informations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                <ApplianceList appliances={appliances} onDelete={deleteAppliance} />
              </TabsContent>
              
              <TabsContent value="info">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">À propos de l'application</h3>
                    <p className="mb-4">
                      Cette application a été conçue pour faciliter la gestion et le suivi des appareils électroménagers.
                      Elle offre des fonctionnalités intelligentes de suggestion basées sur les données existantes.
                    </p>
                    <h4 className="font-medium mb-2">Comment ça fonctionne</h4>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                      <li>Ajoutez un nouvel appareil en remplissant le formulaire</li>
                      <li>Importez des données par copier-coller de tableaux ou fichiers PDF</li>
                      <li>L'application suggérera automatiquement la marque et le type basés sur les références similaires</li>
                      <li>Recherchez et filtrez les appareils existants</li>
                      <li>Toutes les données sont stockées localement dans votre navigateur</li>
                    </ul>
                    <h4 className="font-medium mb-2">Fonctionnalités</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Suggestions intelligentes basées sur les données existantes</li>
                      <li>Autocomplétion pour les marques et types</li>
                      <li>Import de données par copier-coller</li>
                      <li>Import de données depuis des fichiers PDF (bientôt)</li>
                      <li>Recherche par référence, marque ou type</li>
                      <li>Stockage local des données</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <footer className="mt-10 p-4 bg-gray-200 text-center text-gray-600">
        <p>&copy; 2023 Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Index;
