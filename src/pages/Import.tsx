
import React from "react";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Import as ImportIcon } from "lucide-react";
import ImportForm from "@/components/ImportForm";
import { useAppliances } from "@/hooks/useAppliances";
import { toast } from "sonner";
import { Appliance } from "@/types/appliance";

const Import: React.FC = () => {
  const { 
    importAppliances, 
    knownBrands = [], // Provide default empty arrays
    knownTypes = [], 
    knownPartReferences = [],
    allAppliances = [],
    associateApplicancesToPartReference,
    suggestBrand,
    suggestType
  } = useAppliances();

  // Ensure we always have valid arrays even if the hook returns undefined
  const safeKnownBrands = Array.isArray(knownBrands) ? knownBrands : [];
  const safeKnownTypes = Array.isArray(knownTypes) ? knownTypes : [];
  const safeKnownPartReferences = Array.isArray(knownPartReferences) ? knownPartReferences : [];
  const safeAllAppliances = Array.isArray(allAppliances) ? allAppliances : [];

  const getApplianceByReference = (ref: string) => {
    return safeAllAppliances.find(a => a.reference === ref);
  };

  const handleImport = (appliancesToImport: Appliance[]): Appliance[] => {
    try {
      // Ensure we have a valid array to import
      const safeAppliancesToImport = Array.isArray(appliancesToImport) ? appliancesToImport : [];
      
      const count = importAppliances(safeAppliancesToImport);

      if (count === 0) {
        toast("Information", {
          description: "Aucun nouvel appareil à importer (références déjà présentes dans la base de données)"
        });
      }

      // Retournons les appareils importés pour pouvoir les associer à une référence par la suite
      return safeAppliancesToImport;
    } catch (error) {
      toast("Erreur d'importation", {
        description: "Une erreur est survenue lors de l'importation des données"
      });
      console.error("Import error:", error);
      return [];
    }
  };

  // Wrap the associateApplicancesToPartReference function to ensure it handles undefined properly
  const safeAssociateAppliancesToPartReference = (applianceIds: string[], partReference: string) => {
    if (!Array.isArray(applianceIds) || !partReference) {
      console.warn("Invalid parameters for associateApplicancesToPartReference");
      return 0;
    }
    return associateApplicancesToPartReference(applianceIds, partReference);
  };

  // Wrap the suggestBrand function to handle potential undefined
  const safeSuggestBrand = (reference: string): string | null => {
    if (!reference || typeof suggestBrand !== 'function') return null;
    return suggestBrand(reference);
  };

  // Wrap the suggestType function to handle potential undefined
  const safeSuggestType = (reference: string, brand: string): string | null => {
    if (!reference || !brand || typeof suggestType !== 'function') return null;
    return suggestType(reference, brand);
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
            knownBrands={safeKnownBrands} 
            knownTypes={safeKnownTypes}
            knownPartReferences={safeKnownPartReferences}
            getApplianceByReference={getApplianceByReference}
            suggestBrand={safeSuggestBrand}
            suggestType={safeSuggestType}
            associateAppliancesToPartReference={safeAssociateAppliancesToPartReference}
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
