/**
 * Integration tests for SectionManager validation
 * 
 * Tests Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionManager, Section } from '../section-manager';

// Mock ingredient type
interface MockIngredient {
  id: string;
  text: string;
  position: number;
}

describe('SectionManager Validation Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnSectionsChange = jest.fn();
  const mockOnAddItem = jest.fn();
  const mockOnRemoveItem = jest.fn();
  const mockOnValidate = jest.fn();

  const mockRenderItem = (item: MockIngredient, index: number, sectionId: string) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      <input
        type="text"
        value={item.text}
        placeholder="Ingredient name"
        aria-label={`Ingredient ${index + 1}`}
        readOnly
      />
      <button
        onClick={() => mockOnRemoveItem(sectionId, item.id)}
        aria-label={`Remove ingredient ${index + 1}`}
      >
        Remove
      </button>
    </div>
  );

  const createMockSection = (
    id: string,
    name: string,
    order: number,
    items: MockIngredient[] = []
  ): Section<MockIngredient> => ({
    id,
    name,
    order,
    items,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  describe('Empty section error display (Req 2.1, 2.2, 2.3, 2.4)', () => {
    it('should display error message for empty section', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Check for error message
      expect(
        screen.getByText('This section must contain at least one ingredient')
      ).toBeInTheDocument();
    });

    it('should display error with proper styling for empty section', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Find the error container
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveClass('validation-error-container');
      expect(errorContainer).toHaveTextContent(
        'This section must contain at least one ingredient'
      );
    });

    it('should not display error when section has items', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Should not show error message
      expect(
        screen.queryByText('This section must contain at least one ingredient')
      ).not.toBeInTheDocument();
    });

    it('should show empty section indicator when section has no items', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      // Check for empty section indicator
      expect(
        screen.getByText(/This section is empty/i)
      ).toBeInTheDocument();
    });
  });

  describe('Empty section name error display (Req 1.1, 1.2, 1.3)', () => {
    it('should display error message for empty section name', () => {
      const sections = [
        createMockSection('section-1', '', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set('ingredientSections.0.name', 'Section name is required');

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Check for error message (appears in multiple places)
      const errorMessages = screen.getAllByText('Section name is required');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should display error for whitespace-only section name', () => {
      const sections = [
        createMockSection('section-1', '   ', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'ingredientSections.0.name',
        'Section name cannot be only whitespace'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Check for error message (appears in multiple places)
      const errorMessages = screen.getAllByText('Section name cannot be only whitespace');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should not display error when section name is valid', () => {
      const sections = [
        createMockSection('section-1', 'Valid Section Name', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      expect(screen.queryByText('Section name is required')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Section name cannot be only whitespace')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error styling on invalid sections (Req 5.1, 5.2, 5.3)', () => {
    it('should apply error styling to section container with validation errors', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Find the section container
      const sectionContainer = screen.getByRole('group');
      expect(sectionContainer).toHaveClass('border-red-300');
      expect(sectionContainer).toHaveClass('dark:border-red-700');
    });

    it('should apply aria-invalid attribute to invalid sections', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      const sectionContainer = screen.getByRole('group');
      expect(sectionContainer).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not apply error styling to valid sections', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      const sectionContainer = screen.getByRole('group');
      expect(sectionContainer).not.toHaveClass('border-red-300');
      expect(sectionContainer).toHaveAttribute('aria-invalid', 'false');
    });

    it('should apply error styling to section header with name error', () => {
      const sections = [
        createMockSection('section-1', '', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set('ingredientSections.0.name', 'Section name is required');

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Section container should have error styling
      const sectionContainer = screen.getByRole('group');
      expect(sectionContainer).toHaveClass('border-red-300');
    });
  });

  describe('Validation after section operations (Req 2.1, 2.2, 2.3, 2.4)', () => {
    it('should trigger validation callback when adding a section', async () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          onValidate={mockOnValidate}
        />
      );

      const addButton = screen.getByRole('button', { name: /add ingredient section/i });
      await user.click(addButton);

      expect(mockOnValidate).toHaveBeenCalledTimes(1);
    });

    it('should trigger validation callback when deleting a section', async () => {
      const sections = [
        createMockSection('section-1', 'Test Section 1', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
        createMockSection('section-2', 'Test Section 2', 1, [
          { id: 'item-2', text: 'Sugar', position: 0 },
        ]),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          onValidate={mockOnValidate}
        />
      );

      // Find delete button for first section
      const deleteButtons = screen.getAllByRole('button', { name: /delete.*section/i });
      await user.click(deleteButtons[0]);

      // Wait for modal to appear and find the confirm button
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the confirm button in the modal (not the section delete buttons)
      const confirmButtons = screen.getAllByRole('button', { name: /^delete$/i });
      const modalConfirmButton = confirmButtons.find(btn => 
        btn.textContent === 'Delete' && !btn.getAttribute('aria-label')
      );
      
      if (modalConfirmButton) {
        await user.click(modalConfirmButton);
      }

      await waitFor(() => {
        expect(mockOnValidate).toHaveBeenCalledTimes(1);
      });
    });

    it('should trigger validation callback when renaming a section', async () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          onValidate={mockOnValidate}
        />
      );

      // Find the editable title (it should be a button or input)
      const titleElement = screen.getByText('Test Section');
      await user.click(titleElement);

      // Type new name
      const input = screen.getByDisplayValue('Test Section');
      await user.clear(input);
      await user.type(input, 'New Section Name');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnValidate).toHaveBeenCalled();
      });
    });

    it('should update sections when adding a new section', async () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          onValidate={mockOnValidate}
        />
      );

      const addButton = screen.getByRole('button', { name: /add ingredient section/i });
      await user.click(addButton);

      expect(mockOnSectionsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'section-1' }),
          expect.objectContaining({
            name: 'Untitled Section',
            order: 1,
            items: [],
          }),
        ])
      );
    });

    it('should update sections when deleting a section', async () => {
      const sections = [
        createMockSection('section-1', 'Test Section 1', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
        createMockSection('section-2', 'Test Section 2', 1, [
          { id: 'item-2', text: 'Sugar', position: 0 },
        ]),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          onValidate={mockOnValidate}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete.*section/i });
      await user.click(deleteButtons[0]);

      // Wait for modal to appear and find the confirm button
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the confirm button in the modal
      const confirmButtons = screen.getAllByRole('button', { name: /^delete$/i });
      const modalConfirmButton = confirmButtons.find(btn => 
        btn.textContent === 'Delete' && !btn.getAttribute('aria-label')
      );
      
      if (modalConfirmButton) {
        await user.click(modalConfirmButton);
      }

      await waitFor(() => {
        expect(mockOnSectionsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'section-2', order: 0 }),
          ])
        );
      });
    });
  });

  describe('Error clearing when section becomes valid (Req 5.2, 5.3)', () => {
    it('should not display error when empty section gets items added', () => {
      const sectionsWithItems = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();

      const { rerender } = render(
        <SectionManager
          sections={[createMockSection('section-1', 'Test Section', 0, [])]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={new Map([
            ['ingredientSections.0.items', 'This section must contain at least one ingredient'],
          ])}
          onValidate={mockOnValidate}
        />
      );

      // Initially should show error
      expect(
        screen.getByText('This section must contain at least one ingredient')
      ).toBeInTheDocument();

      // Rerender with items added and no errors
      rerender(
        <SectionManager
          sections={sectionsWithItems}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Error should be gone
      expect(
        screen.queryByText('This section must contain at least one ingredient')
      ).not.toBeInTheDocument();
    });

    it('should not display error when section name is corrected', () => {
      const { rerender } = render(
        <SectionManager
          sections={[
            createMockSection('section-1', '', 0, [
              { id: 'item-1', text: 'Flour', position: 0 },
            ]),
          ]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={new Map([
            ['ingredientSections.0.name', 'Section name is required'],
          ])}
          onValidate={mockOnValidate}
        />
      );

      // Initially should show error (appears in multiple places)
      const initialErrors = screen.getAllByText('Section name is required');
      expect(initialErrors.length).toBeGreaterThan(0);

      // Rerender with valid name and no errors
      rerender(
        <SectionManager
          sections={[
            createMockSection('section-1', 'Valid Name', 0, [
              { id: 'item-1', text: 'Flour', position: 0 },
            ]),
          ]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={new Map()}
          onValidate={mockOnValidate}
        />
      );

      // Error should be gone
      expect(screen.queryByText('Section name is required')).not.toBeInTheDocument();
    });

    it('should remove error styling when section becomes valid', () => {
      const { rerender } = render(
        <SectionManager
          sections={[createMockSection('section-1', 'Test Section', 0, [])]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={new Map([
            ['ingredientSections.0.items', 'This section must contain at least one ingredient'],
          ])}
          onValidate={mockOnValidate}
        />
      );

      // Initially should have error styling
      let sectionContainer = screen.getByRole('group');
      expect(sectionContainer).toHaveClass('border-red-300');
      expect(sectionContainer).toHaveAttribute('aria-invalid', 'true');

      // Rerender with valid section
      rerender(
        <SectionManager
          sections={[
            createMockSection('section-1', 'Test Section', 0, [
              { id: 'item-1', text: 'Flour', position: 0 },
            ]),
          ]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={new Map()}
          onValidate={mockOnValidate}
        />
      );

      // Error styling should be removed
      sectionContainer = screen.getByRole('group');
      expect(sectionContainer).not.toHaveClass('border-red-300');
      expect(sectionContainer).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Multiple validation errors display simultaneously (Req 5.1, 5.2)', () => {
    it('should display both name and items errors for the same section', () => {
      const sections = [
        createMockSection('section-1', '', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set('ingredientSections.0.name', 'Section name is required');
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Both errors should be displayed (name error appears in multiple places)
      const nameErrors = screen.getAllByText('Section name is required');
      expect(nameErrors.length).toBeGreaterThan(0);
      expect(
        screen.getByText('This section must contain at least one ingredient')
      ).toBeInTheDocument();
    });

    it('should display errors for multiple sections simultaneously', () => {
      const sections = [
        createMockSection('section-1', '', 0, []),
        createMockSection('section-2', 'Valid Section', 1, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set('ingredientSections.0.name', 'Section name is required');
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );
      validationErrors.set(
        'ingredientSections.1.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // All errors should be displayed (name error appears in multiple places)
      const nameErrors = screen.getAllByText('Section name is required');
      expect(nameErrors.length).toBeGreaterThan(0);
      const itemsErrors = screen.getAllByText(
        'This section must contain at least one ingredient'
      );
      expect(itemsErrors).toHaveLength(2);
    });

    it('should apply error styling to all invalid sections', () => {
      const sections = [
        createMockSection('section-1', '', 0, []),
        createMockSection('section-2', 'Valid Section', 1, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set('ingredientSections.0.name', 'Section name is required');
      validationErrors.set(
        'ingredientSections.1.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      // Both sections should have error styling
      const sectionContainers = screen.getAllByRole('group');
      expect(sectionContainers).toHaveLength(2);
      sectionContainers.forEach((container) => {
        expect(container).toHaveClass('border-red-300');
        expect(container).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should handle mixed valid and invalid sections', () => {
      const sections = [
        createMockSection('section-1', 'Valid Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
        createMockSection('section-2', '', 1, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set('ingredientSections.1.name', 'Section name is required');
      validationErrors.set(
        'ingredientSections.1.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      const sectionContainers = screen.getAllByRole('group');
      expect(sectionContainers).toHaveLength(2);

      // First section should not have error styling
      expect(sectionContainers[0]).not.toHaveClass('border-red-300');
      expect(sectionContainers[0]).toHaveAttribute('aria-invalid', 'false');

      // Second section should have error styling
      expect(sectionContainers[1]).toHaveClass('border-red-300');
      expect(sectionContainers[1]).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Accessibility features (Req 5.1, 5.2, 5.3)', () => {
    it('should use aria-describedby to associate errors with sections', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      const sectionContainer = screen.getByRole('group');
      const describedBy = sectionContainer.getAttribute('aria-describedby');
      expect(describedBy).toContain('section-');
      expect(describedBy).toContain('-error');
    });

    it('should use role="alert" for error messages', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'ingredientSections.0.items',
        'This section must contain at least one ingredient'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should provide aria-label for empty section indicator', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      const emptyIndicator = screen.getByRole('status');
      expect(emptyIndicator).toHaveAttribute('aria-label');
    });

    it('should use aria-labelledby to associate section with its title', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      const sectionContainer = screen.getByRole('group');
      const labelledBy = sectionContainer.getAttribute('aria-labelledby');
      expect(labelledBy).toContain('section-');
      expect(labelledBy).toContain('-title');
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle sections with instruction type', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, []),
      ];

      const validationErrors = new Map<string, string>();
      validationErrors.set(
        'instructionSections.0.items',
        'This section must contain at least one step'
      );

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="instruction"
          validationErrors={validationErrors}
          onValidate={mockOnValidate}
        />
      );

      expect(
        screen.getByText('This section must contain at least one step')
      ).toBeInTheDocument();
    });

    it('should handle empty sections array', () => {
      render(
        <SectionManager
          sections={[]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      expect(screen.getByText(/no sections yet/i)).toBeInTheDocument();
    });

    it('should handle validation errors without onValidate callback', async () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      const validationErrors = new Map<string, string>();

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          validationErrors={validationErrors}
        />
      );

      // Should not crash when adding section without onValidate
      const addButton = screen.getByRole('button', { name: /add ingredient section/i });
      await user.click(addButton);

      expect(mockOnSectionsChange).toHaveBeenCalled();
    });

    it('should handle loading state', () => {
      render(
        <SectionManager
          sections={[]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          isLoading={true}
        />
      );

      // Should show loading skeleton
      const skeletons = document.querySelectorAll('.section-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should handle adding section loading state', () => {
      const sections = [
        createMockSection('section-1', 'Test Section', 0, [
          { id: 'item-1', text: 'Flour', position: 0 },
        ]),
      ];

      render(
        <SectionManager
          sections={sections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          isAddingSection={true}
        />
      );

      const addButton = screen.getByRole('button', { name: /add ingredient section/i });
      expect(addButton).toBeDisabled();
    });
  });
});
