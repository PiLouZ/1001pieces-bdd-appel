
import { useState, useEffect, useCallback, useMemo } from "react";
import { Appliance } from "../types/appliance";
import { useAppliances } from "./useAppliances";
import { useDataCache } from "./useDataCache";

export const useAppliancesOptimized = () => {
  const originalHook = useAppliances();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cache pour les calculs coûteux
  const { data: cachedStats, invalidateCache } = useDataCache(
    'appliance-stats',
    () => {
      const brands = [...new Set(originalHook.allAppliances.map(item => item.brand))].filter(Boolean);
      const types = [...new Set(originalHook.allAppliances.map(item => item.type))].filter(Boolean);
      
      return {
        brands,
        types,
        totalCount: originalHook.allAppliances.length,
        brandsCount: brands.length,
        typesCount: types.length
      };
    },
    2 * 60 * 1000 // Cache pour 2 minutes
  );

  // Recherche optimisée avec debouncing
  const filteredAppliances = useMemo(() => {
    if (!searchQuery.trim()) {
      return originalHook.allAppliances;
    }

    const query = searchQuery.toLowerCase();
    
    // Vérifier si c'est une référence de pièce
    if (originalHook.knownPartReferences.includes(searchQuery)) {
      return originalHook.getAppliancesByPartReference(searchQuery);
    }
    
    // Recherche standard optimisée
    return originalHook.allAppliances.filter(appliance => {
      return (
        appliance.reference.toLowerCase().includes(query) ||
        (appliance.commercialRef && appliance.commercialRef.toLowerCase().includes(query)) ||
        appliance.brand.toLowerCase().includes(query) ||
        appliance.type.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, originalHook.allAppliances, originalHook.knownPartReferences, originalHook.getAppliancesByPartReference]);

  // Invalider le cache quand les données changent
  useEffect(() => {
    invalidateCache();
  }, [originalHook.allAppliances.length, invalidateCache]);

  // Pagination virtuelle pour les grandes listes
  const getPagedAppliances = useCallback((page: number = 0, pageSize: number = 100) => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filteredAppliances.slice(start, end);
  }, [filteredAppliances]);

  return {
    ...originalHook,
    appliances: filteredAppliances,
    searchQuery,
    setSearchQuery,
    cachedStats,
    getPagedAppliances,
    totalFilteredCount: filteredAppliances.length
  };
};
