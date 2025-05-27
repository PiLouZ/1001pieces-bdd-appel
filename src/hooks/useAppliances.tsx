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

  // Charger les données depuis le localStorage ou utiliser les données par défaut
  useEffect(() => {
    const savedAppliances = localStorage.getItem("appliances");
    if (savedAppliances) {
      setAppliances(JSON.parse(savedAppliances));
    } else {
      setAppliances(defaultAppliances);
    }
    
    // Charger les références de pièces connues
    const savedPartRefs = localStorage.getItem("knownPartReferences");
    if (savedPartRefs) {
      setKnownPartReferences(JSON.parse(savedPartRefs));
    }
    
    // Charger les associations entre appareils et références de pièces
    const savedAssociations = localStorage.getItem("appliancePartAssociations");
    if (savedAssociations) {
      setAppliancePartAssociations(JSON.parse(savedAssociations));
    }
    
    // Charger les sessions d'import
    const savedSessions = localStorage.getItem("importSessions");
    if (savedSessions) {
      setImportSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Sauvegarder les données dans le localStorage quand elles changent
  useEffect(() => {
    if (appliances.length > 0) {
      localStorage.setItem("appliances", JSON.stringify(appliances));
    }
  }, [appliances]);
  
  // Sauvegarder les associations quand elles changent
  useEffect(() => {
    if (appliancePartAssociations.length > 0) {
      localStorage.setItem("appliancePartAssociations", JSON.stringify(appliancePartAssociations));
    }
  }, [appliancePartAssociations]);
  
  // Sauvegarder les sessions d'import quand elles changent
  useEffect(() => {
    if (Object.keys(importSessions).length > 0) {
      localStorage.setItem("importSessions", JSON.stringify(importSessions));
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

  // Importer plusieurs appareils avec une approche améliorée
  const importAppliances = useCallback((newAppliances: Appliance[]) => {
    console.log("=== DÉBUT IMPORT APPAREILS ===");
    console.log("Appareils à importer:", newAppliances.length);
    
    // Vérifier les doublons par référence
    const existingRefs = new Set(appliances.map(app => app.reference));
    const uniqueNewAppliances = newAppliances.filter(app => !existingRefs.has(app.reference));
    
    console.log("Appareils existants (références):", Array.from(existingRefs));
    console.log("Nouveaux appareils uniques:", uniqueNewAppliances.length);
    
    if (uniqueNewAppliances.length > 0) {
      // Ajouter les nouveaux appareils avec des IDs générés de façon cohérente
      const appliancesToAdd = uniqueNewAppliances.map(app => ({
        ...app,
        id: app.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        dateAdded: app.dateAdded || new Date().toISOString().split("T")[0]
      }));
      
      console.log("Appareils avec IDs générés:", appliancesToAdd.map(a => ({ ref: a.reference, id: a.id })));
      
      setAppliances(prev => {
        const updated = [...prev, ...appliancesToAdd];
        console.log("État de la base après import:", updated.length, "appareils");
        return updated;
      });
      
      console.log("=== FIN IMPORT APPAREILS ===");
      return uniqueNewAppliances.length;
    }
    
    console.log("=== FIN IMPORT APPAREILS (AUCUN NOUVEAU) ===");
    return 0;
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
    localStorage.removeItem("appliances");
    localStorage.removeItem("knownPartReferences");
    localStorage.removeItem("appliancePartAssociations");
    localStorage.removeItem("importSessions");
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

  // Associer des appareils à une référence de pièce avec une approche améliorée
  const associateApplicancesToPartReference = useCallback((applianceIds: string[], partReference: string) => {
    console.log("=== DÉBUT FONCTION ASSOCIATION AMÉLIORÉE ===");
    console.log("IDs reçus:", applianceIds);
    console.log("Type des IDs:", typeof applianceIds, Array.isArray(applianceIds));
    console.log("Référence pièce:", partReference);
    console.log("Type de la référence:", typeof partReference);
    
    // Validation des paramètres
    if (!Array.isArray(applianceIds)) {
      console.error("ERREUR: applianceIds n'est pas un tableau");
      return 0;
    }
    
    if (!partReference || typeof partReference !== 'string' || partReference.trim() === '') {
      console.error("ERREUR: partReference invalide");
      return 0;
    }
    
    if (applianceIds.length === 0) {
      console.error("ERREUR: Aucun ID d'appareil fourni");
      return 0;
    }
    
    // Utiliser une fonction de rappel pour accéder au state le plus récent
    let successCount = 0;
    
    setAppliances(currentAppliances => {
      console.log("État actuel de la base d'appareils dans setAppliances:", currentAppliances.length, "appareils");
      console.log("Détail des appareils:", currentAppliances.map(a => ({ id: a.id, ref: a.reference })));
      
      // Vérifier que les appareils existent dans la base
      const validationResults = applianceIds.map(id => {
        const found = currentAppliances.find(app => app.id === id);
        console.log(`Validation ID ${id}: ${found ? 'TROUVÉ' : 'NON TROUVÉ'}`);
        if (found) {
          console.log(`  -> Appareil: ${found.reference} (${found.brand} ${found.type})`);
        }
        return { id, found: !!found, appliance: found };
      });
      
      const validIds = validationResults.filter(result => result.found).map(result => result.id);
      const invalidIds = validationResults.filter(result => !result.found).map(result => result.id);
      
      console.log("IDs valides:", validIds);
      console.log("IDs invalides:", invalidIds);
      
      if (validIds.length === 0) {
        console.error("ERREUR CRITIQUE: Aucun appareil valide trouvé pour l'association");
        return currentAppliances; // Retourner l'état inchangé
      }
      
      successCount = validIds.length;
      
      // Sauvegarder la référence de pièce si elle n'existe pas déjà
      setKnownPartReferences(currentRefs => {
        if (!currentRefs.includes(partReference)) {
          const updatedRefs = [...currentRefs, partReference];
          localStorage.setItem("knownPartReferences", JSON.stringify(updatedRefs));
          console.log("Nouvelle référence de pièce ajoutée:", partReference);
          return updatedRefs;
        } else {
          console.log("Référence de pièce déjà connue:", partReference);
          return currentRefs;
        }
      });
      
      // Créer les associations
      setAppliancePartAssociations(currentAssociations => {
        console.log("Associations actuelles:", currentAssociations.length);
        const existingAssociations = currentAssociations.filter(
          assoc => assoc.partReference === partReference && validIds.includes(assoc.applianceId)
        );
        console.log("Associations existantes pour cette référence:", existingAssociations.length);
        
        // Créer de nouvelles associations (éviter les doublons)
        const newAssociations: AppliancePartAssociation[] = [];
        const existingKeys = new Set(currentAssociations.map(a => `${a.applianceId}-${a.partReference}`));
        
        validIds.forEach(id => {
          const key = `${id}-${partReference}`;
          if (!existingKeys.has(key)) {
            const newAssoc: AppliancePartAssociation = {
              id: `${id}-${partReference}-${Date.now()}-${Math.random()}`,
              applianceId: id,
              partReference,
              dateAssociated: new Date().toISOString()
            };
            newAssociations.push(newAssoc);
            console.log("Nouvelle association créée:", newAssoc);
          } else {
            console.log("Association déjà existante pour ID:", id);
          }
        });
        
        console.log("Nombre de nouvelles associations à créer:", newAssociations.length);
        
        if (newAssociations.length > 0) {
          const updated = [...currentAssociations, ...newAssociations];
          console.log("Associations totales après ajout:", updated.length);
          return updated;
        } else {
          console.log("Aucune nouvelle association à créer (toutes existent déjà)");
          return currentAssociations;
        }
      });
      
      return currentAppliances; // Retourner l'état inchangé des appareils
    });
    
    console.log("=== FIN FONCTION ASSOCIATION AMÉLIORÉE ===");
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
