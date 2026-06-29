# Server Service

The `server` service is the main HTTP API for the platform. It handles REST endpoints, Socket.IO flows, authentication, middleware, media utilities, and request orchestration.

> [!WARNING]
> **This project is strictly Docker-centric.**
> Run the API only through Docker Compose.
> Do not start MongoDB, Redis, or the server process directly on the host.

> Docker-first note: this service should be run through the root Docker Compose setup. You should not rely on starting MongoDB or Redis directly on the host.

## Responsibilities

- API routing and middleware composition
- request/response handling and validation
- Socket.IO setup and authentication
- Redis and MongoDB access
- health endpoint and startup orchestration
- file/media-related utilities

## Scripts

From this folder, you can run:

```bash
pnpm run build
pnpm run start
pnpm run dev
pnpm run format
pnpm run lint
pnpm run create:module
pnpm run create:admin
pnpm run create:subscriptionFeature
```

### Script details

- `build`: produces a production build
- `start`: runs the compiled server
- `dev`: runs the server with nodemon for development
- `format`: formats the source tree
- `lint`: runs the linter
- `create:module`: scaffolds a new module
- `create:admin`: runs the admin setup utility
- `create:subscriptionFeature`: runs the subscription scaffolding utility

## Development Notes

- Default port: `5000`
- The service expects a service-local `.env` file.
- For a full environment, start the stack from the repository root:

```bash
docker compose up --build
```

## Useful Commands

```bash
docker compose logs -f server
docker compose restart server
docker compose exec server sh
```

## Health Check

```http
GET /health
```

Expected result:

- HTTP `200`
- JSON payload with `success: true`
