import type { Difficulty } from "@/types/recipe";

interface RecipeStatsProps {
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  difficulty?: Difficulty | null;
  scale: number;
}

interface Stat {
  label: string;
  value: string;
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function RecipeStats({ prepTime, cookTime, servings, difficulty, scale }: RecipeStatsProps) {
  const stats: Stat[] = [];

  if (prepTime) stats.push({ label: "Prep time", value: `${prepTime} min` });
  if (cookTime) stats.push({ label: "Cook time", value: `${cookTime} min` });
  // Total only adds information when both parts are known
  if (prepTime && cookTime) {
    stats.push({ label: "Total time", value: `${prepTime + cookTime} min` });
  }
  if (servings) stats.push({ label: "Servings", value: `${Math.round(servings * scale)}` });
  if (difficulty) stats.push({ label: "Difficulty", value: difficultyLabels[difficulty] });

  if (stats.length === 0) return null;

  // Cells draw their own top/left borders; the negative margin hides them on the outer edge
  return (
    <div className="overflow-hidden rounded-xl border text-left">
      <dl className="-ml-px -mt-px flex flex-wrap">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex-1 basis-28 border-l border-t px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
