import { ImageResponse } from 'next/og';
import { APP_NAME } from '@/constants';
import { getRecipeShareData } from '@/lib/share/recipe-share-data';
import {
  loadMascotDataUrl,
  loadRecipePhotoDataUrl,
  loadTitleFont,
} from '@/lib/share/share-card-assets';
import { GenericShareCard, RecipeShareCard } from '@/lib/share/share-card-layouts';

export const alt = `A recipe on ${APP_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function RecipeShareImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeShareData(id);
  const mascot = await loadMascotDataUrl();

  const fontText = recipe ? `${recipe.title}${APP_NAME}` : `${APP_NAME}Family recipes, all in one place`;
  const [photo, titleFont] = await Promise.all([
    loadRecipePhotoDataUrl(recipe?.imageUrl ?? null),
    loadTitleFont(fontText),
  ]);

  const card = recipe ? (
    <RecipeShareCard title={recipe.title} photo={photo} mascot={mascot} />
  ) : (
    <GenericShareCard mascot={mascot} />
  );

  return new ImageResponse(card, {
    ...size,
    fonts: titleFont
      ? [{ name: 'Geist', data: titleFont, weight: 800, style: 'normal' }]
      : undefined,
  });
}
