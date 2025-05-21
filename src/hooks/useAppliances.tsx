
import { useState, useEffect } from "react";
import { Appliance, ImportSession } from "../types/appliance";
import { defaultAppliances } from "../data/defaultAppliances";

export const useAppliances = () => {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [filteredAppliances, setFilteredAppliances] = useState<Appliance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [knownBrands, setKnownBrands] = useState<string[]>([]);
  const [knownTypes, setKnownTypes] = useState<string[]>([]);
  const [knownPartReferences, setKnownPartReferences] = useState<string[]>([]);
  const [needsUpdate, setNeedsUpdate] = useState<Appliance[]>([]);

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
  }, []);

  // Sauvegarder les données dans le localStorage quand elles changent
  useEffect(() => {
    if (appliances.length > 0) {
      localStorage.setItem("appliances", JSON.stringify(appliances));
    }
  }, [appliances]);

  // Extraire les marques et types connus
  useEffect(() => {
    const brands = [...new Set(appliances.map(item => item.brand))];
    const types = [...new Set(appliances.map(item => item.type))];
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
  }, [searchQuery, appliances, knownPartReferences]);

  // Ajouter un nouvel appareil
  const addAppliance = (newAppliance: Omit<Appliance, "id" | "dateAdded">) => {
    const applianceToAdd: Appliance = {
      ...newAppliance,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split("T")[0]
    };
    setAppliances(prev => [...prev, applianceToAdd]);
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
        ids.includes(app.id) ? { ...app, ...updates } : app
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
  };
  
  // Vider complètement la base de données
  const clearDatabase = () => {
    setAppliances([]);
    localStorage.removeItem("appliances");
    localStorage.removeItem("knownPartReferences");
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
    if (exactMatch) return exactMatch.brand;
    
    // Chercher par référence commerciale
    const commercialMatch = appliances.find(a => a.commercialRef === reference);
    if (commercialMatch) return commercialMatch.brand;
    
    // Chercher une correspondance partielle (début de référence)
    const partialMatches = appliances.filter(a => 
      reference.startsWith(a.reference.substring(0, 3)) || 
      a.reference.startsWith(reference.substring(0, 3)) ||
      (a.commercialRef && (
        reference.startsWith(a.commercialRef.substring(0, 3)) || 
        a.commercialRef.startsWith(reference.substring(0, 3))
      ))
    );
    
    if (partialMatches.length > 0) {
      // Grouper par marque et prendre la plus fréquente
      const brandCount: Record<string, number> = {};
      partialMatches.forEach(a => {
        brandCount[a.brand] = (brandCount[a.brand] || 0) + 1;
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
        reference.startsWith(a.reference.substring(0, 3)) || 
        a.reference.startsWith(reference.substring(0, 3)) ||
        (a.commercialRef && (
          reference.startsWith(a.commercialRef.substring(0, 3)) || 
          a.commercialRef.startsWith(reference.substring(0, 3))
        ))
      );
      
      if (refMatches.length > 0) {
        // Grouper par type et prendre le plus fréquent
        const typeCount: Record<string, number> = {};
        refMatches.forEach(a => {
          typeCount[a.type] = (typeCount[a.type] || 0) + 1;
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
        typeCount[a.type] = (typeCount[a.type] || 0) + 1;
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
    // Sauvegarder la référence de pièce si elle n'existe pas déjà
    if (!knownPartReferences.includes(partReference)) {
      const updatedRefs = [...knownPartReferences, partReference];
      setKnownPartReferences(updatedRefs);
      localStorage.setItem("knownPartReferences", JSON.stringify(updatedRefs));
    }
    
    // Créer ou mettre à jour la session d'importation
    const selectedAppliances = appliances.filter(app => applianceIds.includes(app.id));
    
    const importSession: ImportSession = {
      partReference,
      appliances: selectedAppliances,
      createdAt: new Date().toISOString()
    };
    
    // Sauvegarder dans le localStorage
    localStorage.setItem(`partRef_${partReference}`, JSON.stringify(importSession));
    
    return selectedAppliances.length;
  };

  // Récupérer les appareils compatibles avec une référence de pièce
  const getAppliancesByPartReference = (partReference: string): Appliance[] => {
    const sessionStr = localStorage.getItem(`partRef_${partReference}`);
    if (!sessionStr) return [];
    
    try {
      const session: ImportSession = JSON.parse(sessionStr);
      
      // Vérifier que ces appareils existent toujours dans la base
      const applianceRefs = new Set(session.appliances.map(app => app.reference));
      const currentAppliances = appliances.filter(app => applianceRefs.has(app.reference));
      
      return currentAppliances;
    } catch (e) {
      console.error(`Erreur lors de la récupération des appareils pour ${partReference}:`, e);
      return [];
    }
  };

  // Récupérer les références de pièces compatibles avec un appareil
  const getPartReferencesForAppliance = (applianceId: string): string[] => {
    const targetAppliance = appliances.find(app => app.id === applianceId);
    if (!targetAppliance) return [];
    
    const compatibleRefs: string[] = [];
    
    knownPartReferences.forEach(ref => {
      const sessionStr = localStorage.getItem(`partRef_${ref}`);
      if (sessionStr) {
        try {
          const session: ImportSession = JSON.parse(sessionStr);
          const isCompatible = session.appliances.some(
            app => app.reference === targetAppliance.reference
          );
          
          if (isCompatible) {
            compatibleRefs.push(ref);
          }
        } catch (e) {
          console.error(`Erreur avec la référence ${ref}:`, e);
        }
      }
    });
    
    return compatibleRefs;
  };

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
    getAppliancesByPartReference,
    getPartReferencesForAppliance
  };
};
