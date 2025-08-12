import {
  parseIsoDuration,
  parseIngredientText,
  parseJsonLdRecipe,
  extractJsonLdFromHtml,
} from '@/lib/recipe-parser';

describe('Recipe Parser', () => {
  describe('parseIsoDuration', () => {
    it('should parse ISO 8601 duration formats correctly', () => {
      expect(parseIsoDuration('PT30M')).toBe(30); // 30 minutes
      expect(parseIsoDuration('PT1H')).toBe(60); // 1 hour
      expect(parseIsoDuration('PT1H30M')).toBe(90); // 1 hour 30 minutes
      expect(parseIsoDuration('PT2H15M')).toBe(135); // 2 hours 15 minutes
      expect(parseIsoDuration('P1DT2H30M')).toBe(1590); // 1 day 2 hours 30 minutes
    });

    it('should handle invalid or empty durations', () => {
      expect(parseIsoDuration('')).toBeUndefined();
      expect(parseIsoDuration('invalid')).toBeUndefined();
      expect(parseIsoDuration('PT')).toBeUndefined();
    });

    it('should handle seconds by rounding to minutes', () => {
      expect(parseIsoDuration('PT30S')).toBe(1); // 30 seconds -> 1 minute
      expect(parseIsoDuration('PT90S')).toBe(2); // 90 seconds -> 2 minutes
    });
  });

  describe('parseIngredientText', () => {
    it('should parse measured ingredients correctly', () => {
      const flour = parseIngredientText('2 cups flour');
      expect(flour.amount).toBe(2);
      expect(flour.unit).toBe('cup');
      expect(flour.name).toBe('flour');

      const salt = parseIngredientText('1/2 tsp salt');
      expect(salt.amount).toBe(0.5);
      expect(salt.unit).toBe('tsp');
      expect(salt.name).toBe('salt');

      const oil = parseIngredientText('1 1/2 tbsp olive oil');
      expect(oil.amount).toBe(1.5);
      expect(oil.unit).toBe('tbsp');
      expect(oil.name).toBe('olive oil');
    });

    it('should parse count-based ingredients', () => {
      const eggs = parseIngredientText('2 large eggs');
      expect(eggs.amount).toBe(2);
      expect(eggs.unit).toBe('');
      expect(eggs.name).toBe('large eggs');

      const onions = parseIngredientText('3 medium onions');
      expect(onions.amount).toBe(3);
      expect(onions.unit).toBe('');
      expect(onions.name).toBe('medium onions');

      const simpleEggs = parseIngredientText('4 eggs');
      expect(simpleEggs.amount).toBe(4);
      expect(simpleEggs.unit).toBe('');
      expect(simpleEggs.name).toBe('egg');
    });

    it('should handle unicode fractions', () => {
      const half = parseIngredientText('½ cup sugar');
      expect(half.amount).toBe(0.5);
      expect(half.unit).toBe('cup');

      const quarter = parseIngredientText('¼ tsp vanilla');
      expect(quarter.amount).toBe(0.25);
      expect(quarter.unit).toBe('tsp');

      const threeQuarters = parseIngredientText('¾ cup milk');
      expect(threeQuarters.amount).toBe(0.75);
      expect(threeQuarters.unit).toBe('cup');
    });

    it('should normalize units correctly', () => {
      expect(parseIngredientText('1 tablespoon oil').unit).toBe('tbsp');
      expect(parseIngredientText('1 teaspoon salt').unit).toBe('tsp');
      expect(parseIngredientText('1 ounce cheese').unit).toBe('oz');
      expect(parseIngredientText('1 pound butter').unit).toBe('lb');
      expect(parseIngredientText('1 gram flour').unit).toBe('g');
      expect(parseIngredientText('1 milliliter water').unit).toBe('ml');
    });

    it('should handle fallback cases', () => {
      const simple = parseIngredientText('Salt to taste');
      expect(simple.name).toBe('Salt to taste');
      expect(simple.amount).toBe(1);
      expect(simple.unit).toBe('');

      const complex = parseIngredientText('A pinch of love');
      expect(complex.name).toBe('A pinch of love');
      expect(complex.amount).toBe(1);
      expect(complex.unit).toBe('');
    });
  });

  describe('parseJsonLdRecipe', () => {
    it('should parse a complete JSON-LD recipe', () => {
      const jsonLdRecipe = {
        '@type': 'Recipe' as const,
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        recipeIngredient: [
          '2 cups all-purpose flour',
          '1 tsp baking soda',
          '1/2 cup butter',
          '2 large eggs',
        ],
        recipeInstructions: [
          'Preheat oven to 375°F',
          'Mix dry ingredients',
          'Add wet ingredients',
          'Bake for 10-12 minutes',
        ],
        prepTime: 'PT15M',
        cookTime: 'PT12M',
        recipeYield: '24',
        keywords: 'cookies, dessert, chocolate',
        image: 'https://example.com/cookies.jpg',
      };

      const result = parseJsonLdRecipe(jsonLdRecipe, 'user1');

      expect(result.title).toBe('Chocolate Chip Cookies');
      expect(result.description).toBe('Delicious homemade cookies');
      expect(result.ingredients).toHaveLength(4);
      expect(result.instructions).toHaveLength(4);
      expect(result.prepTime).toBe(15);
      expect(result.cookTime).toBe(12);
      expect(result.servings).toBe(24);
      expect(result.tags).toEqual(['cookies', 'dessert', 'chocolate']);
      expect(result.imageUrl).toBe('https://example.com/cookies.jpg');
      expect(result.authorId).toBe('user1');
      expect(result.visibility).toBe('private');
    });

    it('should handle missing optional fields', () => {
      const minimalRecipe = {
        '@type': 'Recipe' as const,
        name: 'Simple Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: ['Mix and bake'],
      };

      const result = parseJsonLdRecipe(minimalRecipe, 'user1');

      expect(result.title).toBe('Simple Recipe');
      expect(result.description).toBeNull();
      expect(result.prepTime).toBeNull();
      expect(result.cookTime).toBeNull();
      expect(result.servings).toBeNull();
      expect(result.tags).toEqual([]);
      expect(result.imageUrl).toBeNull();
    });

    it('should handle different image formats', () => {
      // String image
      const stringImage = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: ['Mix'],
        image: 'https://example.com/image.jpg',
      };

      expect(parseJsonLdRecipe(stringImage, 'user1').imageUrl).toBe('https://example.com/image.jpg');

      // Array of strings
      const arrayImage = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: ['Mix'],
        image: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      };

      expect(parseJsonLdRecipe(arrayImage, 'user1').imageUrl).toBe('https://example.com/image1.jpg');

      // Object with URL
      const objectImage = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: ['Mix'],
        image: { '@type': 'ImageObject', url: 'https://example.com/image.jpg' },
      };

      expect(parseJsonLdRecipe(objectImage, 'user1').imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should handle different recipeYield formats', () => {
      // String yield
      const stringYield = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: ['Mix'],
        recipeYield: '12',
      };

      expect(parseJsonLdRecipe(stringYield, 'user1').servings).toBe(12);

      // Number yield
      const numberYield = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: ['Mix'],
        recipeYield: 8,
      };

      expect(parseJsonLdRecipe(numberYield, 'user1').servings).toBe(8);

      // Array yield
      const arrayYield = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: ['Mix'],
        recipeYield: ['24', '24 cookies'],
      };

      expect(parseJsonLdRecipe(arrayYield, 'user1').servings).toBe(24);
    });

    it('should handle structured instructions', () => {
      const structuredInstructions = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        recipeIngredient: ['1 cup flour'],
        recipeInstructions: [
          { '@type': 'HowToStep', text: 'Step 1: Mix ingredients' },
          { '@type': 'HowToStep', text: 'Step 2: Bake' },
        ],
      };

      const result = parseJsonLdRecipe(structuredInstructions, 'user1');

      expect(result.instructions).toHaveLength(2);
      expect(result.instructions[0].content).toBe('Step 1: Mix ingredients');
      expect(result.instructions[1].content).toBe('Step 2: Bake');
    });
  });

  describe('extractJsonLdFromHtml', () => {
    it('should extract JSON-LD from HTML script tags', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@type": "Recipe",
              "name": "Test Recipe",
              "recipeIngredient": ["1 cup flour"],
              "recipeInstructions": ["Mix and bake"]
            }
            </script>
          </head>
        </html>
      `;

      const result = extractJsonLdFromHtml(html);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Recipe');
      expect(result?.recipeIngredient).toEqual(['1 cup flour']);
    });

    it('should extract JSON-LD from @graph structure', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "Recipe Site"
                },
                {
                  "@type": "Recipe",
                  "name": "Graph Recipe",
                  "recipeIngredient": ["2 cups sugar"],
                  "recipeInstructions": ["Mix well"]
                }
              ]
            }
            </script>
          </head>
        </html>
      `;

      const result = extractJsonLdFromHtml(html);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Graph Recipe');
      expect(result?.recipeIngredient).toEqual(['2 cups sugar']);
    });

    it('should return null for HTML without JSON-LD', () => {
      const html = `
        <html>
          <head>
            <title>No Recipe Here</title>
          </head>
          <body>
            <p>Just some text</p>
          </body>
        </html>
      `;

      const result = extractJsonLdFromHtml(html);

      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@type": "Recipe",
              "name": "Broken Recipe"
              // Missing comma and closing brace
            </script>
          </head>
        </html>
      `;

      const result = extractJsonLdFromHtml(html);

      expect(result).toBeNull();
    });

    it('should find the first Recipe type in multiple script tags', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@type": "Organization",
              "name": "Recipe Company"
            }
            </script>
            <script type="application/ld+json">
            {
              "@type": "Recipe",
              "name": "First Recipe",
              "recipeIngredient": ["1 cup flour"]
            }
            </script>
            <script type="application/ld+json">
            {
              "@type": "Recipe",
              "name": "Second Recipe",
              "recipeIngredient": ["2 cups sugar"]
            }
            </script>
          </head>
        </html>
      `;

      const result = extractJsonLdFromHtml(html);

      expect(result).toBeDefined();
      expect(result?.name).toBe('First Recipe');
    });
  });
});