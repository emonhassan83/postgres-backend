Date/Session: 2026-06-29 (PostgreSQL Read-Replica & Build Setup)

Completed Tasks:
- Set up a master-replica PostgreSQL architecture in `docker-compose.yaml`.
- Configured environment variables (.env) for `server`, `worker`, and `corn` packages to connect to PostgreSQL instead of MongoDB.
- Converted bash build script line endings to LF to ensure compatibility in Docker environments.
- Fully aligned TypeScript versions across the pnpm monorepo.
- Refactored `worker` to save notifications using Prisma Client instead of MongoDB.
- Created compatibility layers for legacy Mongoose schema imports in `server`.

Key Changes:
- [docker-compose.yaml](file:///d:/bd-calling/explores_tech/postgres-backend/docker-compose.yaml)
- [server/.env](file:///d:/bd-calling/explores_tech/postgres-backend/server/.env)
- [worker/.env](file:///d:/bd-calling/explores_tech/postgres-backend/worker/.env)
- [corn/.env](file:///d:/bd-calling/explores_tech/postgres-backend/corn/.env)
- [server/package.json](file:///d:/bd-calling/explores_tech/postgres-backend/server/package.json)
- [worker/package.json](file:///d:/bd-calling/explores_tech/postgres-backend/worker/package.json)
- [worker/src/app/workers/notification.worker.ts](file:///d:/bd-calling/explores_tech/postgres-backend/worker/src/app/workers/notification.worker.ts)
- [worker/src/app/configs/db.configs.ts](file:///d:/bd-calling/explores_tech/postgres-backend/worker/src/app/configs/db.configs.ts)
- [corn/src/app/configs/db.configs.ts](file:///d:/bd-calling/explores_tech/postgres-backend/corn/src/app/configs/db.configs.ts)

Pending/Next Steps:
- Deploy the Docker containers and verify streaming replication status.

==================================================

Date/Session: 2026-06-29 (Update)

Completed Tasks:
- Relocated the `prisma` folder from `schemas/prisma/` to the project root `prisma/` folder (`prisma/schema.prisma`).
- Completely removed the deprecated MongoDB/Mongoose `schemas` folder from the project root.
- Installed Prisma dependencies (`@prisma/client` and `prisma`) at the workspace root to ensure schema-relative client resolution.
- Updated root `package.json` and `server/package.json` to remove deprecated scripts and refer to `../prisma/schema.prisma`.
- Regenerated the Prisma Client successfully and verified that the server compiles cleanly.

Key Changes:
- [schema.prisma](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/prisma/schema.prisma)
- [package.json](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/package.json)
- [package.json](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/package.json)

Pending/Next Steps:
- Configure similar database connections or migrations for any auxiliary services.

==================================================

Date/Session: 2026-06-29

Completed Tasks:
- Successfully migrated the database system from MongoDB (Mongoose) to PostgreSQL (Prisma).
- Created a standard Prisma schema (`schemas/prisma/schema.prisma`) defining `User`, `Setting`, and `Notification` models, complete with enums and indices.
- Installed and configured Prisma Client inside the server package, generating the typescript types.
- Rewrote the database config, query builder (`QueryBuilder.ts`), global error handler, and socket error handler to use Prisma client and Postgres.
- Refactored user, auth, settings, and notification service and helper modules to query using Prisma Client instead of mongoose models.
- Updated `server/scripts/createModule.js` to generate the exact 8 file types: `.dto.ts`, `.types.ts`, `.controllers.ts`, `.services.ts`, `.middlewares.ts`, `.routes.ts`, `.interface.ts`, and `.validation.ts`.
- Removed `scripts/sync-schemas.js` sync script from workspace root and schemas package scripts.
- Updated `docker-compose.yaml` to run a PostgreSQL container (`postgres:15-alpine`) instead of MongoDB replica set, and updated environments to `DATABASE_URL`.

Key Changes:
- [schema.prisma](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/schemas/prisma/schema.prisma)
- [db.configs.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/configs/db.configs.ts)
- [prisma.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/configs/prisma.ts)
- [QueryBuilder.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/builder/QueryBuilder.ts)
- [user.services.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/modules/user/user.services.ts)
- [user.helpers.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/modules/user/user.helpers.ts)
- [auth.services.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/modules/auth/auth.services.ts)
- [auth.helpers.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/modules/auth/auth.helpers.ts)
- [settings.service.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/modules/settings/settings.service.ts)
- [notification.services.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/modules/notification/notification.services.ts)
- [globalError.middlewares.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/middlewares/globalError.middlewares.ts)
- [handleSocketError.ts](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/src/app/socket/utils/handleSocketError.ts)
- [createModule.js](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/server/scripts/createModule.js)
- [docker-compose.yaml](file:///c:/bdcalling/explore/monorepo-backend%20-%20Copy/docker-compose.yaml)

Pending/Next Steps:
- Apply similar database config and query migration for `worker` and `corn` services if they also need to be run with Postgres.
- Deploy the docker compose environment with Postgres and run Prisma database migrations.
