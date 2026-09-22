import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/services/api-client.js';

describe('api client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches list of recipes with pagination query params', async () => {
    const mockData = [{ _id: '123', name: 'Pancakes' }];
    const mockPagination = { total: 25, page: 2, pages: 3 };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockData,
        meta: { count: 1, pagination: mockPagination },
      }),
    } as unknown as Response);

    const result = await api.list({ page: 2, limit: 10 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes?page=2&limit=10',
      expect.anything(),
    );
    expect(result).toEqual({
      recipes: mockData,
      pagination: mockPagination,
    });
  });

  it('fetches search endpoint when query is provided', async () => {
    const mockData = [{ _id: '456', name: 'Garlic Bread' }];
    const mockPagination = { total: 1, page: 1, pages: 1 };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockData,
        meta: { count: 1, pagination: mockPagination },
      }),
    } as unknown as Response);

    const result = await api.list({ query: 'garlic', page: 1, limit: 25 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes/search?page=1&limit=25&q=garlic',
      expect.anything(),
    );
    expect(result).toEqual({
      recipes: mockData,
      pagination: mockPagination,
    });
  });

  it('supports legacy string parameter for search query', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { count: 0, pagination: { total: 0, page: 1, pages: 1 } },
      }),
    } as unknown as Response);

    await api.list('soup');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes/search?page=1&limit=10&q=soup',
      expect.anything(),
    );
  });

  it('includes course filter in query params when provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { count: 0, pagination: { total: 0, page: 1, pages: 1 } },
      }),
    } as unknown as Response);

    await api.list({ course: 'Dessert' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes?page=1&limit=10&course=Dessert',
      expect.anything(),
    );
  });

  it('includes both query and course filter when searching', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { count: 0, pagination: { total: 0, page: 1, pages: 1 } },
      }),
    } as unknown as Response);

    await api.list({ query: 'pie', course: 'Dessert' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes/search?page=1&limit=10&course=Dessert&q=pie',
      expect.anything(),
    );
  });

  it('fetches unique courses list via api.courses()', async () => {
    const courses = ['Breakfast', 'Dessert', 'Dinner'];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: courses,
      }),
    } as unknown as Response);

    const result = await api.courses();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/recipes/courses', expect.anything());
    expect(result).toEqual(courses);
  });

  it('includes author (by) filter in query params when provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { count: 0, pagination: { total: 0, page: 1, pages: 1 } },
      }),
    } as unknown as Response);

    await api.list({ by: 'Alice' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes?page=1&limit=10&by=Alice',
      expect.anything(),
    );
  });

  it('combines search, course, and author filters', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { count: 0, pagination: { total: 0, page: 1, pages: 1 } },
      }),
    } as unknown as Response);

    await api.list({ query: 'pie', course: 'Dessert', by: 'Alice' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes/search?page=1&limit=10&course=Dessert&by=Alice&q=pie',
      expect.anything(),
    );
  });

  it('fetches unique authors list via api.authors()', async () => {
    const authors = ['Alice', 'Bob'];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: authors,
      }),
    } as unknown as Response);

    const result = await api.authors();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/recipes/authors', expect.anything());
    expect(result).toEqual(authors);
  });

  it('fetches full takeout data via api.takeout()', async () => {
    const mockTakeout = {
      version: '1.0',
      exportedAt: '2026-09-22T00:00:00.000Z',
      app: 'Mise',
      recipeCount: 1,
      recipes: [{ _id: '123', name: 'Soup' } as any],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTakeout,
      }),
    } as unknown as Response);

    const result = await api.takeout();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/takeout', expect.anything());
    expect(result).toEqual(mockTakeout);
  });

  it('downloads takeout and computes file metadata via api.downloadTakeout()', async () => {
    const mockTakeout = {
      version: '1.0',
      exportedAt: '2026-09-22T00:00:00.000Z',
      app: 'Mise',
      recipeCount: 2,
      recipes: [{ _id: '1', name: 'A' } as any, { _id: '2', name: 'B' } as any],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTakeout,
      }),
    } as unknown as Response);

    const result = await api.downloadTakeout();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/takeout', expect.anything());
    expect(result.recipeCount).toBe(2);
    expect(result.filename).toMatch(/^mise-takeout-\d{4}-\d{2}-\d{2}\.json$/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.data).toEqual(mockTakeout);
  });
});
