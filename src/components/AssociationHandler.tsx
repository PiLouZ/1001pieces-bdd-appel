
import React from "react";

interface AssociationHandlerProps {
  associateAppliancesToPartReference: (applianceIds: string[], partReference: string) => number;
}

export const AssociationHandler: React.FC<AssociationHandlerProps> = ({
  associateAppliancesToPartReference
}) => {
  const safeAssociateAppliancesToPartReference = (applianceIds: string[], partReference: string) => {
    if (!Array.isArray(applianceIds) || !partReference) {
      console.warn("Invalid parameters for associateApplicancesToPartReference");
      return 0;
    }
    return associateAppliancesToPartReference(applianceIds, partReference);
  };

  // Return null since this is just a utility component
  return null;
};

export const useAssociationHandler = (
  associateAppliancesToPartReference: (applianceIds: string[], partReference: string) => number
) => {
  const safeAssociateAppliancesToPartReference = (applianceIds: string[], partReference: string) => {
    if (!Array.isArray(applianceIds) || !partReference) {
      console.warn("Invalid parameters for associateApplicancesToPartReference");
      return 0;
    }
    return associateAppliancesToPartReference(applianceIds, partReference);
  };

  return {
    safeAssociateAppliancesToPartReference
  };
};
