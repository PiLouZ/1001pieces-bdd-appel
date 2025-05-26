
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PartReferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applianceId: string;
  appliance: { reference: string; brand: string; type: string } | null;
  currentPartReferences: string[];
  knownPartReferences: string[];
  onAssociate: (applianceIds: string[], partRef: string) => number;
  onRemoveAssociation: (applianceId: string, partRef: string) => void;
}

const PartReferencesDialog: React.FC<PartReferencesDialogProps> = ({
  open,
  onOpenChange,
  applianceId,
  appliance,
  currentPartReferences,
  knownPartReferences,
  onAssociate,
  onRemoveAssociation,
}) => {
  const [newPartRef, setNewPartRef] = useState("");
  const [localPartReferences, setLocalPartReferences] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partRefToDelete, setPartRefToDelete] = useState<string>("");

  // Sync local state with props
  useEffect(() => {
    setLocalPartReferences(currentPartReferences);
  }, [currentPartReferences]);

  const handleAddPartRef = () => {
    if (newPartRef.trim() && !localPartReferences.includes(newPartRef.trim())) {
      const result = onAssociate([applianceId], newPartRef.trim());
      if (result > 0) {
        setLocalPartReferences(prev => [...prev, newPartRef.trim()]);
        setNewPartRef("");
        toast(`Référence de pièce "${newPartRef.trim()}" associée avec succès`);
      }
    }
  };

  const handleRemovePartRef = (partRef: string) => {
    setPartRefToDelete(partRef);
    setDeleteDialogOpen(true);
  };

  const confirmRemovePartRef = () => {
    onRemoveAssociation(applianceId, partRefToDelete);
    setLocalPartReferences(prev => prev.filter(ref => ref !== partRefToDelete));
    setDeleteDialogOpen(false);
    setPartRefToDelete("");
    toast(`Association avec la référence "${partRefToDelete}" supprimée`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddPartRef();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pièces compatibles</DialogTitle>
            {appliance && (
              <DialogDescription>
                {appliance.brand} {appliance.type} - {appliance.reference}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-part-ref">Ajouter une référence de pièce</Label>
              <div className="flex space-x-2">
                <Input
                  id="new-part-ref"
                  value={newPartRef}
                  onChange={(e) => setNewPartRef(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ex: XRT123456"
                  className="flex-1"
                />
                <Button onClick={handleAddPartRef} disabled={!newPartRef.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Références associées ({localPartReferences.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {localPartReferences.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Aucune référence de pièce associée</p>
                ) : (
                  localPartReferences.map((partRef) => (
                    <div key={partRef} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <Badge variant="secondary">{partRef}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePartRef(partRef)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deletion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'association avec la référence de pièce "{partRefToDelete}" ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemovePartRef}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PartReferencesDialog;
