
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ApplianceFormProps {
  knownBrands: string[];
  knownTypes: string[];
  onSubmit: (data: { reference: string; brand: string; type: string }) => void;
  suggestBrand: (reference: string) => string | null;
  suggestType: (reference: string, brand: string) => string | null;
}

const ApplianceForm: React.FC<ApplianceFormProps> = ({ 
  knownBrands, 
  knownTypes, 
  onSubmit,
  suggestBrand,
  suggestType
}) => {
  const [reference, setReference] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const { toast } = useToast();

  // Effet pour les suggestions de marque basées sur la référence
  useEffect(() => {
    if (reference.length >= 3) {
      const suggestedBrand = suggestBrand(reference);
      if (suggestedBrand && brand === "") {
        setBrand(suggestedBrand);
        toast({
          title: "Suggestion",
          description: `Marque suggérée: ${suggestedBrand}`,
        });
      }
    }
  }, [reference, suggestBrand, toast, brand]);

  // Effet pour les suggestions de type basées sur la référence et la marque
  useEffect(() => {
    if (reference.length >= 3 && brand) {
      const suggestedType = suggestType(reference, brand);
      if (suggestedType && type === "") {
        setType(suggestedType);
        toast({
          title: "Suggestion",
          description: `Type suggéré: ${suggestedType}`,
        });
      }
    }
  }, [reference, brand, suggestType, toast, type]);

  // Filtrer les suggestions de marque
  const filterBrandSuggestions = (input: string) => {
    if (input.length > 0) {
      const filtered = knownBrands.filter(brand => 
        brand.toLowerCase().startsWith(input.toLowerCase())
      );
      setBrandSuggestions(filtered.slice(0, 5));
      setShowBrandSuggestions(filtered.length > 0);
    } else {
      setBrandSuggestions([]);
      setShowBrandSuggestions(false);
    }
  };

  // Filtrer les suggestions de type
  const filterTypeSuggestions = (input: string) => {
    if (input.length > 0) {
      const filtered = knownTypes.filter(type => 
        type.toLowerCase().startsWith(input.toLowerCase())
      );
      setTypeSuggestions(filtered.slice(0, 5));
      setShowTypeSuggestions(filtered.length > 0);
    } else {
      setTypeSuggestions([]);
      setShowTypeSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference || !brand || !type) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        variant: "destructive",
      });
      return;
    }
    onSubmit({ reference, brand, type });
    toast({
      title: "Succès",
      description: "Appareil ajouté avec succès",
    });
    setReference("");
    setBrand("");
    setType("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ajouter un nouvel appareil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              placeholder="Entrez la référence"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          
          <div className="space-y-2 relative">
            <Label htmlFor="brand">Marque</Label>
            <Input
              id="brand"
              placeholder="Entrez la marque"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                filterBrandSuggestions(e.target.value);
              }}
              onFocus={() => filterBrandSuggestions(brand)}
              onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
            />
            
            {showBrandSuggestions && (
              <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-32 overflow-y-auto">
                {brandSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setBrand(suggestion);
                      setShowBrandSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2 relative">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              placeholder="Entrez le type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                filterTypeSuggestions(e.target.value);
              }}
              onFocus={() => filterTypeSuggestions(type)}
              onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 200)}
            />
            
            {showTypeSuggestions && (
              <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-32 overflow-y-auto">
                {typeSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setType(suggestion);
                      setShowTypeSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button type="submit" className="w-full">Ajouter</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApplianceForm;
