
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Plus, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PartReferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applianceId: string;
  applianceReference: string;
  getPartReferencesForAppliance?: (id: string) => string[];
}

const PartReferencesDialog: React.FC<PartReferencesDialogProps> = ({
  open,
  onOpenChange,
  applianceId,
  applianceReference,
  getPartReferencesForAppliance
}) => {
  const [selectedPartReference, setSelectedPartReference] = useState("");
  const [newPartReference, setNewPartReference] = useState("");
  const [tabMode, setTabMode] = useState<"existing" | "new">("existing");
  
  // Get part references from the function or default to empty array
  const partReferences = getPartReferencesForAppliance ? getPartReferencesForAppliance(applianceId) || [] : [];
  
  // Available part references (can be implemented later)
  const knownPartReferences: string[] = [];

  useEffect(() => {
    // Reset states when the dialog opens
    if (open) {
      setSelectedPartReference("");
      setNewPartReference("");
      setTabMode("existing");
    }
  }, [open]);

  const handleAddReference = () => {
    // This functionality can be implemented later
    const partRef = tabMode === "existing" ? selectedPartReference : newPartReference;
    // Future implementation
    setSelectedPartReference("");
    setNewPartReference("");
  };

  const handleRemoveReference = (partRef: string) => {
    // This functionality can be implemented later
  };

  // Available references (can be set up later)
  const availableReferences = knownPartReferences.filter(
    (ref) => !partReferences.includes(ref)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Tag className="mr-2 h-5 w-5" />
            Pièces compatibles
          </DialogTitle>
          <DialogDescription>
            Gérer les pièces compatibles pour {applianceReference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Liste des références actuelles */}
          <div>
            <Label>Références associées ({partReferences.length})</Label>
            <ScrollArea className="h-[150px] border rounded-md p-2 mt-1">
              {partReferences.length === 0 ? (
                <p className="text-sm text-gray-400 text-center p-4">
                  Aucune référence de pièce associée
                </p>
              ) : (
                <div className="space-y-1">
                  {partReferences.map((ref) => (
                    <div key={ref} className="flex justify-between items-center py-1">
                      <span className="text-sm">{ref}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReference(ref)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Ajouter une nouvelle référence */}
          <div className="space-y-2">
            <Label>Ajouter une référence</Label>
            <div className="flex space-x-2">
              <Button
                variant={tabMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabMode("existing")}
                className="flex-1"
              >
                Existante
              </Button>
              <Button
                variant={tabMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabMode("new")}
                className="flex-1"
              >
                Nouvelle
              </Button>
            </div>

            {tabMode === "existing" ? (
              <div>
                <Select
                  value={selectedPartReference}
                  onValueChange={setSelectedPartReference}
                  disabled={availableReferences.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une référence" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReferences.map((ref) => (
                      <SelectItem key={ref} value={ref}>
                        {ref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableReferences.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Toutes les références existantes sont déjà associées
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Input
                  placeholder="Nouvelle référence de pièce"
                  value={newPartReference}
                  onChange={(e) => setNewPartReference(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            onClick={handleAddReference}
            disabled={
              (tabMode === "existing" && !selectedPartReference) ||
              (tabMode === "new" && !newPartReference.trim())
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartReferencesDialog;
