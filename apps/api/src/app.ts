import { randomUUID } from 'node:crypto';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { zValidator } from '@hono/zod-validator';
import type { Logger } from 'pino';
import {
  createRecipeSchema,
  objectIdSchema,
  recipeListQuerySchema,
  recipeSearchQuerySchema,
  updateRecipeSchema,
} from '@mise/contracts';
import { DomainError } from './errors/domain-error.js';
import { RecipeService } from './services/recipe-service.js';

type Variables = { requestId: string };
const validation = (
  result: { success: boolean; error?: unknown },
  c: Context,
) =>
  result.success
    ? undefined
    : c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: result.error,
            requestId: c.get('requestId'),
          },
        },
        400,
      );
export function createApp(
  service: RecipeService,
  logger: Logger,
  webOrigin = 'http://localhost:5173',
  serveWeb = true,
) {
  const app = new Hono<{ Variables: Variables }>();
  app.use('*', cors({ origin: webOrigin }));
  app.use('*', async (c, next) => {
    const requestId = c.req.header('x-request-id') ?? randomUUID();
    c.set('requestId', requestId);
    c.header('x-request-id', requestId);
    const started = Date.now();
    await next();
    logger.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - started,
      },
      'request',
    );
  });
  const id = (c: Context<{ Variables: Variables }>) => {
    const parsed = objectIdSchema.safeParse(c.req.param('id'));
    if (!parsed.success)
      throw new DomainError('INVALID_ID', 'Invalid ID format', 400);
    return parsed.data;
  };
  app.get('/health', (c) =>
    c.json({ status: 'OK', message: 'Recipe REST API is running' }),
  );
  app.get(
    '/api/recipes/search',
    zValidator('query', recipeSearchQuerySchema, validation),
    async (c) => {
      const result = await service.searchRecipes(c.req.valid('query'));
      return c.json({
        success: true,
        data: result.recipes,
        meta: {
          query: result.query,
          count: result.recipes.length,
          pagination: result.pagination,
        },
      });
    },
  );
  app.get(
    '/api/recipes',
    zValidator('query', recipeListQuerySchema, validation),
    async (c) => {
      const result = await service.getRecipes(c.req.valid('query'));
      return c.json({
        success: true,
        data: result.recipes,
        meta: { count: result.recipes.length, pagination: result.pagination },
      });
    },
  );
  app.get('/api/recipes/courses', async (c) =>
    c.json({ success: true, data: await service.getCourses() }),
  );
  app.get('/api/recipes/authors', async (c) =>
    c.json({ success: true, data: await service.getAuthors() }),
  );
  app.post(
    '/api/recipes',
    zValidator('json', createRecipeSchema, validation),
    async (c) =>
      c.json(
        {
          success: true,
          data: await service.createRecipe(c.req.valid('json')),
        },
        201,
      ),
  );
  app.get('/api/recipes/takeout', async (c) => {
    const data = await service.getTakeout();
    const date = new Date().toISOString().slice(0, 10);
    c.header(
      'Content-Disposition',
      `attachment; filename="mise-takeout-${date}.json"`,
    );
    return c.json({ success: true, data });
  });
  app.get('/api/recipes/:id', async (c) =>
    c.json({ success: true, data: await service.getRecipeById(id(c)) }),
  );
  app.put(
    '/api/recipes/:id',
    zValidator('json', updateRecipeSchema, validation),
    async (c) =>
      c.json({
        success: true,
        data: await service.updateRecipe(id(c), c.req.valid('json')),
      }),
  );
  app.delete('/api/recipes/:id', async (c) => {
    await service.deleteRecipe(id(c));
    return c.json({
      success: true,
      message: 'Recipe successfully deleted',
      data: {},
    });
  });
  app.get('/api/takeout', async (c) => {
    const data = await service.getTakeout();
    const date = new Date().toISOString().slice(0, 10);
    c.header(
      'Content-Disposition',
      `attachment; filename="mise-takeout-${date}.json"`,
    );
    return c.json({ success: true, data });
  });
  app.all('/api/*', (c) =>
    c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          requestId: c.get('requestId'),
        },
      },
      404,
    ),
  );
  if (serveWeb) {
    app.use('/*', serveStatic({ root: '../web/dist' }));
    app.get('*', serveStatic({ root: '../web/dist', path: 'index.html' }));
  }
  app.onError((error, c) => {
    const requestId = c.get('requestId') ?? randomUUID();
    if (error instanceof DomainError)
      return c.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            requestId,
          },
        },
        error.status,
      );
    logger.error({ err: error, requestId }, 'unhandled error');
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          requestId,
        },
      },
      500,
    );
  });
  return app;
}
