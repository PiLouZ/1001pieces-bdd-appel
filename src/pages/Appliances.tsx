import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Appliance } from "@/types/appliance";
import { useAppliances } from "@/hooks/useAppliances";
import ApplianceList from "@/components/ApplianceList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toastWithProgress } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";

const AppliancessPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAppliances, setFilteredAppliances] = useState<Appliance[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [selectedAppliances, setSelectedAppliances] = useState<{
    [key: string]: boolean;
  }>({});
  const [needsUpdateCount, setNeedsUpdateCount] = useState(0);
  const [inconsistentCount, setInconsistentCount] = useState(0);
  const [filteredStatus, setFilteredStatus] = useState<
    "all" | "needs-update" | "inconsistent"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [bulkUpdateField, setBulkUpdateField] =
    useState<"brand" | "type" | null>(null);
  const [bulkUpdateValue, setBulkUpdateValue] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const { toast } = useToast();

  const {
    allAppliances,
    needsUpdateCount: needsUpdate,
    searchQuery: globalSearchQuery,
    setSearchQuery: setGlobalSearchQuery,
    addAppliance,
    updateAppliance,
    updateMultipleAppliances,
    importAppliances,
    deleteAppliance,
    clearDatabase,
    cleanDatabase,
    knownBrands,
    knownTypes,
    suggestBrand,
    suggestType,
    associateApplicancesToPartReference,
    getAppliancesByPartReference,
    getPartReferencesForAppliance,
  } = useAppliances();

  useEffect(() => {
    setAppliances(allAppliances);
  }, [allAppliances]);

  useEffect(() => {
    setNeedsUpdateCount(needsUpdate);
  }, [needsUpdate]);

  useEffect(() => {
    setFilteredAppliances(appliances);
  }, [appliances]);

  useEffect(() => {
    setGlobalSearchQuery(searchQuery);
  }, [searchQuery, setGlobalSearchQuery]);

  const checkInconsistencies = () => {
    const inconsistent = appliances.filter(
      (appliance) => !appliance.brand || !appliance.type
    );
    setInconsistentCount(inconsistent.length);
    if (inconsistent.length === 0) {
      toast({
        description: "Tous les appareils ont une marque et un type.",
      });
    } else {
      toast({
        description: `${inconsistent.length} appareils ont des informations manquantes.`,
      });
    }
  };

  const cleanDuplicates = () => {
    const deletedCount = cleanDatabase();
    toastWithProgress("Doublons supprimés", {
      description: `${deletedCount} doublons ont été supprimés de la base de données.`
    });
  };

  useEffect(() => {
    const uniqueRefs = new Set<string>();
    const duplicates: Appliance[] = [];

    appliances.forEach((appliance) => {
      if (uniqueRefs.has(appliance.reference)) {
        duplicates.push(appliance);
      } else {
        uniqueRefs.add(appliance.reference);
      }
    });

    setDuplicateCount(duplicates.length);
  }, [appliances]);

  const handleBulkDelete = (ids: string[]) => {
    ids.forEach((id) => handleDeleteAppliance(id));
  };

  const handleSelectAppliance = (id: string, selected: boolean) => {
    setSelectedAppliances((prev) => ({
      ...prev,
      [id]: selected,
    }));
  };

  const handleSelectAllAppliances = (selected: boolean) => {
    const newSelection: { [key: string]: boolean } = {};
    appliances.forEach((appliance) => {
      newSelection[appliance.id] = selected;
    });
    setSelectedAppliances(newSelection);
  };

  const handleUpdateAppliance = (appliance: Appliance) => {
    updateAppliance(appliance);
  };

  const handleDeleteAppliance = (id: string) => {
    deleteAppliance(id);
  };

  const handleBulkUpdateAppliances = (
    field: "brand" | "type",
    value: string
  ) => {
    const selectedIds = Object.keys(selectedAppliances).filter(
      (id) => selectedAppliances[id]
    );
    if (selectedIds.length > 0) {
      const updatedCount = updateMultipleAppliances(selectedIds, {
        [field]: value,
      });
      toastWithProgress("Mise à jour effectuée", {
        description: `${updatedCount} appareils ont été mis à jour.`
      });
      setSelectedAppliances({});
    }
  };

  const handleClearDatabase = () => {
    clearDatabase();
    toastWithProgress("Base de données effacée", {
      description: "Toutes les données ont été supprimées."
    });
  };

  const handleConfirmClear = () => {
    setConfirmClear(true);
  };

  const handleCancelClear = () => {
    setConfirmClear(false);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppliances.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Gestion des appareils</h1>
      <p className="text-gray-500 mb-6">
        Consultez, modifiez ou supprimez les appareils existants
      </p>

      <div className="flex flex-wrap gap-4 mb-8">
        <Button
          variant={filteredStatus === "all" ? "default" : "outline"}
          onClick={() => setFilteredStatus("all")}
        >
          Tous ({filteredAppliances.length})
        </Button>
        <Button
          variant={filteredStatus === "needs-update" ? "default" : "outline"}
          onClick={() => setFilteredStatus("needs-update")}
          className={
            needsUpdateCount > 0
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800"
              : ""
          }
        >
          Besoin de mise à jour ({needsUpdateCount})
        </Button>
        <Button
          variant={filteredStatus === "inconsistent" ? "default" : "outline"}
          onClick={checkInconsistencies}
          className={
            inconsistentCount > 0
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800"
              : ""
          }
        >
          Vérifier les incohérences ({inconsistentCount})
        </Button>
        <Button
          variant="outline"
          onClick={cleanDuplicates}
          className={
            duplicateCount > 0
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800"
              : ""
          }
        >
          Supprimer les doublons ({duplicateCount})
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Input
          type="text"
          placeholder="Rechercher un appareil..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="my-4">
        <ApplianceList
          appliances={currentItems}
          onDelete={handleDeleteAppliance}
          onEdit={handleUpdateAppliance}
          onSelect={handleSelectAppliance}
          selected={selectedAppliances}
          onSelectAll={handleSelectAllAppliances}
          onBulkUpdate={handleBulkUpdateAppliances}
          onBulkDelete={handleBulkDelete}
          getPartReferencesForAppliance={getPartReferencesForAppliance}
        />
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-gray-500">
          Page {currentPage} sur{" "}
          {Math.ceil(filteredAppliances.length / itemsPerPage)}
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === Math.ceil(
              filteredAppliances.length / itemsPerPage
            )}
          >
            Suivant
          </Button>
        </div>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer toutes les données ? Cette
              action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelClear}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleClearDatabase}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppliancessPage;
