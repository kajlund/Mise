# Mise

Mise is a TypeScript recipe manager organized as npm workspaces and modeled after TaskBook's stack.

## Stack

- **API:** Hono, Zod, Mongoose/MongoDB, and Pino
- **Web:** Lit, Vite, and Phosphor Icons
- **Shared contracts:** Zod schemas with inferred TypeScript types
- **Tooling:** TypeScript and Vitest

## Workspaces

```text
apps/api/           @mise/api
apps/web/           @mise/web
packages/contracts/ @mise/contracts
docs/design/        Approved visual and brand references
```

## Development

Requires Node.js 22+ and access to the configured MongoDB server.

```bash
npm install
npm run dev
```

The web app runs at `http://localhost:5173` and proxies API calls to `http://localhost:3000`. Copy `.env.example` to `.env` in the repository root to customize configuration. The API resolves this file relative to the repository, so it works consistently when launched through npm workspaces.

## Checks

```bash
npm run check
npm test
npm run typecheck
npm run build
```

The production API serves the built client from `apps/web/dist`.

## Container Deployment (Docker)

To run the full stack (Mise app + MongoDB) with Docker Compose:

```bash
docker compose up -d --build
```

Or build and run the unified production image standalone:

```bash
docker build -t mise .
docker run -p 3000:3000 -e MONGO_URI="mongodb+srv://..." mise
```

## API

- `GET /health`
- `GET /api/recipes`
- `GET /api/recipes/search?q=...`
- `GET /api/recipes/:id`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

Existing MongoDB recipe documents remain compatible; no data migration is required.

## Linting and formatting

All Dreamquest projects use the same ESLint and Prettier configuration, based on Activus. Run these commands from the repository root:

```sh
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

ESLint checks supported JavaScript and TypeScript files and treats warnings as failures. Prettier formats its supported source, configuration, and documentation files with single quotes, trailing commas, and LF line endings. Dependencies, generated builds and test output, local data, editor settings, archived artifacts, and dependency lockfiles are excluded. SQL and Nunjucks templates are outside the installed tools' supported file types.
