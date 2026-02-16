# Phase 2.1 — Rapport : Securite Auth Service

> Date : 16/02/2026
> Statut : TERMINE

---

## Objectif

Renforcer la securite du service d'authentification suite a un audit CTO. 4 corrections critiques implementees et testees.

---

## Corrections implementees

### 1. Bcrypt 10 → 12 rounds

**Fichier** : `apps/auth-service/src/auth/auth.service.ts`

- Augmentation du cout de hachage de 10 a 12 salt rounds
- Renforce la resistance aux attaques brute-force sur les mots de passe
- Impact : temps de hash ~4x plus long (negligeable pour l'UX, significatif pour un attaquant)

### 2. Rate limiting login (Redis)

**Fichier cree** : `apps/auth-service/src/auth/login-rate-limit.service.ts`

| Parametre | Valeur |
|---|---|
| Tentatives max | 5 |
| Duree de blocage | 15 minutes |
| Stockage | Redis (cles `login:lock:{id}` et `login:attempts:{id}`) |
| Identifiant | emailOrPhone (cle unique par utilisateur) |

**Comportement** :
- Tentatives 1 a 5 : "Identifiants invalides" (401)
- Tentative 6+ : "Trop de tentatives. Reessayez dans X minutes." (429)
- Login reussi : reset du compteur
- TTL automatique : les cles Redis expirent apres 15 min

**Integration** : Injecte dans `AuthService.login()` — verifie `isLocked()` avant toute logique, appelle `recordFailedAttempt()` en cas d'echec, `resetAttempts()` en cas de succes.

### 3. Gateway JWT Middleware

**Fichier cree** : `apps/api-gateway/src/jwt-auth.middleware.ts`

**Principe** : Le gateway valide le JWT en amont et injecte les headers pour les services downstream.

```
Client → Gateway → JWT Middleware → Proxy → Auth Service
                   ↓
                   Decode JWT
                   Injecte x-user-id
                   Injecte x-user-role
```

- Si le token est valide : injecte `x-user-id` (payload.sub) et `x-user-role` (payload.role) dans les headers
- Si le token est invalide ou absent : laisse passer sans headers (le service downstream gere le 401)
- Middleware applique globalement via `consumer.apply(JwtAuthMiddleware).forRoutes('*')`

**Fichier modifie** : `apps/api-gateway/src/app.module.ts` — Implement `NestModule` avec le middleware

### 4. Audit Logs (table AuditLog)

**Fichier modifie** : `packages/database/prisma/schema.prisma`

Modifications du modele AuditLog :
- `userId` : `String` → `String?` (nullable, pour les tentatives de login echouees sans user)
- `details` : ajout du champ `String?` (description de l'action)
- Relation `user` : rendue optionnelle (`User?`)

**Actions tracees** :

| Action | Quand | Details |
|---|---|---|
| `REGISTER` | Inscription reussie | "Inscription via telephone/email" |
| `LOGIN_SUCCESS` | Login reussi | "Tentative login: {identifier} depuis {IP}" |
| `LOGIN_FAILED` | Login echoue | "Tentative login: {identifier} depuis {IP}" |
| `LOGOUT` | Deconnexion | "Deconnexion" |

---

## Correction proxy Gateway

**Fichier** : `apps/api-gateway/src/auth-proxy.controller.ts`

**Bug** : `req.url` contenait le chemin complet `/api/auth/me`, ce qui generait l'URL `http://localhost:4001/auth/api/auth/me`.

**Fix** : Utilisation de `req.originalUrl.replace(/^\/api\/auth/, '')` pour extraire uniquement le sous-chemin (`/me`, `/login`, etc.).

---

## Fichiers crees (2)

| Fichier | Role |
|---|---|
| `apps/auth-service/src/auth/login-rate-limit.service.ts` | Service rate limiting Redis |
| `apps/api-gateway/src/jwt-auth.middleware.ts` | Middleware validation JWT au gateway |

## Fichiers modifies (5)

| Fichier | Modification |
|---|---|
| `apps/auth-service/src/auth/auth.service.ts` | bcrypt 12, rate limiting, audit logs |
| `apps/auth-service/src/auth/auth.module.ts` | Ajout LoginRateLimitService |
| `apps/api-gateway/src/app.module.ts` | Ajout JwtAuthMiddleware global |
| `apps/api-gateway/src/auth-proxy.controller.ts` | Fix proxy URL path |
| `packages/database/prisma/schema.prisma` | AuditLog: userId nullable + details |

## Dependances ajoutees

| Package | Ou | Raison |
|---|---|---|
| `jsonwebtoken` | api-gateway | Verification JWT dans le middleware |
| `@types/jsonwebtoken` | api-gateway (dev) | Types TypeScript |

---

## Tests effectues

| Test | Resultat |
|---|---|
| Login direct (auth-service:4001) | OK — tokens + user retournes |
| Rate limiting — 5 tentatives echouees | OK — "Identifiants invalides" x5 |
| Rate limiting — 6eme tentative | OK — "Trop de tentatives. Reessayez dans 15 minutes." (429) |
| /auth/me avec JWT | OK — profil complet avec sellerStats |
| Login via Gateway (gateway:4000) | OK — proxy fonctionne |
| /auth/me via Gateway | OK — profil retourne correctement |
| Audit logs en DB | OK — LOGIN_SUCCESS, LOGIN_FAILED (x5) traces avec IP |
| Build complet (11 packages) | OK |

---

## Verification audit logs

```sql
SELECT id, user_id, action, details, created_at
FROM audit_logs ORDER BY created_at DESC LIMIT 10;

-- Resultat observe :
-- LOGIN_SUCCESS  | Tentative login: +221771234567 depuis ::ffff:127.0.0.1
-- LOGIN_FAILED   | Tentative login: +221771234567 depuis ::1  (x5)
-- LOGIN_SUCCESS  | Tentative login: +221771234567 depuis ::1
-- REGISTER       | (lors de l'inscription initiale)
```

---

## Resume securite Phase 2 complete

| Mesure | Statut |
|---|---|
| Bcrypt 12 rounds | Actif |
| Refresh tokens hashes (bcrypt) | Actif |
| Rotation des tokens | Actif |
| Rate limiting login (Redis, 5 tentatives / 15min) | Actif |
| Gateway JWT validation + injection headers | Actif |
| Audit logs (toutes actions auth) | Actif |
| Validation DTO (class-validator) | Actif |
| passwordHash jamais expose | Actif |
| Messages d'erreur en francais | Actif |

---

## Prochaine etape

**Phase 3** : Implementation du listing-service (CRUD annonces, upload images MinIO, recherche/filtres).
