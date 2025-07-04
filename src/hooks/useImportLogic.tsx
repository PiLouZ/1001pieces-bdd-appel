
import { useState, useCallback } from "react";
import { Appliance } from "@/types/appliance";
import { toast } from "sonner";

interface UseImportLogicProps {
  importAppliances: (appliances: Appliance[], callback?: (importedAppliances: Appliance[]) => void) => number;
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
      
      console.log("=== DÉBUT IMPORT AVEC INDEXEDDB ===");
      console.log("📋 Appareils à importer:", safeAppliancesToImport.length);
      console.log("📋 Référence de pièce:", partReference);
      console.log("📋 Détails des appareils:", safeAppliancesToImport.map(a => ({ref: a.reference, brand: a.brand, type: a.type})));
      
      if (safeAppliancesToImport.length === 0) {
        console.log("Aucun appareil à importer");
        setIsProcessing(false);
        return [];
      }

      // Étape 1: Importer tous les appareils avec callback pour récupérer les IDs
      console.log("📥 Import des appareils...");
      let importedAppliancesWithIds: Appliance[] = [];
      
      const importedCount = importAppliances(safeAppliancesToImport, (importedAppliances) => {
        importedAppliancesWithIds = importedAppliances;
        console.log("📋 Callback: appareils reçus avec IDs:", importedAppliances.map(a => `${a.id} (${a.reference})`));
      });
      
      console.log("✅ Appareils importés:", importedCount);
      
      // Attendre que le callback soit traité (synchrone dans React)
      console.log("🔍 Vérification des IDs après callback:", importedAppliancesWithIds.length);

      // Étape 2: Association directe à la référence de pièce si fournie
      if (partReference && partReference.trim() && importedCount > 0 && importedAppliancesWithIds.length > 0) {
        console.log("🔗 Association à la référence de pièce:", partReference);
        
        // Utiliser les IDs récupérés directement du callback
        const newApplianceIds = importedAppliancesWithIds.map(app => app.id);

        console.log("🆔 IDs trouvés pour association:", newApplianceIds);

        if (newApplianceIds.length > 0) {
          const associatedCount = associateApplicancesToPartReference(newApplianceIds, partReference);
          console.log("🔗 Appareils associés:", associatedCount);
          
          if (associatedCount > 0) {
            toast(`${importedCount} appareils importés et ${associatedCount} associations créées avec la pièce ${partReference}`);
          } else {
            toast(`${importedCount} appareils importés`);
          }
        } else {
          console.warn("⚠️ Aucun ID trouvé pour les associations");
          toast(`${importedCount} appareils importés`);
        }
      } else {
        if (importedCount > 0) {
          toast(`${importedCount} appareils importés avec succès`);
        } else {
          toast("Aucun nouvel appareil à importer (références déjà présentes)");
        }
      }
      
      setIsProcessing(false);
      console.log("=== FIN IMPORT AVEC INDEXEDDB ===");
      return importedAppliancesWithIds;
      
    } catch (error) {
      console.error("💥 ERREUR lors de l'import:", error);
      toast("Une erreur est survenue lors de l'importation des données");
      setIsProcessing(false);
      return [];
    }
  }, [importAppliances, associateApplicancesToPartReference, isProcessing]);

  // Fonction pour rechercher par référence commerciale
  const getApplianceByCommercialRef = useCallback((commercialRef: string): Appliance | undefined => {
    console.log(`🔍 Recherche par référence commerciale: ${commercialRef}`);
    const found = allAppliances.find(a => a.commercialRef === commercialRef);
    if (found) {
      console.log(`✅ Trouvé par commercialRef: ${commercialRef} -> ${found.brand} ${found.type}`);
    } else {
      console.log(`❌ Pas trouvé par commercialRef: ${commercialRef}`);
    }
    return found;
  }, [allAppliances]);

  return {
    handleImport,
    isProcessing,
    getApplianceByCommercialRef
  };
};
