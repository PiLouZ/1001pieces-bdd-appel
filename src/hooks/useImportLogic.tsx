
import { useState, useCallback } from "react";
import { Appliance } from "@/types/appliance";
import { toast } from "sonner";

interface UseImportLogicProps {
  importAppliances: (appliances: Appliance[]) => number;
  associateApplicancesToPartReference: (applianceIds: string[], partReference: string) => number;
  getAllAppliances: () => Appliance[];
}

export const useImportLogic = ({
  importAppliances,
  associateApplicancesToPartReference,
  getAllAppliances
}: UseImportLogicProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = useCallback((appliancesToImport: Appliance[], partReference?: string): Appliance[] => {
    if (isProcessing) {
      console.log("Import already in progress, ignoring request");
      return [];
    }

    setIsProcessing(true);
    
    try {
      const safeAppliancesToImport = Array.isArray(appliancesToImport) ? appliancesToImport : [];
      
      console.log("=== NOUVELLE APPROCHE IMPORT COMPLET ===");
      console.log("Appareils à importer:", safeAppliancesToImport.length);
      console.log("Détail des appareils:", safeAppliancesToImport.map(a => ({ ref: a.reference, brand: a.brand, type: a.type })));
      console.log("Référence de pièce:", partReference);
      
      // Obtenir l'état actuel AVANT import
      const currentAppliances = getAllAppliances();
      console.log("État de la base AVANT import:", currentAppliances.length, "appareils");
      
      // Collecter les références à associer (existantes et nouvelles)
      const referencesToAssociate: string[] = [];
      const newAppliances: Appliance[] = [];
      
      safeAppliancesToImport.forEach(importApp => {
        const existingAppliance = currentAppliances.find(a => a.reference === importApp.reference);
        if (existingAppliance) {
          referencesToAssociate.push(importApp.reference);
          console.log(`✓ Appareil existant: ${importApp.reference} -> sera associé`);
        } else {
          newAppliances.push(importApp);
          referencesToAssociate.push(importApp.reference);
          console.log(`→ Nouvel appareil: ${importApp.reference} -> sera importé puis associé`);
        }
      });
      
      console.log("Références à associer au total:", referencesToAssociate);
      console.log("Nouveaux appareils à importer:", newAppliances.length);
      
      // Étape 1: Importer les nouveaux appareils
      const importedCount = importAppliances(newAppliances);
      console.log("Nombre d'appareils nouvellement importés:", importedCount);
      
      // Étape 2: Si une référence de pièce est fournie, procéder aux associations
      if (partReference && partReference.trim() && referencesToAssociate.length > 0) {
        console.log("=== ASSOCIATIONS PAR RÉFÉRENCES ===");
        console.log("Référence de pièce:", partReference);
        console.log("Références d'appareils à associer:", referencesToAssociate);
        
        // Fonction pour effectuer les associations en utilisant les références
        const performAssociations = () => {
          const freshAppliances = getAllAppliances();
          console.log("État actuel de la base pour associations:", freshAppliances.length, "appareils");
          
          const applianceIdsToAssociate: string[] = [];
          const missingReferences: string[] = [];
          
          referencesToAssociate.forEach(ref => {
            const appliance = freshAppliances.find(a => a.reference === ref);
            if (appliance) {
              applianceIdsToAssociate.push(appliance.id);
              console.log(`✓ Référence ${ref} trouvée -> ID: ${appliance.id}`);
            } else {
              missingReferences.push(ref);
              console.log(`✗ Référence ${ref} non trouvée`);
            }
          });
          
          console.log("IDs finaux pour association:", applianceIdsToAssociate);
          console.log("Références manquantes:", missingReferences);
          
          if (applianceIdsToAssociate.length > 0) {
            const associatedCount = associateApplicancesToPartReference(applianceIdsToAssociate, partReference);
            console.log("Appareils associés:", associatedCount);
            
            // Messages de résultat
            if (importedCount === 0 && associatedCount > 0) {
              toast(`Aucun nouvel appareil importé, mais ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
            } else if (importedCount > 0 && associatedCount > 0) {
              toast(`${importedCount} nouveaux appareils importés et ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
            } else if (importedCount > 0 && associatedCount === 0) {
              toast(`${importedCount} nouveaux appareils importés, mais aucune association créée`);
            } else {
              toast("Erreur: Impossible de créer les associations");
            }
          } else {
            console.error("Aucun appareil trouvé pour l'association");
            if (importedCount > 0) {
              toast(`${importedCount} nouveaux appareils importés, mais aucune association créée (appareils non trouvés)`);
            } else {
              toast("Erreur: Aucun appareil trouvé pour l'association");
            }
          }
          
          setIsProcessing(false);
        };
        
        // Si nous avons importé de nouveaux appareils, attendre qu'ils soient disponibles
        if (importedCount > 0) {
          console.log("Attente de synchronisation des nouveaux appareils...");
          let attempts = 0;
          const maxAttempts = 10;
          
          const checkAndAssociate = () => {
            attempts++;
            console.log(`=== TENTATIVE ${attempts}/${maxAttempts} ===`);
            
            const currentAppliances = getAllAppliances();
            const allFound = referencesToAssociate.every(ref => 
              currentAppliances.some(a => a.reference === ref)
            );
            
            if (allFound || attempts >= maxAttempts) {
              console.log("Tous les appareils sont disponibles ou max tentatives atteint");
              performAssociations();
            } else {
              console.log("Certains appareils manquent encore, nouvelle tentative...");
              setTimeout(checkAndAssociate, 200);
            }
          };
          
          setTimeout(checkAndAssociate, 200);
        } else {
          // Pas de nouveaux appareils, association immédiate
          performAssociations();
        }
      } else {
        // Pas de référence de pièce, juste un import
        if (importedCount === 0) {
          toast("Aucun nouvel appareil à importer (références déjà présentes dans la base de données)");
        } else {
          toast(`${importedCount} nouveaux appareils importés avec succès`);
        }
        setIsProcessing(false);
      }
      
      console.log("=== FIN NOUVELLE APPROCHE IMPORT ===");
      return safeAppliancesToImport;
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      toast("Une erreur est survenue lors de l'importation des données");
      setIsProcessing(false);
      return [];
    }
  }, [importAppliances, associateApplicancesToPartReference, getAllAppliances, isProcessing]);

  return {
    handleImport,
    isProcessing
  };
};
