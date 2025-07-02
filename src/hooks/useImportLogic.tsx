
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
      
      console.log("=== DÉBUT IMPORT SIMPLIFIÉ ===");
      console.log("📋 Appareils à importer:", safeAppliancesToImport.length);
      console.log("📋 Référence de pièce:", partReference);
      
      if (safeAppliancesToImport.length === 0) {
        console.log("Aucun appareil à importer");
        setIsProcessing(false);
        return [];
      }

      // Étape 1: Importer tous les appareils
      console.log("📥 Import des appareils...");
      const importedCount = importAppliances(safeAppliancesToImport);
      console.log("✅ Appareils importés:", importedCount);

      // Étape 2: Association à la référence de pièce si fournie
      if (partReference && partReference.trim() && importedCount > 0) {
        console.log("🔗 Association à la référence de pièce:", partReference);
        
        // Attendre un peu pour que les appareils soient bien enregistrés
        setTimeout(() => {
          // Récupérer les IDs des appareils nouvellement importés
          const newApplianceIds = safeAppliancesToImport
            .map(newApp => {
              const found = allAppliances.find(app => app.reference === newApp.reference);
              return found ? found.id : null;
            })
            .filter(id => id !== null) as string[];

          if (newApplianceIds.length > 0) {
            const associatedCount = associateApplicancesToPartReference(newApplianceIds, partReference);
            console.log("🔗 Appareils associés:", associatedCount);
            
            if (associatedCount > 0) {
              toast(`${importedCount} appareils importés et ${associatedCount} associations créées avec la pièce ${partReference}`);
            } else {
              toast(`${importedCount} appareils importés`);
            }
          } else {
            toast(`${importedCount} appareils importés`);
          }
          
          setIsProcessing(false);
        }, 500);
      } else {
        if (importedCount > 0) {
          toast(`${importedCount} appareils importés avec succès`);
        } else {
          toast("Aucun nouvel appareil à importer (références déjà présentes)");
        }
        setIsProcessing(false);
      }
      
      console.log("=== FIN IMPORT SIMPLIFIÉ ===");
      return safeAppliancesToImport;
      
    } catch (error) {
      console.error("💥 ERREUR lors de l'import:", error);
      toast("Une erreur est survenue lors de l'importation des données");
      setIsProcessing(false);
      return [];
    }
  }, [importAppliances, associateApplicancesToPartReference, allAppliances, isProcessing]);

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
