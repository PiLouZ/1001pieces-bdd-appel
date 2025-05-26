import { useState, useEffect } from "react";
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

  // Importer plusieurs appareils
  const importAppliances = (newAppliances: Appliance[]) => {
    // Vérifier les doublons par référence
    const existingRefs = new Set(appliances.map(app => app.reference));
    const uniqueNewAppliances = newAppliances.filter(app => !existingRefs.has(app.reference));
    
    if (uniqueNewAppliances.length > 0) {
      setAppliances(prev => [...prev, ...uniqueNewAppliances]);
      return uniqueNewAppliances.length;
    }
    return 0;
  };

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

  // Associer des appareils à une référence de pièce
  const associateApplicancesToPartReference = (applianceIds: string[], partReference: string) => {
    console.log("=== FONCTION ASSOCIATION ===");
    console.log("IDs reçus:", applianceIds);
    console.log("Référence pièce:", partReference);
    console.log("Appareils dans la base:", appliances.map(a => ({ id: a.id, ref: a.reference })));
    
    // Vérifier que les appareils existent dans la base
    const validIds = applianceIds.filter(id => {
      const found = appliances.find(app => app.id === id);
      console.log(`ID ${id} -> ${found ? 'TROUVÉ' : 'NON TROUVÉ'}`);
      return found;
    });
    
    console.log("IDs valides après vérification:", validIds);
    
    if (validIds.length === 0) {
      console.error("ERREUR: Aucun appareil valide trouvé pour l'association");
      return 0;
    }
    
    // Sauvegarder la référence de pièce si elle n'existe pas déjà
    if (!knownPartReferences.includes(partReference)) {
      const updatedRefs = [...knownPartReferences, partReference];
      setKnownPartReferences(updatedRefs);
      localStorage.setItem("knownPartReferences", JSON.stringify(updatedRefs));
      console.log("Nouvelle référence de pièce ajoutée:", partReference);
    }
    
    // Créer de nouvelles associations
    const newAssociations: AppliancePartAssociation[] = validIds.map(id => ({
      id: `${id}-${partReference}-${Date.now()}`,
      applianceId: id,
      partReference,
      dateAssociated: new Date().toISOString()
    }));
    
    console.log("Nouvelles associations à créer:", newAssociations);
    
    // Ajouter les nouvelles associations sans créer de doublons
    setAppliancePartAssociations(prev => {
      const existingAssocs = new Set(prev.map(a => `${a.applianceId}-${a.partReference}`));
      const filteredNewAssocs = newAssociations.filter(
        na => !existingAssocs.has(`${na.applianceId}-${na.partReference}`)
      );
      console.log("Associations filtrées (sans doublons):", filteredNewAssocs);
      console.log("Associations totales après ajout:", [...prev, ...filteredNewAssocs].length);
      return [...prev, ...filteredNewAssocs];
    });
    
    console.log("=== FIN ASSOCIATION ===");
    return validIds.length;
  };

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
