
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
      
      // Étape 1: Importer les nouveaux appareils et récupérer le nombre importé
      const importedCount = importAppliances(safeAppliancesToImport);
      console.log("Nombre d'appareils nouvellement importés:", importedCount);
      
      // Étape 2: Si une référence de pièce est fournie, créer les associations
      if (partReference && partReference.trim()) {
        console.log("=== ÉTAPE 2: CRÉATION DES ASSOCIATIONS ===");
        console.log("Référence de pièce:", partReference);
        
        // Pour les appareils existants, on peut les associer directement
        const existingApplianceIds: string[] = [];
        const newApplianceReferences: string[] = [];
        
        safeAppliancesToImport.forEach(importApp => {
          const existingAppliance = safeAllAppliances.find(a => a.reference === importApp.reference);
          if (existingAppliance) {
            existingApplianceIds.push(existingAppliance.id);
            console.log(`✓ Appareil existant trouvé: ${importApp.reference} -> ID: ${existingAppliance.id}`);
          } else {
            newApplianceReferences.push(importApp.reference);
            console.log(`→ Nouvel appareil à associer: ${importApp.reference}`);
          }
        });
        
        // Associer les appareils existants immédiatement
        let associatedCount = 0;
        if (existingApplianceIds.length > 0) {
          associatedCount += associateApplicancesToPartReference(existingApplianceIds, partReference);
          console.log("Appareils existants associés:", associatedCount);
        }
        
        // Pour les nouveaux appareils, utiliser un délai plus long et plusieurs tentatives
        if (newApplianceReferences.length > 0) {
          let attempts = 0;
          const maxAttempts = 10;
          const attemptInterval = 200; // 200ms entre chaque tentative
          
          const tryAssociateNewAppliances = () => {
            attempts++;
            console.log(`=== TENTATIVE ${attempts}/${maxAttempts} D'ASSOCIATION DES NOUVEAUX APPAREILS ===`);
            
            // Récupérer l'état actuel de la base (peut être mis à jour depuis la dernière fois)
            const currentAppliances = safeAllAppliances;
            console.log("État actuel de la base:", currentAppliances.length, "appareils");
            
            const newApplianceIds: string[] = [];
            const stillMissingReferences: string[] = [];
            
            newApplianceReferences.forEach(ref => {
              const foundAppliance = currentAppliances.find(a => a.reference === ref);
              if (foundAppliance) {
                newApplianceIds.push(foundAppliance.id);
                console.log(`✓ Nouvel appareil trouvé: ${ref} -> ID: ${foundAppliance.id}`);
              } else {
                stillMissingReferences.push(ref);
                console.log(`✗ Nouvel appareil non trouvé: ${ref}`);
              }
            });
            
            // Associer les nouveaux appareils trouvés
            if (newApplianceIds.length > 0) {
              const newAssociationsCount = associateApplicancesToPartReference(newApplianceIds, partReference);
              associatedCount += newAssociationsCount;
              console.log("Nouveaux appareils associés:", newAssociationsCount);
            }
            
            // Si tous les appareils sont trouvés ou si on a atteint le max de tentatives
            if (stillMissingReferences.length === 0 || attempts >= maxAttempts) {
              console.log("=== FIN PROCESSUS D'ASSOCIATION ===");
              console.log("Total d'appareils associés:", associatedCount);
              console.log("Appareils encore manquants:", stillMissingReferences);
              
              // Messages finaux
              if (importedCount === 0 && associatedCount > 0) {
                toast(`Aucun nouvel appareil importé, mais ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
              } else if (importedCount > 0 && associatedCount > 0) {
                toast(`${importedCount} nouveaux appareils importés et ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
              } else if (importedCount > 0 && associatedCount === 0) {
                toast(`${importedCount} nouveaux appareils importés, mais aucune association créée`);
              } else {
                toast("Erreur: Impossible de créer les associations");
              }
              
              return;
            }
            
            // Programmer la prochaine tentative
            setTimeout(tryAssociateNewAppliances, attemptInterval);
          };
          
          // Commencer les tentatives d'association après un délai initial
          setTimeout(tryAssociateNewAppliances, attemptInterval);
        } else {
          // Pas de nouveaux appareils, juste des existants
          if (importedCount === 0 && associatedCount > 0) {
            toast(`Aucun nouvel appareil importé, mais ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
          } else if (importedCount > 0 && associatedCount > 0) {
            toast(`${importedCount} nouveaux appareils importés et ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
          } else {
            toast("Erreur: Impossible de créer les associations");
          }
        }
      } else {
        // Pas de référence de pièce, juste un import
        if (importedCount === 0) {
          toast("Aucun nouvel appareil à importer (références déjà présentes dans la base de données)");
        } else {
          toast(`${importedCount} nouveaux appareils importés avec succès`);
        }
      }
      
      console.log("=== FIN PROCESSUS IMPORT ===");
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
