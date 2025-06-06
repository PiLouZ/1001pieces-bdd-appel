
import { useState } from 'react';

export type SortField = 'reference' | 'commercialRef';
export type SortDirection = 'asc' | 'desc' | null;

interface UseSortingProps<T> {
  data: T[];
  initialData: T[];
}

export const useTableSorting = <T extends Record<string, any>>({ 
  data, 
  initialData 
}: UseSortingProps<T>) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField, setData: (data: T[]) => void) => {
    let newDirection: SortDirection;
    
    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      } else {
        newDirection = 'asc';
      }
    } else {
      newDirection = 'asc';
    }

    setSortField(newDirection ? field : null);
    setSortDirection(newDirection);

    if (newDirection) {
      const sorted = [...data].sort((a, b) => {
        const aValue = a[field] || '';
        const bValue = b[field] || '';
        
        if (newDirection === 'asc') {
          return aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' });
        } else {
          return bValue.localeCompare(aValue, 'fr', { sensitivity: 'base' });
        }
      });
      setData(sorted);
    } else {
      setData([...initialData]);
    }
  };

  return {
    sortField,
    sortDirection,
    handleSort
  };
};
