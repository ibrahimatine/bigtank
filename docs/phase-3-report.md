# Phase 3 — Rapport : Listing Service

> Date : 16/02/2026
> Statut : TERMINE

---

## Objectif

Implementer le service d'annonces complet : CRUD securise avec ownership, upload images via presigned URLs MinIO, recherche Meilisearch avec filtres, slugs SEO, et securite (XSS, rate limiting, validation).

---

## Travail realise

### 1. Fichiers crees (21 fichiers)

**Infrastructure commune :**
- `listing-service/src/database/database.module.ts` — Module global PRISMA + REDIS
- `listing-service/src/common/filters/http-exception.filter.ts` — Erreurs en francais
- `listing-service/src/common/interceptors/transform.interceptor.ts` — Wrap {success, data}
- `listing-service/src/common/guards/gateway-auth.guard.ts` — Auth via headers x-user-id/x-user-role
- `listing-service/src/common/guards/roles.guard.ts` — Guard roles (SELLER, ADMIN)
- `listing-service/src/common/decorators/current-user.decorator.ts` — @CurrentUser()
- `listing-service/src/common/decorators/roles.decorator.ts` — @Roles()

**Utilitaires :**
- `listing-service/src/common/utils/slug.util.ts` — Slug SEO : `{brand}-{model}-{size}-{city}-{nanoid8}`
- `listing-service/src/common/utils/sanitize.util.ts` — Protection XSS (sanitize-html, zero tags)
- `listing-service/src/common/services/rate-limit.service.ts` — Max 5 creations/heure par vendeur (Redis)

**DTOs :**
- `listing-service/src/listing/dto/create-listing.dto.ts` — Validation complete (titre, prix, taille, region)
- `listing-service/src/listing/dto/update-listing.dto.ts` — PartialType de create
- `listing-service/src/listing/dto/update-status.dto.ts` — Enum ListingStatus
- `listing-service/src/listing/dto/listing-filters.dto.ts` — Query params recherche

**Images (MinIO) :**
- `listing-service/src/image/image.module.ts` — Module image
- `listing-service/src/image/image.service.ts` — Presigned URL, confirm, delete via @aws-sdk/client-s3
- `listing-service/src/image/dto/presign-request.dto.ts` — fileName + contentType
- `listing-service/src/image/dto/confirm-image.dto.ts` — key + order + width + height

**Recherche (Meilisearch) :**
- `listing-service/src/search/search.module.ts` — Module search
- `listing-service/src/search/search.service.ts` — Index/remove/search avec filtres + tri

**Logique metier :**
- `listing-service/src/listing/listing.module.ts` — Module principal
- `listing-service/src/listing/listing.service.ts` — CRUD + ownership + slug + sanitize + indexation
- `listing-service/src/listing/listing.controller.ts` — 10 endpoints REST

