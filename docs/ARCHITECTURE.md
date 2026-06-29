# Postgress Backend - System Architecture

This document describes the layered architecture and asynchronous service data flows of the postgress-backend project.

---

## 1. High-Level System Overview

The system consists of three main runnable applications, a shared schemas library, and dedicated services for caching and data storage:

```mermaid
graph TD
    Client[Client / Web / Mobile] -->|HTTPS / WSS| Server[server: Express API & Socket.IO]
    Server -->|Read / Write| MongoDB[(MongoDB Replica Set)]
    Server -->|Cache / Session| Redis[(Redis Client)]
    Server -->|Enqueue Job| BullMQ[(BullMQ Redis Queues)]
    
    Worker[worker: Queue Consumer] -->|Process Job| BullMQ
    Worker -->|Read / Write| MongoDB
    
    Corn[corn: Cron Scheduler] -->|Scheduled Job| MongoDB
    Corn -->|Enqueue / Run| BullMQ
    
    Schemas[schemas: Shared Definitions] -.->|pnpm sync:schema| Server
    Schemas -...->|pnpm sync:schema| Worker
    Schemas -...->|pnpm sync:schema| Corn
```

---

## 2. Layered Application Architecture (Server)

The Express application in `server/` utilizes a clean, decoupled **Layered Architecture** pattern:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Middleware as Middlewares (Auth / Trace / CORS)
    participant Validator as Zod Request Validator
    participant Controller as Express Controller
    participant Service as Business Service
    participant Model as Mongoose Model (Shared)
    participant DB as MongoDB

    Client->>Middleware: HTTP Request
    Middleware->>Validator: Pass checked request context
    Validator->>Controller: Route to controller if valid
    Controller->>Service: Call service function with sanitized payload
    Service->>Model: Execute queries / updates
    Model->>DB: Send query execution
    DB-->>Model: Return raw document data
    Model-->>Service: Return Mongoose Document / Hydrated Object
    Service-->>Controller: Return formatted response payload
    Controller-->>Client: Send response (via sendResponse helper)
```

### Key Architectural Layers

#### 1. Routing & Middleware Layer
- **Entrypoints**: Defined inside [server/src/app/routes](file:///c:/bdcalling/explore/postgress-backend/server/src/app/routes) (e.g., [v1/index.ts](file:///c:/bdcalling/explore/postgress-backend/server/src/app/routes/v1/index.ts)).
- **Middlewares**: Handles global concerns like request tracing via `trace.middlewares.ts`, CORS validation, multer file uploading, authentication checks using `auth.ts`, and centralized error catching using `globalError.middlewares.ts`.

#### 2. Request Validation Layer
- **Utility**: [validateRequest.ts](file:///c:/bdcalling/explore/postgress-backend/server/src/app/utils/validateRequest.ts).
- **Functionality**: Uses Zod validation schemas (defined per module in `<module>.validators.ts`) to validate the request body, parameters, query parameters, and cookies before passing execution to the controller.

#### 3. Controller Layer
- **Responsibility**: Orchestrates the API request and response cycle.
- **Rules**:
  - Should **not** contain business logic.
  - Extracts parameters and payload from the request.
  - Invokes services to perform operations.
  - Calls `sendResponse` helper to standardise Express JSON output.

#### 4. Service Layer
- **Responsibility**: Core business logic and rules.
- **Rules**:
  - Contains calculations, third-party integrations (S3, Stripe, Firebase, Nodemailer), and orchestrates model operations.
  - Interacts with Redis caching helpers.
  - Pushes background jobs into BullMQ queues (like email or notification queues).

#### 5. Data Access / Repository Layer (Mongoose Models)
- **Shared Schemas**: All Mongoose models, constants, and schema definitions are housed in the shared [schemas](file:///c:/bdcalling/explore/postgress-backend/schemas) directory to prevent duplication.
- **Output**: Synchronized into `server/src/app/schemas/` via the `pnpm run sync:schema` tool.

---

## 3. Asynchronous Task & Worker Flows

Heavy and long-running operations are deferred to background queue processes to keep HTTP request response times low.

### Queues Configuration
Defined in [queues.ts](file:///c:/bdcalling/explore/postgress-backend/server/src/app/queues/queues.ts):
- **Email Queue** (`email-queue`): Handles outbound transactional notifications.
- **Notification Queue** (`notification-queue`): Manages push notifications and real-time alerts.
- **System Queue** (`system-queue`): Processing administrative tasks or data synchronization.

### Event-Driven Flow
1. **Trigger**: User performs an action in the `server` requiring notification dispatch.
2. **Publish**: The `server` service calls `notification-queue` helper to add a job payload.
3. **Queue**: Redis holds the job transaction securely.
4. **Consume**: The `worker` service reads the job and runs the corresponding BullMQ job processor.
