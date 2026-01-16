import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/recipes/empty-state';
import { RecipeSearch } from '@/components/recipes/recipe-search';

// Mock Next.js components
const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
  <a href={href} {...props}>
    {children}
  </a>
);

jest.mock('next/link', () => {
  return MockLink;
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

describe('My Recipes Components Accessibility', () => {

  describe('EmptyState Component Accessibility', () => {
    it('should have proper ARIA structure', () => {
      render(
        <EmptyState
          title="No recipes found"
          description="Start building your recipe collection"
          actionLabel="Create Recipe"
          actionHref="/recipes/new"
        />
      );
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'empty-state-title');
      expect(region).toHaveAttribute('aria-describedby', 'empty-state-description');
      
      const title = screen.getByText('No recipes found');
      expect(title).toHaveAttribute('id', 'empty-state-title');
      
      const description = screen.getByText('Start building your recipe collection');
      expect(description).toHaveAttribute('id', 'empty-state-description');
    });

    it('should have accessible action button', () => {
      render(
        <EmptyState
          title="No recipes found"
          description="Start building your recipe collection"
          actionLabel="Create Recipe"
          actionHref="/recipes/new"
        />
      );
      
      const button = screen.getByRole('link', { name: 'Create Recipe' });
      expect(button).toHaveAttribute('href', '/recipes/new');
      expect(button).toHaveAttribute('aria-describedby', 'empty-state-title empty-state-description');
    });

    it('should handle responsive design classes', () => {
      render(
        <EmptyState
          title="No recipes found"
          description="Start building your recipe collection"
          actionLabel="Create Recipe"
          actionHref="/recipes/new"
        />
      );
      
      const region = screen.getByRole('region');
      expect(region).toHaveClass('py-8 sm:py-12 lg:py-16');
      
      const button = screen.getByRole('link');
      expect(button).toHaveClass('w-full sm:w-auto');
    });
  });

  describe('RecipeSearch Component Accessibility', () => {
    it('should have proper search region labeling', () => {
      const mockOnSearch = jest.fn();
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchRegion = screen.getByRole('search');
      expect(searchRegion).toHaveAttribute('aria-label', 'Recipe search');
    });

    it('should have accessible search input', () => {
      const mockOnSearch = jest.fn();
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
      
      const helpText = screen.getByText('Search through your recipes by title, ingredients, or instructions');
      expect(helpText).toHaveAttribute('id', 'search-help');
      expect(helpText).toHaveClass('sr-only');
    });

    it('should have accessible filter button', () => {
      const mockOnSearch = jest.fn();
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toHaveAttribute('aria-expanded', 'false');
      expect(filterButton).toHaveAttribute('aria-controls', 'advanced-filters');
    });

    it('should have accessible sort dropdown', () => {
      const mockOnSearch = jest.fn();
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      screen.getByText('Sort by:');
      const sortTrigger = screen.getByRole('combobox');
      expect(sortTrigger).toHaveAttribute('id', 'sort');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive empty state layout', () => {
      render(
        <EmptyState
          title="No recipes found"
          description="Start building your recipe collection"
          actionLabel="Create Recipe"
          actionHref="/recipes/new"
        />
      );
      
      const region = screen.getByRole('region');
      expect(region).toHaveClass('py-8 sm:py-12 lg:py-16');
      
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('text-lg sm:text-xl lg:text-2xl');
    });

    it('should have responsive search layout', () => {
      const mockOnSearch = jest.fn();
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchContainer = screen.getByRole('search').firstChild;
      expect(searchContainer).toHaveClass('flex-col sm:flex-row');
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toHaveClass('w-full sm:w-auto');
    });
  });
});