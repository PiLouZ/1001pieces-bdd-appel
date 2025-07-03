
import React from "react";
import { Link } from "react-router-dom";
import { Database, FileText, Import } from "lucide-react";
import StorageIndicator from "./StorageIndicator";

const Navigation: React.FC = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 w-full">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold">Gestionnaire d'Appareils Électroménagers</Link>
          <StorageIndicator />
        </div>
        <div className="flex space-x-4">
          <Link to="/" className="text-white hover:text-blue-200 flex items-center">
            <FileText className="mr-1 h-4 w-4" />
            Accueil
          </Link>
          <Link to="/appliances" className="text-white hover:text-blue-200 flex items-center">
            <Database className="mr-1 h-4 w-4" />
            Appareils
          </Link>
          <Link to="/import" className="text-white hover:text-blue-200 flex items-center">
            <Import className="mr-1 h-4 w-4" />
            Importer
          </Link>
          <Link to="/export" className="text-white hover:text-blue-200 flex items-center">
            <FileText className="mr-1 h-4 w-4" />
            Exporter
          </Link>
          <Link to="/help" className="text-white hover:text-blue-200 flex items-center">
            <FileText className="mr-1 h-4 w-4" />
            Aide
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
