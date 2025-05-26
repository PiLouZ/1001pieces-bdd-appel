
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
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppliances } from "@/hooks/useAppliances";

interface PartReferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applianceId: string;
  applianceReference: string;
  knownPartReferences: string[];
  getPartReferencesForAppliance: (id: string) => string[];
  associateAppliancesToPartReference: (applianceIds: string[], partRef: string) => number;
}

const PartReferencesDialog: React.FC<PartReferencesDialogProps> = ({
  open,
  onOpenChange,
  applianceId,
  applianceReference,
  knownPartReferences = [],
  getPartReferencesForAppliance,
  associateAppliancesToPartReference
}) => {
  const [selectedPartReference, setSelectedPartReference] = useState("");
  const [newPartReference, setNewPartReference] = useState("");
  const [tabMode, setTabMode] = useState<"existing" | "new">("existing");
  
  // Utiliser le hook pour accéder à la fonction de suppression
  const { removeAppliancePartAssociation } = useAppliances();
  
  // Get part references from the function or default to empty array
  const partReferences = getPartReferencesForAppliance ? 
    getPartReferencesForAppliance(applianceId) || [] : [];
  
  // Available part references (références connues non déjà associées)
  const availableReferences = React.useMemo(() => {
    if (!Array.isArray(knownPartReferences) || !Array.isArray(partReferences)) {
      return [];
    }
    return knownPartReferences.filter(ref => !partReferences.includes(ref));
  }, [knownPartReferences, partReferences]);

  useEffect(() => {
    // Reset states when the dialog opens
    if (open) {
      setSelectedPartReference("");
      setNewPartReference("");
      setTabMode("existing");
    }
  }, [open]);

  const handleAddReference = () => {
    // Utiliser la référence sélectionnée ou la nouvelle
    const partRef = tabMode === "existing" ? selectedPartReference : newPartReference;
    
    if (!partRef) return;
    
    // Associer l'appareil à cette référence
    if (associateAppliancesToPartReference && applianceId) {
      try {
        associateAppliancesToPartReference([applianceId], partRef);
        toast("Référence associée", {
          description: `L'appareil a été associé à la référence ${partRef}`
        });
        // Réinitialiser les champs
        setSelectedPartReference("");
        setNewPartReference("");
      } catch (error) {
        console.error("Erreur lors de l'association:", error);
        toast("Erreur", {
          description: "Impossible d'associer la référence à l'appareil"
        });
      }
    }
  };

  const handleRemoveReference = (partRef: string) => {
    if (removeAppliancePartAssociation) {
      try {
        removeAppliancePartAssociation(applianceId, partRef);
        toast("Référence supprimée", {
          description: `La référence ${partRef} a été dissociée de l'appareil`
        });
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast("Erreur", {
          description: "Impossible de supprimer l'association"
        });
      }
    }
  };

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
              {!partReferences || partReferences.length === 0 ? (
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
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedPartReference}
                  onChange={(e) => setSelectedPartReference(e.target.value)}
                  disabled={!availableReferences || availableReferences.length === 0}
                >
                  <option value="">Sélectionner une référence</option>
                  {availableReferences && availableReferences.map((ref) => (
                    <option key={ref} value={ref}>
                      {ref}
                    </option>
                  ))}
                </select>
                {(!availableReferences || availableReferences.length === 0) && (
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
