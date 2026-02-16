# BigTank — Contexte Projet

> Derniere mise a jour : Phase 3 terminee (16/02/2026)

---

## Vision

**BigTank** est une marketplace specialisee dans la revente de chaussures grandes tailles (EU 46+ / US 12+), basee au Senegal.

Objectif : devenir la plateforme de reference en Afrique de l'Ouest pour les grandes pointures.

---

## Contexte Business

| Element | Detail |
|---|---|
| Localisation | Senegal (Afrique de l'Ouest) |
| Devise | FCFA (XOF) uniquement |
| Langue | Francais uniquement |
| Domaine | bigtank.com |
| Cible | Milliers d'utilisateurs au Senegal et Afrique de l'Ouest |
| Frais de port | Geres entre vendeur et acheteur (pas par la plateforme) |
| KYC vendeur | Non requis pour le moment |
| Moderation | Publication directe, suppression admin manuelle |

---

## Modele de Commission

- 1ere vente de chaque vendeur : **GRATUITE**
- A partir de la 2e vente : **100 FCFA** par vente reussie
- Table `seller_stats` pour tracker les ventes par vendeur

---

## Paiement — Solutions Locales (PAS DE STRIPE)

- Fournisseurs : **PayDunya**, **PayTech** ou **Naboopay**
- Methodes : Wave, Orange Money, Free Money, Carte bancaire
- Architecture abstraite (interface commune) pour changer de fournisseur facilement
- Flux : acheteur paie → plateforme retient (escrow) → confirmation reception → versement vendeur

---

## Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14+ (App Router, SSR, Server Actions) |
| Backend | NestJS 11 (microservices modulaires) |
| Base de donnees | PostgreSQL 16 (Prisma ORM v6) |
| Cache & Queues | Redis 7 |
| Temps reel | Socket.io + Redis adapter |
| Stockage images | MinIO (dev) / AWS S3 (prod) |
| Recherche | Meilisearch |
| Emails | Resend ou SendGrid |
| Push | Firebase Cloud Messaging |
| Monorepo | Turborepo + pnpm workspaces |
| CI/CD | GitHub Actions |
| Conteneurs | Docker + Docker Compose |
| Runtime | Node.js 20 LTS |
| Langage | TypeScript strict partout |

---

## Architecture Monorepo

```
bigtank/
├── apps/
│   ├── web/                  # Next.js frontend (port 3000)
│   ├── api-gateway/          # NestJS — point d'entree API (port 4000)
│   ├── auth-service/         # NestJS — authentification (port 4001)
│   ├── listing-service/      # NestJS — annonces (port 4002)
│   ├── chat-service/         # NestJS — messagerie (port 4003)
│   ├── payment-service/      # NestJS — paiements mobile money (port 4004)
│   ├── notification-service/ # NestJS — emails/push/SMS (port 4005)
│   └── search-service/       # NestJS — Meilisearch (port 4006)
├── packages/
│   ├── shared-config/        # TSConfig, ESLint, Prettier partages
│   ├── shared-types/         # Types TypeScript (User, Listing, Offer, etc.)
│   ├── shared-utils/         # Utilitaires (commission, format FCFA, regions SN)
│   └── database/             # Prisma schema + migrations + seed
├── docker/
│   └── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Schema Base de Donnees (10 tables)

| Table | Description |
|---|---|
| `users` | Utilisateurs (email, phone, role, city, region) |
| `seller_stats` | Stats vendeur (total ventes, commission gratuite restante) |
| `refresh_tokens` | Tokens de rafraichissement JWT |
| `listings` | Annonces (marque, modele, taille, prix FCFA, etat) |
| `listing_images` | Images des annonces (S3) |
| `offers` | Offres / contre-offres / negociation |
| `transactions` | Paiements (mobile money, escrow, commission) |
| `conversations` | Conversations chat par annonce |
| `messages` | Messages individuels |
| `notifications` | Notifications (in-app, email, SMS, push) |
| `reviews` | Avis apres transaction |
| `audit_logs` | Journal des actions auth + admin (userId nullable, details) |

---

## Services Docker (dev)

| Service | Port | Image |
|---|---|---|
| PostgreSQL 16 | **5433** (5432 occupe par PG local) | postgres:16-alpine |
| Redis 7 | 6379 | redis:7-alpine |
| Meilisearch | 7700 | getmeili/meilisearch:v1.6 |
| MinIO (S3) | 9000 (API) / 9001 (Console) | minio/minio:latest |

---

## Roles Utilisateurs

| Role | Permissions |
|---|---|
| `USER` | Acheter, faire des offres, chatter |
| `SELLER` | Tout USER + publier des annonces |
| `ADMIN` | Tout + supprimer annonces, voir audit logs |

---

## Securite

- JWT access token (15 min) + refresh token (7 jours)
- Rotation automatique des tokens
- Bcrypt 12 rounds pour les mots de passe + refresh tokens hashes
- Rate limiting login : 5 tentatives → blocage 15 min (Redis)
- Gateway JWT middleware : validation + injection x-user-id/x-user-role
- Audit logs : REGISTER, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT (avec IP)
- Validation inputs (class-validator backend, Zod frontend)
- Helmet.js, CORS strict, protection XSS/CSRF
- Logs structures (Winston/Pino)

---

## SEO (SEO-First)

- SSR avec Next.js App Router
- Metadata dynamique par page
- URLs semantiques : `/shoes/nike/size-46`
- JSON-LD (Product + Marketplace)
- Sitemap.xml dynamique
- OpenGraph optimise

---

## Avancement

| Phase | Contenu | Statut |
|---|---|---|
| Phase 1 | Setup monorepo, Prisma schema, Docker, squelettes services | TERMINE |
| Phase 2 | auth-service (inscription, login, JWT, refresh, roles, proxy gateway) | TERMINE |
| Phase 2.1 | Securite auth (bcrypt 12, rate limiting Redis, gateway JWT, audit logs) | TERMINE |
| Phase 3 | listing-service (CRUD, presigned upload MinIO, Meilisearch, slugs SEO, rate limit) | TERMINE |
| Phase 5 | search-service (Meilisearch, filtres, facettes) | A FAIRE |
| Phase 6 | web (pages Next.js : accueil, listing, profil, auth) | A FAIRE |
| Phase 7 | chat-service (WebSocket temps reel) | A FAIRE |
| Phase 8 | payment-service (PayDunya/PayTech, offres, escrow) | A FAIRE |
| Phase 9 | notification-service (emails, push, SMS) | A FAIRE |
| Phase 10 | Securite avancee, tests, CI/CD, Docker prod | A FAIRE |

---

## Valeurs Produit

- Simplicite
- Confiance
- Niche forte (grandes tailles)
- Performance
- Scalabilite
- Branding africain assume

---

> BigTank — Built for Bigger Steps
