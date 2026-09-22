import { Types, type FilterQuery } from 'mongoose';
import type { CreateRecipe, Recipe, TakeoutData, UpdateRecipe } from '@mise/contracts';
import { DomainError } from '../errors/domain-error.js';
import { recipeRepository, type RecipeRepository } from '../repositories/recipe-repository.js';
import type { RecipeDocument } from '../db/recipe-model.js';

export class RecipeService {
  constructor(private readonly repository: RecipeRepository = recipeRepository) {}
  private id(value: string): void {
    if (!Types.ObjectId.isValid(value))
      throw new DomainError('INVALID_ID', 'Invalid ID format', 400);
  }
  private ordered<T extends { pos: number }>(values: T[] | undefined): T[] | undefined {
    return values ? [...values].sort((a, b) => a.pos - b.pos) : undefined;
  }
  async createRecipe(data: CreateRecipe) {
    return this.repository.create({
      ...data,
      ingredients: this.ordered(data.ingredients),
      instructions: this.ordered(data.instructions),
    } as unknown as Partial<RecipeDocument>);
  }
  async getRecipes(input: {
    userID?: string | undefined;
    tag?: string | undefined;
    course?: string | undefined;
    by?: string | undefined;
    isPublic?: 'true' | 'false' | undefined;
    page: number;
    limit: number;
    sort: string;
  }) {
    const query: FilterQuery<RecipeDocument> = {};
    if (input.userID) query.userID = new Types.ObjectId(input.userID);
    if (input.tag) query.tags = input.tag;
    if (input.course) query.course = input.course;
    if (input.by) query.by = input.by;
    if (input.isPublic !== undefined) query.isPublic = input.isPublic === 'true';
    const total = await this.repository.count(query);
    const recipes = await this.repository.find(query, {
      sort: input.sort,
      skip: (input.page - 1) * input.limit,
      limit: input.limit,
    });
    return {
      recipes,
      pagination: { total, page: input.page, pages: Math.ceil(total / input.limit) || 1 },
    };
  }
  async searchRecipes(input: {
    q: string;
    course?: string | undefined;
    by?: string | undefined;
    page: number;
    limit: number;
  }) {
    const escaped = input.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const value = new RegExp(escaped, 'i');
    const query: FilterQuery<RecipeDocument> = {
      $or: [
        { name: value },
        { description: value },
        { tags: value },
        { course: value },
        { cuisine: value },
        { 'ingredients.name': value },
        { by: value },
      ],
    };
    if (input.course) query.course = input.course;
    if (input.by) query.by = input.by;
    const total = await this.repository.count(query);
    const recipes = await this.repository.find(query, {
      sort: '-createdAt',
      skip: (input.page - 1) * input.limit,
      limit: input.limit,
    });
    return {
      recipes,
      query: input.q,
      pagination: { total, page: input.page, pages: Math.ceil(total / input.limit) || 1 },
    };
  }
  async getCourses(): Promise<string[]> {
    const values = await this.repository.distinct('course', {
      course: { $exists: true, $nin: ['', null] },
    });
    return (values as string[])
      .filter((course): course is string => typeof course === 'string' && course.trim().length > 0)
      .map((course) => course.trim())
      .filter((course, index, array) => array.indexOf(course) === index)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  async getAuthors(): Promise<string[]> {
    const values = await this.repository.distinct('by', {
      by: { $exists: true, $nin: ['', null] },
    });
    return (values as string[])
      .filter((author): author is string => typeof author === 'string' && author.trim().length > 0)
      .map((author) => author.trim())
      .filter((author, index, array) => array.indexOf(author) === index)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  async getRecipeById(id: string) {
    this.id(id);
    const recipe = await this.repository.findById(id);
    if (!recipe) throw new DomainError('NOT_FOUND', 'Recipe not found', 404);
    return recipe;
  }
  async updateRecipe(id: string, data: UpdateRecipe) {
    this.id(id);
    const recipe = await this.repository.update(id, {
      ...data,
      ingredients: this.ordered(data.ingredients),
      instructions: this.ordered(data.instructions),
    });
    if (!recipe) throw new DomainError('NOT_FOUND', 'Recipe not found', 404);
    return recipe;
  }
  async deleteRecipe(id: string) {
    this.id(id);
    const recipe = await this.repository.delete(id);
    if (!recipe) throw new DomainError('NOT_FOUND', 'Recipe not found', 404);
  }
  async getTakeout(): Promise<TakeoutData> {
    const recipes = await this.repository.findAll();
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      app: 'Mise',
      recipeCount: recipes.length,
      recipes: recipes as unknown as Recipe[],
    };
  }
}
