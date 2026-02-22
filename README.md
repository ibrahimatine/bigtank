# BigTank

Marketplace de chaussures grandes tailles au Senegal. Architecture microservices avec NestJS, PostgreSQL, Redis, Meilisearch et Socket.io.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS 4, shadcn/ui |
| **Backend** | NestJS 11, Express 5, TypeScript |
| **Base de donnees** | PostgreSQL 16 (Prisma ORM v6) |
| **Cache** | Redis 7 |
| **Recherche** | Meilisearch v1.6 |
| **Stockage images** | MinIO (S3-compatible) |
| **Temps reel** | Socket.io 4.7 |
| **Auth** | JWT + Refresh Tokens, bcrypt |
| **Monorepo** | Turborepo + pnpm workspaces |

## Architecture

```
Client (Next.js :3000)
  |
API Gateway (:4000)  ──  JWT validation, rate limiting, routing
  ├── Auth Service     (:4001)  ──  inscription, login, tokens, roles
  ├── Listing Service  (:4002)  ──  CRUD annonces, images, recherche
  ├── Chat Service     (:4003)  ──  messagerie temps reel (WebSocket)
  ├── Payment Service  (:4004)  ──  paiements (en cours)
  ├── Notif Service    (:4005)  ──  notifications (en cours)
  ├── Search Service   (:4006)  ──  recherche avancee (en cours)
  └── Admin Service    (:4007)  ──  panel administration (ADMIN uniquement)
```

## Prerequis

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** et **Docker Compose**

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/<votre-username>/bigtank.git
cd bigtank
```

### 2. Installer les dependances

```bash
pnpm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Les valeurs par defaut dans `.env.example` fonctionnent directement en developpement.

### 4. Demarrer l'infrastructure Docker

```bash
pnpm docker:up
```

Cela lance 4 conteneurs :

| Service | Port | Interface |
|---------|------|-----------|
| PostgreSQL 16 | `5433` | - |
| Redis 7 | `6379` | - |
| Meilisearch | `7700` | http://localhost:7700 |
| MinIO | `9000` (API) / `9001` (console) | http://localhost:9001 |

Verifier que tout tourne :

```bash
docker ps
```

Les 4 conteneurs doivent etre `healthy`. Le conteneur `minio-setup` s'arrete apres avoir cree le bucket, c'est normal.

### 5. Initialiser la base de donnees

```bash
# Appliquer les migrations (cree les tables)
pnpm db:migrate

# Generer le client Prisma
pnpm db:generate

# Peupler avec des donnees de test
pnpm db:seed
```

### 6. Creer un compte administrateur

```bash
PGPASSWORD=bigtank_dev_2024 psql -h localhost -p 5433 -U bigtank bigtank -c "
INSERT INTO users (id, name, phone, password_hash, role, status, phone_verified, created_at, updated_at)
VALUES (
  'admin_bigtank_001',
  'Admin BigTank',
  '+221770000000',
  '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'ADMIN',
  'ACTIVE',
  true,
  NOW(),
  NOW()
);"
```

Identifiants : telephone `+221770000000` (ou `77 000 00 00`), mot de passe `password`.

### 7. Lancer tous les services

```bash
pnpm dev
```

Tous les microservices demarrent en parallele via Turborepo.

---

## Interface web — http://localhost:3000

### Comptes de test

| Role | Telephone | Mot de passe | Acces |
|------|-----------|--------------|-------|
| **ADMIN** | `77 000 00 00` | `password` | Panel admin `/admin` |
| SELLER | Cree via `/register` | — | Dashboard `/dashboard` |
| USER | Cree via `/register` | — | Profil, chat |

> Les comptes vendeurs/acheteurs se creent directement sur http://localhost:3000/register avec un telephone ou email.

### Parcours utilisateur typique

1. **S'inscrire** → http://localhost:3000/register
   - Email OU telephone uniquement (les deux ne sont pas obligatoires)
   - Mot de passe minimum 8 caracteres
