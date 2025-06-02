
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
      
      console.log("=== IMPORT ET ASSOCIATION SIMPLIFIÉS ===");
      console.log("Appareils à importer:", safeAppliancesToImport.length);
      console.log("Références:", safeAppliancesToImport.map(a => a.reference));
      console.log("Référence de pièce:", partReference);
      
      // Étape 1: Identifier les nouveaux appareils
      const currentAppliances = getAllAppliances();
      const existingRefs = new Set(currentAppliances.map(a => a.reference));
      const newAppliances = safeAppliancesToImport.filter(app => !existingRefs.has(app.reference));
      
      console.log("Appareils existants:", existingRefs.size);
      console.log("Nouveaux appareils à importer:", newAppliances.length);
      
      // Étape 2: Importer les nouveaux appareils
      const importedCount = importAppliances(newAppliances);
      console.log("Appareils importés:", importedCount);
      
      // Étape 3: Si une référence de pièce est fournie, procéder aux associations
      if (partReference && partReference.trim()) {
        console.log("=== DÉBUT ASSOCIATIONS ===");
        
        // Attendre que les nouveaux appareils soient disponibles dans la base
        const performAssociations = () => {
          const freshAppliances = getAllAppliances();
          console.log("Base mise à jour, appareils disponibles:", freshAppliances.length);
          
          // Résoudre les IDs réels pour toutes les références d'appareils
          const referencesToAssociate = safeAppliancesToImport.map(app => app.reference);
          const realIds: string[] = [];
          
          referencesToAssociate.forEach(ref => {
            const appliance = freshAppliances.find(a => a.reference === ref);
            if (appliance) {
              realIds.push(appliance.id);
              console.log(`✓ Référence ${ref} -> ID réel: ${appliance.id}`);
            } else {
              console.error(`✗ Référence ${ref} non trouvée dans la base`);
            }
          });
          
          console.log("IDs réels pour association:", realIds);
          
          if (realIds.length > 0) {
            const associatedCount = associateApplicancesToPartReference(realIds, partReference);
            console.log("Appareils associés:", associatedCount);
            
            if (associatedCount > 0) {
              if (importedCount === 0) {
                toast(`${associatedCount} appareils existants associés à la référence de pièce ${partReference}`);
              } else {
                toast(`${importedCount} nouveaux appareils importés et ${associatedCount} appareils associés à la référence de pièce ${partReference}`);
              }
            } else {
              toast("Erreur lors de l'association des appareils");
            }
          } else {
            toast("Erreur: Aucun appareil trouvé pour l'association");
          }
          
          setIsProcessing(false);
        };
        
        // Si on a importé de nouveaux appareils, attendre qu'ils soient disponibles
        if (importedCount > 0) {
          console.log("Attente de synchronisation des nouveaux appareils...");
          let attempts = 0;
          const maxAttempts = 5;
          
          const checkAvailability = () => {
            attempts++;
            const currentCount = getAllAppliances().length;
            const expectedCount = currentAppliances.length + importedCount;
            
            console.log(`Tentative ${attempts}: ${currentCount} appareils (attendu: ${expectedCount})`);
            
            if (currentCount >= expectedCount || attempts >= maxAttempts) {
              performAssociations();
            } else {
              setTimeout(checkAvailability, 100);
            }
          };
          
          setTimeout(checkAvailability, 100);
        } else {
          // Pas de nouveaux appareils, association immédiate
          performAssociations();
        }
      } else {
        // Pas de référence de pièce, juste un import
        if (importedCount === 0) {
          toast("Aucun nouvel appareil à importer (références déjà présentes)");
        } else {
          toast(`${importedCount} nouveaux appareils importés avec succès`);
        }
        setIsProcessing(false);
      }
      
      console.log("=== FIN IMPORT ET ASSOCIATION ===");
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
