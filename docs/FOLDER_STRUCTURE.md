# Workspace Layout & Folder Structure

This document outlines the organization of codebases, schemas, queues, and configuration files across the monorepo.

---

## 1. Monorepo Root Directory Layout

```text
.
├── docker-compose.yaml      # Multi-container orchestration config
├── package.json             # Root monorepo workspace dependencies
├── pnpm-workspace.yaml      # Workspace packages definitions
├── schemas/                 # Shared schema definitions (source-of-truth)
├── server/                  # Express API Server package
├── worker/                  # BullMQ background task workers
├── corn/                    # Cron jobs / Scheduler package
├── nodemailer/              # Local mail-sending container service
├── scripts/                 # Shared shell and build operations
├── docs/                    # Central developer documentation system
└── README.md                # Main onboarding documentation
```

---

## 2. Server Application Structure

The API application lives inside [server/src](file:///c:/bdcalling/explore/postgress-backend/server/src):

```text
server/src/
├── app.ts                  # App initialisation and configuration
├── server.ts               # Server startup listener
└── app/
    ├── @types/             # TS Declaration and system namespaces
    ├── configs/            # System services configurations (CORS, Redis, Mongoose)
    ├── constant/           # Shared server constants
    ├── core/               # Deep core mechanisms
    ├── errors/             # Custom Error classes and mapping helpers
    ├── middlewares/        # Express routing middlewares (Auth, Tracing)
    ├── modules/            # Domain Modules (Auth, Users, Notifications)
    ├── queues/             # BullMQ queue instantiations
    ├── redis/              # Redis client caching helpers
    ├── routes/             # Versioned Express router indexes
    ├── schemas/            # Generated Mongoose models (git-ignored)
    ├── socket/             # Socket.IO handlers
    └── utils/              # General helper methods
```

---

## 3. Schema Package & Scaffolding

Shared types, contracts, and Mongoose files are defined under `schemas/`:

```text
schemas/
├── package.json
├── tsconfig.json
├── utils/                  # Schema build and compilation utilities
└── modules/                # Domain-specific collections
    ├── user/               # User model collection definitions
    │   ├── user.constant.ts
    │   ├── user.interface.ts
    │   └── user.model.ts
    └── auth/               # Shared authentication models
```

---

## 4. Module Directory Structure

Features are isolated inside domain folders inside `server/src/app/modules/<module>`:

```text
auth/
├── auth.controllers.ts     # Express controller actions
├── auth.services.ts        # Business logic and database access
├── auth.routes.ts          # Express router configuration
├── auth.validators.ts      # Input validator schemas (Zod)
├── auth.interface.ts       # Module interfaces
└── auth.helpers.ts         # Module helpers
```
Each file name follows the format `<module-name>.<type>.ts` for clear separation of concerns.
