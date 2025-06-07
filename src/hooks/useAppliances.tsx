import { useState, useEffect, useCallback } from "react";
import { Appliance, ImportSession, AppliancePartAssociation } from "../types/appliance";
import { defaultAppliances } from "../data/defaultAppliances";
import { indexedDBService } from "@/services/indexedDBService";
import { useMigration } from "./useMigration";
import { toast } from "sonner";

export const useAppliances = () => {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [filteredAppliances, setFilteredAppliances] = useState<Appliance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [knownBrands, setKnownBrands] = useState<string[]>([]);
  const [knownTypes, setKnownTypes] = useState<string[]>([]);
  const [knownPartReferences, setKnownPartReferences] = useState<string[]>([]);
  const [needsUpdate, setNeedsUpdate] = useState<Appliance[]>([]);
  const [appliancePartAssociations, setAppliancePartAssociations] = useState<AppliancePartAssociation[]>([]);
  const [importSessions, setImportSessions] = useState<Record<string, ImportSession>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Utiliser le hook de migration
  const { isReady: migrationReady } = useMigration();

  // Charger les données depuis IndexedDB une fois la migration terminée
  useEffect(() => {
    if (migrationReady) {
      loadDataFromIndexedDB();
    }
  }, [migrationReady]);

  const loadDataFromIndexedDB = async () => {
    try {
      console.log("📖 Chargement des données depuis IndexedDB...");
      setIsLoading(true);

      // Charger toutes les données en parallèle
      const [
        loadedAppliances,
        loadedAssociations,
        loadedPartRefs,
        loadedSessions
      ] = await Promise.all([
        indexedDBService.loadAppliances(),
        indexedDBService.loadAssociations(),
        indexedDBService.loadPartReferences(),
        indexedDBService.loadImportSessions()
      ]);

      // Si aucun appareil n'est trouvé, utiliser les données par défaut
      if (loadedAppliances.length === 0) {
        console.log("📦 Aucun appareil trouvé, utilisation des données par défaut");
        setAppliances(defaultAppliances);
        await indexedDBService.saveAppliances(defaultAppliances);
      } else {
        setAppliances(loadedAppliances);
      }

      setAppliancePartAssociations(loadedAssociations);
      setKnownPartReferences(loadedPartRefs);
      setImportSessions(loadedSessions);

      console.log("✅ Données chargées depuis IndexedDB");
    } catch (error) {
      console.error("❌ Erreur lors du chargement depuis IndexedDB:", error);
      toast.error("Erreur lors du chargement des données");
      
      // Fallback vers les données par défaut
      setAppliances(defaultAppliances);
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les appareils dans IndexedDB (avec debouncing automatique)
  const saveAppliancesToDB = useCallback(async (appliancesToSave: Appliance[]) => {
    if (!migrationReady || appliancesToSave.length === 0) return;

    try {
      await indexedDBService.saveAppliances(appliancesToSave);
    } catch (error) {
      console.error("❌ Erreur sauvegarde appareils:", error);
      toast.error("Erreur lors de la sauvegarde des appareils");
    }
  }, [migrationReady]);

  // Sauvegarder les associations dans IndexedDB
  const saveAssociationsToDB = useCallback(async (associationsToSave: AppliancePartAssociation[]) => {
    if (!migrationReady || associationsToSave.length === 0) return;

    try {
      await indexedDBService.saveAssociations(associationsToSave);
    } catch (error) {
      console.error("❌ Erreur sauvegarde associations:", error);
      toast.error("Erreur lors de la sauvegarde des associations");
    }
  }, [migrationReady]);

  // Sauvegarder les sessions d'import dans IndexedDB
  const saveSessionsToDB = useCallback(async (sessionsToSave: Record<string, ImportSession>) => {
    if (!migrationReady || Object.keys(sessionsToSave).length === 0) return;

    try {
      await indexedDBService.saveImportSessions(sessionsToSave);
    } catch (error) {
      console.error("❌ Erreur sauvegarde sessions:", error);
      toast.error("Erreur lors de la sauvegarde des sessions");
    }
  }, [migrationReady]);

  // Sauvegarder les références de pièces dans IndexedDB
  const savePartRefsToDB = useCallback(async (partRefsToSave: string[]) => {
    if (!migrationReady || partRefsToSave.length === 0) return;

    try {
      await indexedDBService.savePartReferences(partRefsToSave);
    } catch (error) {
      console.error("❌ Erreur sauvegarde références:", error);
      toast.error("Erreur lors de la sauvegarde des références");
    }
  }, [migrationReady]);

  // Sauvegarder automatiquement les appareils quand ils changent
  useEffect(() => {
    if (migrationReady && appliances.length > 0) {
      saveAppliancesToDB(appliances);
    }
  }, [appliances, saveAppliancesToDB, migrationReady]);

  // Sauvegarder automatiquement les associations quand elles changent
  useEffect(() => {
    if (migrationReady && appliancePartAssociations.length > 0) {
      saveAssociationsToDB(appliancePartAssociations);
    }
  }, [appliancePartAssociations, saveAssociationsToDB, migrationReady]);

  // Sauvegarder automatiquement les sessions quand elles changent
  useEffect(() => {
    if (migrationReady && Object.keys(importSessions).length > 0) {
      saveSessionsToDB(importSessions);
    }
  }, [importSessions, saveSessionsToDB, migrationReady]);

  // Sauvegarder automatiquement les références quand elles changent
  useEffect(() => {
    if (migrationReady && knownPartReferences.length > 0) {
      savePartRefsToDB(knownPartReferences);
    }
  }, [knownPartReferences, savePartRefsToDB, migrationReady]);

  // Extraire les marques et types connus
  useEffect(() => {
    const brands = [...new Set(appliances.map(item => item.brand))].filter(Boolean);
    const types = [...new Set(appliances.map(item => item.type))].filter(Boolean);
    setKnownBrands(brands);
    setKnownTypes(types);
    
    // Identifier les appareils qui nécessitent une mise à jour
    const appliancesNeedingUpdate = appliances.filter(
      item => !item.brand || item.brand.trim() === "" || !item.type || item.type.trim() === ""
    );
    setNeedsUpdate(appliancesNeedingUpdate);
  }, [appliances]);

  // Filtrer les appareils en fonction de la recherche
  useEffect(() => {
    if (searchQuery) {
      // Vérifier si la recherche correspond à une référence de pièce
      if (knownPartReferences.includes(searchQuery)) {
        const appliancesForPart = getAppliancesByPartReference(searchQuery);
        setFilteredAppliances(appliancesForPart);
        return;
      }
      
      // Sinon, recherche standard par référence, marque ou type
      const filtered = appliances.filter(
        appliance =>
          appliance.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (appliance.commercialRef && appliance.commercialRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
          appliance.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appliance.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAppliances(filtered);
    } else {
      setFilteredAppliances(appliances);
    }
  }, [searchQuery, appliances, knownPartReferences, appliancePartAssociations]);

  // Ajouter un nouvel appareil
  const addAppliance = (newAppliance: Omit<Appliance, "id" | "dateAdded">) => {
    const applianceToAdd: Appliance = {
      ...newAppliance,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split("T")[0]
    };
    setAppliances(prev => [...prev, applianceToAdd]);
    return applianceToAdd;
  };

  // Modifier un appareil existant
  const updateAppliance = (updatedAppliance: Appliance) => {
    setAppliances(prev => 
      prev.map(app => 
        app.id === updatedAppliance.id ? updatedAppliance : app
      )
    );
  };

  // Mettre à jour plusieurs appareils à la fois
  const updateMultipleAppliances = (ids: string[], updates: Partial<Appliance>) => {
    setAppliances(prev => 
      prev.map(app => 
        ids.includes(app.id) ? { ...app, ...updates, lastUpdated: new Date().toISOString() } : app
      )
    );
    
    return ids.length;
  };

  // Importer plusieurs appareils avec une approche corrigée pour l'association
  const importAppliances = useCallback(async (newAppliances: Appliance[]): Promise<{
    importedCount: number;
    importedIds: string[];
  }> => {
    console.log("=== DÉBUT IMPORT APPAREILS AVEC ASSOCIATION CORRIGÉE ===");
    console.log("Appareils à importer:", newAppliances.length);
    
    if (newAppliances.length === 0) {
      console.log("=== FIN IMPORT (AUCUN APPAREIL) ===");
      return { importedCount: 0, importedIds: [] };
    }
    
    // Récupérer l'état actuel des appareils
    const currentAppliances = appliances;
    const existingRefs = new Set(currentAppliances.map(app => app.reference));
    const uniqueNewAppliances = newAppliances.filter(app => !existingRefs.has(app.reference));
    
    console.log("Appareils existants:", currentAppliances.length);
    console.log("Nouveaux appareils uniques:", uniqueNewAppliances.length);
    
    if (uniqueNewAppliances.length === 0) {
      console.log("=== FIN IMPORT (AUCUN NOUVEAU) ===");
      return { importedCount: 0, importedIds: [] };
    }
    
    // Ajouter les nouveaux appareils avec des IDs générés
    const appliancesToAdd = uniqueNewAppliances.map(app => ({
      ...app,
      id: app.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dateAdded: app.dateAdded || new Date().toISOString().split("T")[0]
    }));
    
    const importedIds = appliancesToAdd.map(app => app.id);
    
    // Mettre à jour l'état avec une approche synchrone
    return new Promise((resolve) => {
      setAppliances(prev => {
        const updated = [...prev, ...appliancesToAdd];
        console.log("État de la base après import:", updated.length, "appareils");
        console.log("IDs des nouveaux appareils:", importedIds);
        console.log("=== FIN IMPORT APPAREILS AVEC ASSOCIATION CORRIGÉE ===");
        
        // Résoudre avec les informations d'import
        setTimeout(() => {
          resolve({
            importedCount: uniqueNewAppliances.length,
            importedIds: importedIds
          });
        }, 0);
        
        return updated;
      });
    });
  }, [appliances]);

  // Supprimer un appareil (maintenant avec IndexedDB)
  const deleteAppliance = async (id: string) => {
    try {
      setAppliances(prev => prev.filter(appliance => appliance.id !== id));
      
      // Supprimer également les associations avec cette référence d'appareil
      setAppliancePartAssociations(prev => 
        prev.filter(assoc => assoc.applianceId !== id)
      );

      // Supprimer de IndexedDB
      if (migrationReady) {
        await indexedDBService.deleteAppliance(id);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'appareil");
    }
  };
  
  // Vider complètement la base de données (maintenant avec IndexedDB)
  const clearDatabase = async () => {
    try {
      setAppliances([]);
      setAppliancePartAssociations([]);
      setImportSessions({});
      setKnownPartReferences([]);

      if (migrationReady) {
        await indexedDBService.clearAllData();
      }
      
      console.log("=== BASE DE DONNÉES NETTOYÉE (INDEXEDDB) ===");
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage:", error);
      toast.error("Erreur lors du nettoyage de la base de données");
    }
  };

  // Nettoyer la base de données (supprimer les doublons)
  const cleanDatabase = () => {
    // Utiliser un Map pour ne garder que la première occurrence de chaque référence
    const uniqueAppliances = new Map<string, Appliance>();
    
    appliances.forEach(appliance => {
      const key = appliance.reference;
      if (!uniqueAppliances.has(key)) {
        uniqueAppliances.set(key, appliance);
      }
    });
    
    const cleanedAppliances = Array.from(uniqueAppliances.values());
    setAppliances(cleanedAppliances);
    
    return appliances.length - cleanedAppliances.length; // Nombre de doublons supprimés
  };

  // Suggérer une marque basée sur la référence
  const suggestBrand = (reference: string): string | null => {
    // Chercher une correspondance exacte de référence
    const exactMatch = appliances.find(a => a.reference === reference);
    if (exactMatch && exactMatch.brand) return exactMatch.brand;
    
    // Chercher par référence commerciale
    const commercialMatch = appliances.find(a => a.commercialRef === reference);
    if (commercialMatch && commercialMatch.brand) return commercialMatch.brand;
    
    // Chercher une correspondance partielle (début de référence)
    const partialMatches = appliances.filter(a => 
      (a.reference && reference && 
        (reference.startsWith(a.reference.substring(0, 3)) || 
        a.reference.startsWith(reference.substring(0, 3)))) ||
      (a.commercialRef && reference && (
        reference.startsWith(a.commercialRef.substring(0, 3)) || 
        a.commercialRef.startsWith(reference.substring(0, 3))
      ))
    );
    
    if (partialMatches.length > 0) {
      // Grouper par marque et prendre la plus fréquente
      const brandCount: Record<string, number> = {};
      partialMatches.forEach(a => {
        if (a.brand) {
          brandCount[a.brand] = (brandCount[a.brand] || 0) + 1;
        }
      });
      
      let maxCount = 0;
      let suggestedBrand = null;
      
      Object.entries(brandCount).forEach(([brand, count]) => {
        if (count > maxCount) {
          maxCount = count;
          suggestedBrand = brand;
        }
      });
      
      return suggestedBrand;
    }
    
    return null;
  };

  // Suggérer un type basé sur la référence et/ou la marque
  const suggestType = (reference: string, brand: string): string | null => {
    // D'abord vérifier la combinaison référence + marque
    const brandMatches = appliances.filter(a => a.brand === brand);
    
    if (brandMatches.length > 0) {
      // Chercher une correspondance partielle de référence dans la même marque
      const refMatches = brandMatches.filter(a => 
        (a.reference && reference && 
          (reference.startsWith(a.reference.substring(0, 3)) || 
          a.reference.startsWith(reference.substring(0, 3)))) ||
        (a.commercialRef && reference && (
          reference.startsWith(a.commercialRef.substring(0, 3)) || 
          a.commercialRef.startsWith(reference.substring(0, 3))
        ))
      );
      
      if (refMatches.length > 0) {
        // Grouper par type et prendre le plus fréquent
        const typeCount: Record<string, number> = {};
        refMatches.forEach(a => {
          if (a.type) {
            typeCount[a.type] = (typeCount[a.type] || 0) + 1;
          }
        });
        
        let maxCount = 0;
        let suggestedType = null;
        
        Object.entries(typeCount).forEach(([type, count]) => {
          if (count > maxCount) {
            maxCount = count;
            suggestedType = type;
          }
        });
        
        return suggestedType;
      }
      
      // Si pas de correspondance de référence, prendre le type le plus courant pour cette marque
      const typeCount: Record<string, number> = {};
      brandMatches.forEach(a => {
        if (a.type) {
          typeCount[a.type] = (typeCount[a.type] || 0) + 1;
        }
      });
      
      let maxCount = 0;
      let suggestedType = null;
      
      Object.entries(typeCount).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          suggestedType = type;
        }
      });
      
      return suggestedType;
    }
    
    return null;
  };

  // Associer des appareils à une référence de pièce avec validation robuste et approche corrigée
  const associateApplicancesToPartReference = useCallback((applianceIds: string[], partReference: string) => {
    console.log("=== DÉBUT ASSOCIATION ROBUSTE CORRIGÉE ===");
    console.log("IDs reçus:", applianceIds);
    console.log("Référence pièce:", partReference);
    
    // Validation stricte des paramètres
    if (!Array.isArray(applianceIds) || applianceIds.length === 0) {
      console.error("ERREUR: IDs d'appareils invalides ou vides");
      return 0;
    }
    
    if (!partReference || typeof partReference !== 'string' || partReference.trim() === '') {
      console.error("ERREUR: Référence de pièce invalide");
      return 0;
    }
    
    // Accéder à l'état actuel des appareils pour validation
    const currentAppliances = appliances;
    console.log("État actuel pour validation:", currentAppliances.length, "appareils");
    
    // Valider que TOUS les IDs existent
    const validationResults = applianceIds.map(id => {
      const found = currentAppliances.find(app => app.id === id);
      return { id, found: !!found, appliance: found };
    });
    
    const validIds = validationResults.filter(r => r.found).map(r => r.id);
    const invalidIds = validationResults.filter(r => !r.found).map(r => r.id);
    
    console.log("IDs valides:", validIds);
    console.log("IDs invalides:", invalidIds);
    
    if (validIds.length === 0) {
      console.error("ERREUR CRITIQUE: Aucun appareil valide trouvé");
      return 0;
    }
    
    if (invalidIds.length > 0) {
      console.warn("ATTENTION: Certains IDs sont invalides:", invalidIds);
    }
    
    // Ajouter la référence de pièce aux références connues
    setKnownPartReferences(currentRefs => {
      if (!currentRefs.includes(partReference)) {
        const updatedRefs = [...currentRefs, partReference];
        console.log("Nouvelle référence de pièce ajoutée:", partReference);
        return updatedRefs;
      }
      return currentRefs;
    });
    
    // Créer les associations sans doublons
    setAppliancePartAssociations(currentAssociations => {
      console.log("Associations actuelles:", currentAssociations.length);
      
      const newAssociations: AppliancePartAssociation[] = [];
      const existingKeys = new Set(currentAssociations.map(a => `${a.applianceId}-${a.partReference}`));
      
      validIds.forEach(id => {
        const key = `${id}-${partReference}`;
        if (!existingKeys.has(key)) {
          newAssociations.push({
            id: `${id}-${partReference}-${Date.now()}-${Math.random()}`,
            applianceId: id,
            partReference,
            dateAssociated: new Date().toISOString()
          });
          console.log(`Nouvelle association créée pour ID: ${id}`);
        } else {
          console.log(`Association déjà existante pour ID: ${id}`);
        }
      });
      
      console.log("Nouvelles associations à créer:", newAssociations.length);
      
      if (newAssociations.length > 0) {
        const updated = [...currentAssociations, ...newAssociations];
        console.log("Total associations après ajout:", updated.length);
        return updated;
      }
      
      return currentAssociations;
    });
    
    console.log("=== FIN ASSOCIATION ROBUSTE CORRIGÉE ===");
    console.log("Appareils associés avec succès:", validIds.length);
    return validIds.length;
  }, [appliances]);

  // Supprimer une association entre un appareil et une référence de pièce
  const removeAppliancePartAssociation = (applianceId: string, partReference: string) => {
    setAppliancePartAssociations(prev => 
      prev.filter(assoc => !(assoc.applianceId === applianceId && assoc.partReference === partReference))
    );
  };

  // Récupérer les appareils compatibles avec une référence de pièce
  const getAppliancesByPartReference = (partReference: string): Appliance[] => {
    // Utiliser les associations pour trouver les IDs des appareils compatibles
    const applianceIds = appliancePartAssociations
      .filter(a => a.partReference === partReference)
      .map(a => a.applianceId);
    
    // Récupérer les appareils correspondants
    return appliances.filter(app => applianceIds.includes(app.id));
  };

  // Récupérer les références de pièces compatibles avec un appareil
  const getPartReferencesForAppliance = (applianceId: string): string[] => {
    return appliancePartAssociations
      .filter(a => a.applianceId === applianceId)
      .map(a => a.partReference);
  };
  
  // Sauvegarder une session d'importation
  const saveImportSession = (sessionId: string, session: ImportSession) => {
    setImportSessions(prev => ({
      ...prev,
      [sessionId]: session
    }));
  };
  
  // Récupérer une session d'importation
  const getImportSession = (sessionId: string): ImportSession | null => {
    return importSessions[sessionId] || null;
  };
  
  // Supprimer une session d'importation
  const deleteImportSession = (sessionId: string) => {
    setImportSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[sessionId];
      return newSessions;
    });
  };
  
  // Récupérer les appareils récents (triés par date d'ajout)
  const recentAppliances = [...appliances]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  
  // Récupérer les appareils avec le plus de références de pièces compatibles
  const appliancesWithMostPartRefs = [...appliances]
    .map(app => {
      const partRefCount = appliancePartAssociations.filter(a => a.applianceId === app.id).length;
      return { ...app, partRefCount };
    })
    .sort((a, b) => b.partRefCount - a.partRefCount)
    .filter(app => app.partRefCount > 0);

  return {
    appliances: filteredAppliances,
    allAppliances: appliances,
    needsUpdateCount: needsUpdate.length,
    appliancesNeedingUpdate: needsUpdate,
    searchQuery,
    setSearchQuery,
    addAppliance,
    updateAppliance,
    updateMultipleAppliances,
    importAppliances,
    deleteAppliance,
    clearDatabase,
    cleanDatabase,
    knownBrands,
    knownTypes,
    knownPartReferences,
    suggestBrand,
    suggestType,
    associateApplicancesToPartReference,
    removeAppliancePartAssociation,
    getAppliancesByPartReference,
    getPartReferencesForAppliance,
    saveImportSession,
    getImportSession,
    deleteImportSession,
    recentAppliances,
    appliancesWithMostPartRefs,
    isLoading,
    migrationReady
  };
};