**API Gateway :**
- `api-gateway/src/listing-proxy.controller.ts` — Proxy /api/listings/* → listing-service:4002

### 2. Fichiers modifies

- `listing-service/src/app.module.ts` — Import DatabaseModule, ListingModule, filter, interceptor
- `api-gateway/src/app.module.ts` — Ajout ListingProxyController
- `packages/database/prisma/schema.prisma` — Ajout champ `slug` unique sur Listing

---

## Architecture listing-service

```
apps/listing-service/src/
├── main.ts
├── app.module.ts
├── health.controller.ts
├── database/
│   └── database.module.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── guards/
│   │   ├── gateway-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── utils/
│   │   ├── slug.util.ts
│   │   └── sanitize.util.ts
│   └── services/
│       └── rate-limit.service.ts
├── image/
│   ├── image.module.ts
│   ├── image.service.ts
│   └── dto/
│       ├── presign-request.dto.ts
│       └── confirm-image.dto.ts
├── search/
│   ├── search.module.ts
│   └── search.service.ts
└── listing/
    ├── listing.module.ts
    ├── listing.service.ts
    ├── listing.controller.ts
    └── dto/
        ├── create-listing.dto.ts
        ├── update-listing.dto.ts
        ├── update-status.dto.ts
        └── listing-filters.dto.ts
```

---

## Endpoints implementes (10 routes)

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /listings/search | Non | Recherche Meilisearch avec filtres |
| GET | /listings/my | Oui | Mes annonces (vendeur) |
| GET | /listings/:slug | Non | Detail annonce par slug SEO |
| POST | /listings | Oui (SELLER) | Creer une annonce |
| PATCH | /listings/:id | Oui (owner) | Modifier une annonce |
| PATCH | /listings/:id/status | Oui (owner) | Changer le statut |
| DELETE | /listings/:id | Oui (owner/admin) | Soft delete |
| POST | /listings/:id/images/presign | Oui (owner) | Generer URL d'upload presignee |
| POST | /listings/:id/images/confirm | Oui (owner) | Confirmer image uploadee |
| DELETE | /listings/:id/images/:imageId | Oui (owner) | Supprimer une image |

Tous accessibles via le gateway : `http://localhost:4000/api/listings/*`

---

## Logique cle

### CRUD securise
- **Create** : SELLER uniquement, rate limit (5/heure), sanitize description, genere slug SEO, index Meilisearch
- **Read by slug** : Public, incremente viewsCount (fire-and-forget)
- **Update** : Ownership check (sellerId === userId), regenere slug si brand/model/size/city change
- **Status** : Transitions validees (ACTIVE→RESERVED, ACTIVE→SOLD, RESERVED→ACTIVE, RESERVED→SOLD)
- **Delete** : Soft delete (status=DELETED, deletedAt, deletedBy), owner ou ADMIN

### Upload images (presigned URL flow)
1. Frontend appelle POST /listings/:id/images/presign → recoit {uploadUrl, key}
2. Frontend upload direct vers MinIO via uploadUrl (PUT)
3. Frontend appelle POST /listings/:id/images/confirm → backend verifie HeadObject, stocke metadata
- Max 5 images par annonce
- Types acceptes : JPEG, PNG, WebP
- URL presignee expire en 5 minutes

### Meilisearch
- Index "listings" avec primaryKey "id"
- Searchable : title, brand, model, description, color
- Filterable : brand, sizeEu, condition, color, locationRegion, locationCity, status, priceXof
- Sortable : priceXof, createdAt, viewsCount
- Indexation async a chaque create/update, suppression a chaque delete

### Slug SEO
- Format : `{brand}-{model}-{sizeEu}-{city}-{nanoid8}`
- Exemple : `nike-air-max-90-46-dakar-N-WgS2Di`
- slugify avec locale 'fr', contrainte @unique en DB

### Auth via Gateway headers
- Pas de Passport/JWT dans le listing-service
- GatewayAuthGuard lit x-user-id et x-user-role injectes par le gateway
- Simplifie l'architecture microservice

---

## Securite

| Mesure | Implementation |
|--------|---------------|
| Ownership check | sellerId === userId sur update/delete/images |
| Role SELLER requis | Guard @Roles('SELLER', 'ADMIN') sur creation |
| Rate limit creation | 5 annonces/heure par vendeur (Redis) |
| XSS description | sanitize-html (zero tags HTML autorises) |
| Max 5 images | Verifie en DB avant presign et confirm |
| Validation DTO | class-validator strict sur tous les champs |
| Soft delete | status DELETED + deletedAt + deletedBy |
| Transitions status | Seules transitions valides autorisees |

---

## Tests effectues

| Test | Resultat |
|------|----------|
| Create listing (SELLER) | OK — slug SEO genere |
| Create 2eme listing | OK |
| Get by slug (public) | OK — listing + seller info |
| Get my listings | OK — pagination cursor |
| Update listing (prix) | OK |
| Update status (RESERVED) | OK |
| Ownership protection (mauvais user) | OK — "Vous ne pouvez modifier que vos propres annonces" |
| Auth guard (pas de headers) | OK — "Authentification requise" |
| Role guard (USER != SELLER) | OK — "Forbidden resource" |
| Meilisearch search "puma" | OK — 1 resultat |
| Meilisearch filter sizeEu>=47 | OK |
| Meilisearch filter priceMax=30000 | OK |
| Presigned URL MinIO | OK — URL signee generee |
| Soft delete | OK — status=DELETED, deletedAt rempli |
| Deleted listing → 404 | OK — "Annonce non trouvee" |
| Gateway search /api/listings/search | OK |
| Gateway slug /api/listings/:slug | OK |
| Gateway my listings /api/listings/my | OK (avec JWT) |
| Build 11/11 | OK |

---

## Dependances ajoutees

**listing-service :**
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` — Upload MinIO
- `meilisearch` — Indexation et recherche
- `sanitize-html`, `@types/sanitize-html` — Protection XSS
- `slugify` — Generation slugs SEO
- `nanoid@3` — IDs courts (v3 CJS compatible)
- `ioredis` — Rate limiting Redis
- `class-validator`, `class-transformer` — Validation DTO
- `@nestjs/mapped-types` — PartialType pour UpdateDTO
- `@prisma/client` — ORM
- `@types/express`, `@types/node` — Types dev

---

## Prochaine etape

**Phase 4** : A definir selon le context.md (search-service, web frontend, ou chat-service).
