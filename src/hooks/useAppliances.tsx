import { useState, useEffect, useCallback } from "react";
import { Appliance, ImportSession, AppliancePartAssociation } from "../types/appliance";
import { defaultAppliances } from "../data/defaultAppliances";

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

  // Helper function to safely save to localStorage with error handling
  const safeSaveToLocalStorage = (key: string, data: any): boolean => {
    try {
      const jsonString = JSON.stringify(data);
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      
      console.log(`Tentative de sauvegarde ${key}: ${sizeInMB.toFixed(2)} MB`);
      
      // Check if data is too large (over 4MB as safety margin)
      if (sizeInMB > 4) {
        console.warn(`⚠️ Données trop volumineuses pour localStorage (${sizeInMB.toFixed(2)} MB). Sauvegarde ignorée.`);
        return false;
      }
      
      localStorage.setItem(key, jsonString);
      console.log(`✅ Sauvegarde réussie: ${key}`);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error(`❌ Quota localStorage dépassé pour ${key}. Taille des données trop importante.`);
        // Optionally show user notification here
        return false;
      } else {
        console.error(`❌ Erreur lors de la sauvegarde ${key}:`, error);
        return false;
      }
    }
  };

  // Charger les données depuis le localStorage ou utiliser les données par défaut
  useEffect(() => {
    const savedAppliances = localStorage.getItem("appliances");
    if (savedAppliances) {
      try {
        setAppliances(JSON.parse(savedAppliances));
      } catch (error) {
        console.error("Erreur lors du chargement des appareils:", error);
        setAppliances(defaultAppliances);
      }
    } else {
      setAppliances(defaultAppliances);
    }
    
    // Charger les références de pièces connues
    const savedPartRefs = localStorage.getItem("knownPartReferences");
    if (savedPartRefs) {
      try {
        setKnownPartReferences(JSON.parse(savedPartRefs));
      } catch (error) {
        console.error("Erreur lors du chargement des références de pièces:", error);
      }
    }
    
    // Charger les associations entre appareils et références de pièces
    const savedAssociations = localStorage.getItem("appliancePartAssociations");
    if (savedAssociations) {
      try {
        setAppliancePartAssociations(JSON.parse(savedAssociations));
      } catch (error) {
        console.error("Erreur lors du chargement des associations:", error);
      }
    }
    
    // Charger les sessions d'import
    const savedSessions = localStorage.getItem("importSessions");
    if (savedSessions) {
      try {
        setImportSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error("Erreur lors du chargement des sessions:", error);
      }
    }
  }, []);

  // Sauvegarder les données dans le localStorage quand elles changent avec protection
  useEffect(() => {
    if (appliances.length > 0) {
      const saved = safeSaveToLocalStorage("appliances", appliances);
      if (!saved) {
        console.warn(`⚠️ Impossible de sauvegarder ${appliances.length} appareils. Données trop volumineuses.`);
        // You could show a toast notification to the user here
      }
    }
  }, [appliances]);
  
  // Sauvegarder les associations quand elles changent
  useEffect(() => {
    if (appliancePartAssociations.length > 0) {
      safeSaveToLocalStorage("appliancePartAssociations", appliancePartAssociations);
    }
  }, [appliancePartAssociations]);
  
  // Sauvegarder les sessions d'import quand elles changent
  useEffect(() => {
    if (Object.keys(importSessions).length > 0) {
      safeSaveToLocalStorage("importSessions", importSessions);
    }
  }, [importSessions]);

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

  // Importer plusieurs appareils avec une approche améliorée et protection quota
  const importAppliances = useCallback((newAppliances: Appliance[]) => {
    console.log("=== DÉBUT IMPORT APPAREILS AVEC PROTECTION QUOTA ===");
    console.log("Appareils à importer:", newAppliances.length);
    
    if (newAppliances.length === 0) {
      console.log("=== FIN IMPORT (AUCUN APPAREIL) ===");
      return 0;
    }
    
    // Check storage capacity before importing large datasets
    const estimatedSize = JSON.stringify(newAppliances).length;
    const estimatedSizeMB = estimatedSize / (1024 * 1024);
    
    if (estimatedSizeMB > 3) {
      console.warn(`⚠️ Import volumineux détecté: ${estimatedSizeMB.toFixed(2)} MB`);
      console.warn("Les données pourraient ne pas être sauvegardées en localStorage");
    }
    
    // Vérifier les doublons par référence avec l'état actuel
    setAppliances(currentAppliances => {
      const existingRefs = new Set(currentAppliances.map(app => app.reference));
      const uniqueNewAppliances = newAppliances.filter(app => !existingRefs.has(app.reference));
      
      console.log("Appareils existants:", currentAppliances.length);
      console.log("Nouveaux appareils uniques:", uniqueNewAppliances.length);
      
      if (uniqueNewAppliances.length > 0) {
        // Ajouter les nouveaux appareils avec des IDs générés
        const appliancesToAdd = uniqueNewAppliances.map(app => ({
          ...app,
          id: app.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          dateAdded: app.dateAdded || new Date().toISOString().split("T")[0]
        }));
        
        const updated = [...currentAppliances, ...appliancesToAdd];
        console.log("État de la base après import:", updated.length, "appareils");
        
        // Warn if dataset is getting very large
        if (updated.length > 50000) {
          console.warn(`⚠️ Base de données très volumineuse: ${updated.length} appareils`);
          console.warn("Performances et sauvegarde pourraient être impactées");
        }
        
        console.log("=== FIN IMPORT APPAREILS AVEC PROTECTION QUOTA ===");
        return updated;
      }
      
      console.log("=== FIN IMPORT (AUCUN NOUVEAU) ===");
      return currentAppliances;
    });
    
    // Retourner le nombre d'appareils uniques importés
    const existingRefs = new Set(appliances.map(app => app.reference));
    const uniqueCount = newAppliances.filter(app => !existingRefs.has(app.reference)).length;
    return uniqueCount;
  }, [appliances]);

  // Supprimer un appareil
  const deleteAppliance = (id: string) => {
    setAppliances(prev => prev.filter(appliance => appliance.id !== id));
    
    // Supprimer également les associations avec cette référence d'appareil
    setAppliancePartAssociations(prev => 
      prev.filter(assoc => assoc.applianceId !== id)
    );
  };
  
  // Vider complètement la base de données
  const clearDatabase = () => {
    setAppliances([]);
    setAppliancePartAssociations([]);
    setImportSessions({});
    setKnownPartReferences([]);
    localStorage.removeItem("appliances");
    localStorage.removeItem("knownPartReferences");
    localStorage.removeItem("appliancePartAssociations");
    localStorage.removeItem("importSessions");
    console.log("=== BASE DE DONNÉES NETTOYÉE ===");
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

  // Associer des appareils à une référence de pièce avec validation robuste
  const associateApplicancesToPartReference = useCallback((applianceIds: string[], partReference: string) => {
    console.log("=== DÉBUT ASSOCIATION ROBUSTE ===");
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
    
    let successCount = 0;
    
    // Utiliser une fonction qui accède à l'état le plus récent
    setAppliances(currentAppliances => {
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
        return currentAppliances;
      }
      
      if (invalidIds.length > 0) {
        console.warn("ATTENTION: Certains IDs sont invalides:", invalidIds);
      }
      
      successCount = validIds.length;
      
      // Ajouter la référence de pièce aux références connues
      setKnownPartReferences(currentRefs => {
        if (!currentRefs.includes(partReference)) {
          const updatedRefs = [...currentRefs, partReference];
          safeSaveToLocalStorage("knownPartReferences", updatedRefs);
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
      
      return currentAppliances;
    });
    
    console.log("=== FIN ASSOCIATION ROBUSTE ===");
    console.log("Appareils associés avec succès:", successCount);
    return successCount;
  }, []);

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
    appliancesWithMostPartRefs
  };
};
