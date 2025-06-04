
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportSession {
  id: string;
  name?: string;
  dateAdded: string;
  count: number;
}

interface ImportSessionFilterProps {
  sessions: ImportSession[];
  selectedSession: string | null;
  onSessionChange: (sessionId: string | null) => void;
  showLastSessionOnly: boolean;
  onToggleLastSession: () => void;
}

const ImportSessionFilter: React.FC<ImportSessionFilterProps> = ({
  sessions,
  selectedSession,
  onSessionChange,
  showLastSessionOnly,
  onToggleLastSession
}) => {
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  const handleSelectChange = (value: string) => {
    if (value === "all") {
      onSessionChange(null);
    } else {
      onSessionChange(value);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Sessions d'import:</span>
      </div>

      {lastSession && (
        <Button
          variant={showLastSessionOnly ? "default" : "outline"}
          size="sm"
          onClick={onToggleLastSession}
          className="flex items-center gap-1"
        >
          <Calendar className="h-3.5 w-3.5" />
          Dernière session
          {showLastSessionOnly && (
            <Badge variant="secondary" className="ml-1">
              {lastSession.count}
            </Badge>
          )}
        </Button>
      )}

      <Select value={selectedSession || "all"} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Toutes les sessions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les sessions</SelectItem>
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              <div className="flex items-center justify-between w-full">
                <span>{session.name || `Session ${session.dateAdded}`}</span>
                <Badge variant="outline" className="ml-2">
                  {session.count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(selectedSession || showLastSessionOnly) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSessionChange(null);
            if (showLastSessionOnly) onToggleLastSession();
          }}
          className="flex items-center gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
};

export default ImportSessionFilter;
