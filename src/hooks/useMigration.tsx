
import { useState, useEffect } from "react";
import { migrationService } from "@/services/migrationService";
import { toast } from "sonner";

interface MigrationState {
  isChecking: boolean;
  isMigrating: boolean;
  isCompleted: boolean;
  needsMigration: boolean;
  error: string | null;
  migrationResult: any | null;
}

export const useMigration = () => {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isChecking: true,
    isMigrating: false,
    isCompleted: false,
    needsMigration: false,
    error: null,
    migrationResult: null
  });

  useEffect(() => {
    checkAndPerformMigration();
  }, []);

  const checkAndPerformMigration = async () => {
    try {
      console.log("🔍 Vérification du besoin de migration...");
      
      // Vérifier si une migration est nécessaire
      const needsMigration = await migrationService.checkMigrationNeeded();
      
      setMigrationState(prev => ({
        ...prev,
        isChecking: false,
        needsMigration
      }));

      if (needsMigration) {
        console.log("🚀 Début de la migration automatique...");
        
        setMigrationState(prev => ({
          ...prev,
          isMigrating: true
        }));

        // Afficher un toast d'information
        toast.info("Migration des données vers IndexedDB en cours...", {
          duration: 5000
        });

        // Effectuer la migration
        const result = await migrationService.performMigration();
        
        setMigrationState(prev => ({
          ...prev,
          isMigrating: false,
          isCompleted: true,
          migrationResult: result,
          error: result.success ? null : "Erreur durant la migration"
        }));

        if (result.success) {
          const totalMigrated = Object.values(result.migratedData).reduce((sum, count) => sum + count, 0);
          toast.success(`Migration réussie ! ${totalMigrated} éléments transférés vers IndexedDB`, {
            duration: 7000
          });
          console.log("✅ Migration automatique terminée avec succès");
        } else {
          toast.error(`Erreur lors de la migration: ${result.errors.join(", ")}`, {
            duration: 10000
          });
          console.error("❌ Erreurs durant la migration:", result.errors);
        }
      } else {
        console.log("ℹ️ Aucune migration nécessaire");
        setMigrationState(prev => ({
          ...prev,
          isCompleted: true
        }));
      }

    } catch (error) {
      console.error("❌ Erreur lors de la vérification/migration:", error);
      setMigrationState(prev => ({
        ...prev,
        isChecking: false,
        isMigrating: false,
        error: `Erreur: ${error}`
      }));
      
      toast.error("Erreur lors de la migration des données", {
        duration: 7000
      });
    }
  };

  const retryMigration = async () => {
    setMigrationState(prev => ({
      ...prev,
      error: null,
      isChecking: true
    }));
    
    await checkAndPerformMigration();
  };

  const getMigrationStatus = async () => {
    try {
      return await migrationService.getMigrationStatus();
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du statut:", error);
      return null;
    }
  };

  return {
    migrationState,
    retryMigration,
    getMigrationStatus,
    isReady: migrationState.isCompleted && !migrationState.error
  };
};
