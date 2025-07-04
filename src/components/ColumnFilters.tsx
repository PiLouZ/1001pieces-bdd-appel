import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ColumnFiltersProps {
  filters: {
    brand: string;
    type: string;
    reference: string;
    commercialRef: string;
  };
  onFiltersChange: (filters: any) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const ColumnFilters: React.FC<ColumnFiltersProps> = ({
  filters,
  onFiltersChange,
  knownBrands,
  knownTypes
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      brand: "",
      type: "",
      reference: "",
      commercialRef: ""
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value.trim() !== "");
  const activeFilterCount = Object.values(filters).filter(value => value.trim() !== "").length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtres colonnes
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtres par colonne</h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Effacer tout
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Marque</label>
              <Select value={filters.brand} onValueChange={(value) => updateFilter('brand', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les marques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les marques</SelectItem>
                  {knownBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les types</SelectItem>
                  {knownTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Référence technique</label>
              <Input
                value={filters.reference}
                onChange={(e) => updateFilter('reference', e.target.value)}
                placeholder="Filtrer par référence..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Référence commerciale</label>
              <Input
                value={filters.commercialRef}
                onChange={(e) => updateFilter('commercialRef', e.target.value)}
                placeholder="Filtrer par réf. commerciale..."
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnFilters;