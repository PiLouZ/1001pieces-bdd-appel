
import { useState } from 'react';
import { Appliance } from '@/types/appliance';
import { useFillHandle } from './useFillHandle';

interface UseExcelFillProps {
  appliances: Appliance[];
  onUpdateAppliances: (appliances: Appliance[]) => void;
}

export const useExcelFill = ({ appliances, onUpdateAppliances }: UseExcelFillProps) => {
  const [selectedCell, setSelectedCell] = useState<{
    index: number;
    field: 'brand' | 'type';
  } | null>(null);

  const { fillDown, autoFill, dragFill } = useFillHandle({
    data: appliances,
    onUpdateData: onUpdateAppliances
  });

  return {
    fillDown,
    autoFill,
    dragFill,
    selectedCell,
    setSelectedCell
  };
};
