import Database from 'better-sqlite3';
import { Appliance, ImportSession, AppliancePartAssociation } from "@/types/appliance";

// Configuration de la base de données SQLite
const DB_PATH = 'appliance_database.db';

// Interface pour le store de métadonnées
interface MetadataEntry {
  key: string;
  value: string;
  lastUpdated: string;
}

interface PartReference {
  reference: string;
  dateAdded: string;
}

class SQLiteService {
  private db: Database.Database | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      console.log("🔧 Initialisation SQLite...");
      
      // Créer ou ouvrir la base de données
      this.db = new Database(DB_PATH);
      
      // Activer les clés étrangères
      this.db.pragma('foreign_keys = ON');
      
      // Créer les tables
      this.createTables();
      
      console.log("✅ SQLite initialisé avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation SQLite:", error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) throw new Error("Base de données non initialisée");

    // Table des appareils
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS appliances (
        id TEXT PRIMARY KEY,
        reference TEXT NOT NULL,
        commercialRef TEXT,
        brand TEXT NOT NULL,
        type TEXT NOT NULL,
        dateAdded TEXT NOT NULL,
        lastUpdated TEXT
      )
    `);

    // Index pour optimiser les recherches
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_appliances_reference ON appliances(reference);
      CREATE INDEX IF NOT EXISTS idx_appliances_brand ON appliances(brand);
      CREATE INDEX IF NOT EXISTS idx_appliances_type ON appliances(type);
      CREATE INDEX IF NOT EXISTS idx_appliances_dateAdded ON appliances(dateAdded);
    `);

    // Table des associations appareil-pièce
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS appliance_part_associations (
        id TEXT PRIMARY KEY,
        applianceId TEXT NOT NULL,
        partReference TEXT NOT NULL,
        dateAssociated TEXT NOT NULL,
        FOREIGN KEY (applianceId) REFERENCES appliances(id) ON DELETE CASCADE
      )
    `);

    // Index pour optimiser les associations
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_associations_applianceId ON appliance_part_associations(applianceId);
      CREATE INDEX IF NOT EXISTS idx_associations_partReference ON appliance_part_associations(partReference);
    `);

    // Table des sessions d'import
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS import_sessions (
        id TEXT PRIMARY KEY,
        name TEXT,
        partReference TEXT,
        appliances TEXT NOT NULL,
        incompleteAppliances TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `);

    // Table des références de pièces
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS part_references (
        reference TEXT PRIMARY KEY,
        dateAdded TEXT NOT NULL
      )
    `);

    // Table des métadonnées
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        lastUpdated TEXT NOT NULL
      )
    `);

    console.log("📦 Tables SQLite créées");
  }

  private ensureDB(): Database.Database {
    if (!this.db) {
      throw new Error("Base de données non initialisée");
    }
    return this.db;
  }

  // === MÉTHODES POUR LES APPAREILS ===

  async saveAppliances(appliances: Appliance[]): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO appliances 
      (id, reference, commercialRef, brand, type, dateAdded, lastUpdated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((appliances: Appliance[]) => {
      for (const appliance of appliances) {
        stmt.run(
          appliance.id,
          appliance.reference,
          appliance.commercialRef || null,
          appliance.brand,
          appliance.type,
          appliance.dateAdded,
          appliance.lastUpdated || null
        );
      }
    });

    transaction(appliances);
    console.log(`✅ ${appliances.length} appareils sauvegardés dans SQLite`);
  }

  async loadAppliances(): Promise<Appliance[]> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('SELECT * FROM appliances ORDER BY dateAdded DESC');
    const rows = stmt.all() as any[];
    
    const appliances: Appliance[] = rows.map(row => ({
      id: row.id,
      reference: row.reference,
      commercialRef: row.commercialRef,
      brand: row.brand,
      type: row.type,
      dateAdded: row.dateAdded,
      lastUpdated: row.lastUpdated
    }));

    console.log(`📖 ${appliances.length} appareils chargés depuis SQLite`);
    return appliances;
  }

  async deleteAppliance(id: string): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('DELETE FROM appliances WHERE id = ?');
    stmt.run(id);
  }

  async clearAppliances(): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('DELETE FROM appliances');
    stmt.run();
    
    console.log("🗑️ Tous les appareils supprimés de SQLite");
  }

  // === MÉTHODES POUR LES ASSOCIATIONS ===

  async saveAssociations(associations: AppliancePartAssociation[]): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO appliance_part_associations 
      (id, applianceId, partReference, dateAssociated)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction((associations: AppliancePartAssociation[]) => {
      for (const association of associations) {
        stmt.run(
          association.id,
          association.applianceId,
          association.partReference,
          association.dateAssociated
        );
      }
    });

    transaction(associations);
    console.log(`✅ ${associations.length} associations sauvegardées dans SQLite`);
  }

  async loadAssociations(): Promise<AppliancePartAssociation[]> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('SELECT * FROM appliance_part_associations');
    const rows = stmt.all() as any[];
    
    const associations: AppliancePartAssociation[] = rows.map(row => ({
      id: row.id,
      applianceId: row.applianceId,
      partReference: row.partReference,
      dateAssociated: row.dateAssociated
    }));

    console.log(`📖 ${associations.length} associations chargées depuis SQLite`);
    return associations;
  }

  async deleteAssociation(id: string): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('DELETE FROM appliance_part_associations WHERE id = ?');
    stmt.run(id);
  }

  // === MÉTHODES POUR LES RÉFÉRENCES DE PIÈCES ===

  async savePartReferences(partReferences: string[]): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO part_references (reference, dateAdded)
      VALUES (?, ?)
    `);

    const transaction = db.transaction((partReferences: string[]) => {
      for (const reference of partReferences) {
        stmt.run(reference, new Date().toISOString());
      }
    });

    transaction(partReferences);
    console.log(`✅ ${partReferences.length} références de pièces sauvegardées dans SQLite`);
  }

  async loadPartReferences(): Promise<string[]> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('SELECT reference FROM part_references ORDER BY dateAdded DESC');
    const rows = stmt.all() as PartReference[];
    
    const references = rows.map(row => row.reference);
    console.log(`📖 ${references.length} références de pièces chargées depuis SQLite`);
    return references;
  }

  // === MÉTHODES POUR LES SESSIONS D'IMPORT ===

  async saveImportSessions(sessions: Record<string, ImportSession>): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO import_sessions 
      (id, name, partReference, appliances, incompleteAppliances, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sessionArray = Object.values(sessions);
    const transaction = db.transaction((sessions: ImportSession[]) => {
      for (const session of sessions) {
        stmt.run(
          session.id,
          session.name || null,
          session.partReference || null,
          JSON.stringify(session.appliances),
          JSON.stringify(session.incompleteAppliances || []),
          session.createdAt,
          session.updatedAt || null
        );
      }
    });

    transaction(sessionArray);
    console.log(`✅ ${sessionArray.length} sessions d'import sauvegardées dans SQLite`);
  }

  async loadImportSessions(): Promise<Record<string, ImportSession>> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('SELECT * FROM import_sessions ORDER BY createdAt DESC');
    const rows = stmt.all() as any[];
    
    const sessions: Record<string, ImportSession> = {};
    rows.forEach((row: any) => {
      sessions[row.id] = {
        id: row.id,
        name: row.name,
        partReference: row.partReference,
        appliances: JSON.parse(row.appliances || '[]'),
        incompleteAppliances: JSON.parse(row.incompleteAppliances || '[]'),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
    });

    console.log(`📖 ${Object.keys(sessions).length} sessions d'import chargées depuis SQLite`);
    return sessions;
  }

  // === MÉTHODES POUR LES MÉTADONNÉES ===

  async saveMetadata(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO metadata (key, value, lastUpdated)
      VALUES (?, ?, ?)
    `);

    stmt.run(key, JSON.stringify(value), new Date().toISOString());
  }

  async loadMetadata(key: string): Promise<any> {
    const db = this.ensureDB();
    
    const stmt = db.prepare('SELECT value FROM metadata WHERE key = ?');
    const row = stmt.get(key) as MetadataEntry | undefined;
    
    if (row?.value) {
      try {
        return JSON.parse(row.value);
      } catch {
        return row.value;
      }
    }
    return null;
  }

  // === MÉTHODES UTILITAIRES ===

  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    
    const transaction = db.transaction(() => {
      db.exec('DELETE FROM appliances');
      db.exec('DELETE FROM appliance_part_associations');
      db.exec('DELETE FROM import_sessions');
      db.exec('DELETE FROM part_references');
      db.exec('DELETE FROM metadata');
    });

    transaction();
    console.log("🗑️ Toutes les données supprimées de SQLite");
  }

  async getStorageInfo(): Promise<{
    appliances: number;
    associations: number;
    sessions: number;
    partReferences: number;
  }> {
    const db = this.ensureDB();

    const applianceCount = db.prepare('SELECT COUNT(*) as count FROM appliances').get() as { count: number };
    const associationCount = db.prepare('SELECT COUNT(*) as count FROM appliance_part_associations').get() as { count: number };
    const sessionCount = db.prepare('SELECT COUNT(*) as count FROM import_sessions').get() as { count: number };
    const partRefCount = db.prepare('SELECT COUNT(*) as count FROM part_references').get() as { count: number };

    return {
      appliances: applianceCount.count,
      associations: associationCount.count,
      sessions: sessionCount.count,
      partReferences: partRefCount.count
    };
  }

  // Fermer la base de données
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instance singleton
export const sqliteService = new SQLiteService();