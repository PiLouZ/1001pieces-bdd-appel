
import { Appliance, ImportSession, AppliancePartAssociation } from "@/types/appliance";

// Configuration de la base de données
const DB_NAME = "ApplianceDB";
const DB_VERSION = 1;

// Noms des stores
export const STORES = {
  APPLIANCES: "appliances",
  PART_ASSOCIATIONS: "appliancePartAssociations", 
  IMPORT_SESSIONS: "importSessions",
  PART_REFERENCES: "partReferences",
  METADATA: "metadata"
} as const;

// Interface pour le store de métadonnées
interface MetadataEntry {
  key: string;
  value: any;
  lastUpdated: string;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🔧 Initialisation IndexedDB...");
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("❌ Erreur lors de l'ouverture d'IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB initialisé avec succès");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log("🔄 Mise à jour du schéma IndexedDB...");
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour les appareils
        if (!db.objectStoreNames.contains(STORES.APPLIANCES)) {
          const appliancesStore = db.createObjectStore(STORES.APPLIANCES, { keyPath: "id" });
          appliancesStore.createIndex("reference", "reference", { unique: false });
          appliancesStore.createIndex("brand", "brand", { unique: false });
          appliancesStore.createIndex("type", "type", { unique: false });
          appliancesStore.createIndex("dateAdded", "dateAdded", { unique: false });
          console.log("📦 Store 'appliances' créé");
        }

        // Store pour les associations appareil-pièce
        if (!db.objectStoreNames.contains(STORES.PART_ASSOCIATIONS)) {
          const associationsStore = db.createObjectStore(STORES.PART_ASSOCIATIONS, { keyPath: "id" });
          associationsStore.createIndex("applianceId", "applianceId", { unique: false });
          associationsStore.createIndex("partReference", "partReference", { unique: false });
          console.log("📦 Store 'appliancePartAssociations' créé");
        }

        // Store pour les sessions d'import
        if (!db.objectStoreNames.contains(STORES.IMPORT_SESSIONS)) {
          const sessionsStore = db.createObjectStore(STORES.IMPORT_SESSIONS, { keyPath: "id" });
          sessionsStore.createIndex("createdAt", "createdAt", { unique: false });
          console.log("📦 Store 'importSessions' créé");
        }

        // Store pour les références de pièces connues
        if (!db.objectStoreNames.contains(STORES.PART_REFERENCES)) {
          const partRefsStore = db.createObjectStore(STORES.PART_REFERENCES, { keyPath: "reference" });
          partRefsStore.createIndex("dateAdded", "dateAdded", { unique: false });
          console.log("📦 Store 'partReferences' créé");
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          const metadataStore = db.createObjectStore(STORES.METADATA, { keyPath: "key" });
          console.log("📦 Store 'metadata' créé");
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    await this.initPromise;
    
    if (!this.db) {
      throw new Error("Base de données non initialisée");
    }
    return this.db;
  }

  // === MÉTHODES POUR LES APPAREILS ===

  async saveAppliances(appliances: Appliance[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.APPLIANCES], "readwrite");
    const store = transaction.objectStore(STORES.APPLIANCES);

