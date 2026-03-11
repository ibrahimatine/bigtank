# Phase 2 — Rapport : Auth Service

> Date : 16/02/2026
> Statut : TERMINE

---

## Objectif

Implementer le service d'authentification complet : inscription, connexion, gestion JWT avec refresh tokens, gestion des roles, et proxy API Gateway.

---

## Travail realise

### 1. Fichiers crees (18 fichiers)

**Infrastructure commune :**
- `auth-service/src/database/database.module.ts` — Module global Prisma client
- `auth-service/src/common/validators/senegal-phone.validator.ts` — Validation +221XXXXXXXXX
- `auth-service/src/common/filters/http-exception.filter.ts` — Erreurs en francais, format ApiResponse
- `auth-service/src/common/interceptors/transform.interceptor.ts` — Wrap reponses en ApiResponse

**DTOs :**
- `auth-service/src/auth/dto/register.dto.ts` — Inscription (phone/email + password + name + city/region)
- `auth-service/src/auth/dto/login.dto.ts` — Login (emailOrPhone + password)
- `auth-service/src/auth/dto/refresh-token.dto.ts` — Refresh token

**JWT & Securite :**
- `auth-service/src/auth/strategies/jwt.strategy.ts` — Passport JWT (Bearer token)
- `auth-service/src/auth/guards/jwt-auth.guard.ts` — Guard authentification
- `auth-service/src/auth/guards/roles.guard.ts` — Guard roles (USER/SELLER/ADMIN)
- `auth-service/src/auth/decorators/current-user.decorator.ts` — @CurrentUser()
- `auth-service/src/auth/decorators/roles.decorator.ts` — @Roles()

**Logique metier :**
- `auth-service/src/auth/auth.service.ts` — Register, login, refresh, logout
- `auth-service/src/auth/auth.controller.ts` — 6 endpoints REST
- `auth-service/src/auth/auth.module.ts` — Module NestJS auth
- `auth-service/src/user/user.service.ts` — Profil + upgrade vendeur
- `auth-service/src/user/user.controller.ts` — GET user par ID (admin)
- `auth-service/src/user/user.module.ts` — Module NestJS user

**API Gateway :**
- `api-gateway/src/auth-proxy.controller.ts` — Proxy HTTP /api/auth/* → auth-service:4001

### 2. Fichiers modifies

- `auth-service/src/app.module.ts` — Ajout DatabaseModule, AuthModule, UserModule, filter, interceptor
- `api-gateway/src/app.module.ts` — Ajout HttpModule + AuthProxyController
- `api-gateway/package.json` — Ajout @nestjs/axios + axios

### 3. Endpoints implementes

| Methode | Route | Auth | Description |
|---|---|---|---|
| POST | /auth/register | Non | Inscription (phone + password + name) |
| POST | /auth/login | Non | Connexion → accessToken + refreshToken |
| POST | /auth/refresh | Non | Renouveler le token (rotation) |
| POST | /auth/logout | Oui | Deconnexion (supprime refresh token) |
| GET | /auth/me | Oui | Profil utilisateur courant |
| POST | /auth/upgrade-to-seller | Oui | Devenir vendeur (cree SellerStats) |
| GET | /users/:id | Oui (ADMIN) | Consulter un profil |

Tous accessibles via le gateway : `http://localhost:4000/api/auth/*`

---

## Architecture auth-service

```
apps/auth-service/src/
├── main.ts
├── app.module.ts
├── health.controller.ts
├── database/
│   └── database.module.ts
├── common/
│   ├── validators/
│   │   └── senegal-phone.validator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── refresh-token.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       ├── current-user.decorator.ts
│       └── roles.decorator.ts
└── user/
    ├── user.module.ts
    ├── user.service.ts
    └── user.controller.ts
```

---

## Logique cle

- **Inscription** : Verifie unicite phone/email → hash bcrypt (10 rounds) → cree User
- **Login** : Trouve user par email ou phone → verifie password → genere JWT access (15min) + refresh (7d) → stocke refresh hashe en DB
- **Refresh** : Verifie signature JWT → compare hash en DB → rotation (supprime ancien, cree nouveau)
- **Logout** : Supprime le refresh token de la DB
- **Upgrade vendeur** : Update role USER → SELLER + cree SellerStats (commissionFreeRemaining: 1)
- **Validation telephone** : Regex `^\+221[0-9]{9}$`
- **Messages d'erreur** : Tous en francais

---

## Securite

- Mots de passe hashes avec bcrypt (10 salt rounds)
- Refresh tokens hashes avant stockage en DB
- Rotation des tokens (ancien invalide apres refresh)
- Access token court (15min), refresh token long (7d)
- Validation class-validator sur tous les DTOs
- passwordHash jamais expose dans les reponses
- Proxy gateway transmet les headers Authorization

---

## Tests manuels

```bash
# 1. Demarrer Docker + services
pnpm docker:up
pnpm --filter @samadal/auth-service dev
pnpm --filter @samadal/api-gateway dev   # (optionnel, pour tester le proxy)

# 2. Inscription
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "+221771234567", "password": "TestPass123", "name": "Moussa Diop", "region": "Dakar"}'

# 3. Login
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "+221771234567", "password": "TestPass123"}'

# 4. Profil (remplacer <token> par l'accessToken recu)
curl http://localhost:4001/auth/me \
  -H "Authorization: Bearer <token>"

# 5. Devenir vendeur
curl -X POST http://localhost:4001/auth/upgrade-to-seller \
  -H "Authorization: Bearer <token>"

# 6. Refresh token
curl -X POST http://localhost:4001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'

# 7. Logout
curl -X POST http://localhost:4001/auth/logout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'

# 8. Via API Gateway
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "+221771234567", "password": "TestPass123"}'
```

---

## Dependances ajoutees

- `class-validator`, `class-transformer`, `@prisma/client` dans auth-service
- `@types/express`, `@types/node` dans auth-service (devDependencies)
- `@nestjs/axios`, `axios` dans api-gateway

---

## Prochaine etape

**Phase 3** : Implementation du listing-service (CRUD annonces, upload images MinIO, recherche/filtres).
