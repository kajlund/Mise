import type { FilterQuery, UpdateQuery } from 'mongoose';
import {
  RecipeModel,
  type RecipeDocument,
  type RecipeHydratedDocument,
} from '../db/recipe-model.js';
export type FindOptions = { sort?: string; skip?: number; limit?: number };
export interface RecipeRepository {
  create(data: Partial<RecipeDocument>): Promise<RecipeHydratedDocument>;
  find(
    query: FilterQuery<RecipeDocument>,
    options?: FindOptions,
  ): Promise<RecipeHydratedDocument[]>;
  findAll(): Promise<RecipeHydratedDocument[]>;
  count(query: FilterQuery<RecipeDocument>): Promise<number>;
  findById(id: string): Promise<RecipeHydratedDocument | null>;
  update(id: string, data: UpdateQuery<RecipeDocument>): Promise<RecipeHydratedDocument | null>;
  delete(id: string): Promise<RecipeHydratedDocument | null>;
  distinct(field: string, query?: FilterQuery<RecipeDocument>): Promise<unknown[]>;
}
export const recipeRepository: RecipeRepository = {
  create: (data) => RecipeModel.create(data),
  find: (query, { sort = '-createdAt', skip = 0, limit = 10 } = {}) =>
    RecipeModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
  findAll: () => RecipeModel.find().sort('-createdAt').exec(),
  count: (query) => RecipeModel.countDocuments(query).exec(),
  findById: (id) => RecipeModel.findById(id).exec(),
  update: (id, data) =>
    RecipeModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec(),
  delete: (id) => RecipeModel.findByIdAndDelete(id).exec(),
  distinct: (field, query = {}) => RecipeModel.distinct(field, query).exec(),
};
