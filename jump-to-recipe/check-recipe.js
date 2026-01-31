const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { recipes, recipePhotos } = require('./src/db/schema');
const { eq } = require('drizzle-orm');

async function checkRecipe() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const db = drizzle(pool);
  
  const recipeId = '72fb2ef4-c0fb-4f22-a283-3cb6b7f449a0';
  
  // Get recipe
  const recipe = await db.select().from(recipes).where(eq(recipes.id, recipeId));
  console.log('\n=== Recipe ===');
  console.log('Title:', recipe[0]?.title);
  console.log('ImageURL:', recipe[0]?.imageUrl);
  
  // Get photos
  const photos = await db.select().from(recipePhotos).where(eq(recipePhotos.recipeId, recipeId));
  console.log('\n=== Recipe Photos ===');
  console.log('Count:', photos.length);
  photos.forEach((photo, i) => {
    console.log(`Photo ${i + 1}:`, photo.filePath);
  });
  
  await pool.end();
}

checkRecipe().catch(console.error);
