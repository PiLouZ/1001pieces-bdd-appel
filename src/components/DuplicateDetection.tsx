
import React, { useState, useMemo } from "react";
import { Appliance } from "@/types/appliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Merge, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface DuplicateGroup {
  id: string;
  appliances: Appliance[];
  duplicateReason: string;
}

interface DuplicateDetectionProps {
  appliances: Appliance[];
  onMergeDuplicates: (keepId: string, mergeIds: string[], mergedData: Partial<Appliance>) => void;
  onUpdateAppliance: (appliance: Appliance) => void;
}

const DuplicateDetection: React.FC<DuplicateDetectionProps> = ({
  appliances,
  onMergeDuplicates,
  onUpdateAppliance
}) => {
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<DuplicateGroup | null>(null);
  const [keepApplianceId, setKeepApplianceId] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Détecter les doublons basés sur la référence
  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, Appliance[]>();
    
    appliances.forEach(appliance => {
      const key = appliance.reference.toLowerCase().trim();
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(appliance);
    });

    const duplicates: DuplicateGroup[] = [];
    groups.forEach((applianceGroup, reference) => {
      if (applianceGroup.length > 1) {
        duplicates.push({
          id: reference,
          appliances: applianceGroup,
          duplicateReason: "Référence identique"
        });
      }
    });

    return duplicates;
  }, [appliances]);

  const handleOpenMergeDialog = (group: DuplicateGroup) => {
    setCurrentGroup(group);
    setKeepApplianceId(group.appliances[0].id);
    
    // Préparer les options de marque et type
    const brands = [...new Set(group.appliances.map(a => a.brand).filter(Boolean))];
    const types = [...new Set(group.appliances.map(a => a.type).filter(Boolean))];
    
    setSelectedBrand(brands[0] || "");
    setSelectedType(types[0] || "");
    setMergeDialogOpen(true);
  };

  const handleMerge = () => {
    if (!currentGroup || !keepApplianceId) return;

    const keepAppliance = currentGroup.appliances.find(a => a.id === keepApplianceId);
    const mergeIds = currentGroup.appliances.filter(a => a.id !== keepApplianceId).map(a => a.id);

    if (!keepAppliance) return;

    const mergedData: Partial<Appliance> = {
      brand: selectedBrand || keepAppliance.brand,
      type: selectedType || keepAppliance.type,
      lastUpdated: new Date().toISOString()
    };

    onMergeDuplicates(keepApplianceId, mergeIds, mergedData);
    setMergeDialogOpen(false);
    setCurrentGroup(null);
    toast(`${mergeIds.length + 1} appareils fusionnés`);
  };

  const getBrandOptions = () => {
    if (!currentGroup) return [];
    return [...new Set(currentGroup.appliances.map(a => a.brand).filter(Boolean))];
  };

  const getTypeOptions = () => {
    if (!currentGroup) return [];
    return [...new Set(currentGroup.appliances.map(a => a.type).filter(Boolean))];
  };

  if (duplicateGroups.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center text-green-600">
            <Eye className="h-4 w-4 mr-2" />
            <span>Aucun doublon détecté</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              <span>Doublons détectés</span>
              <Badge variant="destructive" className="ml-2">
                {duplicateGroups.length} groupe{duplicateGroups.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDuplicates(!showDuplicates)}
            >
              {showDuplicates ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDuplicates ? 'Masquer' : 'Afficher'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showDuplicates && (
          <CardContent>
            <div className="space-y-4">
              {duplicateGroups.map((group) => (
                <div key={group.id} className="border rounded p-4 bg-orange-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Référence: {group.appliances[0].reference}</h4>
                      <p className="text-sm text-gray-600">{group.duplicateReason}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenMergeDialog(group)}
                      className="flex items-center"
                    >
                      <Merge className="h-3.5 w-3.5 mr-1" />
                      Fusionner
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.appliances.map((appliance, index) => (
                      <div key={appliance.id} className="text-sm p-2 bg-white rounded border">
                        <div className="font-medium">Appareil {index + 1}</div>
                        <div>Marque: {appliance.brand || "Non spécifié"}</div>
                        <div>Type: {appliance.type || "Non spécifié"}</div>
                        <div className="text-gray-500">Ajouté: {appliance.dateAdded}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dialog de fusion */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Fusionner les doublons</DialogTitle>
            <DialogDescription>
              Sélectionnez l'appareil à conserver et choisissez les meilleures valeurs pour la marque et le type.
            </DialogDescription>
          </DialogHeader>

          {currentGroup && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Appareil à conserver</Label>
                <Select value={keepApplianceId} onValueChange={setKeepApplianceId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentGroup.appliances.map((appliance, index) => (
                      <SelectItem key={appliance.id} value={appliance.id}>
                        Appareil {index + 1} - Ajouté le {appliance.dateAdded}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Marque finale</Label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une marque" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBrandOptions().map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type final</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTypeOptions().map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Résultat:</strong> {currentGroup.appliances.length - 1} appareil(s) sera(ont) supprimé(s) 
                et leurs données seront fusionnées dans l'appareil conservé.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleMerge} disabled={!keepApplianceId || !selectedBrand || !selectedType}>
              Fusionner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DuplicateDetection;
