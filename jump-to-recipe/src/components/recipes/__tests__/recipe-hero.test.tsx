import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecipeHero } from '../recipe-hero';
import { RecipeAuthorLine } from '../recipe-author-line';

jest.mock('../recipe-image', () => ({
  RecipeImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const baseRecipe = {
  title: 'Chocolate Cake',
  description: 'Rich and tender.',
  authorName: 'Jordan Rader',
  updatedAt: new Date('2026-11-23T12:00:00Z'),
  sourceUrl: null,
  tags: ['dessert', 'birthday'],
  imageUrl: null,
};

describe('RecipeHero', () => {
  it('shows the title, description, tags and slotted content', () => {
    render(
      <RecipeHero recipe={baseRecipe} canEdit={false}>
        <p>Stats go here</p>
      </RecipeHero>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Chocolate Cake' })).toBeInTheDocument();
    expect(screen.getByText('Rich and tender.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Tags' })).toHaveTextContent('dessertbirthday');
    expect(screen.getByText('Stats go here')).toBeInTheDocument();
  });

  it('offers owners a photo placeholder when there is no photo', () => {
    render(<RecipeHero recipe={baseRecipe} canEdit />);

    expect(screen.getByRole('button', { name: /add a photo/i })).toBeInTheDocument();
  });
});

describe('RecipeAuthorLine', () => {
  it('shows initials, author and updated date', () => {
    render(<RecipeAuthorLine authorName="Jordan Rader" updatedAt={baseRecipe.updatedAt} />);

    expect(screen.getByText('JR')).toBeInTheDocument();
    expect(screen.getByText(/Updated Nov 23, 2026/)).toBeInTheDocument();
    expect(screen.getByText('Jordan Rader')).toBeInTheDocument();
  });

  it('links to the source in a new tab only when there is a source URL', () => {
    const { rerender } = render(<RecipeAuthorLine updatedAt={baseRecipe.updatedAt} />);
    expect(screen.queryByRole('link', { name: /source/i })).not.toBeInTheDocument();

    rerender(
      <RecipeAuthorLine updatedAt={baseRecipe.updatedAt} sourceUrl="https://example.com/recipe" />
    );
    const link = screen.getByRole('link', { name: /source/i });
    expect(link).toHaveAttribute('href', 'https://example.com/recipe');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
