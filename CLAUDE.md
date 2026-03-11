# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Samadal is a marketplace for large-size shoes (EU 46+ / US 12+) based in Senegal. Currency is FCFA (XOF) only. Language is French only. Microservices architecture with NestJS backend, Next.js frontend, managed as a pnpm monorepo with Turborepo.

## Common Commands

```bash
# Install dependencies
pnpm install

# Start all services (dev mode via Turborepo)
pnpm dev

# Start Docker infrastructure (PostgreSQL, Redis, Meilisearch, MinIO)
pnpm docker:up
pnpm docker:down

# Database operations (Prisma)
pnpm db:migrate        # Apply migrations
pnpm db:generate       # Generate Prisma client
pnpm db:seed           # Seed test data
pnpm db:studio         # Open Prisma Studio (localhost:5555)
pnpm db:push           # Push schema without migration

# Build & lint
pnpm build
pnpm lint
pnpm format            # Prettier
pnpm format:check

# Run a single service in dev
pnpm --filter auth-service dev
pnpm --filter @samadal/web dev

# Production: build then start services
pnpm build
./start-services.sh    # Starts all built services via nohup
```

## Architecture

```
Client (Next.js :3000)
  │
API Gateway (:4000)  ── JWT validation, rate limiting (100 req/60s), proxying
  ├── Auth Service     (:4001)  ── registration, login, JWT tokens, roles
  ├── Listing Service  (:4002)  ── CRUD listings, S3 images, Meilisearch sync
  ├── Chat Service     (:4003)  ── real-time messaging (Socket.io WebSocket)
  ├── Payment Service  (:4004)  ── PayTech/PayDunya/Naboopay (mobile money)
  ├── Notification Svc (:4005)  ── email, SMS, push notifications
  ├── Search Service   (:4006)  ── Meilisearch indexing
  └── Admin Service    (:4007)  ── admin panel (ADMIN role only)
```

The **API Gateway** proxies all requests under `/api/` to downstream services. Its `JwtAuthMiddleware` decodes JWT Bearer tokens and injects `x-user-id` and `x-user-role` headers for downstream services. Routes:
- `/api/auth/*` → Auth Service
- `/api/listings/*` → Listing Service
- `/api/chat/*` → Chat Service
- `/api/payment/*` → Payment Service
- `/api/admin/*` → Admin Service
- `/api/notifications/*` → Notification Service
- `/api/users/*` → User Proxy (Auth Service)

## Monorepo Structure

**apps/** - Each NestJS service follows the same pattern:
- `src/main.ts` - Bootstrap with port from env
- `src/app.module.ts` - Root module
- `src/<domain>/` - Domain module with controller, service, DTOs, guards
- `src/common/` - Shared filters, interceptors, validators
- `src/database/` - Prisma module (injected)

**packages/**:
- `database/` - Single Prisma schema (`prisma/schema.prisma`) shared by all services. All DB models here.
- `shared-types/` - TypeScript interfaces (User, Listing, Offer, Transaction, Chat, Notification). Import as `@samadal/shared-types`.
- `shared-utils/` - Commission calculation, FCFA formatting, Senegal regions. Import as `@samadal/shared-utils`.
- `shared-config/` - Base tsconfig, ESLint config, Prettier config. Import as `@samadal/shared-config`.

## Key Technical Details

- **TypeScript strict** mode everywhere, with experimental decorators (NestJS requirement)
- **Prisma 6** ORM — schema in `packages/database/prisma/schema.prisma`. Run `pnpm db:generate` after schema changes.
- **Validation**: class-validator + class-transformer on backend DTOs, Zod on frontend
- **Auth**: JWT access token (15min) + refresh token (7 days), bcrypt 12 rounds. Roles: USER, SELLER, ADMIN
- **Images**: MinIO (dev) / S3 (prod) with presigned upload URLs
- **Real-time**: Socket.io on chat-service, authenticated via token in query params
- **Search**: Meilisearch for listings full-text search
- **Commission model**: 1st sale free per seller, then 100 FCFA per sale
- **Phone numbers**: Senegal format, multiple formats accepted (77XXXXXXX, +221XXXXXXXXX, etc.)
- **No tests** currently in the codebase

## Docker Infrastructure (dev)

| Service      | Port  |
|-------------|-------|
| PostgreSQL  | 5433  |
| Redis       | 6379  |
| Meilisearch | 7700  |
| MinIO API   | 9000  |
| MinIO Console | 9001 |

Config: `docker/docker-compose.dev.yml`

## NestJS Service Pattern

Each backend service follows this structure:
```
src/
├── <domain>/
│   ├── dto/            # Request/response DTOs with class-validator decorators
│   ├── guards/         # JWT guard, Roles guard
│   ├── strategies/     # Passport JWT strategy (auth-service)
│   ├── decorators/     # @Roles(), @CurrentUser()
│   ├── <domain>.controller.ts
│   ├── <domain>.service.ts
│   └── <domain>.module.ts
├── common/
│   ├── validators/     # Custom validators (e.g. Senegal phone)
│   ├── filters/        # Exception filters
│   └── interceptors/   # Response transformation
├── database/           # PrismaModule + PrismaService
├── app.module.ts
└── main.ts
```

## Frontend (apps/web)

Next.js 14 with App Router. Tailwind CSS 4 + Radix UI components. The web app transpiles `@samadal/shared-types` and `@samadal/shared-utils`. All API calls go through the gateway at `localhost:4000/api/`.

Key routes: `/` (landing), `/search` (with filters), `/shoes/[slug]` (SSR detail), `/dashboard` (seller), `/chat` (real-time), `/admin` (admin panel).
