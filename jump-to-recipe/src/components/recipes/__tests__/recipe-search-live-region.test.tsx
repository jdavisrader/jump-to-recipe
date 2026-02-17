/**
 * Test: RecipeSearch - Live Region Announcements (Task 8.1)
 * 
 * Validates: Requirements 1.3
 * 
 * This test verifies that screen reader announcements are properly
 * implemented via ARIA live regions for search status updates.
 */

import { render, screen } from '@testing-library/react';
import { RecipeSearch } from '../recipe-search';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

describe('RecipeSearch - Live Region Announcements (Task 8.1)', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have a live region for status announcements', () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);
    
    // Find the live region by role
    const liveRegion = screen.getByRole('status');
    
    // Verify it has proper ARIA attributes
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    
    // Verify it's visually hidden but accessible to screen readers
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('should announce "Searching recipes..." when isLoading is true', () => {
    render(<RecipeSearch onSearch={mockOnSearch} isLoading={true} />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Searching recipes...');
  });

  it('should be empty when not searching', () => {
    render(<RecipeSearch onSearch={mockOnSearch} isLoading={false} />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('');
  });

  it('should have sr-only help text for button purpose', () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);
    
    // Verify the button has aria-describedby pointing to help text
    const searchButton = screen.getByRole('button', { name: /search recipes/i });
    expect(searchButton).toHaveAttribute('aria-describedby', 'search-button-help');
    
    // Verify the help text exists and is sr-only
    const helpText = document.getElementById('search-button-help');
    expect(helpText).toBeInTheDocument();
    expect(helpText).toHaveClass('sr-only');
    expect(helpText).toHaveTextContent('Press to search recipes with current filters');
  });

  it('should have sr-only help text for search input', () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);
    
    // Verify the search input has aria-describedby pointing to help text
    const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
    expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
    
    // Verify the help text exists and is sr-only
    const helpText = document.getElementById('search-help');
    expect(helpText).toBeInTheDocument();
    expect(helpText).toHaveClass('sr-only');
    expect(helpText).toHaveTextContent('Search through your recipes by title, ingredients, or instructions');
  });
});
