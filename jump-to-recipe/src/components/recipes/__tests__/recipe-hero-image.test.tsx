import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeHeroImage } from '../recipe-hero-image';

jest.mock('../recipe-image', () => ({
  RecipeImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

describe('RecipeHeroImage', () => {
  it('shows the image when the recipe has one', () => {
    render(<RecipeHeroImage imageUrl="/cake.jpg" title="Cake" canEdit />);

    expect(screen.getByRole('img', { name: 'Cake' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add a photo/i })).not.toBeInTheDocument();
  });

  it('prompts owners to add a photo when there is no image', () => {
    const onEdit = jest.fn();
    render(<RecipeHeroImage imageUrl={null} title="Cake" canEdit onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /add a photo/i }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for other viewers when there is no image', () => {
    const { container } = render(<RecipeHeroImage imageUrl="" title="Cake" canEdit={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