2. **Devenir vendeur** → Profile → "Activer le mode vendeur"
3. **Publier une annonce** → Dashboard → "Nouvelle annonce"
4. **Contacter un vendeur** → Page annonce → "Contacter le vendeur"
5. **Messagerie** → http://localhost:3000/chat

### Panel Admin → http://localhost:3000/admin

Reserve au role ADMIN. Connexion → redirection automatique vers `/admin`.

| Page | Description |
|------|-------------|
| `/admin` | Tableau de bord : stats utilisateurs, annonces |
| `/admin/users` | Liste utilisateurs, filtres, suspendre / reactiver |
| `/admin/listings` | Liste annonces, filtres, supprimer |

---

## Tester les API

Toutes les requetes passent par l'API Gateway sur `http://localhost:4000/api/`.

### Verifier que le gateway fonctionne

```bash
curl http://localhost:4000/api/health
```

---

### Auth Service — Inscription / Connexion

#### Creer un compte (email ou telephone, pas les deux obligatoires)

```bash
# Avec email uniquement
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amadou Ba",
    "email": "amadou@exemple.com",
    "password": "MonMotDePasse123!"
  }'

# Avec telephone uniquement (format libre : 77XXXXXXX, +221XXXXXXXXX, 00221XXXXXXXXX)
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fatou Sall",
    "phone": "77 123 45 67",
    "password": "MonMotDePasse123!"
  }'
```

Reponse : un objet `user` avec `accessToken` et `refreshToken`.

#### Se connecter

```bash
# Avec email
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "amadou@exemple.com",
    "password": "MonMotDePasse123!"
  }'

# Avec telephone (tous les formats acceptes)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "77 123 45 67",
    "password": "MonMotDePasse123!"
  }'
```

> **Important :** Copiez le `accessToken` retourne. Il sera utilise dans toutes les requetes authentifiees. On l'appellera `TOKEN` dans la suite.

#### Voir son profil

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

#### Passer vendeur

```bash
curl -X POST http://localhost:4000/api/auth/upgrade-to-seller \
  -H "Authorization: Bearer TOKEN"
```

> Apres cette commande, reconnectez-vous pour obtenir un nouveau token avec le role `SELLER`.

#### Se deconnecter

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "VOTRE_REFRESH_TOKEN"}'
```

---

### Listing Service — Annonces

> Les operations de creation/modification necessitent le role **SELLER**.

#### Creer une annonce

```bash
curl -X POST http://localhost:4000/api/listings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nike Air Force 1 - Taille 47",
    "description": "Paire neuve, jamais portee. Coloris blanc classique.",
    "brand": "Nike",
    "model": "Air Force 1",
    "sizeEu": 47,
    "sizeUs": 13,
    "condition": "NEW",
    "color": "Blanc",
    "priceXof": 45000,
    "locationRegion": "Dakar"
  }'
```

#### Rechercher des annonces (public)

```bash
# Recherche textuelle
curl "http://localhost:4000/api/listings/search?q=nike"

# Avec filtres
curl "http://localhost:4000/api/listings/search?brand=Nike&minSize=46&maxPrice=50000&region=Dakar"
```

Filtres disponibles : `q`, `brand`, `condition`, `minSize`, `maxSize`, `minPrice`, `maxPrice`, `region`, `city`, `sortBy`, `limit`.

#### Mes annonces

```bash
curl http://localhost:4000/api/listings/my \
  -H "Authorization: Bearer TOKEN"
```

#### Changer le statut d'une annonce

```bash
curl -X PATCH http://localhost:4000/api/listings/LISTING_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "SOLD"}'
```

Statuts : `ACTIVE`, `SOLD`, `RESERVED`, `DELETED`.

---

### Chat Service — Messagerie temps reel

#### Demarrer une conversation

```bash
curl -X POST http://localhost:4000/api/chat/conversations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "ID_DE_LANNONCE",
    "message": "Bonjour, cette paire est-elle toujours disponible ?"
  }'
```

> Seul un acheteur (pas le vendeur de l'annonce) peut initier une conversation.

#### Lister ses conversations

```bash
curl http://localhost:4000/api/chat/conversations \
  -H "Authorization: Bearer TOKEN"
