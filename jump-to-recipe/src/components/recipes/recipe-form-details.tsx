"use client";

import { useState } from "react";
import { useController, type Control } from "react-hook-form";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FormPanel } from "@/components/recipes/form-panel";
import type { RecipeFormValues } from "@/components/recipes/recipe-form-basics";

interface RecipeFormDetailsProps {
  control: Control<RecipeFormValues>;
}

type NumberFieldName = "prepTime" | "cookTime" | "servings";

function NumberField({
  control,
  name,
  label,
  placeholder,
}: RecipeFormDetailsProps & { name: NumberFieldName; label: string; placeholder: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={placeholder}
              {...field}
              value={field.value || ""}
              onChange={(e) =>
                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TagsField({ control }: RecipeFormDetailsProps) {
  const [tagInput, setTagInput] = useState("");
  const { field } = useController({ control, name: "tags" });
  const tags = field.value || [];

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!tags.includes(tag)) field.onChange([...tags, tag]);
    setTagInput("");
  };

  return (
    <div className="space-y-2">
      <label htmlFor="recipe-tag-input" className="text-sm font-medium">
        Tags
      </label>
      <div className="flex gap-2">
        <Input
          id="recipe-tag-input"
          placeholder="Add a tag, like weeknight or vegetarian"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleAddTag}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Tags">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm text-secondary-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => field.onChange(tags.filter((t) => t !== tag))}
                className="rounded-full p-1 hover:text-destructive"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecipeFormDetails({ control }: RecipeFormDetailsProps) {
  return (
    <FormPanel title="Details">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <NumberField control={control} name="prepTime" label="Prep time (min)" placeholder="15" />
          <NumberField control={control} name="cookTime" label="Cook time (min)" placeholder="30" />
          <NumberField control={control} name="servings" label="Servings" placeholder="4" />
          <FormField
            control={control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <TagsField control={control} />

        <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
          <FormField
            control={control}
            name="sourceUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com/recipe"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </FormPanel>
  );
}
