import { db } from './index';
import { users, recipes } from './schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

// Helper function to generate recipe objects for a user
function generateUserRecipes(authorId: string, recipeData: Array<{
  title: string;
  description: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string;
}>) {
  return recipeData.map(data => ({
    id: uuidv4(),
    title: data.title,
    description: data.description,
    ingredients: [
      { id: uuidv4(), name: 'Ingredient 1', amount: 1, unit: 'cup', notes: '' },
      { id: uuidv4(), name: 'Ingredient 2', amount: 2, unit: 'tbsp', notes: '' },
      { id: uuidv4(), name: 'Ingredient 3', amount: 1, unit: 'tsp', notes: '' },
    ],
    instructions: [
      { id: uuidv4(), step: 1, content: 'Prepare all ingredients.', duration: 5 },
      { id: uuidv4(), step: 2, content: 'Follow the cooking process.', duration: data.cookTime - 5 },
      { id: uuidv4(), step: 3, content: 'Serve and enjoy!', duration: 2 },
    ],
    prepTime: data.prepTime,
    cookTime: data.cookTime,
    servings: data.servings,
    difficulty: data.difficulty,
    tags: data.tags,
    notes: 'This is a delicious recipe. Adjust seasoning to taste.',
    imageUrl: data.imageUrl,
    sourceUrl: '',
    authorId,
    visibility: 'public' as const,
  }));
}

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create demo users
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Check if demo user exists
    const existingDemoUser = await db.select().from(users).where(sql`email = 'demo@jumptorecipe.com'`).limit(1);
    let demoUser;

    if (existingDemoUser.length > 0) {
      demoUser = existingDemoUser[0];
      console.log('ℹ️  Demo user already exists:', demoUser.email);
    } else {
      [demoUser] = await db.insert(users).values({
        id: uuidv4(),
        name: 'Demo User',
        email: 'demo@jumptorecipe.com',
        password: hashedPassword,
        role: 'user',
      }).returning();
      console.log('✅ Created demo user:', demoUser.email);
    }

    // Create 5 additional users (check if they exist first)
    const newUserData = [
      { name: 'Sarah Chen', email: 'sarah.chen@example.com' },
      { name: 'Marcus Johnson', email: 'marcus.j@example.com' },
      { name: 'Elena Rodriguez', email: 'elena.r@example.com' },
      { name: 'Raj Patel', email: 'raj.patel@example.com' },
      { name: 'Olivia Thompson', email: 'olivia.t@example.com' },
    ];

    const additionalUsers = [];
    for (const userData of newUserData) {
      const existing = await db.select().from(users).where(sql`email = ${userData.email}`).limit(1);

      if (existing.length > 0) {
        additionalUsers.push(existing[0]);
        console.log(`ℹ️  User already exists: ${userData.email}`);
      } else {
        const [newUser] = await db.insert(users).values({
          id: uuidv4(),
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: 'user',
        }).returning();
        additionalUsers.push(newUser);
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    console.log(`📊 Total users ready: ${additionalUsers.length + 1}`);

    // Sample recipes data
    const sampleRecipes = [
      {
        id: uuidv4(),
        title: 'Classic Chocolate Chip Cookies',
        description: 'Soft and chewy chocolate chip cookies that are perfect for any occasion. These cookies have crispy edges and a tender center.',
        ingredients: [
          { id: uuidv4(), name: 'All-purpose flour', amount: 2.25, unit: 'cup', notes: 'sifted' },
          { id: uuidv4(), name: 'Baking soda', amount: 1, unit: 'tsp', notes: '' },
          { id: uuidv4(), name: 'Salt', amount: 1, unit: 'tsp', notes: '' },
          { id: uuidv4(), name: 'Butter', amount: 1, unit: 'cup', notes: 'softened' },
          { id: uuidv4(), name: 'Brown sugar', amount: 0.75, unit: 'cup', notes: 'packed' },
          { id: uuidv4(), name: 'White sugar', amount: 0.75, unit: 'cup', notes: '' },
          { id: uuidv4(), name: 'Eggs', amount: 2, unit: '', notes: 'large' },
          { id: uuidv4(), name: 'Vanilla extract', amount: 2, unit: 'tsp', notes: '' },
          { id: uuidv4(), name: 'Chocolate chips', amount: 2, unit: 'cup', notes: 'semi-sweet' },
        ],
        instructions: [
          { id: uuidv4(), step: 1, content: 'Preheat oven to 375°F (190°C).', duration: 5 },
          { id: uuidv4(), step: 2, content: 'In a medium bowl, whisk together flour, baking soda, and salt.', duration: 2 },
          { id: uuidv4(), step: 3, content: 'In a large bowl, cream together butter and both sugars until light and fluffy.', duration: 3 },
          { id: uuidv4(), step: 4, content: 'Beat in eggs one at a time, then add vanilla extract.', duration: 2 },
          { id: uuidv4(), step: 5, content: 'Gradually mix in the flour mixture until just combined.', duration: 2 },
          { id: uuidv4(), step: 6, content: 'Fold in chocolate chips.', duration: 1 },
          { id: uuidv4(), step: 7, content: 'Drop rounded tablespoons of dough onto ungreased baking sheets.', duration: 5 },
          { id: uuidv4(), step: 8, content: 'Bake for 9-11 minutes or until golden brown around edges.', duration: 10 },
          { id: uuidv4(), step: 9, content: 'Cool on baking sheet for 2 minutes, then transfer to wire rack.', duration: 5 },
        ],
        prepTime: 15,
        cookTime: 10,
        servings: 48,
        difficulty: 'easy' as const,
        tags: ['dessert', 'cookies', 'chocolate', 'baking'],
        notes: 'For extra chewy cookies, slightly underbake them. Store in airtight container for up to 1 week.',
        imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=500&auto=format&fit=crop',
        sourceUrl: '',
        authorId: demoUser.id,
        visibility: 'public' as const,
      },
      {
        id: uuidv4(),
        title: 'Creamy Chicken Alfredo Pasta',
        description: 'Rich and creamy pasta dish with tender chicken breast in a homemade alfredo sauce.',
        ingredients: [
          { id: uuidv4(), name: 'Fettuccine pasta', amount: 1, unit: 'lb', notes: '' },
          { id: uuidv4(), name: 'Chicken breast', amount: 2, unit: 'lb', notes: 'boneless, skinless' },
          { id: uuidv4(), name: 'Heavy cream', amount: 1, unit: 'cup', notes: '' },
          { id: uuidv4(), name: 'Butter', amount: 4, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Parmesan cheese', amount: 1, unit: 'cup', notes: 'freshly grated' },
          { id: uuidv4(), name: 'Garlic', amount: 3, unit: '', notes: 'cloves, minced' },
          { id: uuidv4(), name: 'Salt', amount: 1, unit: 'tsp', notes: '' },
          { id: uuidv4(), name: 'Black pepper', amount: 0.5, unit: 'tsp', notes: 'freshly ground' },
          { id: uuidv4(), name: 'Olive oil', amount: 2, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Fresh parsley', amount: 2, unit: 'tbsp', notes: 'chopped' },
        ],
        instructions: [
          { id: uuidv4(), step: 1, content: 'Cook fettuccine according to package directions. Drain and set aside.', duration: 12 },
          { id: uuidv4(), step: 2, content: 'Season chicken with salt and pepper. Heat olive oil in a large skillet over medium-high heat.', duration: 3 },
          { id: uuidv4(), step: 3, content: 'Cook chicken until golden brown and cooked through, about 6-7 minutes per side.', duration: 14 },
          { id: uuidv4(), step: 4, content: 'Remove chicken and let rest, then slice into strips.', duration: 5 },
          { id: uuidv4(), step: 5, content: 'In the same skillet, melt butter and sauté garlic for 1 minute.', duration: 2 },
          { id: uuidv4(), step: 6, content: 'Add heavy cream and bring to a gentle simmer.', duration: 3 },
          { id: uuidv4(), step: 7, content: 'Gradually whisk in Parmesan cheese until smooth.', duration: 2 },
          { id: uuidv4(), step: 8, content: 'Add cooked pasta and chicken to the sauce. Toss to combine.', duration: 2 },
          { id: uuidv4(), step: 9, content: 'Garnish with fresh parsley and serve immediately.', duration: 1 },
        ],
        prepTime: 15,
        cookTime: 25,
        servings: 4,
        difficulty: 'medium' as const,
        tags: ['pasta', 'chicken', 'italian', 'dinner', 'creamy'],
        notes: 'For best results, use freshly grated Parmesan cheese. The sauce will thicken as it cools.',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?q=80&w=500&auto=format&fit=crop',
        sourceUrl: '',
        authorId: demoUser.id,
        visibility: 'public' as const,
      },
      {
        id: uuidv4(),
        title: 'Fresh Caprese Salad',
        description: 'A simple and elegant Italian salad featuring fresh mozzarella, tomatoes, and basil.',
        ingredients: [
          { id: uuidv4(), name: 'Fresh mozzarella', amount: 8, unit: 'oz', notes: 'sliced' },
          { id: uuidv4(), name: 'Tomatoes', amount: 3, unit: '', notes: 'large, ripe' },
          { id: uuidv4(), name: 'Fresh basil', amount: 0.25, unit: 'cup', notes: 'leaves' },
          { id: uuidv4(), name: 'Extra virgin olive oil', amount: 3, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Balsamic vinegar', amount: 2, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Salt', amount: 0.5, unit: 'tsp', notes: 'sea salt' },
          { id: uuidv4(), name: 'Black pepper', amount: 0.25, unit: 'tsp', notes: 'freshly ground' },
        ],
        instructions: [
          { id: uuidv4(), step: 1, content: 'Slice tomatoes and mozzarella into 1/4-inch thick rounds.', duration: 5 },
          { id: uuidv4(), step: 2, content: 'Arrange tomato and mozzarella slices alternately on a serving platter.', duration: 3 },
          { id: uuidv4(), step: 3, content: 'Tuck fresh basil leaves between the slices.', duration: 2 },
          { id: uuidv4(), step: 4, content: 'Drizzle with olive oil and balsamic vinegar.', duration: 1 },
          { id: uuidv4(), step: 5, content: 'Season with salt and pepper to taste.', duration: 1 },
          { id: uuidv4(), step: 6, content: 'Let stand for 10 minutes before serving to allow flavors to meld.', duration: 10 },
        ],
        prepTime: 15,
        cookTime: 0,
        servings: 4,
        difficulty: 'easy' as const,
        tags: ['salad', 'italian', 'vegetarian', 'fresh', 'summer'],
        notes: 'Use the best quality ingredients you can find. This salad is best served at room temperature.',
        imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?q=80&w=500&auto=format&fit=crop',
        sourceUrl: '',
        authorId: demoUser.id,
        visibility: 'public' as const,
      },
      {
        id: uuidv4(),
        title: 'Beef Wellington',
        description: 'An elegant and challenging dish featuring tender beef tenderloin wrapped in pâté and puff pastry.',
        ingredients: [
          { id: uuidv4(), name: 'Beef tenderloin', amount: 2, unit: 'lb', notes: 'center cut' },
          { id: uuidv4(), name: 'Puff pastry', amount: 1, unit: '', notes: 'sheet, thawed' },
          { id: uuidv4(), name: 'Mushrooms', amount: 1, unit: 'lb', notes: 'mixed variety, finely chopped' },
          { id: uuidv4(), name: 'Shallots', amount: 2, unit: '', notes: 'minced' },
          { id: uuidv4(), name: 'Garlic', amount: 3, unit: '', notes: 'cloves, minced' },
          { id: uuidv4(), name: 'Fresh thyme', amount: 2, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Dijon mustard', amount: 2, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Prosciutto', amount: 6, unit: '', notes: 'thin slices' },
          { id: uuidv4(), name: 'Egg', amount: 1, unit: '', notes: 'beaten for wash' },
          { id: uuidv4(), name: 'Olive oil', amount: 2, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Salt', amount: 1, unit: 'tsp', notes: '' },
          { id: uuidv4(), name: 'Black pepper', amount: 1, unit: 'tsp', notes: '' },
        ],
        instructions: [
          { id: uuidv4(), step: 1, content: 'Season beef with salt and pepper. Sear in hot oil until browned on all sides.', duration: 8 },
          { id: uuidv4(), step: 2, content: 'Brush seared beef with Dijon mustard and let cool completely.', duration: 15 },
          { id: uuidv4(), step: 3, content: 'Sauté mushrooms, shallots, garlic, and thyme until moisture evaporates.', duration: 15 },
          { id: uuidv4(), step: 4, content: 'Let mushroom mixture cool completely.', duration: 10 },
          { id: uuidv4(), step: 5, content: 'Lay plastic wrap on work surface, arrange prosciutto slices overlapping.', duration: 5 },
          { id: uuidv4(), step: 6, content: 'Spread mushroom mixture over prosciutto, place beef on top.', duration: 3 },
          { id: uuidv4(), step: 7, content: 'Roll tightly in plastic wrap and refrigerate for 30 minutes.', duration: 30 },
          { id: uuidv4(), step: 8, content: 'Wrap in puff pastry, seal edges, and brush with egg wash.', duration: 10 },
          { id: uuidv4(), step: 9, content: 'Bake at 400°F for 25-30 minutes until pastry is golden.', duration: 30 },
          { id: uuidv4(), step: 10, content: 'Rest for 10 minutes before slicing and serving.', duration: 10 },
        ],
        prepTime: 60,
        cookTime: 45,
        servings: 6,
        difficulty: 'hard' as const,
        tags: ['beef', 'pastry', 'elegant', 'dinner', 'special occasion'],
        notes: 'This is an advanced recipe that requires careful timing. Make sure the beef is completely cooled before wrapping.',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=500&auto=format&fit=crop',
        sourceUrl: '',
        authorId: demoUser.id,
        visibility: 'public' as const,
      },
      {
        id: uuidv4(),
        title: 'Avocado Toast with Poached Eggs',
        description: 'A healthy and delicious breakfast featuring creamy avocado and perfectly poached eggs on toasted bread.',
        ingredients: [
          { id: uuidv4(), name: 'Bread', amount: 4, unit: '', notes: 'slices, whole grain' },
          { id: uuidv4(), name: 'Avocados', amount: 2, unit: '', notes: 'ripe' },
          { id: uuidv4(), name: 'Eggs', amount: 4, unit: '', notes: 'fresh' },
          { id: uuidv4(), name: 'Lemon juice', amount: 1, unit: 'tbsp', notes: 'fresh' },
          { id: uuidv4(), name: 'Salt', amount: 0.5, unit: 'tsp', notes: '' },
          { id: uuidv4(), name: 'Black pepper', amount: 0.25, unit: 'tsp', notes: '' },
          { id: uuidv4(), name: 'Red pepper flakes', amount: 0.25, unit: 'tsp', notes: 'optional' },
          { id: uuidv4(), name: 'White vinegar', amount: 1, unit: 'tbsp', notes: 'for poaching' },
        ],
        instructions: [
          { id: uuidv4(), step: 1, content: 'Toast bread slices until golden brown.', duration: 3 },
          { id: uuidv4(), step: 2, content: 'Mash avocados with lemon juice, salt, and pepper.', duration: 3 },
          { id: uuidv4(), step: 3, content: 'Bring a pot of water to gentle simmer, add vinegar.', duration: 5 },
          { id: uuidv4(), step: 4, content: 'Crack each egg into a small bowl, then gently slide into water.', duration: 2 },
          { id: uuidv4(), step: 5, content: 'Poach eggs for 3-4 minutes until whites are set.', duration: 4 },
          { id: uuidv4(), step: 6, content: 'Spread avocado mixture on toast.', duration: 1 },
          { id: uuidv4(), step: 7, content: 'Top each toast with a poached egg.', duration: 1 },
          { id: uuidv4(), step: 8, content: 'Season with salt, pepper, and red pepper flakes.', duration: 1 },
        ],
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy' as const,
        tags: ['breakfast', 'healthy', 'avocado', 'eggs', 'quick'],
        notes: 'For perfect poached eggs, use the freshest eggs possible and create a gentle whirlpool in the water.',
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=500&auto=format&fit=crop',
        sourceUrl: '',
        authorId: demoUser.id,
        visibility: 'public' as const,
      },
      {
        id: uuidv4(),
        title: 'Thai Green Curry',
        description: 'Aromatic and spicy Thai curry with coconut milk, fresh vegetables, and fragrant herbs.',
        ingredients: [
          { id: uuidv4(), name: 'Chicken thigh', amount: 1, unit: 'lb', notes: 'boneless, cut into pieces' },
          { id: uuidv4(), name: 'Coconut milk', amount: 1, unit: '', notes: '14oz can' },
          { id: uuidv4(), name: 'Green curry paste', amount: 3, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Thai eggplant', amount: 1, unit: 'cup', notes: 'quartered' },
          { id: uuidv4(), name: 'Bell pepper', amount: 1, unit: '', notes: 'sliced' },
          { id: uuidv4(), name: 'Bamboo shoots', amount: 0.5, unit: 'cup', notes: 'sliced' },
          { id: uuidv4(), name: 'Thai basil', amount: 0.25, unit: 'cup', notes: 'leaves' },
          { id: uuidv4(), name: 'Fish sauce', amount: 2, unit: 'tbsp', notes: '' },
          { id: uuidv4(), name: 'Palm sugar', amount: 1, unit: 'tbsp', notes: 'or brown sugar' },
          { id: uuidv4(), name: 'Lime juice', amount: 1, unit: 'tbsp', notes: 'fresh' },
          { id: uuidv4(), name: 'Jasmine rice', amount: 2, unit: 'cup', notes: 'cooked' },
        ],
        instructions: [
          { id: uuidv4(), step: 1, content: 'Heat 1/4 cup coconut milk in a wok over medium heat.', duration: 2 },
          { id: uuidv4(), step: 2, content: 'Add curry paste and fry until fragrant, about 2 minutes.', duration: 2 },
          { id: uuidv4(), step: 3, content: 'Add chicken and cook until no longer pink.', duration: 5 },
          { id: uuidv4(), step: 4, content: 'Add remaining coconut milk and bring to a simmer.', duration: 3 },
          { id: uuidv4(), step: 5, content: 'Add eggplant, bell pepper, and bamboo shoots.', duration: 2 },
          { id: uuidv4(), step: 6, content: 'Simmer for 10-15 minutes until vegetables are tender.', duration: 15 },
          { id: uuidv4(), step: 7, content: 'Season with fish sauce, palm sugar, and lime juice.', duration: 1 },
          { id: uuidv4(), step: 8, content: 'Stir in Thai basil leaves just before serving.', duration: 1 },
          { id: uuidv4(), step: 9, content: 'Serve over jasmine rice.', duration: 1 },
        ],
        prepTime: 20,
        cookTime: 30,
        servings: 4,
        difficulty: 'medium' as const,
        tags: ['thai', 'curry', 'spicy', 'coconut', 'asian'],
        notes: 'Adjust the amount of curry paste to your heat preference. Thai eggplant can be substituted with regular eggplant.',
        imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=500&auto=format&fit=crop',
        sourceUrl: '',
        authorId: demoUser.id,
        visibility: 'public' as const,
      },
    ];

    // Insert recipes for demo user
    for (const recipe of sampleRecipes) {
      await db.insert(recipes).values(recipe);
      console.log(`✅ Created recipe: ${recipe.title}`);
    }

    // Create recipes for additional users
    const userRecipes = [
      // Sarah Chen's recipes (Asian cuisine focus)
      ...generateUserRecipes(additionalUsers[0].id, [
        {
          title: 'Homemade Ramen Bowl',
          description: 'Rich and flavorful ramen with tender pork belly, soft-boiled eggs, and fresh toppings.',
          tags: ['japanese', 'ramen', 'noodles', 'soup', 'comfort food'],
          difficulty: 'hard',
          prepTime: 30,
          cookTime: 180,
          servings: 4,
          imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Korean Bibimbap',
          description: 'Colorful rice bowl with seasoned vegetables, beef, and a fried egg topped with gochujang.',
          tags: ['korean', 'rice', 'bowl', 'vegetables', 'healthy'],
          difficulty: 'medium',
          prepTime: 40,
          cookTime: 20,
          servings: 4,
          imageUrl: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Vietnamese Pho',
          description: 'Aromatic beef noodle soup with fresh herbs and rice noodles in a fragrant broth.',
          tags: ['vietnamese', 'soup', 'noodles', 'beef', 'herbs'],
          difficulty: 'hard',
          prepTime: 20,
          cookTime: 240,
          servings: 6,
          imageUrl: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Pad Thai',
          description: 'Classic Thai stir-fried noodles with shrimp, tofu, peanuts, and tamarind sauce.',
          tags: ['thai', 'noodles', 'stir-fry', 'shrimp', 'street food'],
          difficulty: 'medium',
          prepTime: 25,
          cookTime: 15,
          servings: 4,
          imageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Sushi Rolls',
          description: 'Fresh homemade sushi rolls with salmon, avocado, and cucumber.',
          tags: ['japanese', 'sushi', 'seafood', 'rice', 'healthy'],
          difficulty: 'medium',
          prepTime: 45,
          cookTime: 20,
          servings: 4,
          imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=500&auto=format&fit=crop',
        },
      ]),
      // Marcus Johnson's recipes (BBQ and American classics)
      ...generateUserRecipes(additionalUsers[1].id, [
        {
          title: 'Slow-Smoked Brisket',
          description: 'Texas-style smoked brisket with a perfect bark and tender, juicy meat.',
          tags: ['bbq', 'beef', 'smoked', 'texas', 'dinner'],
          difficulty: 'hard',
          prepTime: 30,
          cookTime: 720,
          servings: 12,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Classic Cheeseburger',
          description: 'Juicy beef patty with melted cheese, crispy lettuce, and special sauce on a toasted bun.',
          tags: ['burger', 'beef', 'american', 'grill', 'casual'],
          difficulty: 'easy',
          prepTime: 15,
          cookTime: 10,
          servings: 4,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'BBQ Pulled Pork',
          description: 'Tender slow-cooked pork shoulder with tangy BBQ sauce, perfect for sandwiches.',
          tags: ['bbq', 'pork', 'slow-cooked', 'sandwich', 'comfort food'],
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 480,
          servings: 10,
          imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Buffalo Wings',
          description: 'Crispy chicken wings tossed in spicy buffalo sauce with blue cheese dip.',
          tags: ['chicken', 'wings', 'spicy', 'appetizer', 'game day'],
          difficulty: 'easy',
          prepTime: 15,
          cookTime: 45,
          servings: 6,
          imageUrl: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Mac and Cheese',
          description: 'Creamy, cheesy macaroni with a crispy breadcrumb topping.',
          tags: ['pasta', 'cheese', 'comfort food', 'side dish', 'baked'],
          difficulty: 'easy',
          prepTime: 15,
          cookTime: 30,
          servings: 8,
          imageUrl: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?q=80&w=500&auto=format&fit=crop',
        },
      ]),
      // Elena Rodriguez's recipes (Latin American cuisine)
      ...generateUserRecipes(additionalUsers[2].id, [
        {
          title: 'Authentic Tacos al Pastor',
          description: 'Marinated pork tacos with pineapple, cilantro, and onions on corn tortillas.',
          tags: ['mexican', 'tacos', 'pork', 'street food', 'spicy'],
          difficulty: 'medium',
          prepTime: 240,
          cookTime: 20,
          servings: 6,
          imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Empanadas',
          description: 'Flaky pastry pockets filled with seasoned beef, olives, and hard-boiled eggs.',
          tags: ['argentinian', 'pastry', 'beef', 'appetizer', 'baked'],
          difficulty: 'medium',
          prepTime: 60,
          cookTime: 25,
          servings: 12,
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Ceviche',
          description: 'Fresh fish marinated in citrus juice with onions, cilantro, and chili peppers.',
          tags: ['peruvian', 'seafood', 'fresh', 'appetizer', 'healthy'],
          difficulty: 'easy',
          prepTime: 30,
          cookTime: 0,
          servings: 4,
          imageUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Arroz con Pollo',
          description: 'One-pot chicken and rice with saffron, vegetables, and Latin spices.',
          tags: ['spanish', 'chicken', 'rice', 'one-pot', 'dinner'],
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 45,
          servings: 6,
          imageUrl: 'https://images.unsplash.com/photo-1633504581786-316c8002b1b9?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Churros with Chocolate',
          description: 'Crispy fried dough pastries dusted with cinnamon sugar, served with thick hot chocolate.',
          tags: ['spanish', 'dessert', 'fried', 'chocolate', 'sweet'],
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 15,
          servings: 6,
          imageUrl: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?q=80&w=500&auto=format&fit=crop',
        },
      ]),
      // Raj Patel's recipes (Indian cuisine)
      ...generateUserRecipes(additionalUsers[3].id, [
        {
          title: 'Butter Chicken',
          description: 'Creamy tomato-based curry with tender chicken in a rich, aromatic sauce.',
          tags: ['indian', 'curry', 'chicken', 'creamy', 'dinner'],
          difficulty: 'medium',
          prepTime: 30,
          cookTime: 40,
          servings: 6,
          imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Vegetable Biryani',
          description: 'Fragrant basmati rice layered with spiced vegetables and aromatic herbs.',
          tags: ['indian', 'rice', 'vegetarian', 'spiced', 'one-pot'],
          difficulty: 'hard',
          prepTime: 40,
          cookTime: 50,
          servings: 8,
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Samosas',
          description: 'Crispy fried pastries filled with spiced potatoes and peas.',
          tags: ['indian', 'appetizer', 'fried', 'vegetarian', 'snack'],
          difficulty: 'medium',
          prepTime: 45,
          cookTime: 20,
          servings: 12,
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Palak Paneer',
          description: 'Soft cheese cubes in a creamy spinach sauce with aromatic spices.',
          tags: ['indian', 'vegetarian', 'curry', 'spinach', 'cheese'],
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 30,
          servings: 4,
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Masala Dosa',
          description: 'Crispy rice and lentil crepe filled with spiced potato filling.',
          tags: ['indian', 'breakfast', 'vegetarian', 'crepe', 'south indian'],
          difficulty: 'hard',
          prepTime: 480,
          cookTime: 30,
          servings: 6,
          imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?q=80&w=500&auto=format&fit=crop',
        },
      ]),
      // Olivia Thompson's recipes (Baking and desserts)
      ...generateUserRecipes(additionalUsers[4].id, [
        {
          title: 'Sourdough Bread',
          description: 'Artisan sourdough with a crispy crust and tangy, chewy interior.',
          tags: ['bread', 'sourdough', 'baking', 'artisan', 'fermented'],
          difficulty: 'hard',
          prepTime: 1440,
          cookTime: 45,
          servings: 1,
          imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Lemon Meringue Pie',
          description: 'Tangy lemon custard topped with fluffy meringue in a buttery crust.',
          tags: ['dessert', 'pie', 'lemon', 'meringue', 'baking'],
          difficulty: 'hard',
          prepTime: 45,
          cookTime: 35,
          servings: 8,
          imageUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Red Velvet Cupcakes',
          description: 'Moist red velvet cupcakes with cream cheese frosting.',
          tags: ['dessert', 'cupcakes', 'baking', 'red velvet', 'frosting'],
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 20,
          servings: 24,
          imageUrl: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Cinnamon Rolls',
          description: 'Soft, fluffy rolls with cinnamon sugar filling and cream cheese glaze.',
          tags: ['breakfast', 'baking', 'cinnamon', 'sweet', 'rolls'],
          difficulty: 'medium',
          prepTime: 150,
          cookTime: 25,
          servings: 12,
          imageUrl: 'https://images.unsplash.com/photo-1626094309830-abbb0c99da4a?q=80&w=500&auto=format&fit=crop',
        },
        {
          title: 'Tiramisu',
          description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream.',
          tags: ['dessert', 'italian', 'coffee', 'no-bake', 'elegant'],
          difficulty: 'medium',
          prepTime: 30,
          cookTime: 0,
          servings: 12,
          imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=500&auto=format&fit=crop',
        },
      ]),
    ];

    // Insert all user recipes
    for (const recipe of userRecipes) {
      await db.insert(recipes).values(recipe);
      console.log(`✅ Created recipe: ${recipe.title}`);
    }

    const totalRecipes = sampleRecipes.length + userRecipes.length;
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${totalRecipes} recipes across ${additionalUsers.length + 1} users`);
    console.log('👤 Demo user credentials:');
    console.log('   Email: demo@jumptorecipe.com');
    console.log('   Password: demo123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seed };