import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';

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
  defaultIngredients = [{ id: '1', name: 'Test Ingredient', amount: 1, unit: 'cup', notes: '', position: 0 }],
  defaultSections = [],
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
  const watchedAmount = form.watch('ingredients.0.amount');

  return (
    <FormProvider {...form}>
      <div data-testid="debug-amount">{watchedAmount}</div>
      <RecipeIngredientsWithSections
        control={form.control}
        watch={form.watch}
        errors={form.formState.errors}
        setError={form.setError}
        clearErrors={form.clearErrors}
        setValue={form.setValue}
      />
    </FormProvider>
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
          { id: '1', name: 'Flour', amount: 2, unit: 'cups', notes: '', position: 0 }
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
    expect(screen.getByPlaceholderText('e.g. 1 3/4')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Notes (optional)')).toBeInTheDocument();
  });

  it('renders add ingredient button in flat mode', () => {
    render(<TestWrapper />);

    expect(screen.getByText('Add Ingredient')).toBeInTheDocument();
  });

  it('falls back to displaying the decimal amount for legacy ingredients with no displayAmount', () => {
    render(<TestWrapper defaultIngredients={[
      { id: '1', name: 'Sugar', amount: 1.5, unit: 'cup', notes: '', position: 0 },
    ]} />);

    expect(screen.getByDisplayValue('1.5')).toBeInTheDocument();
  });

  it('parses a typed mixed fraction into amount and displayAmount on blur', async () => {
    const user = userEvent.setup();
    render(<TestWrapper defaultIngredients={[
      { id: '1', name: 'Flour', amount: 0, unit: 'cup', displayAmount: '', notes: '', position: 0 },
    ]} />);

    const quantityInput = screen.getByPlaceholderText('e.g. 1 3/4');
    await user.clear(quantityInput);
    await user.type(quantityInput, '1 3/4');
    await user.tab();

    expect(quantityInput).toHaveValue('1¾');
    expect(screen.getByTestId('debug-amount')).toHaveTextContent('1.75');
    expect(screen.queryByText(/enter a number or fraction/i)).not.toBeInTheDocument();
  });

  it('shows a validation error for unparseable quantity input', async () => {
    const user = userEvent.setup();
    render(<TestWrapper defaultIngredients={[
      { id: '1', name: 'Flour', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
    ]} />);

    const quantityInput = screen.getByPlaceholderText('e.g. 1 3/4');
    await user.clear(quantityInput);
    await user.type(quantityInput, 'abc');
    await user.tab();

    expect(await screen.findByText(/enter a number or fraction/i)).toBeInTheDocument();
  });
});