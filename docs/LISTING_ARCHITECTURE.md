# Phase 3 — Plan d'implementation : Listing Service

> Date : 16/02/2026
> Statut : A IMPLEMENTER

---

## Architecture cible

Le listing-service (port 4002) est un microservice NestJS autonome. Il fait confiance aux headers `x-user-id` et `x-user-role` injectes par le gateway (pas de Passport/JWT en local).

---

## Flow creation d'annonce

```
Frontend                    Gateway (4000)              Listing Service (4002)       MinIO (9000)         Meilisearch (7700)
   |                            |                            |                         |                      |
   |-- POST /api/listings ----->|-- x-user-id/role --------->|                         |                      |
   |                            |                            |-- Validate DTO          |                      |
   |                            |                            |-- Rate limit check      |                      |
   |                            |                            |-- Sanitize description   |                      |
   |                            |                            |-- Generate slug          |                      |
   |                            |                            |-- Create in Prisma       |                      |
   |                            |                            |-- Index document ------->|--------------------->|
   |<-- { listing } ------------|<---------------------------|                         |                      |
   |                            |                            |                         |                      |
   |-- POST /presign ---------->|--------------------------->|-- Generate presigned --->|                      |
   |<-- { uploadUrl, key } -----|<---------------------------|                         |                      |
   |                            |                            |                         |                      |
   |-- PUT uploadUrl (image) ---|--------------------------------------------direct--->|                      |
   |                            |                            |                         |                      |
   |-- POST /confirm ---------->|--------------------------->|-- HeadObject verify ---->|                      |
   |                            |                            |-- Save metadata (DB)     |                      |
   |<-- { image } --------------|<---------------------------|                         |                      |
```

---

## Endpoints API (10 routes)

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

---

## Fichiers a creer (20 fichiers)

### Infrastructure commune
1. `listing-service/src/database/database.module.ts` — Module global PRISMA + REDIS
2. `listing-service/src/common/filters/http-exception.filter.ts` — Erreurs en francais
3. `listing-service/src/common/interceptors/transform.interceptor.ts` — Wrap {success, data}
4. `listing-service/src/common/guards/gateway-auth.guard.ts` — Auth via headers x-user-id/x-user-role
5. `listing-service/src/common/guards/roles.guard.ts` — Guard roles (SELLER, ADMIN)
6. `listing-service/src/common/decorators/current-user.decorator.ts` — @CurrentUser()
7. `listing-service/src/common/decorators/roles.decorator.ts` — @Roles()

### Utilitaires
8. `listing-service/src/common/utils/slug.util.ts` — Slug SEO : nike-air-max-46-dakar-{nanoid8}
9. `listing-service/src/common/utils/sanitize.util.ts` — XSS sanitize (sanitize-html, zero tags)

### Rate limiting
10. `listing-service/src/common/services/rate-limit.service.ts` — Max 5 creations/heure par vendeur (Redis)

### DTOs
11. `listing-service/src/listing/dto/create-listing.dto.ts` — Validation complete (taille, prix, region)
12. `listing-service/src/listing/dto/update-listing.dto.ts` — PartialType de create
13. `listing-service/src/listing/dto/update-status.dto.ts` — Enum ListingStatus
14. `listing-service/src/listing/dto/listing-filters.dto.ts` — Query params recherche

### Images (MinIO)
15. `listing-service/src/image/image.module.ts` — Module image
16. `listing-service/src/image/image.service.ts` — Presigned URL, confirm, delete via @aws-sdk/client-s3
17. `listing-service/src/image/dto/presign-request.dto.ts` — fileName + contentType
18. `listing-service/src/image/dto/confirm-image.dto.ts` — key + order + width + height

### Recherche (Meilisearch)
19. `listing-service/src/search/search.module.ts` — Module search
20. `listing-service/src/search/search.service.ts` — Index/remove/search avec filtres + tri

### Logique metier
21. `listing-service/src/listing/listing.module.ts` — Module principal
22. `listing-service/src/listing/listing.service.ts` — CRUD + ownership + slug + sanitize + indexation
23. `listing-service/src/listing/listing.controller.ts` — 10 endpoints REST

### API Gateway
24. `api-gateway/src/listing-proxy.controller.ts` — Proxy /api/listings/* → listing-service:4002

## Fichiers a modifier (3 fichiers)

1. `packages/database/prisma/schema.prisma` — Ajout champ `slug` unique sur Listing
2. `listing-service/src/app.module.ts` — Import modules + providers globaux
3. `api-gateway/src/app.module.ts` — Ajout ListingProxyController

---

## Dependencies a installer

**listing-service :**
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` — Upload MinIO
- `meilisearch` — Indexation et recherche
- `sanitize-html` — Protection XSS descriptions
- `slugify` — Generation slugs SEO
- `nanoid@3` — IDs courts (v3 = CJS compatible)
- `ioredis` — Rate limiting Redis
- `class-validator`, `class-transformer` — Validation DTO
- `@nestjs/mapped-types` — PartialType pour UpdateDTO
- `@types/sanitize-html` (dev)

---

## Securite

| Mesure | Implementation |
|--------|---------------|
| Ownership check | `listing.sellerId === user.id` sur update/delete/images |
| Role SELLER requis | Guard @Roles('SELLER', 'ADMIN') sur creation |
| Rate limit creation | 5 annonces/heure par vendeur (Redis) |
| XSS description | sanitize-html (zero tags autorises) |
| Max 5 images | Verifie en DB avant chaque confirm |
| Validation DTO | class-validator strict sur tous les champs |
| Soft delete | status DELETED + deletedAt + deletedBy (pas de suppression physique) |

---

## Schema slug SEO

Format : `{brand}-{model}-{sizeEu}-{city}-{nanoid8}`
Exemple : `nike-air-max-46-dakar-a3f8k2m1`

- Stocke en DB avec contrainte @unique
- Index Prisma pour lookup rapide
- slugify avec locale 'fr' pour accents

---

## Meilisearch — Configuration index

```
Index: "listings"
Searchable: title, brand, model, description, color
Filterable: brand, sizeEu, condition, color, locationRegion, locationCity, status, priceXof
Sortable: priceXof, createdAt, viewsCount
```

---

## Ordre d'implementation

1. Migration Prisma (slug)
2. Install dependencies
3. Infrastructure commune (database, filters, interceptors, guards, decorators)
4. Utilitaires (slug, sanitize)
5. Rate limit service
6. DTOs
7. Image module (MinIO)
8. Search module (Meilisearch)
9. Listing module (service + controller)
10. App module update
11. Gateway proxy
12. Build + test