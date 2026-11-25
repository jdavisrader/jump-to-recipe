import type { Metadata } from 'next';
import { APP_NAME } from '@/constants';
import { getRecipeShareData, truncateForPreview } from '@/lib/share/recipe-share-data';

interface RecipeLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// Link-preview metadata for shared recipe URLs. The preview image itself
// comes from ./opengraph-image.tsx, which Next.js attaches automatically.
export async function generateMetadata({ params }: RecipeLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeShareData(id);

  if (!recipe) {
    return { title: APP_NAME };
  }

  const description =
    truncateForPreview(recipe.description) ?? `A recipe shared on ${APP_NAME}`;

  return {
    title: `${recipe.title} | ${APP_NAME}`,
    description,
    openGraph: {
      type: 'article',
      siteName: APP_NAME,
      title: recipe.title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description,
    },
  };
}

export default function RecipeLayout({ children }: RecipeLayoutProps) {
  return children;
}
