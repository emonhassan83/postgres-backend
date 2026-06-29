# Nodemailer Service

The `nodemailer` service exposes a small HTTP API for sending emails through SMTP.

> [!WARNING]
> **This project is strictly Docker-centric.**
> Run the mail service through Docker Compose so it uses the same local workflow as the other backend services.

## Responsibilities

- accept email send requests
- send HTML emails through the configured SMTP account
- expose a lightweight health endpoint

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

- `build`: creates a production TypeScript build
- `start`: runs the compiled mail service
- `dev`: starts the service in development mode with nodemon
- `format`: formats the source code
- `lint`: checks for lint issues

## Environment

Create `nodemailer/.env` with:

```bash
PORT=3000
CORS_ORIGIN=*
NODEMAILLER_SMTP_HOST=smtp.gmail.com
NODEMAILLER_SMTP_PORT=587
NODEMAILLER_SMTP_SECURE=false
NODEMAILLER_HOST_MAIL=your-mail@example.com
NODEMAILLER_HOST_PASS=your-app-password
NODEMAILLER_FROM_MAIL=your-mail@example.com
```

## Development Notes

- Default port: `3000`
- For a full environment, start the stack from the repository root:

```bash
docker compose up --build
```

## Useful Commands

```bash
docker compose logs -f nodemailer
docker compose restart nodemailer
docker compose exec nodemailer sh
```

## Endpoints

```http
GET /health
```

Expected result:

- HTTP `200`
- JSON payload with `success: true`

```http
POST /
Content-Type: application/json
```

Body:

```json
{
  "to": "receiver@example.com",
  "subject": "Hello",
  "html": "<p>Hello from nodemailer</p>"
}
```
