
import React from "react";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Import as ImportIcon } from "lucide-react";
import ImportForm from "@/components/ImportForm";
import { useAppliances } from "@/hooks/useAppliances";
import { useImportWithAssociation } from "@/hooks/useImportWithAssociation";
import { useAssociationHandler } from "@/components/AssociationHandler";
import { Appliance } from "@/types/appliance";

const Import: React.FC = () => {
  const { 
    knownBrands = [], 
    knownTypes = [], 
    knownPartReferences = [],
    allAppliances = [],
    suggestBrand,
    suggestType
  } = useAppliances();

  const { importAppliancesWithAssociation } = useImportWithAssociation();

  const safeKnownBrands = Array.isArray(knownBrands) ? knownBrands : [];
  const safeKnownTypes = Array.isArray(knownTypes) ? knownTypes : [];
  const safeKnownPartReferences = Array.isArray(knownPartReferences) ? knownPartReferences : [];
  const safeAllAppliances = Array.isArray(allAppliances) ? allAppliances : [];

  const handleImport = async (appliances: Appliance[], partReference?: string): Promise<Appliance[]> => {
    const result = await importAppliancesWithAssociation(appliances, partReference);
    
    // Return the imported appliances for compatibility with ImportForm
    return appliances.slice(0, result.importedCount);
  };

  const getApplianceByReference = (ref: string) => {
    return safeAllAppliances.find(a => a.reference === ref);
  };

  const getApplianceByCommercialRef = (ref: string) => {
    return safeAllAppliances.find(a => a.commercialRef === ref);
  };

  const safeSuggestBrand = (reference: string): string | null => {
    if (!reference || typeof suggestBrand !== 'function') return null;
    return suggestBrand(reference);
  };

  const safeSuggestType = (reference: string, brand: string): string | null => {
    if (!reference || !brand || typeof suggestType !== 'function') return null;
    return suggestType(reference, brand);
  };

  // Dummy association function for compatibility
  const safeAssociateAppliancesToPartReference = (applianceIds: string[], partRef: string): number => {
    // This is handled by importAppliancesWithAssociation now
    return applianceIds.length;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <ImportIcon className="mr-2 h-6 w-6" />
          Importer des appareils
        </h1>
        
        <div className="grid grid-cols-1 gap-6">
          <ImportForm 
            onImport={handleImport} 
            knownBrands={safeKnownBrands} 
            knownTypes={safeKnownTypes}
            knownPartReferences={safeKnownPartReferences}
            getApplianceByReference={getApplianceByReference}
            getApplianceByCommercialRef={getApplianceByCommercialRef}
            suggestBrand={safeSuggestBrand}
            suggestType={safeSuggestType}
            associateAppliancesToPartReference={safeAssociateAppliancesToPartReference}
          />
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} - Gestionnaire d'Appareils Électroménagers</p>
      </footer>
    </div>
  );
};

export default Import;
