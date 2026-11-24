"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface RecipeDescriptionProps {
  text: string;
}

/**
 * Description clamped to four lines, with a Read more toggle that only
 * appears when the text is actually cut off.
 */
export function RecipeDescription({ text }: RecipeDescriptionProps) {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const paragraph = paragraphRef.current;
    if (!paragraph || isExpanded) return;

    const measure = () => setIsTruncated(paragraph.scrollHeight > paragraph.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, [text, isExpanded]);

  return (
    <div className="flex max-w-prose flex-col items-start gap-1">
      <p
        id="recipe-description"
        ref={paragraphRef}
        className={cn(
          "text-lg leading-relaxed text-muted-foreground print:line-clamp-none",
          !isExpanded && "line-clamp-4"
        )}
      >
        {text}
      </p>
      {(isTruncated || isExpanded) && (
        <button
          type="button"
          aria-controls="recipe-description"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
        >
          {isExpanded ? "Show less" : "Read more"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
