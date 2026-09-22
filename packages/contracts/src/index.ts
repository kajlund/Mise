import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

export const ingredientSchema = z.object({
  _id: objectIdSchema.optional(),
  pos: z.coerce.number().int().min(1),
  group: z.string().trim().default('Ingredients'),
  name: z.string().trim().min(1),
  amount: z.union([z.string(), z.number()]).default(''),
  unit: z.string().trim().default(''),
});

export const instructionSchema = z.object({
  _id: objectIdSchema.optional(),
  pos: z.coerce.number().int().min(1),
  group: z.string().trim().default('Instructions'),
  description: z.string().trim().min(1),
});

const recipeFields = z.object({
  userID: objectIdSchema,
  name: z.string().trim().min(1),
  originUrl: z.string().trim().default(''),
  by: z.string().trim().default(''),
  description: z.string().trim().default(''),
  rating: z.coerce.number().min(0).max(5).default(0),
  isFavorite: z.boolean().default(false),
  caloriesPerServing: z.number().int().nonnegative().nullable().default(null),
  prepTimeMinutes: z.number().int().nonnegative().nullable().default(null),
  cookTimeMinutes: z.number().int().nonnegative().nullable().default(null),
  servings: z.number().int().positive().nullable().default(null),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().default(null),
  course: z.string().trim().default(''),
  cuisine: z.string().trim().default(''),
  notes: z.string().trim().default(''),
  tags: z.array(z.string().trim().min(1)).default([]),
  isPublic: z.boolean().default(true),
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.array(instructionSchema).default([]),
});

export const createRecipeSchema = recipeFields;
export const updateRecipeSchema = recipeFields
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });
export const recipeListQuerySchema = z.object({
  userID: objectIdSchema.optional(),
  tag: z.string().trim().min(1).optional(),
  course: z.string().trim().min(1).optional(),
  by: z.string().trim().min(1).optional(),
  isPublic: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().trim().default('-createdAt'),
});
export const recipeSearchQuerySchema = z.object({
  q: z.string().trim().min(1),
  course: z.string().trim().min(1).optional(),
  by: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Instruction = z.infer<typeof instructionSchema>;
export type CreateRecipe = z.infer<typeof createRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;
export type Recipe = CreateRecipe & { _id: string; createdAt: string; updatedAt: string };
export type Pagination = { total: number; page: number; pages: number };
export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
};
export type ApiError = {
  success: false;
  error: { code: string; message: string; requestId: string; details?: unknown };
};
export type TakeoutData = {
  version: string;
  exportedAt: string;
  app: string;
  recipeCount: number;
  recipes: Recipe[];
};
