# Postgress Backend

> [!WARNING]
> **This project is strictly Docker-centric.**
> Do not try to run the backend services, MongoDB, Redis, or any dependencies directly on your host machine.
> The supported development flow is to use Docker Compose for everything.
> Install Docker and Node.js only for container orchestration and scripting convenience.

## 1. Purpose

This repository contains the backend services for the Postgress platform:

- `server`: Express API, Socket.IO, auth, and business endpoints
- `worker`: BullMQ worker processes for background jobs
- `corn`: scheduled/cron-style job runner
- `schemas`: shared schema source-of-truth and scaffolding utilities

## 2. Prerequisites

Required for local setup:

- Docker Desktop or Docker Engine with Docker Compose
- Node.js (LTS recommended)
- pnpm

Optional but useful:

- Git
- VS Code with Docker and Dev Containers support

## 3. Repository Layout

```text
.
├── docker-compose.yaml
├── package.json
├── scripts/
├── schemas/
├── server/
├── worker/
├── corn/
├── docs/
└── README.md
```

## 4. Documentation Map

Use this map to navigate the repository:

| Area                  | Purpose                               | Location                                   |
| --------------------- | ------------------------------------- | ------------------------------------------ |
| Root setup guide      | Full project onboarding               | [README.md](README.md)                     |
| Developer docs index  | Documentation navigation              | [docs/README.md](docs/README.md)           |
| Development workflow  | Docker-first workflow and scripts     | [docs/development.md](docs/development.md) |
| Shared schema tooling | Schema generation and synchronization | [schemas/README.md](schemas/README.md)     |
| API service docs      | Server runtime details                | [server/README.md](server/README.md)       |
| Queue worker docs     | Worker runtime details                | [worker/README.md](worker/README.md)       |
| Scheduler docs        | Corn runtime details                  | [corn/README.md](corn/README.md)           |

## 5. Clone and Bootstrap

```bash
git clone <your-repo-url>
cd postgress-backend
```

Create service-local environment files:

```bash
cp server/.env.example server/.env
cp worker/.env.example worker/.env
cp corn/.env.example corn/.env
cp nodemailer/.env.example nodemailer/.env
```

> Do not create a root-level `.env` file for this repository.

## 6. Run the Entire Project with Docker

From the repository root:

```bash
docker compose up --build
```

This command will:

- build the `server`, `worker`, and `corn` containers
- start Redis and MongoDB services
- mount local source folders into the containers for live development
- keep dependencies inside container volumes

Useful commands:

```bash
docker compose down
docker compose ps
docker compose logs -f server
docker compose logs -f worker
docker compose logs -f corn
docker compose logs -f nodemailer
```

## 7. Root Scripts

The root project defines the schema workflow shortcuts:

```bash
pnpm run create:schema <module-name>
pnpm run sync:schema
```

- `create:schema <module-name>` creates a new shared schema module under [schemas](schemas/modules).
- `sync:schema` copies the shared schema output into the runtime services.

## 8. Schema Workflow

The schema source-of-truth lives in [schemas](schemas).

When you create a new module, run:

```bash
pnpm run create:schema product-category
```

This creates the module scaffold under:

```text
schemas/modules/product-category/
```

After editing files in that module, sync the changes into the runtime services:

```bash
pnpm run sync:schema
```

Run `pnpm run sync:schema` every time you change schema files under [schemas](schemas/modules).

## 9. Service Responsibilities

| Service  | Role                         | Notes                               |
| -------- | ---------------------------- | ----------------------------------- |
| `server` | API, auth, sockets, webhooks | Exposes health checks and endpoints |
| `worker` | BullMQ background workers    | Consumes queue jobs                 |
| `corn`   | Scheduled jobs               | Long-running scheduler process      |

## 10. Health Check

The API endpoint for health verification is:

```http
GET /health
```

Expected response:

- HTTP `200`
- JSON payload containing `success: true`

## 11. Troubleshooting

### Docker build or startup issues

```bash
docker compose down
docker compose up --build
```

### Schema files not appearing in runtime services

Run:

```bash
pnpm run sync:schema
```

### Environment values are missing

Make sure the service-level `.env` files exist and are correctly populated:

- `server/.env`
- `worker/.env`
- `corn/.env`

## 12. Contribution Guidelines

- Keep service-specific logic inside the relevant service folder.
- Do not add root-level runtime environment files.
- Update documentation whenever scripts or workflows change.
- Prefer Docker-based validation for cross-service behavior.
