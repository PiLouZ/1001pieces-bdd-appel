
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Appliance } from '@/types/appliance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowDown, Copy, GripVertical } from 'lucide-react';

interface VirtualizedTableProps {
  appliances: Appliance[];
  onFieldChange: (id: string, field: 'brand' | 'type', value: string) => void;
  knownBrands: string[];
  knownTypes: string[];
  onFillDown: (fromIndex: number, field: 'brand' | 'type') => void;
  onCopyToAll: (fromIndex: number, field: 'brand' | 'type') => void;
  onDragFill: (fromIndex: number, toIndex: number, field: 'brand' | 'type') => void;
  height: number;
}

const ROW_HEIGHT = 60;

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  appliances,
  onFieldChange,
  knownBrands,
  knownTypes,
  onFillDown,
  onCopyToAll,
  onDragFill,
  height
}) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startIndex: number;
    field: 'brand' | 'type';
    currentIndex: number;
  } | null>(null);

  const listRef = useRef<List>(null);

  const handleDragStart = useCallback((index: number, field: 'brand' | 'type') => {
    setDragState({
      isDragging: true,
      startIndex: index,
      field,
      currentIndex: index
    });
  }, []);

  const handleDragOver = useCallback((index: number) => {
    if (dragState && dragState.isDragging) {
      setDragState(prev => prev ? { ...prev, currentIndex: index } : null);
    }
  }, [dragState]);

  const handleDragEnd = useCallback(() => {
    if (dragState && dragState.isDragging && dragState.currentIndex > dragState.startIndex) {
      onDragFill(dragState.startIndex, dragState.currentIndex, dragState.field);
    }
    setDragState(null);
  }, [dragState, onDragFill]);

  // Memoïser les composants de ligne pour éviter les re-rendus inutiles
  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const appliance = appliances[index];
    const isInDragRange = dragState && 
      index >= dragState.startIndex && 
      index <= dragState.currentIndex;

    const handleFieldChangeLocal = useCallback((field: 'brand' | 'type', value: string) => {
      onFieldChange(appliance.id, field, value);
    }, [appliance.id, onFieldChange]);

    const handleFillDownLocal = useCallback((field: 'brand' | 'type') => {
      onFillDown(index, field);
    }, [index, onFillDown]);

    const handleCopyToAllLocal = useCallback((field: 'brand' | 'type') => {
      onCopyToAll(index, field);
    }, [index, onCopyToAll]);

    const handleDragStartLocal = useCallback((field: 'brand' | 'type') => {
      handleDragStart(index, field);
    }, [index, handleDragStart]);

    return (
      <div 
        style={style}
        className={`grid grid-cols-6 gap-2 p-2 border-b hover:bg-gray-50 ${
          isInDragRange ? 'bg-blue-100' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          handleDragOver(index);
        }}
      >
        {/* Référence technique */}
        <div className="p-2 bg-gray-50 rounded text-sm truncate" title={appliance.reference}>
          {appliance.reference}
        </div>

        {/* Référence commerciale */}
        <div className="p-2 bg-gray-50 rounded text-sm truncate" title={appliance.commercialRef || "—"}>
          {appliance.commercialRef || "—"}
        </div>

        {/* Marque */}
        <div className="relative">
          <Select 
            value={appliance.brand || ""} 
            onValueChange={(value) => handleFieldChangeLocal('brand', value)}
          >
            <SelectTrigger 
              className={`h-8 ${!appliance.brand ? 'border-red-300 bg-red-50' : ''}`}
            >
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              {knownBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {appliance.brand && (
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize hover:bg-blue-600"
              draggable
              onDragStart={() => handleDragStartLocal('brand')}
              onDragEnd={handleDragEnd}
              title="Glisser pour remplir vers le bas"
            >
              <GripVertical className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Actions pour la marque */}
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFillDownLocal('brand')}
            disabled={!appliance.brand}
            title="Copier vers le bas"
            className="h-7 w-7 p-0"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyToAllLocal('brand')}
            disabled={!appliance.brand}
            title="Copier vers toutes les cellules vides"
            className="h-7 w-7 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Type */}
        <div className="relative">
          <Select 
            value={appliance.type || ""} 
            onValueChange={(value) => handleFieldChangeLocal('type', value)}
          >
            <SelectTrigger 
              className={`h-8 ${!appliance.type ? 'border-red-300 bg-red-50' : ''}`}
            >
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              {knownTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {appliance.type && (
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize hover:bg-blue-600"
              draggable
              onDragStart={() => handleDragStartLocal('type')}
              onDragEnd={handleDragEnd}
              title="Glisser pour remplir vers le bas"
            >
              <GripVertical className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Actions pour le type */}
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFillDownLocal('type')}
            disabled={!appliance.type}
            title="Copier vers le bas"
            className="h-7 w-7 p-0"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyToAllLocal('type')}
            disabled={!appliance.type}
            title="Copier vers toutes les cellules vides"
            className="h-7 w-7 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  });

  Row.displayName = 'VirtualizedTableRow';

  return (
    <div className="border rounded">
      {/* En-tête du tableau */}
      <div className="grid grid-cols-6 gap-2 p-3 bg-gray-100 rounded-t font-medium text-sm border-b">
        <div>Référence technique</div>
        <div>Référence commerciale</div>
        <div>Marque</div>
        <div className="text-center">Actions</div>
        <div>Type</div>
        <div className="text-center">Actions</div>
      </div>

      {/* Tableau virtualisé */}
      <List
        ref={listRef}
        height={height}
        width="100%"
        itemCount={appliances.length}
        itemSize={ROW_HEIGHT}
        itemData={appliances}
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
};

export default VirtualizedTable;
