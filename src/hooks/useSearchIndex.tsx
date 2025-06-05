
import { useMemo } from 'react';
import { Appliance } from '@/types/appliance';

interface SearchIndex {
  [key: string]: Appliance[];
}

export const useSearchIndex = (appliances: Appliance[]) => {
  const searchIndex = useMemo(() => {
    const index: SearchIndex = {};
    
    appliances.forEach(appliance => {
      // Index par référence technique
      const ref = appliance.reference.toLowerCase();
      if (!index[ref]) index[ref] = [];
      index[ref].push(appliance);
      
      // Index par référence commerciale
      if (appliance.commercialRef) {
        const commercialRef = appliance.commercialRef.toLowerCase();
        if (!index[commercialRef]) index[commercialRef] = [];
        index[commercialRef].push(appliance);
      }
      
      // Index par marque
      if (appliance.brand) {
        const brand = appliance.brand.toLowerCase();
        if (!index[brand]) index[brand] = [];
        index[brand].push(appliance);
      }
      
      // Index par type
      if (appliance.type) {
        const type = appliance.type.toLowerCase();
        if (!index[type]) index[type] = [];
        index[type].push(appliance);
      }
      
      // Index par mots-clés pour recherche partielle
      const keywords = [
        appliance.reference,
        appliance.commercialRef,
        appliance.brand,
        appliance.type
      ].filter(Boolean).join(' ').toLowerCase().split(/\s+/);
      
      keywords.forEach(keyword => {
        if (keyword && keyword.length > 2) {
          if (!index[keyword]) index[keyword] = [];
          if (!index[keyword].includes(appliance)) {
            index[keyword].push(appliance);
          }
        }
      });
    });
    
    return index;
  }, [appliances]);

  const searchAppliances = useMemo(() => {
    return (query: string): Appliance[] => {
      if (!query.trim()) return appliances;
      
      const normalizedQuery = query.toLowerCase();
      const results = new Set<Appliance>();
      
      // Recherche exacte
      if (searchIndex[normalizedQuery]) {
        searchIndex[normalizedQuery].forEach(app => results.add(app));
      }
      
      // Recherche partielle
      Object.keys(searchIndex).forEach(key => {
        if (key.includes(normalizedQuery)) {
          searchIndex[key].forEach(app => results.add(app));
        }
      });
      
      // Recherche floue pour les références
      appliances.forEach(appliance => {
        if (
          appliance.reference.toLowerCase().includes(normalizedQuery) ||
          (appliance.commercialRef && appliance.commercialRef.toLowerCase().includes(normalizedQuery)) ||
          (appliance.brand && appliance.brand.toLowerCase().includes(normalizedQuery)) ||
          (appliance.type && appliance.type.toLowerCase().includes(normalizedQuery))
        ) {
          results.add(appliance);
        }
      });
      
      return Array.from(results);
    };
  }, [searchIndex, appliances]);

  return { searchAppliances };
};