```

#### Messages non lus

```bash
curl http://localhost:4000/api/chat/unread-count \
  -H "Authorization: Bearer TOKEN"
```

#### Messagerie temps reel (WebSocket)

```javascript
const { io } = require("socket.io-client");

const socket = io("http://localhost:4003", {
  query: { token: "VOTRE_ACCESS_TOKEN" }
});

socket.on("connect", () => {
  socket.emit("join_conversation", { conversationId: "CONVERSATION_ID" });
  socket.emit("send_message", {
    conversationId: "CONVERSATION_ID",
    content: "Salut !"
  });
});

socket.on("new_message", (message) => {
  console.log("Nouveau message :", message);
});
```

---

### Admin Service — Panel d'administration

> Toutes les routes necessitent un token avec le role `ADMIN`.

#### Statistiques globales

```bash
curl http://localhost:4000/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Lister les utilisateurs

```bash
# Tous les utilisateurs
curl http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Avec filtres
curl "http://localhost:4000/api/admin/users?search=moussa&role=SELLER&status=ACTIVE&page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Suspendre un utilisateur

```bash
curl -X PATCH http://localhost:4000/api/admin/users/USER_ID/suspend \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Comportement frauduleux signale"}'
```

#### Reactiver un utilisateur

```bash
curl -X PATCH http://localhost:4000/api/admin/users/USER_ID/activate \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Supprimer une annonce (soft delete)

```bash
curl -X DELETE http://localhost:4000/api/admin/listings/LISTING_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Historique des actions admin

```bash
curl "http://localhost:4000/api/admin/audit-logs?page=1&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Scenario de test complet

### 1. Demarrer les services

```bash
pnpm docker:up
pnpm dev
```

### 2. Creer deux comptes (telephone uniquement)

```bash
# Vendeur
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Moussa Diop", "phone": "77 100 00 01", "password": "Vendeur123!"}'

# Acheteur
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Fatou Sall", "phone": "77 100 00 02", "password": "Acheteur123!"}'
```

### 3. Passer le premier compte en vendeur

```bash
# Login vendeur
VENDEUR_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "77 100 00 01", "password": "Vendeur123!"}' | jq -r '.accessToken // .data.accessToken')

# Upgrade
curl -s -X POST http://localhost:4000/api/auth/upgrade-to-seller \
  -H "Authorization: Bearer $VENDEUR_TOKEN"

# Re-login pour obtenir token SELLER
VENDEUR_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "77 100 00 01", "password": "Vendeur123!"}' | jq -r '.accessToken // .data.accessToken')
```

### 4. Publier une annonce

```bash
LISTING=$(curl -s -X POST http://localhost:4000/api/listings \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Jordan 1 Retro High - Taille 48",
    "description": "Air Jordan 1 Retro High OG, neuves dans leur boite originale.",
    "brand": "Nike",
    "model": "Air Jordan 1 Retro High",
    "sizeEu": 48,
    "condition": "NEW",
    "color": "Rouge/Noir",
    "priceXof": 75000,
    "locationRegion": "Dakar"
  }')
LISTING_ID=$(echo $LISTING | jq -r '.id // .data.id')
```

### 5. Contacter le vendeur

```bash
ACHETEUR_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "77 100 00 02", "password": "Acheteur123!"}' | jq -r '.accessToken // .data.accessToken')

curl -s -X POST http://localhost:4000/api/chat/conversations \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"listingId\": \"$LISTING_ID\", \"message\": \"Bonjour, paire encore dispo ?\"}"
```

### 6. Tester le panel admin

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "77 000 00 00", "password": "password"}' | jq -r '.accessToken // .data.accessToken')

