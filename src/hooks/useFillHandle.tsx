
import { useCallback } from 'react';

interface UseFillHandleProps<T> {
  data: T[];
  onUpdateData: (data: T[]) => void;
}

export const useFillHandle = <T extends Record<string, any>>({ 
  data, 
  onUpdateData 
}: UseFillHandleProps<T>) => {
  
  const fillDown = useCallback((fromIndex: number, field: keyof T) => {
    const sourceValue = data[fromIndex]?.[field];
    if (!sourceValue || fromIndex < 0 || fromIndex >= data.length) return;

    const updatedData = [...data];
    
    for (let i = fromIndex + 1; i < updatedData.length; i++) {
      if (!updatedData[i][field]) {
        updatedData[i] = { ...updatedData[i], [field]: sourceValue };
      } else {
        break;
      }
    }

    onUpdateData(updatedData);
  }, [data, onUpdateData]);

  const autoFill = useCallback((fromIndex: number, field: keyof T) => {
    const sourceValue = data[fromIndex]?.[field];
    if (!sourceValue || fromIndex < 0 || fromIndex >= data.length) return;

    const updatedData = [...data];
    
    for (let i = fromIndex + 1; i < updatedData.length; i++) {
      updatedData[i] = { ...updatedData[i], [field]: sourceValue };
    }

    onUpdateData(updatedData);
  }, [data, onUpdateData]);

  const dragFill = useCallback((fromIndex: number, toIndex: number, field: keyof T) => {
    const sourceValue = data[fromIndex]?.[field];
    
    if (!sourceValue || 
        fromIndex < 0 || fromIndex >= data.length ||
        toIndex < 0 || toIndex >= data.length ||
        toIndex <= fromIndex) {
      return;
    }

    const updatedData = [...data];
    
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      if (i < updatedData.length) {
        updatedData[i] = { ...updatedData[i], [field]: sourceValue };
      }
    }

    onUpdateData(updatedData);
  }, [data, onUpdateData]);

  return {
    fillDown,
    autoFill,
    dragFill
  };
};
