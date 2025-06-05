
import { useState, useMemo } from 'react';
import { Appliance } from '@/types/appliance';

type SortField = 'reference' | 'commercialRef' | 'brand' | 'type';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export const useTableSort = (data: Appliance[]) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field!] || '';
      const bValue = b[sortConfig.field!] || '';

      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue, 'fr', { numeric: true });
      } else {
        return bValue.localeCompare(aValue, 'fr', { numeric: true });
      }
    });
  }, [data, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      return { field, direction: 'asc' };
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction;
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortIcon
  };
};
