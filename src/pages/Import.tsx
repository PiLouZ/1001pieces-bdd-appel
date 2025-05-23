
import React from "react";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Import as ImportIcon } from "lucide-react";
import ImportForm from "@/components/ImportForm";
import { useAppliances } from "@/hooks/useAppliances";
import { toast } from "sonner";

const Import: React.FC = () => {
  const { 
    importAppliances, 
    knownBrands, 
    knownTypes, 
    knownPartReferences,
    allAppliances,
    associateApplicancesToPartReference,
    suggestBrand,
    suggestType
  } = useAppliances();

  const getApplianceByReference = (ref: string) => {
    return allAppliances.find(a => a.reference === ref);
  };

  const handleImport = (appliancesToImport: any) => {
    try {
      const count = importAppliances(appliancesToImport);

      if (count === 0) {
        toast("Information", {
          description: "Aucun nouvel appareil à importer (références déjà présentes dans la base de données)"
        });
      }

      // Retournons les appareils importés pour pouvoir les associer à une référence par la suite
      return appliancesToImport;
    } catch (error) {
      toast("Erreur d'importation", {
        description: "Une erreur est survenue lors de l'importation des données"
      });
      console.error("Import error:", error);
      return [];
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <ImportIcon className="mr-2 h-6 w-6" />
          Importer des appareils
        </h1>
        
        <div className="grid grid-cols-1 gap-6">
          <ImportForm 
            onImport={handleImport} 
            knownBrands={knownBrands} 
            knownTypes={knownTypes}
            knownPartReferences={knownPartReferences}
            getApplianceByReference={getApplianceByReference}
            suggestBrand={suggestBrand}
            suggestType={suggestType}
            associateAppliancesToPartReference={associateApplicancesToPartReference}
          />
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Import;
