
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Appliance } from "@/types/appliance";

interface ApplianceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliance: Appliance | null;
  onSave: (updatedAppliance: Appliance) => void;
  knownBrands: string[];
  knownTypes: string[];
}

const ApplianceEditDialog: React.FC<ApplianceEditDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  appliance,
  knownBrands,
  knownTypes
}) => {
  const [formData, setFormData] = useState<Omit<Appliance, "id" | "dateAdded">>({
    reference: "",
    commercialRef: "",
    brand: "",
    type: ""
  });

  useEffect(() => {
    if (appliance) {
      setFormData({
        reference: appliance.reference,
        commercialRef: appliance.commercialRef || "",
        brand: appliance.brand,
        type: appliance.type,
        source: appliance.source,
        additionalInfo: appliance.additionalInfo
      });
    }
  }, [appliance]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appliance) return;
    
    onSave({
      ...appliance,
      ...formData
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l'appareil</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence technique</Label>
              <Input
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercialRef">Référence commerciale</Label>
              <Input
                id="commercialRef"
                name="commercialRef"
                value={formData.commercialRef}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marque</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                list="knownBrands"
                required
              />
              <datalist id="knownBrands">
                {knownBrands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                list="knownTypes"
                required
              />
              <datalist id="knownTypes">
                {knownTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplianceEditDialog;
