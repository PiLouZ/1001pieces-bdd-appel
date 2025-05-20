
import React from "react";

const Navigation: React.FC = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 w-full">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Gestionnaire d'Appareils Électroménagers</h1>
        <div className="flex space-x-4">
          <a href="#import" className="text-white hover:text-blue-200">Importer</a>
          <a href="#help" className="text-white hover:text-blue-200">Aide</a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
