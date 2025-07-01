
import { sqliteService } from "./sqliteService";
import { Appliance, ImportSession, AppliancePartAssociation } from "@/types/appliance";

interface MigrationResult {
  success: boolean;
  migratedData: {
    appliances: number;
    associations: number;
    sessions: number;
    partReferences: number;
  };
  errors: string[];
}

class MigrationService {
  private readonly MIGRATION_KEY = "indexeddb_migration_completed";
  private readonly MIGRATION_VERSION = "v1.0.0";

  async checkMigrationNeeded(): Promise<boolean> {
    try {
      // Vérifier si la migration a déjà été effectuée
      const migrationStatus = await sqliteService.loadMetadata(this.MIGRATION_KEY);
      if (migrationStatus === this.MIGRATION_VERSION) {
        console.log("ℹ️ Migration déjà effectuée, pas de migration nécessaire");
        return false;
      }

      // Vérifier s'il y a des données dans localStorage
      const hasLocalStorageData = this.hasLocalStorageData();
      
      if (!hasLocalStorageData) {
        // Pas de données à migrer, marquer comme migré
        await sqliteService.saveMetadata(this.MIGRATION_KEY, this.MIGRATION_VERSION);
        console.log("ℹ️ Aucune donnée à migrer, migration marquée comme terminée");
        return false;
      }

      console.log("🔄 Migration nécessaire détectée");
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la vérification de migration:", error);
      return false;
    }
  }

  private hasLocalStorageData(): boolean {
    const keys = ["appliances", "appliancePartAssociations", "importSessions", "knownPartReferences"];
    return keys.some(key => {
      const data = localStorage.getItem(key);
      return data && data !== "[]" && data !== "{}";
    });
  }

  async performMigration(): Promise<MigrationResult> {
    console.log("🚀 Début de la migration localStorage → IndexedDB");
    
    const result: MigrationResult = {
      success: false,
      migratedData: {
        appliances: 0,
        associations: 0,
        sessions: 0,
        partReferences: 0
      },
      errors: []
    };

    try {
      // Migrer les appareils
      await this.migrateAppliances(result);
      
      // Migrer les associations
      await this.migrateAssociations(result);
      
      // Migrer les sessions d'import
      await this.migrateImportSessions(result);
      
      // Migrer les références de pièces
      await this.migratePartReferences(result);
      
      // Marquer la migration comme terminée
      await sqliteService.saveMetadata(this.MIGRATION_KEY, this.MIGRATION_VERSION);
      await sqliteService.saveMetadata("migration_date", new Date().toISOString());
      
      result.success = true;
      console.log("✅ Migration terminée avec succès");
      console.log("📊 Données migrées:", result.migratedData);
      
      // Optionnel : nettoyer localStorage après migration réussie
      if (result.success && result.errors.length === 0) {
        this.cleanupLocalStorage();
      }
      
    } catch (error) {
      console.error("❌ Erreur durant la migration:", error);
      result.errors.push(`Erreur générale: ${error}`);
    }

    return result;
  }

  private async migrateAppliances(result: MigrationResult): Promise<void> {
    try {
      const appliancesData = localStorage.getItem("appliances");
      if (appliancesData) {
        const appliances: Appliance[] = JSON.parse(appliancesData);
        if (Array.isArray(appliances) && appliances.length > 0) {
          await sqliteService.saveAppliances(appliances);
          result.migratedData.appliances = appliances.length;
          console.log(`✅ ${appliances.length} appareils migrés`);
        }
      }
    } catch (error) {
      console.error("❌ Erreur migration appareils:", error);
      result.errors.push(`Appareils: ${error}`);
    }
  }

  private async migrateAssociations(result: MigrationResult): Promise<void> {
    try {
      const associationsData = localStorage.getItem("appliancePartAssociations");
      if (associationsData) {
        const associations: AppliancePartAssociation[] = JSON.parse(associationsData);
        if (Array.isArray(associations) && associations.length > 0) {
          await sqliteService.saveAssociations(associations);
          result.migratedData.associations = associations.length;
          console.log(`✅ ${associations.length} associations migrées`);
        }
      }
    } catch (error) {
      console.error("❌ Erreur migration associations:", error);
      result.errors.push(`Associations: ${error}`);
    }
  }

  private async migrateImportSessions(result: MigrationResult): Promise<void> {
    try {
      const sessionsData = localStorage.getItem("importSessions");
      if (sessionsData) {
        const sessions: Record<string, ImportSession> = JSON.parse(sessionsData);
        if (typeof sessions === 'object' && Object.keys(sessions).length > 0) {
          await sqliteService.saveImportSessions(sessions);
          result.migratedData.sessions = Object.keys(sessions).length;
          console.log(`✅ ${Object.keys(sessions).length} sessions d'import migrées`);
        }
      }
    } catch (error) {
      console.error("❌ Erreur migration sessions:", error);
      result.errors.push(`Sessions: ${error}`);
    }
  }

  private async migratePartReferences(result: MigrationResult): Promise<void> {
    try {
      const partRefsData = localStorage.getItem("knownPartReferences");
      if (partRefsData) {
        const partReferences: string[] = JSON.parse(partRefsData);
        if (Array.isArray(partReferences) && partReferences.length > 0) {
          await sqliteService.savePartReferences(partReferences);
          result.migratedData.partReferences = partReferences.length;
          console.log(`✅ ${partReferences.length} références de pièces migrées`);
        }
      }
    } catch (error) {
      console.error("❌ Erreur migration références:", error);
      result.errors.push(`Références: ${error}`);
    }
  }

  private cleanupLocalStorage(): void {
    try {
      const keysToRemove = [
        "appliances",
        "appliancePartAssociations", 
        "importSessions",
        "knownPartReferences"
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log("🧹 localStorage nettoyé après migration réussie");
    } catch (error) {
      console.warn("⚠️ Erreur lors du nettoyage localStorage:", error);
    }
  }

  async rollbackMigration(): Promise<boolean> {
    try {
      console.log("🔄 Rollback de la migration...");
      
      // Effacer le marqueur de migration
      await sqliteService.saveMetadata(this.MIGRATION_KEY, null);
      
      // Optionnel : vider IndexedDB si besoin
      // await indexedDBService.clearAllData();
      
      console.log("✅ Rollback terminé");
      return true;
    } catch (error) {
      console.error("❌ Erreur durant le rollback:", error);
      return false;
    }
  }

  async getMigrationStatus(): Promise<{
    isMigrated: boolean;
    migrationDate?: string;
    storageInfo?: any;
  }> {
    try {
      const migrationStatus = await sqliteService.loadMetadata(this.MIGRATION_KEY);
      const migrationDate = await sqliteService.loadMetadata("migration_date");
      const storageInfo = await sqliteService.getStorageInfo();
      
      return {
        isMigrated: migrationStatus === this.MIGRATION_VERSION,
        migrationDate,
        storageInfo
      };
    } catch (error) {
      console.error("❌ Erreur lors de la vérification du statut:", error);
      return { isMigrated: false };
    }
  }
}

export const migrationService = new MigrationService();
