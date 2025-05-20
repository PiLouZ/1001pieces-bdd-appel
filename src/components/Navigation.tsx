
import React from "react";
import { Link } from "react-router-dom";

const Navigation: React.FC = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 w-full">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Gestionnaire d'Appareils Électroménagers</Link>
        <div className="flex space-x-4">
          <Link to="/" className="text-white hover:text-blue-200">Accueil</Link>
          <Link to="/import" className="text-white hover:text-blue-200">Importer</Link>
          <Link to="/export" className="text-white hover:text-blue-200">Exporter</Link>
          <Link to="/help" className="text-white hover:text-blue-200">Aide</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
