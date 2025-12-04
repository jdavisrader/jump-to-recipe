# Database Seed Summary

## Overview
Successfully seeded the database with 6 users and 31 recipes total.

## Users Created

### 1. Demo User (existing)
- **Email**: demo@jumptorecipe.com
- **Password**: demo123
- **Recipes**: 6 recipes (Classic Chocolate Chip Cookies, Creamy Chicken Alfredo Pasta, Fresh Caprese Salad, Beef Wellington, Avocado Toast with Poached Eggs, Thai Green Curry)

### 2. Sarah Chen
- **Email**: sarah.chen@example.com
- **Password**: demo123
- **Cuisine Focus**: Asian cuisine
- **Recipes**: 5 recipes
  - Homemade Ramen Bowl
  - Korean Bibimbap
  - Vietnamese Pho
  - Pad Thai
  - Sushi Rolls

### 3. Marcus Johnson
- **Email**: marcus.j@example.com
- **Password**: demo123
- **Cuisine Focus**: BBQ and American classics
- **Recipes**: 5 recipes
  - Slow-Smoked Brisket
  - Classic Cheeseburger
  - BBQ Pulled Pork
  - Buffalo Wings
  - Mac and Cheese

### 4. Elena Rodriguez
- **Email**: elena.r@example.com
- **Password**: demo123
- **Cuisine Focus**: Latin American cuisine
- **Recipes**: 5 recipes
  - Authentic Tacos al Pastor
  - Empanadas
  - Ceviche
  - Arroz con Pollo
  - Churros with Chocolate

### 5. Raj Patel
- **Email**: raj.patel@example.com
- **Password**: demo123
- **Cuisine Focus**: Indian cuisine
- **Recipes**: 5 recipes
  - Butter Chicken
  - Vegetable Biryani
  - Samosas
  - Palak Paneer
  - Masala Dosa

### 6. Olivia Thompson
- **Email**: olivia.t@example.com
- **Password**: demo123
- **Cuisine Focus**: Baking and desserts
- **Recipes**: 5 recipes
  - Sourdough Bread
  - Lemon Meringue Pie
  - Red Velvet Cupcakes
  - Cinnamon Rolls
  - Tiramisu

## Recipe Details

All recipes include:
- Title and description
- Sample ingredients (simplified for seeding)
- Basic instructions
- Prep time and cook time
- Servings
- Difficulty level (easy, medium, or hard)
- Tags for categorization
- Image URLs from Unsplash
- Public visibility

## Running the Seed Script

To seed the database:
```bash
npm run db:seed
```

The script is idempotent - it checks for existing users and won't create duplicates.

## Notes

- All users have the same password: `demo123`
- All recipes are set to public visibility
- Recipe ingredients and instructions are simplified placeholders
- Images are sourced from Unsplash
- The seed script can be run multiple times safely
