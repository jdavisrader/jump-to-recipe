import Image from "next/image";
import Link from "next/link";
import { CTAButtons } from "@/components/cta-buttons";
import { RecipeFeed } from "@/components/recipes";
import { Clock, ChefHat, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="relative w-full py-12 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Recipe Feed Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Discover Recipes</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Explore popular recipes, trending dishes, and personalized recommendations from our community.
              </p>
            </div>
          </div>
          <RecipeFeed />
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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