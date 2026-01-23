import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionHeader } from '../section-header';

const mockSection = {
  id: 'section-1',
  name: 'Test Section',
  order: 1
};

describe('SectionHeader', () => {
  const mockOnRename = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnRename.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders section name and controls', () => {
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByTitle('Delete section')).toBeInTheDocument();
  });

  it('calls onRename when title is changed', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    // Click on the title to edit it
    await user.click(screen.getByText('Test Section'));
    
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Section Name');
    await user.keyboard('{Enter}');

    expect(mockOnRename).toHaveBeenCalledWith('section-1', 'New Section Name');
  });

  it('shows delete confirmation modal when delete button is clicked for section with items', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        hasItems={true}
      />
    );

    await user.click(screen.getByTitle('Delete section'));

    expect(screen.getByText('Delete Section')).toBeInTheDocument();
    expect(screen.getByText(/Delete this section and all its contents/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('deletes empty section immediately without confirmation', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        hasItems={false}
      />
    );

    await user.click(screen.getByTitle('Delete section'));

    // Should delete immediately without showing modal
    expect(mockOnDelete).toHaveBeenCalledWith('section-1');
    expect(screen.queryByText('Delete Section')).not.toBeInTheDocument();
  });

  it('shows special message when deleting last section', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        hasItems={true}
        isLastSection={true}
      />
    );

    await user.click(screen.getByTitle('Delete section'));

    expect(screen.getByText('Delete Last Section')).toBeInTheDocument();
    expect(screen.getByText(/convert your recipe to unsectioned mode/)).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed for section with items', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        hasItems={true}
      />
    );

    // Open delete modal
    await user.click(screen.getByTitle('Delete section'));
    
    // Confirm deletion
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockOnDelete).toHaveBeenCalledWith('section-1');
  });

  it('closes modal when delete is cancelled', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        hasItems={true}
      />
    );

    // Open delete modal
    await user.click(screen.getByTitle('Delete section'));
    expect(screen.getByText('Delete Section')).toBeInTheDocument();
    
    // Cancel deletion
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Delete Section')).not.toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        hasItems={true}
      />
    );

    // Open delete modal
    await user.click(screen.getByTitle('Delete section'));
    expect(screen.getByText('Delete Section')).toBeInTheDocument();
    
    // Click backdrop - the ConfirmationModal uses a different structure
    const backdrop = document.querySelector('[role="dialog"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText('Delete Section')).not.toBeInTheDocument();
    });
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('hides delete button when canDelete is false', () => {
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        canDelete={false}
      />
    );

    expect(screen.queryByTitle('Delete section')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        className="custom-class"
      />
    );

    // Find the main header container by looking for the element with the flex class
    const header = document.querySelector('.flex.items-center');
    expect(header).toHaveClass('custom-class');
  });

  it('does not render drag handle', () => {
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />
    );

    // Verify drag handle is not present
    expect(screen.queryByTitle('Drag to reorder')).not.toBeInTheDocument();
    
    // Verify no drag-related classes are present
    const header = document.querySelector('.flex.items-center');
    expect(header).not.toHaveClass('section-drag-preview');
    expect(header).not.toHaveClass('cursor-grab');
  });

  it('closes modal after successful deletion', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionHeader
        section={mockSection}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        hasItems={true}
      />
    );

    // Open and confirm deletion
    await user.click(screen.getByTitle('Delete section'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    // Modal should be closed
    expect(screen.queryByText('Delete Section')).not.toBeInTheDocument();
  });
});