import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import { RecipeIngredientsWithSections } from '../recipe-ingredients-with-sections';

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
  defaultIngredients = [{ id: '1', name: 'Test Ingredient', amount: 1, unit: 'cup', notes: '' }],
  defaultSections = []
}: { 
  defaultIngredients?: any[];
  defaultSections?: any[];
}) {
  const form = useForm({
    defaultValues: {
      ingredients: defaultIngredients,
      ingredientSections: defaultSections,
    },
  });

  return (
    <RecipeIngredientsWithSections
      control={form.control}
      watch={form.watch}
      errors={form.formState.errors}
      setError={form.setError}
      clearErrors={form.clearErrors}
    />
  );
}

describe('RecipeIngredientsWithSections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders flat ingredients by default', () => {
    render(<TestWrapper />);
    
    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Ingredient')).toBeInTheDocument();
    expect(screen.getByText('Organize into Sections')).toBeInTheDocument();
    expect(screen.queryByTestId('section-manager')).not.toBeInTheDocument();
  });

  it('renders sections when provided', () => {
    const sections = [
      {
        id: 'section-1',
        name: 'Main Ingredients',
        order: 0,
        items: [
          { id: '1', name: 'Flour', amount: 2, unit: 'cups', notes: '' }
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

  it('renders ingredient form fields', () => {
    render(<TestWrapper />);
    
    expect(screen.getByPlaceholderText('Ingredient name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Notes (optional)')).toBeInTheDocument();
  });

  it('renders add ingredient button in flat mode', () => {
    render(<TestWrapper />);
    
    expect(screen.getByText('Add Ingredient')).toBeInTheDocument();
  });
});