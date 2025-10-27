"use client";

import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface EmptySection {
  sectionId: string;
  sectionName: string;
  type: 'ingredient' | 'instruction';
}

interface EmptySectionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  emptySections: EmptySection[];
  isLoading?: boolean;
}

export function EmptySectionWarningModal({
  isOpen,
  onClose,
  onConfirm,
  emptySections,
  isLoading = false,
}: EmptySectionWarningModalProps) {
  if (emptySections.length === 0) {
    return null;
  }

  const formatSectionList = (sections: EmptySection[]): string => {
    if (sections.length === 1) {
      const section = sections[0];
      return `"${section.sectionName}" (${section.type})`;
    }

    if (sections.length === 2) {
      return `"${sections[0].sectionName}" (${sections[0].type}) and "${sections[1].sectionName}" (${sections[1].type})`;
    }

    const lastSection = sections[sections.length - 1];
    const otherSections = sections.slice(0, -1);
    const otherSectionsList = otherSections
      .map(section => `"${section.sectionName}" (${section.type})`)
      .join(', ');
    
    return `${otherSectionsList}, and "${lastSection.sectionName}" (${lastSection.type})`;
  };

  const sectionList = formatSectionList(emptySections);
  const sectionWord = emptySections.length === 1 ? 'section' : 'sections';
  
  const description = `The following ${sectionWord} ${emptySections.length === 1 ? 'is' : 'are'} empty: ${sectionList}. 

Empty sections will be saved with the recipe but won't contain any items. You can add items to these sections later by editing the recipe.

Do you want to continue saving the recipe?`;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Empty Sections Detected"
      description={description}
      confirmText="Save Recipe"
      cancelText="Continue Editing"
      variant="warning"
      isLoading={isLoading}
    />
  );
}