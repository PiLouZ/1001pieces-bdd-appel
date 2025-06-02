
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
      
      console.log("=== IMPORT ET ASSOCIATION DÉTAILLÉS ===");
      console.log("📋 Paramètres reçus:");
      console.log("   - Appareils à importer:", safeAppliancesToImport.length);
      console.log("   - Références d'appareils:", safeAppliancesToImport.map(a => a.reference));
      console.log("   - Référence de pièce reçue:", partReference);
      console.log("   - Type de la référence de pièce:", typeof partReference);
      console.log("   - Référence de pièce (string):", String(partReference));
      
      // Récupérer l'état actuel de la base AVANT tout traitement
      const currentAppliances = getAllAppliances();
      console.log("🗄️ État de la base de données:");
      console.log("   - Nombre total d'appareils:", currentAppliances.length);
      console.log("   - Détail des appareils existants:");
      currentAppliances.forEach(app => {
        console.log(`     * ID: ${app.id} | Ref: ${app.reference} | Marque: ${app.brand} | Type: ${app.type}`);
      });
      
      // Étape 1: Classification des appareils (nouveaux vs existants)
      console.log("🔍 ÉTAPE 1: Classification des appareils");
      const existingRefs = new Set(currentAppliances.map(a => a.reference));
      const newAppliances = safeAppliancesToImport.filter(app => !existingRefs.has(app.reference));
      const existingAppliances = safeAppliancesToImport.filter(app => existingRefs.has(app.reference));
      
      console.log("   - Références déjà présentes:", Array.from(existingRefs));
      console.log("   - Nouveaux appareils à importer:", newAppliances.length);
      console.log("   - Appareils déjà existants:", existingAppliances.length);
      
      if (newAppliances.length > 0) {
        console.log("   - Détail des nouveaux appareils:");
        newAppliances.forEach(app => {
          console.log(`     * Ref: ${app.reference} | Marque: ${app.brand} | Type: ${app.type}`);
        });
      }
      
      if (existingAppliances.length > 0) {
        console.log("   - Détail des appareils existants:");
        existingAppliances.forEach(app => {
          const existingApp = currentAppliances.find(existing => existing.reference === app.reference);
          console.log(`     * Ref: ${app.reference} | ID réel: ${existingApp?.id} | Marque: ${existingApp?.brand} | Type: ${existingApp?.type}`);
        });
      }
      
      // Étape 2: Importer SEULEMENT les nouveaux appareils
      let importedCount = 0;
      if (newAppliances.length > 0) {
        console.log("📥 ÉTAPE 2: Import des nouveaux appareils");
        importedCount = importAppliances(newAppliances);
        console.log("   - Appareils importés avec succès:", importedCount);
      } else {
        console.log("📥 ÉTAPE 2: Aucun nouvel appareil à importer");
      }
      
      // Étape 3: Association à la référence de pièce si fournie
      if (partReference && partReference.trim()) {
        console.log("🔗 ÉTAPE 3: Association à la référence de pièce");
        console.log("   - Référence de pièce à associer:", partReference);
        
        // Si on a importé de nouveaux appareils, attendre qu'ils soient disponibles
        const processAssociations = () => {
          const freshAppliances = getAllAppliances();
          console.log("   - Base mise à jour, appareils disponibles:", freshAppliances.length);
          
          // Collecter TOUS les IDs réels (existants + nouveaux)
          const realIds: string[] = [];
          console.log("   - Résolution des IDs réels:");
          
          safeAppliancesToImport.forEach(importedApp => {
            const realApp = freshAppliances.find(app => app.reference === importedApp.reference);
            if (realApp) {
              realIds.push(realApp.id);
              console.log(`     ✅ Référence ${importedApp.reference} -> ID réel: ${realApp.id}`);
            } else {
              console.error(`     ❌ ERREUR: Référence ${importedApp.reference} introuvable dans la base !`);
            }
          });
          
          console.log("   - IDs réels collectés pour association:", realIds);
          console.log("   - Nombre total d'IDs à associer:", realIds.length);
          
          if (realIds.length > 0) {
            console.log("   - Début de l'association...");
            const associatedCount = associateApplicancesToPartReference(realIds, partReference);
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
            console.error("   - ERREUR CRITIQUE: Aucun ID réel trouvé pour l'association");
            toast("Erreur: Aucun appareil trouvé pour l'association");
          }
          
          setIsProcessing(false);
        };
        
        // Si on a importé de nouveaux appareils, attendre qu'ils soient synchronisés
        if (importedCount > 0) {
          console.log("   - Attente de synchronisation des nouveaux appareils...");
          let attempts = 0;
          const maxAttempts = 10; // Augmenté pour plus de robustesse
          
          const checkSynchronization = () => {
            attempts++;
            const currentCount = getAllAppliances().length;
            const expectedCount = currentAppliances.length + importedCount;
            
            console.log(`   - Tentative ${attempts}/${maxAttempts}: ${currentCount} appareils (attendu: ${expectedCount})`);
            
            if (currentCount >= expectedCount) {
              console.log("   - ✅ Synchronisation terminée, début des associations");
              processAssociations();
            } else if (attempts >= maxAttempts) {
              console.warn("   - ⚠️ Timeout de synchronisation, tentative d'association quand même");
              processAssociations();
            } else {
              setTimeout(checkSynchronization, 50); // Réduit l'intervalle pour plus de réactivité
            }
          };
          
          setTimeout(checkSynchronization, 50);
        } else {
          // Pas de nouveaux appareils, association immédiate
          console.log("   - Pas de nouveaux appareils, association immédiate");
          processAssociations();
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
      
      console.log("=== FIN IMPORT ET ASSOCIATION DÉTAILLÉS ===");
      return safeAppliancesToImport;
      
    } catch (error) {
      console.error("💥 ERREUR FATALE lors de l'import:", error);
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
