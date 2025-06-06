
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Appliance } from '@/types/appliance';
import EditableCell from './EditableCell';
import SortableTableHeader from './SortableTableHeader';
import { SortField, SortDirection } from '@/hooks/useTableSorting';

interface QuickEditTableProps {
  appliances: Appliance[];
  onApplianceChange: (index: number, field: keyof Appliance, value: string) => void;
  availableBrands: string[];
  availableTypes: string[];
  onBrandChange: (index: number, value: string) => void;
  onTypeChange: (index: number, value: string) => void;
  onFillDown: (index: number, field: 'brand' | 'type') => void;
  onAutoFill: (index: number, field: 'brand' | 'type') => void;
  onDragFill: (fromIndex: number, toIndex: number, field: 'brand' | 'type') => void;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onNewBrand: (brand: string) => void;
  onNewType: (type: string) => void;
}

const QuickEditTable: React.FC<QuickEditTableProps> = ({
  appliances,
  onApplianceChange,
  availableBrands,
  availableTypes,
  onBrandChange,
  onTypeChange,
  onFillDown,
  onAutoFill,
  onDragFill,
  sortField,
  sortDirection,
  onSort,
  onNewBrand,
  onNewType
}) => {
  const handleBrandDragFill = (index: number, toIndex: number) => {
    onDragFill(index, toIndex, 'brand');
  };

  const handleTypeDragFill = (index: number, toIndex: number) => {
    onDragFill(index, toIndex, 'type');
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHeader
              field="reference"
              currentSortField={sortField}
              currentSortDirection={sortDirection}
              onSort={onSort}
            >
              Référence technique
            </SortableTableHeader>
            <SortableTableHeader
              field="commercialRef"
              currentSortField={sortField}
              currentSortDirection={sortDirection}
              onSort={onSort}
            >
              Référence commerciale
            </SortableTableHeader>
            <TableHead className="min-w-[250px]">Marque *</TableHead>
            <TableHead className="min-w-[250px]">Type *</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appliances.map((appliance, index) => (
            <TableRow key={appliance.id} className="hover:bg-gray-50">
              <TableCell>
                <Input 
                  value={appliance.reference} 
                  readOnly 
                  className="bg-gray-50 border-0 focus:ring-0 focus:border-0"
                />
              </TableCell>
              <TableCell>
                <Input 
                  value={appliance.commercialRef || ""} 
                  readOnly 
                  className="bg-gray-50 border-0 focus:ring-0 focus:border-0"
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  value={appliance.brand || ""}
                  onValueChange={(value) => onBrandChange(index, value)}
                  options={availableBrands}
                  placeholder="Sélectionner une marque"
                  searchPlaceholder="Rechercher ou saisir une marque..."
                  onFillDown={() => onFillDown(index, 'brand')}
                  onDoubleClickFill={() => onAutoFill(index, 'brand')}
                  onDragFill={(toIndex) => handleBrandDragFill(index, toIndex)}
                  index={index}
                  totalRows={appliances.length}
                  onNewValue={onNewBrand}
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  value={appliance.type || ""}
                  onValueChange={(value) => onTypeChange(index, value)}
                  options={availableTypes}
                  placeholder="Sélectionner un type"
                  searchPlaceholder="Rechercher ou saisir un type..."
                  onFillDown={() => onFillDown(index, 'type')}
                  onDoubleClickFill={() => onAutoFill(index, 'type')}
                  onDragFill={(toIndex) => handleTypeDragFill(index, toIndex)}
                  index={index}
                  totalRows={appliances.length}
                  onNewValue={onNewType}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuickEditTable;
