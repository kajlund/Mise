import { describe, expect, it } from 'vitest';
import { createRecipeSchema, recipeListQuerySchema } from '../src/index.js';
describe('recipe contracts', () => {
  it('applies safe recipe defaults', () => {
    const value = createRecipeSchema.parse({
      userID: '665544332211009988776655',
      name: 'Soup',
    });
    expect(value).toMatchObject({
      rating: 0,
      isFavorite: false,
      caloriesPerServing: null,
      prepTimeMinutes: null,
      cookTimeMinutes: null,
      servings: null,
      difficulty: null,
      course: '',
      cuisine: '',
      notes: '',
      tags: [],
      isPublic: true,
      ingredients: [],
      instructions: [],
    });
  });
  it('validates recipe metadata', () => {
    const base = { userID: '665544332211009988776655', name: 'Soup' };
    expect(
      createRecipeSchema.parse({
        ...base,
        caloriesPerServing: 320,
        prepTimeMinutes: 15,
        cookTimeMinutes: 45,
        servings: 4,
        difficulty: 'easy',
      }),
    ).toMatchObject({
      caloriesPerServing: 320,
      servings: 4,
      difficulty: 'easy',
    });
    expect(() => createRecipeSchema.parse({ ...base, servings: 0 })).toThrow();
    expect(() =>
      createRecipeSchema.parse({ ...base, prepTimeMinutes: 2.5 }),
    ).toThrow();
  });
  it('coerces and bounds pagination', () => {
    expect(
      recipeListQuerySchema.parse({ page: '2', limit: '25' }),
    ).toMatchObject({
      page: 2,
      limit: 25,
    });
    expect(() => recipeListQuerySchema.parse({ limit: '101' })).toThrow();
  });
});
