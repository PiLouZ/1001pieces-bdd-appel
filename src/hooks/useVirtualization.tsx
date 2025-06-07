
import { useMemo } from 'react';

interface UseVirtualizationProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  buffer?: number;
}

export const useVirtualization = ({
  items,
  itemHeight,
  containerHeight,
  buffer = 5
}: UseVirtualizationProps) => {
  const virtualizedData = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = items.length * itemHeight;
    
    return {
      totalHeight,
      visibleCount,
      startIndex: 0,
      endIndex: Math.min(visibleCount + buffer, items.length),
      visibleItems: items.slice(0, Math.min(visibleCount + buffer, items.length))
    };
  }, [items, itemHeight, containerHeight, buffer]);

  return virtualizedData;
};
