import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipePhotosCardProps {
  cover: ReactNode;
  originalPhotos: ReactNode;
}

export function RecipePhotosCard({ cover, originalPhotos }: RecipePhotosCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <section aria-labelledby="cover-photo-heading" className="space-y-3">
          <div>
            <h3 id="cover-photo-heading" className="text-sm font-medium">
              Cover photo
            </h3>
            <p className="text-sm text-muted-foreground">
              Shown at the top of the recipe and on recipe cards.
            </p>
          </div>
          {cover}
        </section>

        <section aria-labelledby="original-recipe-heading" className="space-y-3">
          <div>
            <h3 id="original-recipe-heading" className="text-sm font-medium">
              Original recipe
            </h3>
            <p className="text-sm text-muted-foreground">
              Photos or scans of the handwritten or printed recipe.
            </p>
          </div>
          {originalPhotos}
        </section>
      </CardContent>
    </Card>
  );
}
