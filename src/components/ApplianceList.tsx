
import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Appliance } from "@/types/appliance";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";

interface ApplianceListProps {
  appliances: Appliance[];
  onDelete: (id: string) => void;
  onEdit: (appliance: Appliance) => void;
}

type SortField = "reference" | "commercialRef" | "brand" | "type";
type SortDirection = "asc" | "desc";

const ApplianceList: React.FC<ApplianceListProps> = ({ appliances, onDelete, onEdit }) => {
  const [sortField, setSortField] = useState<SortField>("reference");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAppliances = [...appliances].sort((a, b) => {
    const aValue = a[sortField]?.toLowerCase() || "";
    const bValue = b[sortField]?.toLowerCase() || "";

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Appareils enregistrés ({appliances.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            {appliances.length === 0 && (
              <TableCaption>Aucun appareil enregistré.</TableCaption>
            )}
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("reference")} className="cursor-pointer">
                  Référence technique
                  {sortField === "reference" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort("commercialRef")} className="cursor-pointer">
                  Référence commerciale
                  {sortField === "commercialRef" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort("brand")} className="cursor-pointer">
                  Marque
                  {sortField === "brand" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                  Type
                  {sortField === "type" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAppliances.map((appliance) => (
                <TableRow key={appliance.id}>
                  <TableCell>{appliance.reference}</TableCell>
                  <TableCell>{appliance.commercialRef || "-"}</TableCell>
                  <TableCell>{appliance.brand}</TableCell>
                  <TableCell>{appliance.type}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(appliance)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(appliance.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplianceList;
