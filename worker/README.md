# Worker Service

The `worker` service processes asynchronous jobs through BullMQ.

> [!WARNING]
> **This project is strictly Docker-centric.**
> Run the worker only through Docker Compose.
> Do not start Redis, MongoDB, or the worker process directly on the host.

> Docker-first note: this service should be started through the repository root Docker Compose stack. It relies on Redis and MongoDB that are provided by the compose environment.

## Responsibilities

- queue consumers
- async job processing
- email-related background flows
- system maintenance and worker orchestration
- Redis and MongoDB integration

## Scripts

From this folder, you can run:

```bash
pnpm run build
pnpm run start
pnpm run dev
pnpm run format
pnpm run lint
```

### Script details

- `build`: creates a production build
- `start`: runs the built worker
- `dev`: starts the worker in development mode with nodemon
- `format`: formats TypeScript files
- `lint`: runs the linter

## Development Notes

- The worker depends on Redis for queue access.
- It should be run alongside the shared MongoDB and Redis containers.
- This service does not expose a public HTTP API.

## Useful Commands

```bash
docker compose logs -f worker
docker compose restart worker
docker compose exec worker sh
```
