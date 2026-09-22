import type {
  ApiError,
  ApiSuccess,
  CreateRecipe,
  Pagination,
  Recipe,
  TakeoutData,
  UpdateRecipe,
} from '@mise/contracts';

export interface RecipeListOptions {
  query?: string;
  course?: string;
  by?: string;
  page?: number;
  limit?: number;
}

export interface RecipeListResult {
  recipes: Recipe[];
  pagination: Pagination;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta?: Record<string, unknown> | undefined }> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...init?.headers },
  });
  const body = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !body.success)
    throw new Error(body.success ? 'Request failed' : body.error.message);
  return { data: body.data, meta: body.meta };
}

export const api = {
  list: async (options: string | RecipeListOptions = {}): Promise<RecipeListResult> => {
    const opts = typeof options === 'string' ? { query: options } : options;
    const query = opts.query?.trim() ?? '';
    const course = opts.course?.trim() ?? '';
    const by = opts.by?.trim() ?? '';
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 10;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (course) {
      params.set('course', course);
    }
    if (by) {
      params.set('by', by);
    }

    let path = '/api/recipes';
    if (query) {
      params.set('q', query);
      path = '/api/recipes/search';
    }

    const res = await request<Recipe[]>(`${path}?${params.toString()}`);
    const pagination = (res.meta?.pagination as Pagination) ?? {
      total: res.data.length,
      page,
      pages: Math.max(1, Math.ceil(res.data.length / limit)),
    };

    return { recipes: res.data, pagination };
  },
  courses: async (): Promise<string[]> => {
    const res = await request<string[]>('/api/recipes/courses');
    return res.data;
  },
  authors: async (): Promise<string[]> => {
    const res = await request<string[]>('/api/recipes/authors');
    return res.data;
  },
  create: async (recipe: CreateRecipe) => {
    const res = await request<Recipe>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
    return res.data;
  },
  update: async (id: string, recipe: UpdateRecipe) => {
    const res = await request<Recipe>(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await request<Record<string, never>>(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
  takeout: async (): Promise<TakeoutData> => {
    const res = await request<TakeoutData>('/api/takeout');
    return res.data;
  },
  downloadTakeout: async (): Promise<{
    filename: string;
    recipeCount: number;
    sizeBytes: number;
    data: TakeoutData;
  }> => {
    const res = await request<TakeoutData>('/api/takeout');
    const jsonString = JSON.stringify(res.data, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `mise-takeout-${dateStr}.json`;
    if (typeof document !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return {
      filename,
      recipeCount: res.data.recipeCount,
      sizeBytes: new Blob([jsonString]).size,
      data: res.data,
    };
  },
};
