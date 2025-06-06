
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

  // Fonction pour remplir vers le bas à partir d'un index donné (écrase les valeurs existantes)
  const fillDown = useCallback((fromIndex: number, field: 'brand' | 'type') => {
    const sourceValue = appliances[fromIndex]?.[field];
    if (!sourceValue || fromIndex < 0 || fromIndex >= appliances.length) return;

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

  // Fonction pour remplir automatiquement (double-clic - écrase TOUTES les valeurs)
  const autoFill = useCallback((fromIndex: number, field: 'brand' | 'type') => {
    const sourceValue = appliances[fromIndex]?.[field];
    if (!sourceValue || fromIndex < 0 || fromIndex >= appliances.length) return;

    const updatedAppliances = [...appliances];
    
    // Pour l'auto-fill, on remplit TOUTES les cellules restantes (écrase les existantes)
    for (let i = fromIndex + 1; i < updatedAppliances.length; i++) {
      updatedAppliances[i] = { ...updatedAppliances[i], [field]: sourceValue };
    }

    onUpdateAppliances(updatedAppliances);
  }, [appliances, onUpdateAppliances]);

  // Fonction pour remplir par glisser-déposer (écrase TOUTES les valeurs dans la plage)
  const dragFill = useCallback((fromIndex: number, toIndex: number, field: 'brand' | 'type') => {
    const sourceValue = appliances[fromIndex]?.[field];
    
    // Vérifications de sécurité
    if (!sourceValue || 
        fromIndex < 0 || fromIndex >= appliances.length ||
        toIndex < 0 || toIndex >= appliances.length ||
        toIndex <= fromIndex) {
      console.log('dragFill: paramètres invalides', { fromIndex, toIndex, appliancesLength: appliances.length, sourceValue });
      return;
    }

    const updatedAppliances = [...appliances];
    
    // Remplir de fromIndex + 1 à toIndex (écrase toutes les valeurs)
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      if (i < updatedAppliances.length) {
        updatedAppliances[i] = { ...updatedAppliances[i], [field]: sourceValue };
      }
    }

    console.log(`dragFill: Rempli de ${fromIndex + 1} à ${toIndex} avec "${sourceValue}"`);
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
