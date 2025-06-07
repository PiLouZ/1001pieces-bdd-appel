
import { useState, useCallback } from 'react';

export type SortField = 'reference' | 'commercialRef' | 'brand' | 'type' | 'dateAdded';
export type SortDirection = 'asc' | 'desc' | 'none';

interface UseTableSortingProps<T> {
  data: T[];
  initialData: T[];
}

export const useTableSorting = <T extends Record<string, any>>({ 
  data, 
  initialData 
}: UseTableSortingProps<T>) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');

  const handleSort = useCallback((field: SortField, setData: (data: T[]) => void) => {
    let newDirection: SortDirection;
    
    if (sortField !== field) {
      newDirection = 'asc';
    } else {
      switch (sortDirection) {
        case 'none':
          newDirection = 'asc';
          break;
        case 'asc':
          newDirection = 'desc';
          break;
        case 'desc':
          newDirection = 'none';
          break;
        default:
          newDirection = 'asc';
      }
    }

    setSortField(field);
    setSortDirection(newDirection);

    if (newDirection === 'none') {
      setData([...initialData]);
      return;
    }

    const sortedData = [...data].sort((a, b) => {
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'fr', { 
          sensitivity: 'base',
          numeric: true 
        });
        return newDirection === 'asc' ? comparison : -comparison;
      }
      
      if (aValue < bValue) return newDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setData(sortedData);
  }, [sortField, sortDirection, data, initialData]);

  return {
    sortField,
    sortDirection,
    handleSort
  };
};
