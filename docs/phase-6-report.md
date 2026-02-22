# Phase 6 — Panel Admin V1

> Date : 22/02/2026

---

## Objectif

Créer un panneau d'administration complet : service dédié (port 4007), routing gateway, protection middleware par rôle JWT, pages frontend avec gestion des utilisateurs (suspend/activate) et modération des annonces.

---

## Architecture retenue

```
Browser → /admin/*
  → Next.js middleware (check JWT role === ADMIN)
  → Next.js App Router Server Components
  → API calls → api-gateway:4000/api/admin/*
  → admin-service:4007/admin/*
  → PostgreSQL (via Prisma)
```

---

## Migration Prisma

**Problème** : BDD créée via `db:push` — pas d'historique migrations.

**Solution** :
1. Création du dossier `migrations/20260101000000_init/` avec le SQL capturé depuis la BDD existante (`prisma migrate diff --from-empty --to-url`)
2. `prisma migrate resolve --applied 20260101000000_init` → baseline marqué comme appliqué
3. `prisma migrate dev --name add_user_status` → génère et applique la migration

**Migration `20260222_add_user_status`** :
```sql
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

ALTER TABLE "users"
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "suspended_at" TIMESTAMP(3),
  ADD COLUMN "suspended_reason" TEXT;
```

---

## Bugs corrigés

### TypeScript socket-provider.tsx
`user` est potentiellement `null` dans `socket.on('new_message', ...)` — corrigé avec `user?.id`.

---

## Fichiers créés (17)

### Backend

| Fichier | Rôle |
|---|---|
| `apps/admin-service/package.json` | Service NestJS port 4007 |
| `apps/admin-service/tsconfig.json` | TypeScript config |
| `apps/admin-service/nest-cli.json` | NestJS CLI config |
| `apps/admin-service/src/main.ts` | Bootstrap port 4007 |
| `apps/admin-service/src/app.module.ts` | AppModule |
| `apps/admin-service/src/health.controller.ts` | GET /health |
| `apps/admin-service/src/database/database.module.ts` | Global PRISMA provider |
| `apps/admin-service/src/common/filters/http-exception.filter.ts` | Format erreurs |
| `apps/admin-service/src/common/interceptors/transform.interceptor.ts` | Wrap { success, data } |
| `apps/admin-service/src/admin/admin.module.ts` | AdminModule |
| `apps/admin-service/src/admin/admin.service.ts` | Logique : stats, users, listings, audit |
| `apps/admin-service/src/admin/admin.controller.ts` | Routes admin (rôle vérifié via x-user-role header) |

### Gateway

| Fichier | Rôle |
|---|---|
| `apps/api-gateway/src/admin-proxy.controller.ts` | Proxy `/api/admin/*` → admin-service:4007 |

### Frontend

| Fichier | Rôle |
|---|---|
| `apps/web/src/app/admin/layout.tsx` | Layout sidebar admin |
| `apps/web/src/app/admin/page.tsx` | Dashboard stats (6 cards) |
| `apps/web/src/app/admin/users/page.tsx` | Table utilisateurs + filtres + pagination |
| `apps/web/src/app/admin/listings/page.tsx` | Table annonces + filtres + pagination |
| `apps/web/src/components/admin/user-actions.tsx` | Client: Suspendre (dialog + raison) / Réactiver |
| `apps/web/src/components/admin/listing-delete-action.tsx` | Client: Supprimer annonce (dialog confirm) |
| `apps/web/src/app/api/admin/users/[id]/suspend/route.ts` | PATCH proxy → gateway |
| `apps/web/src/app/api/admin/users/[id]/activate/route.ts` | PATCH proxy → gateway |
| `apps/web/src/app/api/admin/listings/[id]/route.ts` | DELETE proxy → gateway |

## Fichiers modifiés (5)

| Fichier | Modification |
|---|---|
| `packages/database/prisma/schema.prisma` | Enum UserStatus + 3 colonnes User |
| `apps/api-gateway/src/app.module.ts` | Import + enregistrement AdminProxyController |
| `apps/web/src/middleware.ts` | Protection `/admin/*` : check JWT role ADMIN |
| `apps/web/src/lib/api.ts` | Types admin + getAdminStats/Users/Listings |
| `apps/web/src/components/providers/socket-provider.tsx` | Fix TS `user?.id` |

---

## Endpoints admin-service

| Méthode | Route | Description |
|---|---|---|
| GET | /admin/stats | Totaux users/listings |
| GET | /admin/users | Liste paginée + filtres (search, role, status) |
| GET | /admin/users/:id | Détail utilisateur |
| PATCH | /admin/users/:id/suspend | Suspendre (body: { reason }) |
| PATCH | /admin/users/:id/activate | Réactiver |
| GET | /admin/listings | Liste paginée + filtres (search, status) |
| DELETE | /admin/listings/:id | Soft delete (status → DELETED) |
| GET | /admin/audit-logs | Historique actions admin |

**Sécurité** : toutes les routes vérifient `x-user-role === 'ADMIN'` (header injecté par le gateway JWT middleware). Un admin ne peut pas se suspendre lui-même ni suspendre un autre admin.

---

## Pages frontend

| Route | Description |
|---|---|
| `/admin` | Dashboard : 6 stat cards + indicateurs (taux vendeurs, taux vente...) |
| `/admin/users` | Table + filtres rôle/statut + suspend/activate inline |
| `/admin/listings` | Table + filtres statut + delete avec confirm dialog |

**Middleware** : `/admin/*` nécessite rôle ADMIN dans le JWT. Redirige vers `/login` si non connecté, vers `/dashboard` si connecté sans rôle ADMIN.

---

## Règles rappelées

- Ne pas commiter sans demande explicite
- Un rapport par session
- Prisma : `db:migrate` (pas `db:push`) — baseline créé pour les futures migrations

---

## Prochaine étape suggérée

- Ajouter un compte admin de test (seed Prisma)
- Notification par email à l'utilisateur suspendu
- Page `/admin/audit-logs` frontend
- Statistiques graphiques (recharts)
