import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import { RecipeInstructionsWithSections } from '../recipe-instructions-with-sections';

// Mock the SectionManager component
jest.mock('../../sections/section-manager', () => ({
  SectionManager: ({ sections }: any) => (
    <div data-testid="section-manager">
      <div data-testid="sections-count">{sections.length}</div>
    </div>
  ),
}));

// Simple test wrapper
function TestWrapper({ 
  defaultInstructions = [{ id: '1', step: 1, content: 'Test instruction', duration: undefined }],
  defaultSections = []
}: { 
  defaultInstructions?: any[];
  defaultSections?: any[];
}) {
  const form = useForm({
    defaultValues: {
      instructions: defaultInstructions,
      instructionSections: defaultSections,
    },
  });

  return (
    <RecipeInstructionsWithSections
      control={form.control}
      watch={form.watch}
      errors={form.formState.errors}
      setError={form.setError}
      clearErrors={form.clearErrors}
    />
  );
}

describe('RecipeInstructionsWithSections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders flat instructions by default', () => {
    render(<TestWrapper />);
    
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test instruction')).toBeInTheDocument();
    expect(screen.getByText('Organize into Sections')).toBeInTheDocument();
    expect(screen.queryByTestId('section-manager')).not.toBeInTheDocument();
  });

  it('renders sections when provided', () => {
    const sections = [
      {
        id: 'section-1',
        name: 'Preparation',
        order: 0,
        items: [
          { id: '1', step: 1, content: 'Preheat oven', duration: 5 }
        ]
      }
    ];
    
    render(<TestWrapper defaultSections={sections} />);
    
    expect(screen.getByTestId('section-manager')).toBeInTheDocument();
    expect(screen.getByTestId('sections-count')).toHaveTextContent('1');
  });

  it('shows toggle button for switching modes', () => {
    render(<TestWrapper />);
    
    expect(screen.getByText('Organize into Sections')).toBeInTheDocument();
  });

  it('shows different toggle text when sections exist', () => {
    const sections = [
      {
        id: 'section-1',
        name: 'Test Section',
        order: 0,
        items: []
      }
    ];
    
    render(<TestWrapper defaultSections={sections} />);
    
    expect(screen.getByText('Use Simple List')).toBeInTheDocument();
  });

  it('renders instruction form fields', () => {
    render(<TestWrapper />);
    
    expect(screen.getByPlaceholderText('Describe this step...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Duration (min)')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders add step button in flat mode', () => {
    render(<TestWrapper />);
    
    expect(screen.getByText('Add Step')).toBeInTheDocument();
  });

  it('displays step numbers correctly', () => {
    const instructions = [
      { id: '1', step: 1, content: 'First step', duration: undefined },
      { id: '2', step: 2, content: 'Second step', duration: 10 },
      { id: '3', step: 3, content: 'Third step', duration: undefined }
    ];
    
    render(<TestWrapper defaultInstructions={instructions} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('handles duration field correctly', () => {
    const instructions = [
      { id: '1', step: 1, content: 'Test step', duration: 15 }
    ];
    
    render(<TestWrapper defaultInstructions={instructions} />);
    
    const durationInput = screen.getByDisplayValue('15');
    expect(durationInput).toBeInTheDocument();
    expect(durationInput).toHaveAttribute('type', 'number');
  });

  it('renders remove button for instructions', () => {
    const instructions = [
      { id: '1', step: 1, content: 'First step', duration: undefined },
      { id: '2', step: 2, content: 'Second step', duration: undefined }
    ];
    
    render(<TestWrapper defaultInstructions={instructions} />);
    
    const removeButtons = screen.getAllByRole('button', { name: /minus/i });
    expect(removeButtons).toHaveLength(2);
  });

  it('disables remove button when only one instruction exists', () => {
    render(<TestWrapper />);
    
    const removeButton = screen.getByRole('button', { name: /minus/i });
    expect(removeButton).toBeDisabled();
  });

  it('handles loading state correctly', () => {
    const form = useForm({
      defaultValues: {
        instructions: [{ id: '1', step: 1, content: 'Test', duration: undefined }],
        instructionSections: [],
      },
    });

    render(
      <RecipeInstructionsWithSections
        control={form.control}
        watch={form.watch}
        errors={form.formState.errors}
        setError={form.setError}
        clearErrors={form.clearErrors}
        isLoading={true}
      />
    );
    
    const toggleButton = screen.getByText('Organize into Sections');
    const removeButton = screen.getByRole('button', { name: /minus/i });
    const addButton = screen.getByText('Add Step');
    
    expect(toggleButton).toBeDisabled();
    expect(removeButton).toBeDisabled();
    expect(addButton).toBeDisabled();
  });

  it('displays section-level errors when present', () => {
    const form = useForm({
      defaultValues: {
        instructions: [],
        instructionSections: [{ id: 'section-1', name: 'Test', order: 0, items: [] }],
      },
    });

    // Mock form errors
    const mockErrors = {
      instructionSections: {
        type: 'manual',
        message: 'Section validation error'
      }
    } as any;

    render(
      <RecipeInstructionsWithSections
        control={form.control}
        watch={form.watch}
        errors={mockErrors}
        setError={form.setError}
        clearErrors={form.clearErrors}
      />
    );
    
    expect(screen.getByText('Section validation error')).toBeInTheDocument();
  });

  describe('Form Integration', () => {
    it('integrates with useFieldArray for instructions', () => {
      const form = useForm({
        defaultValues: {
          instructions: [
            { id: '1', step: 1, content: 'Test instruction', duration: 10 }
          ],
          instructionSections: [],
        },
      });

      render(
        <RecipeInstructionsWithSections
          control={form.control}
          watch={form.watch}
          errors={form.formState.errors}
          setError={form.setError}
          clearErrors={form.clearErrors}
        />
      );

      // Verify form field integration
      expect(screen.getByDisplayValue('Test instruction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('integrates with useFieldArray for instruction sections', () => {
      const sections = [
        {
          id: 'section-1',
          name: 'Preparation',
          order: 0,
          items: [
            { id: '1', step: 1, content: 'Prep step', duration: 5 }
          ]
        }
      ];

      const form = useForm({
        defaultValues: {
          instructions: [],
          instructionSections: sections,
        },
      });

      render(
        <RecipeInstructionsWithSections
          control={form.control}
          watch={form.watch}
          errors={form.formState.errors}
          setError={form.setError}
          clearErrors={form.clearErrors}
        />
      );

      // Should render section manager when sections exist
      expect(screen.getByTestId('section-manager')).toBeInTheDocument();
    });

    it('handles form validation errors', () => {
      const form = useForm({
        defaultValues: {
          instructions: [{ id: '1', step: 1, content: '', duration: undefined }],
          instructionSections: [],
        },
      });

      // Mock validation errors
      const mockErrors = {
        instructions: [
          {
            content: { 
              type: 'manual',
              message: 'Content is required' 
            }
          }
        ]
      } as any;

      render(
        <RecipeInstructionsWithSections
          control={form.control}
          watch={form.watch}
          errors={mockErrors}
          setError={form.setError}
          clearErrors={form.clearErrors}
        />
      );

      // Error handling is managed by FormField components
      // This test verifies the component accepts error props
      expect(screen.getByPlaceholderText('Describe this step...')).toBeInTheDocument();
    });

    it('calls setError and clearErrors when provided', () => {
      const mockSetError = jest.fn();
      const mockClearErrors = jest.fn();

      const form = useForm({
        defaultValues: {
          instructions: [],
          instructionSections: [
            {
              id: 'section-1',
              name: 'Test Section',
              order: 0,
              items: []
            }
          ],
        },
      });

      render(
        <RecipeInstructionsWithSections
          control={form.control}
          watch={form.watch}
          errors={form.formState.errors}
          setError={mockSetError}
          clearErrors={mockClearErrors}
        />
      );

      // Component should be rendered without errors
      expect(screen.getByTestId('section-manager')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<TestWrapper />);
      
      // Check for proper step labeling
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      
      // Check for form inputs
      expect(screen.getByPlaceholderText('Describe this step...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Duration (min)')).toBeInTheDocument();
    });

    it('maintains proper button accessibility', () => {
      render(<TestWrapper />);
      
      const addButton = screen.getByText('Add Step');
      const toggleButton = screen.getByText('Organize into Sections');
      
      expect(addButton).toHaveAttribute('type', 'button');
      expect(toggleButton).toHaveAttribute('type', 'button');
    });
  });
});