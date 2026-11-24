import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { RecipeInstructionsWithSections } from '../recipe-instructions-with-sections';
import type { Instruction } from '@/types/recipe';
import type { InstructionSection } from '@/types/sections';

const step = (id: string, stepNumber: number, position: number): Instruction => ({
  id,
  step: stepNumber,
  content: `Step ${stepNumber} text`,
  position,
});

function Harness({
  instructions = [],
  instructionSections = [],
}: {
  instructions?: Instruction[];
  instructionSections?: InstructionSection[];
}) {
  const form = useForm({ defaultValues: { instructions, instructionSections } });
  return (
    <Form {...form}>
      <RecipeInstructionsWithSections control={form.control} watch={form.watch} />
    </Form>
  );
}

describe('RecipeInstructionsWithSections delete controls', () => {
  it('labels each step delete button with its step number', () => {
    render(<Harness instructions={[step('a', 1, 0), step('b', 2, 1)]} />);

    expect(screen.getByRole('button', { name: 'Delete step 1' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete step 2' })).toBeEnabled();
  });

  it('removes a step when its delete button is clicked', () => {
    render(<Harness instructions={[step('a', 1, 0), step('b', 2, 1)]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete step 2' }));

    expect(screen.queryByRole('button', { name: 'Delete step 2' })).not.toBeInTheDocument();
  });

  it('blocks deleting the only step in flat mode', () => {
    render(<Harness instructions={[step('a', 1, 0)]} />);

    expect(screen.getByRole('button', { name: 'Delete step 1' })).toBeDisabled();
  });

  it('blocks deleting the only step in sectioned mode', () => {
    render(
      <Harness
        instructionSections={[{ id: 's1', name: 'Prep', order: 0, items: [step('a', 1, 0)] }]}
      />
    );

    expect(screen.getByRole('button', { name: 'Delete step 1' })).toBeDisabled();
  });

  it('allows deleting a step when other sections still have steps', () => {
    render(
      <Harness
        instructionSections={[
          { id: 's1', name: 'Prep', order: 0, items: [step('a', 1, 0)] },
          { id: 's2', name: 'Bake', order: 1, items: [step('b', 2, 0)] },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Delete step 1' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete step 2' })).toBeEnabled();
  });
});
