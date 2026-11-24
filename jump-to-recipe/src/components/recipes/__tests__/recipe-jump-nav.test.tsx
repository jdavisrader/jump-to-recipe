import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecipeJumpNav, getMethodSectionId } from '../recipe-jump-nav';

describe('RecipeJumpNav', () => {
  it('links to each method section in order', () => {
    render(
      <RecipeJumpNav
        sections={[
          { id: 'b', name: 'Frosting', order: 1 },
          { id: 'a', name: 'Cake', order: 0 },
        ]}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['1Cake', '2Frosting']);
    expect(links[0]).toHaveAttribute('href', `#${getMethodSectionId(1)}`);
    expect(links[1]).toHaveAttribute('href', `#${getMethodSectionId(2)}`);
  });

  it('renders nothing for recipes with fewer than two sections', () => {
    const { container } = render(
      <RecipeJumpNav sections={[{ id: 'a', name: 'Cake', order: 0 }]} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
