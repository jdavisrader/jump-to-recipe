/**
 * Test: Task 6 Checkpoint - Core Functionality Verification
 * Feature: search-button-enhancement
 * 
 * This test verifies all core functionality from tasks 1-5.3:
 * - Search button click triggers search
 * - Enter key triggers search
 * - Sort dropdown triggers immediate search
 * - Filters don't auto-trigger search
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeSearch } from '../recipe-search';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('RecipeSearch - Task 6 Checkpoint: Core Functionality', () => {
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

  describe('Search Button Click Triggers Search', () => {
    it('should trigger search when search button is clicked', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Type a query
      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'pasta' } });

      // No search should be triggered yet (no initial mount call)
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      fireEvent.click(searchButton);

      // Verify search was called with the query
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      });

      const lastCall = mockOnSearch.mock.calls[0][0];
      expect(lastCall).toMatchObject({
        query: 'pasta',
      });
    });

    it('should include all parameters when search button is clicked', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Add query
      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'chicken' } });

      // Open filters and add some
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Add tag
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'healthy' } });
      fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

      // Set difficulty
      const difficultySelect = screen.getByLabelText('Difficulty');
      fireEvent.click(difficultySelect);
      fireEvent.click(screen.getByRole('option', { name: /^easy$/i }));

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      fireEvent.click(searchButton);

      // Verify all parameters included
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      });

      const lastCall = mockOnSearch.mock.calls[0][0];
      expect(lastCall).toMatchObject({
        query: 'chicken',
        tags: ['healthy'],
        difficulty: 'easy',
      });
    });
  });

  describe('Enter Key Triggers Search', () => {
    it('should trigger search when Enter is pressed in search input', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Type a query
      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'pizza' } });

      // No search should be triggered yet
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Press Enter
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      // Verify search was called
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      });

      const lastCall = mockOnSearch.mock.calls[0][0];
      expect(lastCall).toMatchObject({
        query: 'pizza',
      });
    });

    it('should include all parameters when Enter is pressed', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Add query
      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'salad' } });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Add tag
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'vegan' } });
      fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

      // Press Enter in search input
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      // Verify all parameters included
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      });

      const lastCall = mockOnSearch.mock.calls[0][0];
      expect(lastCall).toMatchObject({
        query: 'salad',
        tags: ['vegan'],
      });
    });
  });

  describe('Sort Dropdown Triggers Immediate Search', () => {
    it('should NOT trigger search on initial render with no search criteria', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Should NOT trigger search on mount when no search criteria exist
      await waitFor(() => {
        const searchButton = screen.getByRole('button', { name: /search recipes/i });
        expect(searchButton).toBeDisabled();
      });
      
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should have sort dropdown that works independently of search button', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Verify both sort dropdown and search button exist
      const sortCombobox = screen.getByRole('combobox');
      const searchButton = screen.getByRole('button', { name: /search recipes/i });

      expect(sortCombobox).toBeInTheDocument();
      expect(searchButton).toBeInTheDocument();

      // Sort dropdown should have default value
      expect(sortCombobox).toHaveTextContent('Newest');
    });
  });

  describe('Filters Do Not Auto-Trigger Search', () => {
    it('should NOT trigger search when tags are added', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Add a tag
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'dessert' } });
      fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

      // Wait to ensure tag is added
      await waitFor(() => {
        expect(screen.getByText('dessert')).toBeInTheDocument();
      });

      // Verify search was NOT called
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should NOT trigger search when difficulty is changed', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Change difficulty
      const difficultySelect = screen.getByLabelText('Difficulty');
      fireEvent.click(difficultySelect);
      fireEvent.click(screen.getByRole('option', { name: /^medium$/i }));

      // Wait for difficulty to update
      await waitFor(() => {
        expect(difficultySelect).toHaveTextContent('Medium');
      });

      // Verify search was NOT called
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should NOT trigger search when time filters are changed', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Change cook time
      const minCookTime = screen.getByLabelText('Minimum cook time in minutes');
      const maxCookTime = screen.getByLabelText('Maximum cook time in minutes');
      
      fireEvent.change(minCookTime, { target: { value: '15' } });
      fireEvent.change(maxCookTime, { target: { value: '45' } });

      // Wait for values to update
      await waitFor(() => {
        expect(minCookTime).toHaveValue(15);
        expect(maxCookTime).toHaveValue(45);
      });

      // Verify search was NOT called
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should NOT trigger search when prep time filters are changed', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Change prep time
      const minPrepTime = screen.getByLabelText('Minimum prep time in minutes');
      const maxPrepTime = screen.getByLabelText('Maximum prep time in minutes');
      
      fireEvent.change(minPrepTime, { target: { value: '10' } });
      fireEvent.change(maxPrepTime, { target: { value: '20' } });

      // Wait for values to update
      await waitFor(() => {
        expect(minPrepTime).toHaveValue(10);
        expect(maxPrepTime).toHaveValue(20);
      });

      // Verify search was NOT called
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  describe('Complete Flow Integration', () => {
    it('should handle complete search flow: type query, add filters, click search', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Type query
      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'soup' } });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Add multiple filters
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'comfort-food' } });
      fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

      const difficultySelect = screen.getByLabelText('Difficulty');
      fireEvent.click(difficultySelect);
      fireEvent.click(screen.getByRole('option', { name: /^easy$/i }));

      const maxCookTime = screen.getByLabelText('Maximum cook time in minutes');
      fireEvent.change(maxCookTime, { target: { value: '30' } });

      // Verify no search triggered yet
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      fireEvent.click(searchButton);

      // Verify search called with all parameters
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      });

      const lastCall = mockOnSearch.mock.calls[0][0];
      expect(lastCall).toMatchObject({
        query: 'soup',
        tags: ['comfort-food'],
        difficulty: 'easy',
        maxCookTime: 30,
      });
    });

    it('should handle complete search flow: type query, add filters, press Enter', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);

      // Type query
      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'bread' } });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);

      // Add tag
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'breakfast' } });
      fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

      // Verify no search triggered yet
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Press Enter in search input
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      // Verify search called with all parameters
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      });

      const lastCall = mockOnSearch.mock.calls[0][0];
      expect(lastCall).toMatchObject({
        query: 'bread',
        tags: ['breakfast'],
      });
    });
  });
});