    const promises = appliances.map(appliance => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(appliance);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`✅ ${appliances.length} appareils sauvegardés dans IndexedDB`);
  }

  async loadAppliances(): Promise<Appliance[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.APPLIANCES], "readonly");
    const store = transaction.objectStore(STORES.APPLIANCES);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log(`📖 ${request.result.length} appareils chargés depuis IndexedDB`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAppliance(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.APPLIANCES], "readwrite");
    const store = transaction.objectStore(STORES.APPLIANCES);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAppliances(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.APPLIANCES], "readwrite");
    const store = transaction.objectStore(STORES.APPLIANCES);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log("🗑️ Tous les appareils supprimés d'IndexedDB");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // === MÉTHODES POUR LES ASSOCIATIONS ===

  async saveAssociations(associations: AppliancePartAssociation[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PART_ASSOCIATIONS], "readwrite");
    const store = transaction.objectStore(STORES.PART_ASSOCIATIONS);

    const promises = associations.map(association => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(association);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`✅ ${associations.length} associations sauvegardées dans IndexedDB`);
  }

  async loadAssociations(): Promise<AppliancePartAssociation[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PART_ASSOCIATIONS], "readonly");
    const store = transaction.objectStore(STORES.PART_ASSOCIATIONS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log(`📖 ${request.result.length} associations chargées depuis IndexedDB`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAssociation(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PART_ASSOCIATIONS], "readwrite");
    const store = transaction.objectStore(STORES.PART_ASSOCIATIONS);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // === MÉTHODES POUR LES RÉFÉRENCES DE PIÈCES ===

  async savePartReferences(partReferences: string[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PART_REFERENCES], "readwrite");
    const store = transaction.objectStore(STORES.PART_REFERENCES);

    const promises = partReferences.map(reference => {
      return new Promise<void>((resolve, reject) => {
        const partRefObj = {
          reference,
          dateAdded: new Date().toISOString()
        };
        const request = store.put(partRefObj);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`✅ ${partReferences.length} références de pièces sauvegardées dans IndexedDB`);
  }

  async loadPartReferences(): Promise<string[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PART_REFERENCES], "readonly");
    const store = transaction.objectStore(STORES.PART_REFERENCES);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const references = request.result.map((item: any) => item.reference);
        console.log(`📖 ${references.length} références de pièces chargées depuis IndexedDB`);
        resolve(references);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // === MÉTHODES POUR LES SESSIONS D'IMPORT ===

  async saveImportSessions(sessions: Record<string, ImportSession>): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.IMPORT_SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.IMPORT_SESSIONS);

    const sessionArray = Object.values(sessions);
    const promises = sessionArray.map(session => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(session);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`✅ ${sessionArray.length} sessions d'import sauvegardées dans IndexedDB`);
  }

  async loadImportSessions(): Promise<Record<string, ImportSession>> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.IMPORT_SESSIONS], "readonly");
    const store = transaction.objectStore(STORES.IMPORT_SESSIONS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const sessions: Record<string, ImportSession> = {};
        request.result.forEach((session: ImportSession) => {
          sessions[session.id] = session;
        });
        console.log(`📖 ${Object.keys(sessions).length} sessions d'import chargées depuis IndexedDB`);
        resolve(sessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // === MÉTHODES POUR LES MÉTADONNÉES ===

  async saveMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.METADATA], "readwrite");
    const store = transaction.objectStore(STORES.METADATA);

    const metadata: MetadataEntry = {
      key,
      value,
      lastUpdated: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadMetadata(key: string): Promise<any> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.METADATA], "readonly");
    const store = transaction.objectStore(STORES.METADATA);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // === MÉTHODES UTILITAIRES ===

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = Object.values(STORES);
    
    const transaction = db.transaction(storeNames, "readwrite");
    
    const promises = storeNames.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log("🗑️ Toutes les données supprimées d'IndexedDB");
  }

  async getStorageInfo(): Promise<{
    appliances: number;
    associations: number;
    sessions: number;
    partReferences: number;
  }> {
    const db = await this.ensureDB();
    
    const counts = await Promise.all([
      this.getStoreCount(db, STORES.APPLIANCES),
      this.getStoreCount(db, STORES.PART_ASSOCIATIONS),
      this.getStoreCount(db, STORES.IMPORT_SESSIONS),
      this.getStoreCount(db, STORES.PART_REFERENCES)
    ]);

    return {
      appliances: counts[0],
      associations: counts[1],
      sessions: counts[2],
      partReferences: counts[3]
    };
  }

  private async getStoreCount(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Instance singleton
export const indexedDBService = new IndexedDBService();
