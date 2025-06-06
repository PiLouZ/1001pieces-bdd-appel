
import React, { useState, useMemo, useRef } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  allowCustomValue?: boolean;
  onFillDown?: () => void;
  onDoubleClickFill?: () => void;
  showFillHandle?: boolean;
  onDragFill?: (toIndex: number) => void;
  index?: number;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé",
  className,
  allowCustomValue = false,
  onFillDown,
  onDoubleClickFill,
  showFillHandle = false,
  onDragFill,
  index = 0
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fillHandleRef = useRef<HTMLDivElement>(null);

  // Trier les options par ordre alphabétique
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [options]);

  // Filtrer les options selon la recherche
  const filteredOptions = useMemo(() => {
    if (!inputValue) return sortedOptions;
    return sortedOptions.filter(option => 
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [sortedOptions, inputValue]);

  // Vérifier si la valeur saisie peut être ajoutée comme nouvelle option
  const canAddCustomValue = allowCustomValue && 
    inputValue.trim() !== "" && 
    !options.some(option => option.toLowerCase() === inputValue.toLowerCase());

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleAddCustomValue = () => {
    if (canAddCustomValue && inputValue.trim()) {
      onValueChange(inputValue.trim());
      setOpen(false);
      setInputValue("");
    }
  };

  const handleFillHandleMouseDown = (e: React.MouseEvent) => {
    if (!value || !onDragFill) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStartY(e.clientY);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Calculer la position relative pour déterminer l'index de destination
      const containerRect = containerRef.current.getBoundingClientRect();
      const rowHeight = containerRect.height;
      const deltaY = e.clientY - dragStartY;
      const rowsToFill = Math.floor(deltaY / rowHeight);
      
      if (rowsToFill > 0) {
        // Feedback visuel pendant le drag
        containerRef.current.style.backgroundColor = '#e3f2fd';
        containerRef.current.style.borderColor = '#2196f3';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      
      if (containerRef.current) {
        containerRef.current.style.backgroundColor = '';
        containerRef.current.style.borderColor = '';
      }
      
      // Calculer l'index de destination
      if (containerRef.current && onDragFill) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const rowHeight = containerRect.height;
        const deltaY = e.clientY - dragStartY;
        const rowsToFill = Math.floor(deltaY / rowHeight);
        
        if (rowsToFill > 0) {
          const targetIndex = index + rowsToFill;
          onDragFill(targetIndex);
        }
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleFillHandleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDoubleClickFill) {
      onDoubleClickFill();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
          >
            {value ? value : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder} 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {filteredOptions.length === 0 && !canAddCustomValue && (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              )}
              
              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {canAddCustomValue && (
                <CommandGroup>
                  <CommandItem onSelect={handleAddCustomValue}>
                    <Plus className="mr-2 h-4 w-4 text-green-600" />
                    <span className="text-green-600">
                      Ajouter "{inputValue.trim()}"
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
              
              {filteredOptions.length === 0 && !canAddCustomValue && inputValue && (
                <CommandEmpty>
                  {allowCustomValue 
                    ? "Aucun résultat trouvé - saisissez du texte pour ajouter une nouvelle option"
                    : emptyMessage
                  }
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Fill Handle - apparaît seulement si la cellule a une valeur et showFillHandle est true */}
      {value && showFillHandle && (
        <div
          ref={fillHandleRef}
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 cursor-se-resize hover:bg-blue-700 border border-white shadow-sm select-none"
          onMouseDown={handleFillHandleMouseDown}
          onDoubleClick={handleFillHandleDoubleClick}
          title="Glisser pour remplir vers le bas ou double-cliquer pour remplir automatiquement"
          style={{
            cursor: isDragging ? 'se-resize' : 'crosshair'
          }}
        />
      )}
    </div>
  );
};

export default SearchableSelect;
