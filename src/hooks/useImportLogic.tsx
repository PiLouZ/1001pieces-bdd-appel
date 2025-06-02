
import { useState, useCallback } from "react";
import { Appliance } from "@/types/appliance";
import { toast } from "sonner";

interface UseImportLogicProps {
  importAppliances: (appliances: Appliance[]) => number;
  associateApplicancesToPartReference: (applianceIds: string[], partReference: string) => number;
  allAppliances: Appliance[];
}

export const useImportLogic = ({
  importAppliances,
  associateApplicancesToPartReference,
  allAppliances
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
      
      console.log("=== DÉBUT PROCESSUS IMPORT COMPLET ===");
      console.log("Appareils à importer:", safeAppliancesToImport.length);
      console.log("Détail des appareils:", safeAppliancesToImport.map(a => ({ ref: a.reference, brand: a.brand, type: a.type })));
      console.log("Référence de pièce:", partReference);
      console.log("État de la base AVANT import:", allAppliances.length, "appareils");
      
      // Séparer les appareils existants et nouveaux AVANT l'import
      const existingAppliances: Appliance[] = [];
      const newAppliances: Appliance[] = [];
      
      safeAppliancesToImport.forEach(importApp => {
        const existingAppliance = allAppliances.find(a => a.reference === importApp.reference);
        if (existingAppliance) {
          existingAppliances.push(existingAppliance); // Garder l'appareil complet avec son vrai ID
          console.log(`✓ Appareil existant trouvé: ${importApp.reference} -> ID réel: ${existingAppliance.id}`);
        } else {
          newAppliances.push(importApp);
          console.log(`→ Nouvel appareil: ${importApp.reference}`);
        }
      });
      
      const existingApplianceIds = existingAppliances.map(app => app.id);
      console.log("Appareils existants (IDs réels):", existingApplianceIds);
      console.log("Nouveaux appareils à importer:", newAppliances.length);
      
      // Étape 1: Importer les nouveaux appareils
      const importedCount = importAppliances(newAppliances);
      console.log("Nombre d'appareils nouvellement importés:", importedCount);
      
      // Étape 2: Si une référence de pièce est fournie, créer les associations
      if (partReference && partReference.trim()) {
        console.log("=== ÉTAPE 2: CRÉATION DES ASSOCIATIONS ===");
        console.log("Référence de pièce:", partReference);
        
        let totalAssociatedCount = 0;
        
        // Associer IMMÉDIATEMENT les appareils existants avec leurs vrais IDs
        if (existingApplianceIds.length > 0) {
          console.log("Association IMMÉDIATE des appareils existants avec IDs:", existingApplianceIds);
          const existingAssociatedCount = associateApplicancesToPartReference(existingApplianceIds, partReference);
          totalAssociatedCount += existingAssociatedCount;
          console.log("Appareils existants associés:", existingAssociatedCount);
        }
        
        // Pour les nouveaux appareils, attendre qu'ils soient disponibles dans la base
        if (newAppliances.length > 0) {
          let attempts = 0;
          const maxAttempts = 10;
          const attemptInterval = 200;
          
          const tryAssociateNewAppliances = () => {
            attempts++;
            console.log(`=== TENTATIVE ${attempts}/${maxAttempts} D'ASSOCIATION DES NOUVEAUX APPAREILS ===`);
            
            // Récupérer l'état actuel de la base
            const currentAppliances = allAppliances;
            console.log("État actuel de la base:", currentAppliances.length, "appareils");
            
            const newApplianceIds: string[] = [];
            const stillMissingReferences: string[] = [];
            
            newAppliances.forEach(newApp => {
              const foundAppliance = currentAppliances.find(a => a.reference === newApp.reference);
              if (foundAppliance) {
                newApplianceIds.push(foundAppliance.id);
                console.log(`✓ Nouvel appareil trouvé dans la base: ${newApp.reference} -> ID: ${foundAppliance.id}`);
              } else {
                stillMissingReferences.push(newApp.reference);
                console.log(`✗ Nouvel appareil non encore trouvé: ${newApp.reference}`);
              }
            });
            
            // Associer les nouveaux appareils trouvés
            if (newApplianceIds.length > 0) {
              console.log("Association des nouveaux appareils avec IDs:", newApplianceIds);
              const newAssociationsCount = associateApplicancesToPartReference(newApplianceIds, partReference);
              totalAssociatedCount += newAssociationsCount;
              console.log("Nouveaux appareils associés:", newAssociationsCount);
            }
            
            // Si tous les appareils sont trouvés ou si on a atteint le max de tentatives
            if (stillMissingReferences.length === 0 || attempts >= maxAttempts) {
              console.log("=== FIN PROCESSUS D'ASSOCIATION ===");
              console.log("Total d'appareils associés:", totalAssociatedCount);
              console.log("Appareils encore manquants:", stillMissingReferences);
              
              // Messages finaux
              if (importedCount === 0 && totalAssociatedCount > 0) {
                toast(`Aucun nouvel appareil importé, mais ${totalAssociatedCount} appareils associés à la référence de pièce ${partReference}`);
              } else if (importedCount > 0 && totalAssociatedCount > 0) {
                toast(`${importedCount} nouveaux appareils importés et ${totalAssociatedCount} appareils associés à la référence de pièce ${partReference}`);
              } else if (importedCount > 0 && totalAssociatedCount === 0) {
                toast(`${importedCount} nouveaux appareils importés, mais aucune association créée`);
              } else {
                toast("Erreur: Impossible de créer les associations");
              }
              
              setIsProcessing(false);
              return;
            }
            
            // Programmer la prochaine tentative
            setTimeout(tryAssociateNewAppliances, attemptInterval);
          };
          
          // Commencer les tentatives d'association après un délai initial
          setTimeout(tryAssociateNewAppliances, attemptInterval);
        } else {
          // Pas de nouveaux appareils, juste des existants
          if (importedCount === 0 && totalAssociatedCount > 0) {
            toast(`Aucun nouvel appareil importé, mais ${totalAssociatedCount} appareils associés à la référence de pièce ${partReference}`);
          } else if (importedCount > 0 && totalAssociatedCount > 0) {
            toast(`${importedCount} nouveaux appareils importés et ${totalAssociatedCount} appareils associés à la référence de pièce ${partReference}`);
          } else {
            toast("Erreur: Impossible de créer les associations");
          }
          setIsProcessing(false);
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
      
      console.log("=== FIN PROCESSUS IMPORT ===");
      return safeAppliancesToImport;
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      toast("Une erreur est survenue lors de l'importation des données");
      setIsProcessing(false);
      return [];
    }
  }, [importAppliances, associateApplicancesToPartReference, allAppliances, isProcessing]);

  return {
    handleImport,
    isProcessing
  };
};
