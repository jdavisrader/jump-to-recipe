"use client";

import { useState } from "react";
import { RecipePhotosUpload } from "./recipe-photos-upload";

export function RecipePhotosUploadDemo() {
  const [photos, setPhotos] = useState<Array<{ id: string; filePath: string; fileName: string }>>([]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Recipe Photos Upload Demo</h1>
      
      <RecipePhotosUpload
        recipeId="demo-recipe"
        existingPhotos={photos}
        onPhotosChange={setPhotos}
      />
      
      {photos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Current Photos:</h2>
          <ul className="space-y-1">
            {photos.map((photo) => (
              <li key={photo.id} className="text-sm text-gray-600">
                {photo.fileName} - {photo.filePath}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}