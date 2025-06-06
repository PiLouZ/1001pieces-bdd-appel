
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SortField, SortDirection } from '@/hooks/useTableSorting';

interface SortableTableHeaderProps {
  field: SortField;
  children: React.ReactNode;
  currentSortField: SortField | null;
  currentSortDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  field,
  children,
  currentSortField,
  currentSortDirection,
  onSort,
  className = "min-w-[200px]"
}) => {
  const getSortIcon = () => {
    if (currentSortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    
    if (currentSortDirection === 'asc') {
      return <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />;
    } else if (currentSortDirection === 'desc') {
      return <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />;
    } else {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <TableHead 
      className={`cursor-pointer hover:bg-gray-50 select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon()}
      </div>
    </TableHead>
  );
};

export default SortableTableHeader;
