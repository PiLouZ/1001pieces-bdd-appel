
import React, { useState, useMemo } from "react";
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
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé",
  className,
  allowCustomValue = false
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

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

  return (
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
  );
};

export default SearchableSelect;