# Stats
curl -s http://localhost:4000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Liste utilisateurs
curl -s http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.total'
```

---

## Outils de developpement

### Prisma Studio (interface graphique BDD)

```bash
pnpm db:studio
```

Ouvre une interface web sur http://localhost:5555.

### Meilisearch Dashboard

http://localhost:7700 — cle : `bigtank_meili_dev_key`

### MinIO Console

http://localhost:9001 — `bigtank_minio` / `bigtank_minio_secret`

### Logs Docker

```bash
pnpm docker:logs
docker logs bigtank-postgres -f
docker logs bigtank-redis -f
```

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lancer tous les services en mode dev |
| `pnpm build` | Build de tous les packages |
| `pnpm lint` | Lint de tout le monorepo |
| `pnpm format` | Formatter le code (Prettier) |
| `pnpm docker:up` | Demarrer PostgreSQL, Redis, Meilisearch, MinIO |
| `pnpm docker:down` | Arreter les conteneurs Docker |
| `pnpm docker:logs` | Voir les logs des conteneurs |
| `pnpm db:migrate` | Creer et appliquer une migration Prisma |
| `pnpm db:generate` | Generer le client Prisma |
| `pnpm db:seed` | Peupler la BDD avec des donnees de test |
| `pnpm db:studio` | Ouvrir Prisma Studio |

## Structure du projet

```
bigtank/
├── apps/
│   ├── api-gateway/          # Point d'entree API (:4000)
│   ├── auth-service/         # Authentification (:4001)
│   ├── listing-service/      # Gestion des annonces (:4002)
│   ├── chat-service/         # Chat temps reel (:4003)
│   ├── payment-service/      # Paiements (:4004) — en cours
│   ├── notification-service/ # Notifications (:4005) — en cours
│   ├── search-service/       # Recherche (:4006) — en cours
│   ├── admin-service/        # Administration (:4007)
│   └── web/                  # Frontend Next.js (:3000)
├── packages/
│   ├── database/             # Schema Prisma et migrations
│   ├── shared-types/         # Types TypeScript partages
│   ├── shared-utils/         # Utilitaires partages
│   └── shared-config/        # Config ESLint, TSConfig, Prettier
├── docker/
│   └── docker-compose.dev.yml
├── docs/                     # Rapports de phases
└── .env.example
```

## Frontend — Pages

### Pages publiques

| Route | Description |
|-------|-------------|
| `/` | Landing : hero, annonces recentes, CTA vendeur |
| `/search` | Recherche avec filtres (marque, taille, prix, etat, region) |
| `/shoes/[slug]` | Detail annonce : galerie, infos vendeur, contacter |

### Pages authentifiees

| Route | Acces | Description |
|-------|-------|-------------|
| `/login` | Public | Connexion email ou telephone |
| `/register` | Public | Inscription avec email OU telephone |
| `/dashboard` | SELLER | CRUD annonces |
| `/dashboard/new` | SELLER | Creer une annonce + upload photos |
| `/dashboard/[id]/edit` | SELLER | Modifier une annonce |
| `/profile` | Tous | Profil, stats vendeur, devenir vendeur |
| `/chat` | Tous | Liste conversations |
| `/chat/[id]` | Participant | Messagerie temps reel |
| `/admin` | **ADMIN** | Dashboard stats |
| `/admin/users` | **ADMIN** | Gestion utilisateurs (suspendre / reactiver) |
| `/admin/listings` | **ADMIN** | Moderation annonces (supprimer) |

### Flux roles

```
Inscription → role USER (acheteur)
  → Dashboard : invitation "Devenir vendeur"
  → Profile → "Activer mode vendeur" → POST /auth/upgrade-to-seller
  → Reconnexion → token SELLER → acces CRUD annonces

Admin → connexion → redirection automatique vers /admin
  → menu dropdown : "Panel Admin" (icone bouclier)
```

## Securite

- **Mots de passe** : bcrypt 12 rounds
- **Tokens** : JWT access (15 min) + refresh (7 jours), rotation automatique
- **Rate limiting** : 5 tentatives login → blocage 15 min, 5 annonces/heure, 100 req/min global
- **Roles** : USER, SELLER, ADMIN — controles d'acces par route et middleware JWT
- **Admin** : verification role dans le middleware Next.js (decode JWT) + verification `x-user-role` dans admin-service
- **Audit** : toutes les actions admin sont journalisees (suspension, activation, suppression)
- **XSS / CORS / Helmet** : protections standard appliquees

## Licence

Projet prive.
