
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
      
      console.log("=== DÉBUT PROCESSUS IMPORT COMPLET ===");
      console.log("Appareils à importer:", safeAppliancesToImport.length);
      console.log("Détail des appareils:", safeAppliancesToImport.map(a => ({ ref: a.reference, brand: a.brand, type: a.type })));
      console.log("Référence de pièce:", partReference);
      console.log("État de la base AVANT import:", safeAllAppliances.length, "appareils");
      
      // Étape 1: Importer les nouveaux appareils
      const importedCount = importAppliances(safeAppliancesToImport);
      console.log("Nombre d'appareils nouvellement importés:", importedCount);
      
      // Étape 2: Attendre que les changements soient propagés et récupérer les IDs
      // On utilise un setTimeout pour laisser le temps au state de se mettre à jour
      setTimeout(() => {
        console.log("=== ÉTAPE 2: RÉCUPÉRATION DES IDS ===");
        console.log("État de la base APRÈS import:", safeAllAppliances.length, "appareils");
        
        const applianceIds: string[] = [];
        const notFoundAppliances: string[] = [];
        
        safeAppliancesToImport.forEach(importApp => {
          const foundAppliance = safeAllAppliances.find(a => a.reference === importApp.reference);
          if (foundAppliance) {
            applianceIds.push(foundAppliance.id);
            console.log(`✓ Appareil trouvé: ${importApp.reference} -> ID: ${foundAppliance.id}`);
          } else {
            notFoundAppliances.push(importApp.reference);
            console.error(`✗ ERREUR: Appareil non trouvé: ${importApp.reference}`);
          }
        });
        
        console.log("IDs collectés:", applianceIds);
        console.log("Appareils non trouvés:", notFoundAppliances);
        
        // Étape 3: Créer les associations si une référence de pièce est fournie
        if (partReference && partReference.trim() && applianceIds.length > 0) {
          console.log("=== ÉTAPE 3: CRÉATION DES ASSOCIATIONS ===");
          console.log("Référence de pièce:", partReference);
          console.log("IDs à associer:", applianceIds);
          
          const associatedCount = associateApplicancesToPartReference(applianceIds, partReference);
          console.log("Résultat des associations:", associatedCount);
          
          // Messages de retour utilisateur
          if (associatedCount > 0) {
            if (importedCount === 0) {
              toast(`Aucun nouvel appareil importé, mais ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
            } else {
              toast(`${importedCount} nouveaux appareils importés et ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
            }
          } else {
            console.error("ERREUR: Aucune association créée");
            toast("Erreur: Impossible de créer les associations avec la référence de pièce");
          }
        } else if (partReference && applianceIds.length === 0) {
          console.error("ERREUR: Aucun appareil trouvé pour l'association");
          toast("Erreur: Aucun appareil trouvé pour l'association");
        } else {
          // Pas de référence de pièce, juste un import
          if (importedCount === 0) {
            toast("Aucun nouvel appareil à importer (références déjà présentes dans la base de données)");
          } else {
            toast(`${importedCount} nouveaux appareils importés avec succès`);
          }
        }
        
        console.log("=== FIN PROCESSUS COMPLET ===");
      }, 100); // Délai de 100ms pour laisser le state se mettre à jour
      
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
