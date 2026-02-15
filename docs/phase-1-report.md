# Phase 1 — Rapport : Setup Monorepo & Infrastructure

> Date : 15/02/2026
> Statut : TERMINE

---

## Objectif

Mettre en place l'architecture complete du monorepo BigTank avec tous les packages partages, les squelettes de services NestJS, le frontend Next.js, le schema de base de donnees, et l'infrastructure Docker de developpement.

---

## Travail realise

### 1. Monorepo (Turborepo + pnpm)

- **Root** : package.json, turbo.json, pnpm-workspace.yaml, .npmrc
- **Workspaces** : `apps/*` (8 apps) + `packages/*` (4 packages)
- Scripts Turborepo : `dev`, `build`, `lint`, `clean`
- Scripts racine : `docker:up`, `docker:down`, `db:generate`, `db:push`, `db:seed`

### 2. Packages partages

| Package | Contenu |
|---|---|
| `shared-config` | TSConfig (base, NestJS, Next.js), ESLint, Prettier |
| `shared-types` | Toutes les interfaces TypeScript (User, Listing, Offer, Transaction, Chat, Notification) + enums |
| `shared-utils` | Calcul commission, formatage FCFA, formatage telephone SN, regions du Senegal, constantes |
| `database` | Schema Prisma (12 modeles), client singleton, seed de test |

### 3. Applications (squelettes)

| App | Port | Description |
|---|---|---|
| `web` | 3000 | Next.js 14 App Router, layout francais, page d'accueil |
| `api-gateway` | 4000 | NestJS, Helmet, CORS, ThrottlerModule (rate limiting), ValidationPipe |
| `auth-service` | 4001 | NestJS, deps bcrypt/passport/JWT installees |
| `listing-service` | 4002 | NestJS, squelette basique |
| `chat-service` | 4003 | NestJS, deps Socket.io/WebSocket installees |
| `payment-service` | 4004 | NestJS, dep axios pour appels PayDunya/PayTech |
| `notification-service` | 4005 | NestJS, deps mailer/nodemailer installees |
| `search-service` | 4006 | NestJS, dep meilisearch client installee |

### 4. Base de donnees (Prisma)

- **12 modeles** : User, SellerStats, RefreshToken, Listing, ListingImage, Offer, Transaction, Conversation, Message, Notification, Review, AuditLog
- **Enums** : UserRole, ListingCondition, ListingStatus, OfferStatus, TransactionStatus, PaymentMethod, PaymentProvider, NotificationType, NotificationChannel
- **Index** optimises pour les requetes frequentes
- **Seed** : 3 utilisateurs (admin, vendeur, acheteur) + 3 annonces de test
- Schema pousse vers PostgreSQL avec succes

### 5. Infrastructure Docker

| Service | Port | Image |
|---|---|---|
| PostgreSQL 16 | 5433 | postgres:16-alpine |
| Redis 7 | 6379 | redis:7-alpine |
| Meilisearch | 7700 | getmeili/meilisearch:v1.6 |
| MinIO (S3) | 9000/9001 | minio/minio:latest |

Tous les services sont healthy et operationnels.

---

## Problemes rencontres et solutions

| Probleme | Cause | Solution |
|---|---|---|
| `@nestjs/config@^10.0.0` introuvable | NestJS v11 utilise un nouveau versioning | Mise a jour vers `@nestjs/config@^4.0.0` dans les 7 services |
| pnpm bloque les scripts postinstall | Securite pnpm v10 | Ajout `pnpm.onlyBuiltDependencies` dans root package.json |
| `npx prisma` installe Prisma v7 | npx prend la derniere version | Utilisation de `pnpm --filter @bigtank/database generate` |
| Port 5432 deja occupe | PostgreSQL local actif | Mapping Docker change en `5433:5432` |
| Prisma ne trouve pas DATABASE_URL | .env a la racine, Prisma dans packages/database | Ajout `dotenv-cli` avec prefix `dotenv -e ../../.env --` |
| Auth PostgreSQL echoue | Volume recreer sans reinit mot de passe | `docker restart` + `ALTER USER` |

---

## Fichiers cles

```
bigtank/
├── .env                              # Variables d'environnement (port 5433)
├── package.json                      # Monorepo root
├── turbo.json                        # Config Turborepo
├── pnpm-workspace.yaml               # Workspaces pnpm
├── apps/
│   ├── web/                          # Next.js frontend
│   ├── api-gateway/                  # Point d'entree API
│   ├── auth-service/                 # Authentification
│   ├── listing-service/              # Annonces
│   ├── chat-service/                 # Messagerie temps reel
│   ├── payment-service/              # Paiements mobile money
│   ├── notification-service/         # Notifications
│   └── search-service/              # Recherche Meilisearch
├── packages/
│   ├── shared-config/                # Config partagee
│   ├── shared-types/                 # Types TypeScript
│   ├── shared-utils/                 # Utilitaires
│   └── database/                     # Prisma schema + client
├── docker/
│   └── docker-compose.dev.yml        # Services dev
└── docs/
    └── phase-1-report.md             # Ce rapport
```

---

## Separation Backend / Frontend

L'architecture choisie assure une separation claire :

- **Frontend** (`apps/web`) : Next.js autonome, communique uniquement via l'API Gateway (HTTP REST). Aucune dependance directe aux services backend.
- **Backend** (`apps/*-service`) : Chaque service est independant avec son propre port, ses propres routes, et sa propre logique metier.
- **API Gateway** (`apps/api-gateway`) : Point d'entree unique pour le frontend. Gere l'authentification, le rate limiting, et le routing vers les services.
- **Packages partages** : Les types (`shared-types`) sont la seule couche partagee entre frontend et backend, garantissant la coherence des interfaces sans couplage.

Cette architecture permet de :
- Deployer frontend et backend independamment
- Scaler chaque service separement
- Remplacer le frontend sans toucher au backend (et inversement)

---

## Prochaine etape

**Phase 2** : Implementation complete de `auth-service` (inscription, login, JWT access/refresh tokens, rotation, OTP telephone).
