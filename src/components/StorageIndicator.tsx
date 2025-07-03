import React from "react";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

const StorageIndicator: React.FC = () => {
  // Dans Lovable, on est toujours dans un environnement navigateur donc IndexedDB
  const isNodeEnvironment = typeof window === 'undefined';
  const storageType = isNodeEnvironment ? 'SQLite' : 'IndexedDB';
  const isOptimal = isNodeEnvironment;

  return (
    <div className="flex items-center gap-2">
      <Database className="h-4 w-4" />
      <Badge 
        variant="secondary"
        className="bg-blue-500 hover:bg-blue-600 text-white"
      >
        Stockage: {storageType}
      </Badge>
      <span className="text-xs text-blue-100">
        (Navigateur - Fonctionnel)
      </span>
    </div>
  );
};

export default StorageIndicator;