
import { useCallback } from "react";
import { Appliance } from "@/types/appliance";
import { useAppliances } from "./useAppliances";
import { toast } from "sonner";

export const useImportWithAssociation = () => {
  const { 
    importAppliances,
    associateApplicancesToPartReference,
    allAppliances
  } = useAppliances();

  const importAppliancesWithAssociation = useCallback(async (
    appliancesToImport: Appliance[],
    partReference?: string,
    importSessionId?: string
  ): Promise<{
    importedCount: number;
    associatedCount: number;
    existingIds: string[];
  }> => {
    console.log("=== DÉBUT IMPORT ET ASSOCIATION COORDONNÉS ===");
    console.log("📋 Paramètres reçus:");
    console.log("   - Appareils à importer:", appliancesToImport.length);
    console.log("   - Références d'appareils:", appliancesToImport.map(a => a.reference));
    console.log("   - Référence de pièce reçue:", partReference);
    console.log("   - ID de session d'import:", importSessionId);

    // Ajouter l'ID de session aux appareils si fourni
    const appliancesWithSession = importSessionId ? 
      appliancesToImport.map(app => ({ ...app, importSessionId })) : 
      appliancesToImport;

    console.log("🗄️ État de la base de données AVANT import:");
    console.log("   - Nombre total d'appareils:", allAppliances.length);
    console.log("   - Références présentes:", allAppliances.map(a => a.reference));

    // Classification des appareils : nouveaux vs existants
    const existingRefs = new Set(allAppliances.map(app => app.reference));
    const newAppliances = appliancesWithSession.filter(app => !existingRefs.has(app.reference));
    const existingAppliances = appliancesWithSession.filter(app => existingRefs.has(app.reference));
    const existingIds = existingAppliances
      .map(app => allAppliances.find(existing => existing.reference === app.reference)?.id)
      .filter(Boolean) as string[];

    console.log("🔍 ÉTAPE 1: Classification des appareils");
    console.log("   - Nouveaux appareils à importer:", newAppliances.length);
    console.log("   - Appareils déjà existants:", existingAppliances.length);

    let importedCount = 0;
    let newApplianceIds: string[] = [];

    // Import des nouveaux appareils seulement
    if (newAppliances.length > 0) {
      console.log("📥 ÉTAPE 2: Import des nouveaux appareils");
      
      try {
        const importResult = await importAppliances(newAppliances);
        importedCount = importResult.importedCount;
        newApplianceIds = importResult.importedIds;
        
        console.log("   - Appareils importés avec succès:", importedCount);
        console.log("   - IDs des nouveaux appareils:", newApplianceIds);
      } catch (error) {
        console.error("❌ Erreur lors de l'import:", error);
        toast.error("Erreur lors de l'import des appareils");
        return { importedCount: 0, associatedCount: 0, existingIds: [] };
      }
    }

    let associatedCount = 0;

    // Association à la référence de pièce si fournie
    if (partReference) {
      console.log("🔗 ÉTAPE 3: Association à la référence de pièce");
      console.log("   - Référence de pièce à associer:", partReference);
      console.log("   - IDs existants déjà collectés:", existingIds);

      // Combiner les IDs existants et nouveaux pour l'association
      const allIdsToAssociate = [...existingIds, ...newApplianceIds];
      
      console.log("   - Tous les IDs à associer:", allIdsToAssociate);

      if (allIdsToAssociate.length > 0) {
        // Attendre un peu pour s'assurer que l'état est mis à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          associatedCount = associateApplicancesToPartReference(allIdsToAssociate, partReference);
          console.log("   - Appareils associés avec succès:", associatedCount);
          
          if (associatedCount > 0) {
            toast.success(`${importedCount} appareils importés et ${associatedCount} associés à ${partReference}`);
          } else {
            toast.warning(`${importedCount} appareils importés mais aucune association créée`);
          }
        } catch (error) {
          console.error("❌ Erreur lors de l'association:", error);
          toast.error("Erreur lors de l'association à la référence de pièce");
        }
      }
    } else if (importedCount > 0) {
      toast.success(`${importedCount} appareils importés avec succès`);
    }

    console.log("=== FIN IMPORT ET ASSOCIATION COORDONNÉS ===");

    return {
      importedCount,
      associatedCount,
      existingIds
    };
  }, [importAppliances, associateApplicancesToPartReference, allAppliances]);

  return {
    importAppliancesWithAssociation
  };
};
