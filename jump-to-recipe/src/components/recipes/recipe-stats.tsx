import { ChefHat, Clock, Users, type LucideIcon } from "lucide-react";

interface RecipeStatsProps {
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  scale: number;
}

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
}

// Literal class names so Tailwind keeps them in the build
const gridColumns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function RecipeStats({ prepTime, cookTime, servings, scale }: RecipeStatsProps) {
  const stats: Stat[] = [];

  if (prepTime) stats.push({ label: "Prep time", value: `${prepTime} min`, icon: Clock });
  if (cookTime) stats.push({ label: "Cook time", value: `${cookTime} min`, icon: ChefHat });
  // Total only adds information when both parts are known
  if (prepTime && cookTime) {
    stats.push({ label: "Total time", value: `${prepTime + cookTime} min`, icon: Clock });
  }
  if (servings) {
    stats.push({ label: "Servings", value: `${Math.round(servings * scale)}`, icon: Users });
  }

  if (stats.length === 0) return null;

  return (
    <dl className={`grid ${gridColumns[stats.length]} gap-2 sm:gap-4 mb-6`}>
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="text-center">
          <dt className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 mb-1">
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium">{label}</span>
          </dt>
          <dd className="text-sm sm:text-lg font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
