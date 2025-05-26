
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
      
      console.log("Import demandé:", { appliancesToImport: safeAppliancesToImport, partReference });
      
      // Importer les nouveaux appareils
      const importedCount = importAppliances(safeAppliancesToImport);
      console.log("Nombre d'appareils nouvellement importés:", importedCount);
      
      // Si une référence de pièce est fournie, associer TOUS les appareils (nouveaux ET existants)
      if (partReference && partReference.trim()) {
        console.log("Association à la référence de pièce:", partReference);
        
        // Récupérer les IDs de tous les appareils mentionnés dans l'import
        const allApplianceIds: string[] = [];
        
        safeAppliancesToImport.forEach(importedAppliance => {
          console.log("Traitement de l'appareil importé:", importedAppliance.reference);
          
          // Chercher l'appareil existant par référence dans la base actuelle
          const existingAppliance = getApplianceByReference(importedAppliance.reference);
          
          if (existingAppliance) {
            // Appareil existant - utiliser son ID
            allApplianceIds.push(existingAppliance.id);
            console.log("Appareil existant trouvé:", {
              reference: importedAppliance.reference,
              existingId: existingAppliance.id
            });
          } else {
            // Nouvel appareil - utiliser l'ID de l'appareil importé
            allApplianceIds.push(importedAppliance.id);
            console.log("Nouvel appareil:", {
              reference: importedAppliance.reference,
              newId: importedAppliance.id
            });
          }
        });
        
        console.log("IDs finaux à associer:", allApplianceIds);
        console.log("Nombre total d'appareils à associer:", allApplianceIds.length);
        
        // Associer tous ces appareils à la référence de pièce
        if (allApplianceIds.length > 0) {
          const associatedCount = associateApplicancesToPartReference(allApplianceIds, partReference);
          console.log("Nombre d'associations créées:", associatedCount);
          
          if (importedCount === 0) {
            toast(`Aucun nouvel appareil importé, mais ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
          } else {
            toast(`${importedCount} nouveaux appareils importés et ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
          }
        } else {
          console.warn("Aucun appareil à associer trouvé");
          toast("Erreur: Aucun appareil trouvé pour l'association");
        }
      } else {
        if (importedCount === 0) {
          toast("Aucun nouvel appareil à importer (références déjà présentes dans la base de données)");
        } else {
          toast(`${importedCount} nouveaux appareils importés avec succès`);
        }
      }

      return safeAppliancesToImport;
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      toast("Une erreur est survenue lors de l'importation des données");
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
