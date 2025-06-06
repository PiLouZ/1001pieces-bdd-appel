
import React from 'react';
import SearchableSelect from '@/components/SearchableSelect';

interface EditableCellProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  onFillDown?: () => void;
  onDoubleClickFill?: () => void;
  onDragFill?: (toIndex: number) => void;
  index: number;
  totalRows: number;
  showFillHandle?: boolean;
  allowCustomValue?: boolean;
  onNewValue?: (value: string) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  onFillDown,
  onDoubleClickFill,
  onDragFill,
  index,
  totalRows,
  showFillHandle = true,
  allowCustomValue = true,
  onNewValue
}) => {
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    
    // Si c'est une nouvelle valeur et qu'on a un callback pour la gérer
    if (newValue && !options.includes(newValue) && onNewValue) {
      onNewValue(newValue);
    }
  };

  return (
    <SearchableSelect
      value={value}
      onValueChange={handleValueChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage="Aucun résultat trouvé"
      className="w-full border-0 focus:ring-1 focus:ring-blue-500"
      allowCustomValue={allowCustomValue}
      showFillHandle={showFillHandle}
      onFillDown={onFillDown}
      onDoubleClickFill={onDoubleClickFill}
      onDragFill={onDragFill}
      index={index}
      totalRows={totalRows}
    />
  );
};

export default EditableCell;
