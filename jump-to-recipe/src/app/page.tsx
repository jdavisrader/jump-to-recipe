import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CTAButtons } from "@/components/cta-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, ChefHat, Users, ExternalLink } from "lucide-react";

// Mock recipe data for preview cards
const recipePreviewData = [
  {
    id: "1",
    title: "Classic Spaghetti Carbonara",
    description: "A creamy Italian pasta dish with pancetta and cheese",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=500&auto=format&fit=crop",
    prepTime: 10,
    cookTime: 15,
    difficulty: "easy",
    servings: 4,
  },
  {
    id: "2",
    title: "Avocado Toast with Poached Eggs",
    description: "A nutritious breakfast with creamy avocado and perfectly poached eggs",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=500&auto=format&fit=crop",
    prepTime: 5,
    cookTime: 10,
    difficulty: "easy",
    servings: 2,
  },
  {
    id: "3",
    title: "Thai Green Curry",
    description: "Aromatic and spicy curry with coconut milk and fresh vegetables",
    imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=500&auto=format&fit=crop",
    prepTime: 20,
    cookTime: 30,
    difficulty: "medium",
    servings: 4,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex flex-col justify-center space-y-4 max-w-3xl">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Recipes, Organized
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  Collect, organize, and share your favorite recipes with Jump to Recipe. 
                  Import from URLs, create digital cookbooks, and generate smart grocery lists.
                </p>
              </div>
              <CTAButtons className="justify-center" />
            </div>
            <div className="mt-8 aspect-video w-full max-w-3xl overflow-hidden rounded-xl">
              <Image
                src="https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1000&auto=format&fit=crop"
                alt="Cooking ingredients and recipe book"
                width={800}
                height={450}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Jump to Recipe provides all the tools you need to manage your recipes and meal planning in one place.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
            <div className="grid gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
                <ChefHat className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Recipe Management</h3>
                <p className="text-muted-foreground">
                  Easily add recipes manually, import from URLs, or extract from images with OCR.
                </p>
              </div>
            </div>
            <div className="grid gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Digital Cookbooks</h3>
                <p className="text-muted-foreground">
                  Create and share custom cookbooks with friends and family.
                </p>
              </div>
            </div>
            <div className="grid gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Smart Grocery Lists</h3>
                <p className="text-muted-foreground">
                  Generate optimized shopping lists from your selected recipes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recipe Preview Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Featured Recipes</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Discover delicious recipes from our community.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
            {recipePreviewData.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden safari-gap-fix">
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    width={500}
                    height={300}
                    className="object-cover w-full h-full transition-all transform-gpu hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{recipe.title}</CardTitle>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                    </div>
                    <div className="flex items-center">
                      <ChefHat className="mr-1 h-4 w-4" />
                      <span>{recipe.difficulty}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      <span>{recipe.servings} servings</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/recipes/${recipe.id}`}>
                      View Recipe
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/recipes">
                Browse All Recipes
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Get Started?</h2>
              <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of home cooks who are organizing their recipes with Jump to Recipe.
              </p>
            </div>
            <CTAButtons 
              primary={{ text: 'Create Account', href: '/auth/register', variant: 'secondary', size: 'lg' }}
              secondary={{ text: 'Sign In', href: '/auth/login', variant: 'outline', size: 'lg' }}
              className="justify-center"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-background border-t">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Jump to Recipe. All rights reserved.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
                Privacy
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}