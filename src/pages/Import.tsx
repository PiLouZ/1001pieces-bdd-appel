
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
    knownBrands = [], 
    knownTypes = [], 
    knownPartReferences = [],
    allAppliances = [],
    associateApplicancesToPartReference,
    suggestBrand,
    suggestType
  } = useAppliances();

  const safeKnownBrands = Array.isArray(knownBrands) ? knownBrands : [];
  const safeKnownTypes = Array.isArray(knownTypes) ? knownTypes : [];
  const safeKnownPartReferences = Array.isArray(knownPartReferences) ? knownPartReferences : [];
  const safeAllAppliances = Array.isArray(allAppliances) ? allAppliances : [];

  const getApplianceByReference = (ref: string) => {
    return safeAllAppliances.find(a => a.reference === ref);
  };

  const handleImport = (appliancesToImport: Appliance[], partReference?: string): Appliance[] => {
    try {
      const safeAppliancesToImport = Array.isArray(appliancesToImport) ? appliancesToImport : [];
      
      const count = importAppliances(safeAppliancesToImport);

      // Si une référence de pièce est fournie, associer TOUS les appareils (nouveaux ET existants)
      if (partReference && partReference.trim()) {
        // Récupérer les IDs de tous les appareils (nouveaux et existants)
        const allApplianceIds = safeAppliancesToImport.map(appliance => {
          const existingAppliance = getApplianceByReference(appliance.reference);
          return existingAppliance ? existingAppliance.id : appliance.id;
        });
        
        // Associer tous ces appareils à la référence de pièce
        const associatedCount = associateApplicancesToPartReference(allApplianceIds, partReference);
        
        if (count === 0) {
          toast(`Aucun nouvel appareil importé, mais ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
        } else {
          toast(`${count} nouveaux appareils importés et ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
        }
      } else {
        if (count === 0) {
          toast("Aucun nouvel appareil à importer (références déjà présentes dans la base de données)");
        } else {
          toast(`${count} nouveaux appareils importés avec succès`);
        }
      }

      return safeAppliancesToImport;
    } catch (error) {
      toast("Une erreur est survenue lors de l'importation des données");
      console.error("Import error:", error);
      return [];
    }
  };

  const safeAssociateAppliancesToPartReference = (applianceIds: string[], partReference: string) => {
    if (!Array.isArray(applianceIds) || !partReference) {
      console.warn("Invalid parameters for associateApplicancesToPartReference");
      return 0;
    }
    return associateApplicancesToPartReference(applianceIds, partReference);
  };

  const safeSuggestBrand = (reference: string): string | null => {
    if (!reference || typeof suggestBrand !== 'function') return null;
    return suggestBrand(reference);
  };

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
