
import { useState, useCallback } from 'react';
import { Appliance } from '@/types/appliance';

interface UseExcelFillProps {
  appliances: Appliance[];
  onUpdateAppliances: (appliances: Appliance[]) => void;
}

export const useExcelFill = ({ appliances, onUpdateAppliances }: UseExcelFillProps) => {
  const [selectedCell, setSelectedCell] = useState<{
    index: number;
    field: 'brand' | 'type';
  } | null>(null);

  // Fonction pour remplir vers le bas à partir d'un index donné
  const fillDown = useCallback((fromIndex: number, field: 'brand' | 'type') => {
    const sourceValue = appliances[fromIndex]?.[field];
    if (!sourceValue) return;

    const updatedAppliances = [...appliances];
    
    // Remplir toutes les cellules vides à partir de fromIndex + 1
    for (let i = fromIndex + 1; i < updatedAppliances.length; i++) {
      if (!updatedAppliances[i][field]) {
        updatedAppliances[i] = { ...updatedAppliances[i], [field]: sourceValue };
      } else {
        // S'arrêter quand on rencontre une cellule non vide
        break;
      }
    }

    onUpdateAppliances(updatedAppliances);
  }, [appliances, onUpdateAppliances]);

  // Fonction pour remplir automatiquement (détection de pattern ou remplir jusqu'à la fin)
  const autoFill = useCallback((fromIndex: number, field: 'brand' | 'type') => {
    const sourceValue = appliances[fromIndex]?.[field];
    if (!sourceValue) return;

    const updatedAppliances = [...appliances];
    
    // Pour l'auto-fill, on remplit toutes les cellules vides restantes
    for (let i = fromIndex + 1; i < updatedAppliances.length; i++) {
      if (!updatedAppliances[i][field]) {
        updatedAppliances[i] = { ...updatedAppliances[i], [field]: sourceValue };
      }
    }

    onUpdateAppliances(updatedAppliances);
  }, [appliances, onUpdateAppliances]);

  // Fonction pour remplir par glisser-déposer
  const dragFill = useCallback((fromIndex: number, toIndex: number, field: 'brand' | 'type') => {
    const sourceValue = appliances[fromIndex]?.[field];
    if (!sourceValue || toIndex <= fromIndex) return;

    const updatedAppliances = [...appliances];
    
    // Remplir de fromIndex + 1 à toIndex
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      updatedAppliances[i] = { ...updatedAppliances[i], [field]: sourceValue };
    }

    onUpdateAppliances(updatedAppliances);
  }, [appliances, onUpdateAppliances]);

  return {
    fillDown,
    autoFill,
    dragFill,
    selectedCell,
    setSelectedCell
  };
};
