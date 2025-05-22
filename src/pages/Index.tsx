
import React from "react";
import Navigation from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import { useAppliances } from "@/hooks/useAppliances";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, Database, FileText, Import, Export, Settings, Info, Plus, Wrench } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { 
    appliances, 
    searchQuery, 
    setSearchQuery,
    knownBrands, 
    knownTypes,
    knownPartReferences,
    recentAppliances,
    appliancesWithMostPartRefs,
    getPartReferencesForAppliance
  } = useAppliances();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Tableau de bord</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <p className="text-gray-600">
              Bienvenue dans votre gestionnaire d'appareils électroménagers.
            </p>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total appareils</p>
                  <h3 className="text-3xl font-bold">{appliances.length}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Marques</p>
                  <h3 className="text-3xl font-bold">{knownBrands.length}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Types d'appareils</p>
                  <h3 className="text-3xl font-bold">{knownTypes.length}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pièces compatibles</p>
                  <h3 className="text-3xl font-bold">{knownPartReferences.length}</h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Accès rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Link to="/appliances" className="w-full h-full flex flex-col items-center">
                <Database className="h-10 w-10 text-blue-600 mb-2" />
                <h3 className="font-medium text-center">Gérer les appareils</h3>
                <p className="text-sm text-gray-500 text-center">Afficher, modifier, supprimer</p>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 hover:bg-green-100 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Link to="/import" className="w-full h-full flex flex-col items-center">
                <Import className="h-10 w-10 text-green-600 mb-2" />
                <h3 className="font-medium text-center">Importer des appareils</h3>
                <p className="text-sm text-gray-500 text-center">Clipboard, PDF, Excel</p>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Link to="/export" className="w-full h-full flex flex-col items-center">
                <Export className="h-10 w-10 text-purple-600 mb-2" />
                <h3 className="font-medium text-center">Exporter les données</h3>
                <p className="text-sm text-gray-500 text-center">CSV, HTML</p>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Link to="/help" className="w-full h-full flex flex-col items-center">
                <Info className="h-10 w-10 text-amber-600 mb-2" />
                <h3 className="font-medium text-center">Aide et informations</h3>
                <p className="text-sm text-gray-500 text-center">Documentation, tutoriels</p>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Données récentes et maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Tabs defaultValue="recent">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Appareils</CardTitle>
                  <TabsList>
                    <TabsTrigger value="recent">Les plus récents</TabsTrigger>
                    <TabsTrigger value="compatible">Les plus compatibles</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <TabsContent value="recent">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Marque</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date d'ajout</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentAppliances.slice(0, 5).map((appliance) => (
                          <TableRow key={appliance.id}>
                            <TableCell className="font-medium">{appliance.reference}</TableCell>
                            <TableCell>{appliance.brand}</TableCell>
                            <TableCell>{appliance.type}</TableCell>
                            <TableCell>{new Date(appliance.dateAdded).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                        {recentAppliances.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              Aucun appareil trouvé
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {recentAppliances.length > 5 && (
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" asChild>
                        <Link to="/appliances">Voir tous les appareils</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="compatible">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Marque</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Références compatibles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appliancesWithMostPartRefs.slice(0, 5).map((appliance) => {
                          const partRefs = getPartReferencesForAppliance(appliance.id);
                          return (
                            <TableRow key={appliance.id}>
                              <TableCell className="font-medium">{appliance.reference}</TableCell>
                              <TableCell>{appliance.brand}</TableCell>
                              <TableCell>{appliance.type}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {partRefs.slice(0, 3).map((ref) => (
                                    <Badge key={ref} variant="secondary">{ref}</Badge>
                                  ))}
                                  {partRefs.length > 3 && (
                                    <Badge variant="outline">+{partRefs.length - 3}</Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {appliancesWithMostPartRefs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              Aucun appareil avec des pièces compatibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {appliancesWithMostPartRefs.length > 5 && (
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" asChild>
                        <Link to="/appliances">Voir tous les appareils</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="mr-2 h-5 w-5" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  Outils d'administration et de maintenance de la base de données.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" asChild>
                  <Link to="/appliances" className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un nouvel appareil
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/import" className="flex items-center">
                    <Import className="mr-2 h-4 w-4" />
                    Importer des données
                  </Link>
                </Button>
                <Link to="/appliances" className="mt-4">
                  <Button variant="destructive" className="w-full">
                    Vider la base de données
                  </Button>
                </Link>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500">
              Utilisez ces outils avec précaution.
            </CardFooter>
          </Card>
        </div>
        
        {/* À propos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              À propos de l'application
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <li>Associez des références techniques à plusieurs références de pièces</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      
      <footer className="mt-10 p-4 bg-gray-200 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Index;
