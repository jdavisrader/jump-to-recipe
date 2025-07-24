import { relations } from 'drizzle-orm';
import { users } from './users';
import { recipes } from './recipes';
import { cookbooks, cookbookRecipes, cookbookCollaborators } from './cookbooks';
import { comments } from './comments';
import { groceryLists } from './grocery-lists';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  recipes: many(recipes),
  ownedCookbooks: many(cookbooks),
  cookbookCollaborations: many(cookbookCollaborators),
  comments: many(comments),
  groceryLists: many(groceryLists),
}));

// Recipe relations
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  author: one(users, {
    fields: [recipes.authorId],
    references: [users.id],
  }),
  cookbookRecipes: many(cookbookRecipes),
  comments: many(comments),
}));

// Cookbook relations
export const cookbooksRelations = relations(cookbooks, ({ one, many }) => ({
  owner: one(users, {
    fields: [cookbooks.ownerId],
    references: [users.id],
  }),
  recipes: many(cookbookRecipes),
  collaborators: many(cookbookCollaborators),
}));

// Cookbook recipes relations
export const cookbookRecipesRelations = relations(cookbookRecipes, ({ one }) => ({
  cookbook: one(cookbooks, {
    fields: [cookbookRecipes.cookbookId],
    references: [cookbooks.id],
  }),
  recipe: one(recipes, {
    fields: [cookbookRecipes.recipeId],
    references: [recipes.id],
  }),
}));

// Cookbook collaborators relations
export const cookbookCollaboratorsRelations = relations(cookbookCollaborators, ({ one }) => ({
  cookbook: one(cookbooks, {
    fields: [cookbookCollaborators.cookbookId],
    references: [cookbooks.id],
  }),
  user: one(users, {
    fields: [cookbookCollaborators.userId],
    references: [users.id],
  }),
}));

// Comments relations
export const commentsRelations = relations(comments, ({ one }) => ({
  recipe: one(recipes, {
    fields: [comments.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Grocery lists relations
export const groceryListsRelations = relations(groceryLists, ({ one }) => ({
  user: one(users, {
    fields: [groceryLists.userId],
    references: [users.id],
  }),
}));