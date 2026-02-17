/**
 * Test: Preserve filter state without auto-execution
 * Task 5.3 - Verify that filter changes update state but don't trigger automatic search
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeSearch } from '../recipe-search';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('RecipeSearch - Filter State Preservation (Task 5.3)', () => {
  const mockOnSearch = jest.fn();
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };
  const mockSearchParams = {
    get: jest.fn(() => null),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      writable: true,
      value: {
        replaceState: jest.fn(),
      },
    });
  });

  it('should update tag state without triggering search', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Add a tag
    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'vegetarian' } });
    
    const addTagButton = screen.getByRole('button', { name: /add tag/i });
    fireEvent.click(addTagButton);

    // Wait a moment to ensure no search is triggered
    await waitFor(() => {
      expect(screen.getByText('vegetarian')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify search was NOT called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should update difficulty state without triggering search', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Change difficulty
    const difficultySelect = screen.getByLabelText('Difficulty');
    fireEvent.click(difficultySelect);
    
    const easyOption = screen.getByRole('option', { name: /^easy$/i });
    fireEvent.click(easyOption);

    // Wait a moment to ensure no search is triggered
    await waitFor(() => {
      expect(difficultySelect).toHaveTextContent('Easy');
    }, { timeout: 1000 });

    // Verify search was NOT called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should update cook time range without triggering search', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Change cook time
    const minCookTime = screen.getByLabelText('Minimum cook time in minutes');
    const maxCookTime = screen.getByLabelText('Maximum cook time in minutes');
    
    fireEvent.change(minCookTime, { target: { value: '10' } });
    fireEvent.change(maxCookTime, { target: { value: '30' } });

    // Wait a moment to ensure no search is triggered
    await waitFor(() => {
      expect(minCookTime).toHaveValue(10);
      expect(maxCookTime).toHaveValue(30);
    }, { timeout: 1000 });

    // Verify search was NOT called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should update prep time range without triggering search', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Change prep time
    const minPrepTime = screen.getByLabelText('Minimum prep time in minutes');
    const maxPrepTime = screen.getByLabelText('Maximum prep time in minutes');
    
    fireEvent.change(minPrepTime, { target: { value: '5' } });
    fireEvent.change(maxPrepTime, { target: { value: '15' } });

    // Wait a moment to ensure no search is triggered
    await waitFor(() => {
      expect(minPrepTime).toHaveValue(5);
      expect(maxPrepTime).toHaveValue(15);
    }, { timeout: 1000 });

    // Verify search was NOT called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should trigger search only when button is clicked after filter changes', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Add multiple filters
    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'vegan' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    const difficultySelect = screen.getByLabelText('Difficulty');
    fireEvent.click(difficultySelect);
    fireEvent.click(screen.getByRole('option', { name: /^easy$/i }));

    const minCookTime = screen.getByLabelText('Minimum cook time in minutes');
    fireEvent.change(minCookTime, { target: { value: '20' } });

    // Verify search was NOT called yet
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Now click the search button
    const searchButton = screen.getByRole('button', { name: /search recipes/i });
    fireEvent.click(searchButton);

    // Verify search was called with all the filters
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    const lastCall = mockOnSearch.mock.calls[0][0];
    expect(lastCall).toMatchObject({
      tags: ['vegan'],
      difficulty: 'easy',
      minCookTime: 20,
    });
  });

  it('should trigger search only when Enter key is pressed after filter changes', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Type in search input
    const searchInput = screen.getByPlaceholderText(/search recipes/i);
    fireEvent.change(searchInput, { target: { value: 'pasta' } });

    // Open filters and add some
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'italian' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Verify search was NOT called yet
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Press Enter in search input
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    // Verify search was called with query and filters
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    const lastCall = mockOnSearch.mock.calls[0][0];
    expect(lastCall).toMatchObject({
      query: 'pasta',
      tags: ['italian'],
    });
  });

  it('should preserve filter state across multiple changes before search', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Add first tag
    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'breakfast' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Add second tag
    fireEvent.change(tagInput, { target: { value: 'quick' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Change difficulty
    const difficultySelect = screen.getByLabelText('Difficulty');
    fireEvent.click(difficultySelect);
    fireEvent.click(screen.getByRole('option', { name: /^medium$/i }));

    // Change time ranges
    const minPrepTime = screen.getByLabelText('Minimum prep time in minutes');
    const maxPrepTime = screen.getByLabelText('Maximum prep time in minutes');
    fireEvent.change(minPrepTime, { target: { value: '5' } });
    fireEvent.change(maxPrepTime, { target: { value: '10' } });

    // Verify all filters are visible in UI
    expect(screen.getByText('breakfast')).toBeInTheDocument();
    expect(screen.getByText('quick')).toBeInTheDocument();
    expect(difficultySelect).toHaveTextContent('Medium');
    expect(minPrepTime).toHaveValue(5);
    expect(maxPrepTime).toHaveValue(10);

    // Verify search was NOT called
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Click search button
    const searchButton = screen.getByRole('button', { name: /search recipes/i });
    fireEvent.click(searchButton);

    // Verify search was called with ALL filters preserved
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    const lastCall = mockOnSearch.mock.calls[0][0];
    expect(lastCall).toMatchObject({
      tags: ['breakfast', 'quick'],
      difficulty: 'medium',
      minPrepTime: 5,
      maxPrepTime: 10,
    });
  });
});
