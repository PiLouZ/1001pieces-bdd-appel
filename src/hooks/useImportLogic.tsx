
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
      
      console.log("=== IMPORT ET ASSOCIATION CORRIGÉS V2 ===");
      console.log("📋 Paramètres reçus:");
      console.log("   - Appareils à importer:", safeAppliancesToImport.length);
      console.log("   - Références d'appareils:", safeAppliancesToImport.map(a => a.reference));
      console.log("   - Référence de pièce reçue:", partReference);
      
      // Récupérer l'état actuel de la base AVANT tout traitement
      console.log("🗄️ État de la base de données AVANT import:");
      console.log("   - Nombre total d'appareils:", allAppliances.length);
      console.log("   - Références présentes:", allAppliances.map(a => a.reference));
      
      // Étape 1: Classification des appareils (nouveaux vs existants)
      console.log("🔍 ÉTAPE 1: Classification des appareils");
      const existingRefs = new Set(allAppliances.map(a => a.reference));
      const newAppliances = safeAppliancesToImport.filter(app => !existingRefs.has(app.reference));
      const existingAppliances = safeAppliancesToImport.filter(app => existingRefs.has(app.reference));
      
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
          // Attendre un délai pour que les nouveaux appareils soient disponibles dans l'état
          console.log("   - Attente que les nouveaux appareils soient disponibles...");
          
          setTimeout(() => {
            // Récupérer l'état mis à jour pour trouver les IDs des nouveaux appareils
            console.log("   - Recherche des IDs des nouveaux appareils dans l'état mis à jour");
            
            // Obtenir une référence fraîche à l'état actuel des appareils
            // Note: On utilise une fonction qui sera appelée avec l'état le plus récent
            const processAssociation = () => {
              // Les références des nouveaux appareils à chercher
              const newApplianceRefs = newAppliances.map(app => app.reference);
              console.log("   - Références des nouveaux appareils à chercher:", newApplianceRefs);
              
              // Simuler l'accès à l'état mis à jour
              // Dans un vrai environnement, ces appareils devraient maintenant être présents
              const newApplianceIds: string[] = [];
              
              // Utiliser une approche différente : déclencher directement l'association
              // en laissant useAppliances gérer la récupération des IDs
              
              // Créer la liste complète des références à associer
              const allReferencesToAssociate = [
                ...existingAppliances.map(app => app.reference),
                ...newAppliances.map(app => app.reference)
              ];
              
              console.log("   - Toutes les références à associer:", allReferencesToAssociate);
              console.log("   - Tentative d'association par référence au lieu d'ID");
              
              // Déléguer la responsabilité de trouver les IDs à useAppliances
              // en passant les références plutôt que les IDs
              const allIds = [...existingApplianceIds]; // On garde les IDs existants déjà trouvés
              
              // Pour les nouveaux appareils, on va laisser useAppliances les récupérer
              // Mais d'abord, testons avec un simple délai plus long
              
              if (allReferencesToAssociate.length > 0) {
                console.log("   - Association avec les IDs disponibles:", allIds);
                
                if (allIds.length > 0) {
                  const associatedCount = associateApplicancesToPartReference(allIds, partReference);
                  console.log("   - Résultat de l'association:", associatedCount, "appareils associés");
                  
                  if (associatedCount > 0) {
                    if (importedCount === 0) {
                      toast(`${associatedCount} appareils existants associés à la référence de pièce ${partReference}`);
                    } else {
                      toast(`${importedCount} nouveaux appareils importés. ${associatedCount} appareils existants associés à la référence de pièce ${partReference}. Les nouveaux appareils seront associés dans un instant.`);
                    }
                  }
                }
                
                // Maintenant, essayer d'associer les nouveaux appareils avec un second délai
                if (newAppliances.length > 0) {
                  setTimeout(() => {
                    console.log("   - Seconde tentative d'association pour les nouveaux appareils");
                    
                    // Cette fois, essayer de trouver les nouveaux appareils par référence
                    // en accédant directement au localStorage pour avoir l'état le plus récent
                    const currentAppliancesJson = localStorage.getItem("appliances");
                    if (currentAppliancesJson) {
                      const currentAppliances = JSON.parse(currentAppliancesJson);
                      console.log("   - État récupéré du localStorage:", currentAppliances.length, "appareils");
                      
                      const newApplianceIds = newAppliances
                        .map(newApp => {
                          const found = currentAppliances.find((app: Appliance) => app.reference === newApp.reference);
                          return found ? found.id : null;
                        })
                        .filter(id => id !== null);
                      
                      console.log("   - IDs des nouveaux appareils trouvés:", newApplianceIds);
                      
                      if (newApplianceIds.length > 0) {
                        const newAssociatedCount = associateApplicancesToPartReference(newApplianceIds, partReference);
                        console.log("   - Nouveaux appareils associés:", newAssociatedCount);
                        
                        if (newAssociatedCount > 0) {
                          toast(`${newAssociatedCount} nouveaux appareils associés à la référence de pièce ${partReference}`);
                        }
                      } else {
                        console.error("   - ERREUR: Aucun nouveau appareil trouvé pour l'association");
                      }
                    }
                  }, 500); // Délai plus long pour la seconde tentative
                }
              }
            };
            
            processAssociation();
            setIsProcessing(false);
          }, 300); // Délai initial plus long
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
      
      console.log("=== FIN IMPORT ET ASSOCIATION CORRIGÉS V2 ===");
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
