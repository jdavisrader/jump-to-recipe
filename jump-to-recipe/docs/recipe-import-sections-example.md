# Recipe Import with Sections Support

The recipe import functionality now supports sections for both ingredients and instructions using JSON-LD structured data.

## HowToSection Support

The import parser now recognizes `HowToSection` objects in JSON-LD data, which allows recipes to be organized into logical sections.

### Example JSON-LD with Instruction Sections

```json
{
  "@type": "Recipe",
  "name": "Chocolate Chip Cookies",
  "recipeInstructions": [
    {
      "@type": "HowToSection",
      "name": "Prepare the Dough",
      "itemListElement": [
        {
          "@type": "HowToStep",
          "text": "Cream butter and sugars together until light and fluffy."
        },
        {
          "@type": "HowToStep", 
          "text": "Beat in eggs one at a time, then add vanilla."
        }
      ]
    },
    {
      "@type": "HowToSection",
      "name": "Bake the Cookies",
      "itemListElement": [
        {
          "@type": "HowToStep",
          "text": "Preheat oven to 375°F (190°C)."
        },
        {
          "@type": "HowToStep",
          "text": "Drop dough onto baking sheets and bake for 9-11 minutes."
        }
      ]
    }
  ]
}
```

### Example JSON-LD with Ingredient Sections

```json
{
  "@type": "Recipe",
  "name": "Layered Cake",
  "recipeIngredient": [
    {
      "@type": "HowToSection",
      "name": "For the Cake",
      "itemListElement": [
        "2 cups all-purpose flour",
        "1½ cups granulated sugar",
        "½ cup butter, softened"
      ]
    },
    {
      "@type": "HowToSection", 
      "name": "For the Frosting",
      "itemListElement": [
        "1 cup powdered sugar",
        "½ cup cream cheese, softened",
        "¼ cup butter, softened"
      ]
    }
  ]
}
```

## Import Behavior

### With Sections
- Creates `ingredientSections` and/or `instructionSections` arrays
- Maintains flat `ingredients` and `instructions` arrays for backward compatibility
- Each item in flat arrays includes `sectionId` reference
- Sections have `id`, `name`, `order`, and `items` properties

### Without Sections (Backward Compatible)
- Creates only flat `ingredients` and `instructions` arrays
- `ingredientSections` and `instructionSections` are `undefined`
- Maintains existing behavior for recipes without sections

## Supported Formats

1. **JSON-LD with HowToSection** - Full section support
2. **JSON-LD without sections** - Flat arrays (backward compatible)
3. **Microdata** - Flat arrays (sections not commonly used)
4. **Basic HTML scraping** - Flat arrays (no section detection)

## Console Logging

The import process includes helpful logging:
- `✅ Found Recipe in JSON-LD: [recipe name]`
- `🔧 Detected HowToSection in instructions`
- `📝 Parsing sectioned instructions`
- `📝 Created instruction section: "[section name]" with [count] items`
- `🥕 Parsing sectioned ingredients`
- `🥕 Created ingredient section: "[section name]" with [count] items`