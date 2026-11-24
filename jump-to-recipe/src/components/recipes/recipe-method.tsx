import { Clock } from 'lucide-react';

import { getMethodSectionId } from './recipe-jump-nav';
import type { Instruction, Recipe } from '@/types/recipe';

interface RecipeMethodProps {
  instructions: Instruction[];
  instructionSections?: Recipe['instructionSections'];
}

interface MethodGroup {
  id: string;
  name: string;
  steps: Instruction[];
}

// Older recipes store a flat list; treat it as one unnamed group
function toGroups(
  instructions: Instruction[],
  sections: Recipe['instructionSections']
): MethodGroup[] {
  const byPosition = (a: Instruction, b: Instruction) =>
    a.position - b.position;

  if (sections && sections.length > 0) {
    return [...sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        id: section.id,
        name: section.name,
        steps: [...section.items].sort(byPosition),
      }));
  }
  return [{ id: 'all', name: '', steps: [...instructions].sort(byPosition) }];
}

export function RecipeMethod({
  instructions,
  instructionSections,
}: RecipeMethodProps) {
  const groups = toGroups(instructions, instructionSections);
  const showPartLabels = groups.length > 1;

  return (
    <section aria-labelledby="method-heading">
      <h2 id="method-heading" className="text-2xl font-bold tracking-tight">
        Method
      </h2>

      {groups.map((group, groupIndex) => (
        <section
          key={group.id}
          id={getMethodSectionId(groupIndex + 1)}
          aria-label={group.name || undefined}
          className="mt-7 scroll-mt-24"
        >
          {(group.name || showPartLabels) && (
            <div className="mb-5 flex items-baseline gap-3 border-b-2 border-foreground pb-2">
              {showPartLabels && (
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Part {groupIndex + 1}
                </span>
              )}
              {group.name && (
                <h3 className="text-xl font-bold tracking-tight">
                  {group.name}
                </h3>
              )}
            </div>
          )}

          <ol className="flex flex-col gap-6">
            {group.steps.map((step, stepIndex) => (
              <li key={step.id} className="flex items-start gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground font-bold"
                  aria-hidden="true"
                >
                  {stepIndex + 1}
                </span>
                <div className="flex-1 space-y-1 pt-1.5">
                  <p className="leading-relaxed">
                    <span className="sr-only">Step {stepIndex + 1}: </span>
                    {step.content}
                  </p>
                  {step.duration ? (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {step.duration} min
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
