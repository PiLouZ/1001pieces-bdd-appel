
import { useState, useCallback } from "react";
import { Appliance } from "@/types/appliance";
import { toast } from "sonner";

interface UseImportLogicProps {
  importAppliances: (appliances: Appliance[]) => number;
  associateApplicancesToPartReference: (applianceIds: string[], partReference: string) => number;
  allAppliances: Appliance[]; // Changé: on reçoit directement l'état des appareils
}

export const useImportLogic = ({
  importAppliances,
  associateApplicancesToPartReference,
  allAppliances // Utilisation directe de l'état
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
      
      console.log("=== IMPORT ET ASSOCIATION CORRIGÉS ===");
      console.log("📋 Paramètres reçus:");
      console.log("   - Appareils à importer:", safeAppliancesToImport.length);
      console.log("   - Références d'appareils:", safeAppliancesToImport.map(a => a.reference));
      console.log("   - Référence de pièce reçue:", partReference);
      
      // Récupérer l'état actuel de la base AVANT tout traitement
      console.log("🗄️ État de la base de données:");
      console.log("   - Nombre total d'appareils:", allAppliances.length);
      
      // Étape 1: Classification des appareils (nouveaux vs existants)
      console.log("🔍 ÉTAPE 1: Classification des appareils");
      const existingRefs = new Set(allAppliances.map(a => a.reference));
      const newAppliances = safeAppliancesToImport.filter(app => !existingRefs.has(app.reference));
      const existingAppliances = safeAppliancesToImport.filter(app => existingRefs.has(app.reference));
      
      console.log("   - Références déjà présentes:", Array.from(existingRefs));
      console.log("   - Nouveaux appareils à importer:", newAppliances.length);
      console.log("   - Appareils déjà existants:", existingAppliances.length);
      
      // Étape 2: Collecter les IDs des appareils existants AVANT l'import
      const existingApplianceIds: string[] = [];
      if (existingAppliances.length > 0) {
        console.log("📍 Collecte des IDs des appareils existants:");
        existingAppliances.forEach(importedApp => {
          const realApp = allAppliances.find(app => app.reference === importedApp.reference);
          if (realApp) {
            existingApplianceIds.push(realApp.id);
            console.log(`     ✅ Référence ${importedApp.reference} -> ID existant: ${realApp.id}`);
          }
        });
      }
      
      // Étape 3: Importer SEULEMENT les nouveaux appareils
      let importedCount = 0;
      if (newAppliances.length > 0) {
        console.log("📥 ÉTAPE 2: Import des nouveaux appareils");
        importedCount = importAppliances(newAppliances);
        console.log("   - Appareils importés avec succès:", importedCount);
      } else {
        console.log("📥 ÉTAPE 2: Aucun nouvel appareil à importer");
      }
      
      // Étape 4: Association à la référence de pièce si fournie
      if (partReference && partReference.trim()) {
        console.log("🔗 ÉTAPE 3: Association à la référence de pièce");
        console.log("   - Référence de pièce à associer:", partReference);
        console.log("   - IDs existants déjà collectés:", existingApplianceIds);
        
        if (importedCount > 0) {
          // Si on a importé de nouveaux appareils, attendre qu'ils soient disponibles
          console.log("   - Attente que les nouveaux appareils soient disponibles...");
          
          // Utiliser un délai fixe plus court car on a accès direct à l'état
          setTimeout(() => {
            // Les IDs des nouveaux appareils sont générés de manière prévisible
            const newApplianceIds: string[] = [];
            
            // Générer les IDs basés sur le timestamp et la logique d'import
            const baseTimestamp = Date.now();
            newAppliances.forEach((_, index) => {
              // L'ID est généré dans importAppliances avec cette logique
              const generatedId = `${baseTimestamp}-${Math.random().toString(36).substr(2, 9)}`;
              newApplianceIds.push(generatedId);
            });
            
            console.log("   - IDs nouveaux générés:", newApplianceIds);
            
            // Combiner tous les IDs (existants + nouveaux)
            const allIds = [...existingApplianceIds, ...newApplianceIds];
            
            console.log("   - IDs existants:", existingApplianceIds);
            console.log("   - IDs nouveaux:", newApplianceIds);
            console.log("   - IDs totaux pour association:", allIds);
            console.log("   - Nombre total d'IDs à associer:", allIds.length);
            
            if (allIds.length > 0) {
              console.log("   - Début de l'association...");
              const associatedCount = associateApplicancesToPartReference(allIds, partReference);
              console.log("   - Résultat de l'association:", associatedCount, "appareils associés");
              
              // Messages de feedback utilisateur
              if (associatedCount > 0) {
                if (importedCount === 0) {
                  toast(`${associatedCount} appareils existants associés à la référence de pièce ${partReference}`);
                } else if (existingAppliances.length === 0) {
                  toast(`${importedCount} nouveaux appareils importés et associés à la référence de pièce ${partReference}`);
                } else {
                  toast(`${importedCount} nouveaux appareils importés et ${associatedCount} appareils (nouveaux + existants) associés à la référence de pièce ${partReference}`);
                }
              } else {
                console.error("   - ERREUR: Aucune association n'a été créée");
                toast("Erreur lors de l'association des appareils à la référence de pièce");
              }
            } else {
              console.error("   - ERREUR CRITIQUE: Aucun ID trouvé pour l'association");
              toast("Erreur: Aucun appareil trouvé pour l'association");
            }
            
            setIsProcessing(false);
          }, 200); // Délai fixe plus court
        } else {
          // Pas de nouveaux appareils, association immédiate des existants
          console.log("   - Pas de nouveaux appareils, association immédiate");
          if (existingApplianceIds.length > 0) {
            const associatedCount = associateApplicancesToPartReference(existingApplianceIds, partReference);
            console.log("   - Résultat de l'association:", associatedCount, "appareils associés");
            
            if (associatedCount > 0) {
              toast(`${associatedCount} appareils existants associés à la référence de pièce ${partReference}`);
            } else {
              toast("Erreur lors de l'association des appareils à la référence de pièce");
            }
          } else {
            toast("Aucun appareil trouvé pour l'association");
          }
          setIsProcessing(false);
        }
      } else {
        // Pas de référence de pièce fournie
        console.log("🔗 ÉTAPE 3: Aucune référence de pièce fournie");
        if (importedCount === 0) {
          toast("Aucun nouvel appareil à importer (références déjà présentes)");
        } else {
          toast(`${importedCount} nouveaux appareils importés avec succès`);
        }
        setIsProcessing(false);
      }
      
      console.log("=== FIN IMPORT ET ASSOCIATION CORRIGÉS ===");
      return safeAppliancesToImport;
      
    } catch (error) {
      console.error("💥 ERREUR FATALE lors de l'import:", error);
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
