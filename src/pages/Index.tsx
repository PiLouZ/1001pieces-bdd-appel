
import React from "react";
import Navigation from "@/components/Navigation";
import { Settings, Import as ImportIcon, FileDown, Database, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppliances } from "@/hooks/useAppliances";
import { Link } from "react-router-dom";

const Index: React.FC = () => {
  const { appliances, needsUpdateCount, knownPartReferences, appliancesWithMostPartRefs } = useAppliances();

  const applianceCount = appliances?.length || 0;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestionnaire d'Appareils Électroménagers</h1>
            <p className="mt-2 text-gray-600">
              Gérez facilement vos appareils et leurs compatibilités
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-end">
            <Link to="/import">
              <Button variant="outline" className="flex items-center gap-2">
                <ImportIcon className="h-4 w-4" />
                Importer
              </Button>
            </Link>
            <Link to="/export">
              <Button variant="outline" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Exporter
              </Button>
            </Link>
            <Link to="/help">
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link to="/appliances">
            <Card className="hover:bg-slate-50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-primary" />
                  Base de données
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applianceCount}</div>
                <p className="text-sm text-muted-foreground">
                  Appareils enregistrés
                </p>
                {needsUpdateCount > 0 && (
                  <div className="mt-2 text-sm bg-amber-50 text-amber-800 px-2 py-1 rounded-sm">
                    {needsUpdateCount} appareil(s) incomplets
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/export">
            <Card className="hover:bg-slate-50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Compatibilités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{knownPartReferences.length}</div>
                <p className="text-sm text-muted-foreground">
                  Références de pièces
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/help">
            <Card className="hover:bg-slate-50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5 text-primary" />
                  Aide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Guide d'utilisation et assistance
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        {appliancesWithMostPartRefs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">
              Appareils les plus compatibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {appliancesWithMostPartRefs.slice(0, 6).map(app => (
                <Link to="/appliances" key={app.id}>
                  <Card className="hover:bg-slate-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="font-medium">{app.brand} {app.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {app.reference}
                        {app.commercialRef && ` - ${app.commercialRef}`}
                      </div>
                      <div className="mt-2 text-xs text-primary">
                        Compatible avec {(app as any).partRefCount} pièce(s)
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Index;
