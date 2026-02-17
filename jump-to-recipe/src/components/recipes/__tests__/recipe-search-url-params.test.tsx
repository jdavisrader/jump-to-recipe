/**
 * Test: URL Parameter Parsing on Mount
 * Feature: search-button-enhancement
 * Task: 9.1 Preserve URL parameter parsing on mount
 * 
 * Validates: Requirements 6.1
 * 
 * This test verifies that URL parameters are correctly parsed on component mount
 * and that the initial search executes with those parameters (backward compatibility).
 */

import { render, waitFor } from '@testing-library/react';
import { RecipeSearch } from '../recipe-search';
import React from 'react';

// Mock Next.js router with URL parameters
const mockGet = jest.fn();
const mockUseSearchParams = jest.fn(() => ({
  get: mockGet,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

describe('RecipeSearch - URL Parameter Parsing on Mount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      writable: true,
      value: {
        replaceState: jest.fn(),
      },
    });
  });

  it('should parse query parameter from URL on mount', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with query parameter
    mockGet.mockImplementation((key: string) => {
      if (key === 'query') return 'pasta';
      if (key === 'sortBy') return 'newest';
      return null;
    });

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify initial search includes query from URL
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'pasta',
          sortBy: 'newest',
        })
      );
    });
  });

  it('should parse tags parameter from URL on mount', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with tags parameter
    mockGet.mockImplementation((key: string) => {
      if (key === 'tags') return 'vegetarian,quick';
      if (key === 'sortBy') return 'newest';
      return null;
    });

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify initial search includes tags from URL
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['vegetarian', 'quick'],
          sortBy: 'newest',
        })
      );
    });
  });

  it('should parse difficulty parameter from URL on mount', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with difficulty parameter
    mockGet.mockImplementation((key: string) => {
      if (key === 'difficulty') return 'easy';
      if (key === 'sortBy') return 'newest';
      return null;
    });

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify initial search includes difficulty from URL
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          difficulty: 'easy',
          sortBy: 'newest',
        })
      );
    });
  });

  it('should parse time filter parameters from URL on mount', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with time filter parameters
    mockGet.mockImplementation((key: string) => {
      if (key === 'minCookTime') return '10';
      if (key === 'maxCookTime') return '30';
      if (key === 'minPrepTime') return '5';
      if (key === 'maxPrepTime') return '15';
      if (key === 'sortBy') return 'newest';
      return null;
    });

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify initial search includes time filters from URL
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          minCookTime: 10,
          maxCookTime: 30,
          minPrepTime: 5,
          maxPrepTime: 15,
          sortBy: 'newest',
        })
      );
    });
  });

  it('should parse sortBy parameter from URL on mount', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with sortBy parameter AND a query to trigger search
    mockGet.mockImplementation((key: string) => {
      if (key === 'sortBy') return 'popular';
      if (key === 'query') return 'test';
      return null;
    });

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify initial search includes sortBy from URL
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'popular',
          query: 'test',
        })
      );
    });
  });

  it('should parse all parameters from URL on mount', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with all parameters
    mockGet.mockImplementation((key: string) => {
      const params: Record<string, string> = {
        query: 'chicken',
        tags: 'healthy,dinner',
        difficulty: 'medium',
        minCookTime: '20',
        maxCookTime: '45',
        minPrepTime: '10',
        maxPrepTime: '20',
        sortBy: 'cookTime',
      };
      return params[key] || null;
    });

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify initial search includes all parameters from URL
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'chicken',
          tags: ['healthy', 'dinner'],
          difficulty: 'medium',
          minCookTime: 20,
          maxCookTime: 45,
          minPrepTime: 10,
          maxPrepTime: 20,
          sortBy: 'cookTime',
        })
      );
    });
  });

  it('should execute initial search with URL parameters on mount', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with parameters
    mockGet.mockImplementation((key: string) => {
      if (key === 'query') return 'salad';
      if (key === 'tags') return 'vegan';
      if (key === 'sortBy') return 'newest';
      return null;
    });

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify onSearch is called on mount (not waiting for user action)
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    // Verify it was called with URL parameters
    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'salad',
        tags: ['vegan'],
        sortBy: 'newest',
      })
    );
  });

  it('should handle empty URL parameters gracefully', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with no parameters (all return null)
    mockGet.mockImplementation(() => null);

    render(<RecipeSearch onSearch={mockOnSearch} />);

    // With no URL parameters and no search criteria, no search should be triggered
    // The search button should be disabled
    await waitFor(() => {
      const searchButton = document.querySelector('button[aria-label="Search recipes"]');
      expect(searchButton).toBeDisabled();
    });

    // Verify onSearch was NOT called (no search criteria)
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should initialize component state from URL parameters', async () => {
    const mockOnSearch = jest.fn();
    
    // Mock URL with parameters
    mockGet.mockImplementation((key: string) => {
      if (key === 'query') return 'pizza';
      if (key === 'difficulty') return 'hard';
      if (key === 'sortBy') return 'title';
      return null;
    });

    const { container } = render(<RecipeSearch onSearch={mockOnSearch} />);

    // Verify search input has value from URL
    const searchInput = container.querySelector('input[id="recipe-search"]') as HTMLInputElement;
    expect(searchInput).toHaveValue('pizza');

    // Verify initial search was triggered
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'pizza',
          difficulty: 'hard',
          sortBy: 'title',
        })
      );
    });
  });
});
