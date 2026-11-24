import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecipeStats } from '../recipe-stats';

describe('RecipeStats', () => {
  it('shows prep, cook, total and scaled servings when all are known', () => {
    render(<RecipeStats prepTime={10} cookTime={20} servings={4} scale={2} />);

    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('hides missing fields instead of showing placeholders', () => {
    render(<RecipeStats prepTime={null} cookTime={45} servings={null} scale={1} />);

    expect(screen.getByText('Cook time')).toBeInTheDocument();
    expect(screen.queryByText('Prep time')).not.toBeInTheDocument();
    expect(screen.queryByText('Servings')).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('only shows total time when both prep and cook time are known', () => {
    render(<RecipeStats prepTime={15} cookTime={undefined} servings={2} scale={1} />);

    expect(screen.queryByText('Total time')).not.toBeInTheDocument();
  });

  it('shows difficulty when it is set', () => {
    render(<RecipeStats difficulty="medium" scale={1} />);

    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders nothing when no stats are known', () => {
    const { container } = render(<RecipeStats scale={1} />);

    expect(container).toBeEmptyDOMElement();
  });
});
