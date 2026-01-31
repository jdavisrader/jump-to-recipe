const { Pool } = require('pg');

async function checkRecipe() {
  const connectionString = 'postgresql://localhost:5432/kiroJumpToRecipe';
  const pool = new Pool({ connectionString });
  
  const recipeId = '72fb2ef4-c0fb-4f22-a283-3cb6b7f449a0';
  
  try {
    // Get recipe
    const recipeResult = await pool.query(
      'SELECT id, title, image_url FROM recipes WHERE id = $1',
      [recipeId]
    );
    
    console.log('\n=== Recipe ===');
    if (recipeResult.rows.length > 0) {
      console.log('Title:', recipeResult.rows[0].title);
      console.log('image_url:', recipeResult.rows[0].image_url);
    } else {
      console.log('Recipe not found!');
    }
    
    // Get photos
    const photosResult = await pool.query(
      'SELECT * FROM recipe_photos WHERE recipe_id = $1 ORDER BY position',
      [recipeId]
    );
    
    console.log('\n=== Recipe Photos ===');
    console.log('Count:', photosResult.rows.length);
    photosResult.rows.forEach((photo, i) => {
      console.log(`\nPhoto ${i + 1}:`);
      console.log('  file_path:', photo.file_path);
      console.log('  file_name:', photo.file_name);
      console.log('  position:', photo.position);
    });
    
    // Check if files exist
    const fs = require('fs');
    const path = require('path');
    
    console.log('\n=== File System Check ===');
    if (recipeResult.rows[0]?.image_url) {
      const imagePath = path.join('public', recipeResult.rows[0].image_url);
      console.log('Main image path:', imagePath);
      console.log('Exists:', fs.existsSync(imagePath));
      
      if (!fs.existsSync(imagePath)) {
        console.log('❌ Main image file does NOT exist!');
      }
    } else {
      console.log('No image_url in database');
    }
    
    photosResult.rows.forEach((photo, i) => {
      const photoPath = path.join('public', photo.file_path);
      console.log(`\nPhoto ${i + 1} path:`, photoPath);
      console.log('Exists:', fs.existsSync(photoPath));
      
      if (!fs.existsSync(photoPath)) {
        console.log(`❌ Photo ${i + 1} file does NOT exist!`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRecipe().catch(console.error);
