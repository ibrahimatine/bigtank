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
  └── Search Service   (:4006)  ──  recherche avancee (en cours)
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

Les valeurs par defaut dans `.env.example` fonctionnent directement en developpement. Aucune modification n'est necessaire pour tester en local.

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
# Generer le client Prisma
pnpm db:generate

# Pousser le schema vers PostgreSQL
pnpm db:push

# Peupler avec des donnees de test
pnpm db:seed
```

### 6. Lancer tous les services

```bash
pnpm dev
```

Tous les microservices demarrent en parallele via Turborepo.

## Tester les API

Toutes les requetes passent par l'API Gateway sur `http://localhost:4000/api/`.

### Verifier que le gateway fonctionne

```bash
curl http://localhost:4000/api/health
```

---

### Auth Service — Inscription / Connexion

#### Creer un compte

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "MonMotDePasse123!",
    "name": "Amadou Ba",
    "phone": "221770001122",
    "city": "Dakar",
    "region": "Dakar"
  }'
```

Reponse : un objet `user` + `accessToken` + `refreshToken`.

#### Se connecter

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "MonMotDePasse123!"
  }'
```

> **Important :** Copiez le `accessToken` retourne. Il sera utilise dans toutes les requetes authentifiees ci-dessous. On l'appellera `TOKEN` dans la suite.

#### Voir son profil

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

#### Rafraichir le token

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "VOTRE_REFRESH_TOKEN"
  }'
```

#### Passer vendeur

```bash
curl -X POST http://localhost:4000/api/auth/upgrade-to-seller \
  -H "Authorization: Bearer TOKEN"
```

> Apres cette commande, reconnectez-vous (`/auth/login`) pour obtenir un nouveau token avec le role `SELLER`.

#### Se deconnecter

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "VOTRE_REFRESH_TOKEN"
  }'
```

---

### Listing Service — Annonces

> Les operations de creation/modification necessitent le role **SELLER**. Faites d'abord un `upgrade-to-seller` puis reconnectez-vous.

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
    "locationCity": "Dakar",
    "locationRegion": "Dakar"
  }'
```

#### Lister ses annonces

```bash
curl http://localhost:4000/api/listings/my \
  -H "Authorization: Bearer TOKEN"
```

#### Rechercher des annonces (public)

```bash
# Recherche textuelle
curl "http://localhost:4000/api/listings/search?q=nike"

# Avec filtres
curl "http://localhost:4000/api/listings/search?brand=Nike&minSize=46&maxPrice=50000&region=Dakar"
```

Filtres disponibles : `q`, `brand`, `condition`, `minSize`, `maxSize`, `minPrice`, `maxPrice`, `region`, `city`, `page`, `limit`.

#### Voir une annonce par slug (public)

```bash
curl http://localhost:4000/api/listings/nike-air-force-1-47-dakar-xxxxx
```

Le slug exact est retourne lors de la creation.

#### Modifier une annonce

```bash
curl -X PATCH http://localhost:4000/api/listings/LISTING_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceXof": 40000
  }'
```

#### Changer le statut d'une annonce

```bash
curl -X PATCH http://localhost:4000/api/listings/LISTING_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SOLD"
  }'
```

Statuts : `ACTIVE`, `SOLD`, `RESERVED`, `DELETED`.

#### Supprimer une annonce

```bash
curl -X DELETE http://localhost:4000/api/listings/LISTING_ID \
  -H "Authorization: Bearer TOKEN"
```

#### Upload d'image

Etape 1 — Obtenir une URL presignee :

```bash
curl -X POST http://localhost:4000/api/listings/LISTING_ID/images/presign \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "photo.jpg",
    "contentType": "image/jpeg"
  }'
```

Etape 2 — Uploader le fichier vers l'URL presignee retournee :

```bash
curl -X PUT "URL_PRESIGNEE_RETOURNEE" \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg
```

Etape 3 — Confirmer l'upload :

```bash
curl -X POST http://localhost:4000/api/listings/LISTING_ID/images/confirm \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "CLE_RETOURNEE_PAR_PRESIGN"
  }'
```

---

### Chat Service — Messagerie temps reel

#### Demarrer une conversation (REST)

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

#### Voir les messages d'une conversation

```bash
curl http://localhost:4000/api/chat/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer TOKEN"
```

Pagination par curseur : `?cursor=MESSAGE_ID&limit=20`

#### Nombre de messages non lus

```bash
curl http://localhost:4000/api/chat/unread-count \
  -H "Authorization: Bearer TOKEN"
```

#### Messagerie temps reel (WebSocket)

Pour tester les WebSockets, vous pouvez utiliser un client Socket.io comme [websocat](https://github.com/nicktomlin/wscat) ou un script Node.js :

```javascript
// test-websocket.js
const { io } = require("socket.io-client");

const socket = io("http://localhost:4003", {
  query: { token: "VOTRE_ACCESS_TOKEN" }
});

socket.on("connect", () => {
  console.log("Connecte au chat !");

  // Rejoindre une conversation
  socket.emit("join_conversation", { conversationId: "CONVERSATION_ID" });

  // Envoyer un message
  socket.emit("send_message", {
    conversationId: "CONVERSATION_ID",
    content: "Salut depuis le WebSocket !"
  });

  // Indicateur de frappe
  socket.emit("typing", { conversationId: "CONVERSATION_ID" });

  // Marquer comme lu
  socket.emit("mark_read", { conversationId: "CONVERSATION_ID" });
});

// Recevoir les messages
socket.on("new_message", (message) => {
  console.log("Nouveau message :", message);
});

// Notification de frappe
socket.on("user_typing", (data) => {
  console.log("L'autre utilisateur tape...");
});

// Confirmation de lecture
socket.on("messages_read", (data) => {
  console.log("Messages lus");
});

socket.on("error", (err) => {
  console.error("Erreur :", err);
});
```

```bash
node test-websocket.js
```

---

## Scenario de test complet

Voici un parcours utilisateur complet pour tester toutes les fonctionnalites :

### 1. Creer deux comptes

```bash
# Compte vendeur
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendeur@test.com",
    "password": "Vendeur123!",
    "name": "Moussa Diop",
    "city": "Dakar",
    "region": "Dakar"
  }'

# Compte acheteur
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "acheteur@test.com",
    "password": "Acheteur123!",
    "name": "Fatou Sall",
    "city": "Thies",
    "region": "Thies"
  }'
```

### 2. Passer le premier compte en vendeur

```bash
# Login vendeur
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "vendeur@test.com", "password": "Vendeur123!"}' | jq .accessToken

# Upgrade en vendeur (avec le token obtenu)
curl -s -X POST http://localhost:4000/api/auth/upgrade-to-seller \
  -H "Authorization: Bearer VENDEUR_TOKEN"

# Re-login pour avoir le token avec role SELLER
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "vendeur@test.com", "password": "Vendeur123!"}' | jq .accessToken
```

### 3. Publier une annonce

```bash
curl -s -X POST http://localhost:4000/api/listings \
  -H "Authorization: Bearer VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Jordan 1 Retro High - Taille 48",
    "description": "Air Jordan 1 Retro High OG, neuves dans leur boite.",
    "brand": "Nike",
    "model": "Air Jordan 1 Retro High",
    "sizeEu": 48,
    "sizeUs": 14,
    "condition": "NEW",
    "color": "Rouge/Noir",
    "priceXof": 75000,
    "locationCity": "Dakar",
    "locationRegion": "Dakar"
  }'
```

> Notez le `id` et le `slug` de l'annonce dans la reponse.

### 4. Rechercher l'annonce

```bash
curl -s "http://localhost:4000/api/listings/search?q=jordan&minSize=47"
```

### 5. Contacter le vendeur (en tant qu'acheteur)

```bash
# Login acheteur
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "acheteur@test.com", "password": "Acheteur123!"}' | jq .accessToken

# Demarrer une conversation
curl -s -X POST http://localhost:4000/api/chat/conversations \
  -H "Authorization: Bearer ACHETEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "ID_DE_LANNONCE",
    "message": "Bonjour ! La paire est toujours dispo ? Possible de faire 70000 ?"
  }'
```

### 6. Le vendeur repond

```bash
# Voir les conversations du vendeur
curl -s http://localhost:4000/api/chat/conversations \
  -H "Authorization: Bearer VENDEUR_TOKEN"

# Voir les messages
curl -s http://localhost:4000/api/chat/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer VENDEUR_TOKEN"
```

---

## Outils de developpement

### Prisma Studio (interface graphique BDD)

```bash
pnpm db:studio
```

Ouvre une interface web sur http://localhost:5555 pour explorer et modifier les donnees.

### Meilisearch Dashboard

Accessible sur http://localhost:7700 avec la cle `bigtank_meili_dev_key`.

### MinIO Console

Accessible sur http://localhost:9001 avec les identifiants :
- **User :** `bigtank_minio`
- **Password :** `bigtank_minio_secret`

### Logs Docker

```bash
# Tous les services
pnpm docker:logs

# Un service specifique
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
| `pnpm db:generate` | Generer le client Prisma |
| `pnpm db:push` | Appliquer le schema a la BDD |
| `pnpm db:seed` | Peupler la BDD avec des donnees de test |
| `pnpm db:studio` | Ouvrir Prisma Studio |
| `pnpm db:migrate` | Creer une migration Prisma |

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
│   └── web/                  # Frontend Next.js (:3000) — pages publiques SEO
├── packages/
│   ├── database/             # Schema Prisma et migrations
│   ├── shared-types/         # Types TypeScript partages
│   ├── shared-utils/         # Utilitaires partages
│   └── shared-config/        # Config ESLint, TSConfig, Prettier
├── docker/
│   └── docker-compose.dev.yml
├── docs/                     # Documentation des phases
└── .env.example              # Template des variables d'environnement
```

## Securite implementee

- **Mots de passe** : hashage bcrypt (12 rounds)
- **Tokens** : JWT access (15 min) + refresh (7 jours), rotation automatique
- **Rate limiting** : 5 tentatives de login puis blocage 15 min, 5 annonces/heure par vendeur, 100 requetes/min globalement
- **XSS** : sanitization de tout le contenu utilisateur (descriptions, messages)
- **CORS** : origines autorisees strictement definies
- **Headers HTTP** : Helmet.js
- **Roles** : USER, SELLER, ADMIN avec controles d'acces
- **Audit** : journalisation des connexions et actions sensibles

## Frontend (Phase 5a)

Le frontend Next.js expose 3 pages publiques optimisees SEO :

| Route | Rendu | Description |
|-------|-------|-------------|
| `/` | Static (SSG) | Landing page : hero, annonces recentes, CTA vendeur |
| `/search` | Dynamic (ISR 60s) | Recherche avec filtres (marque, taille, prix, etat, tri) |
| `/shoes/[slug]` | Dynamic (SSR) | Detail annonce : galerie, infos, JSON-LD Product |

**Design :**
- Couleurs : Navy `#1a1a2e` + Rouge accent `#e94560`
- Fonts : Inter (body) + Space Grotesk (titres, prix)
- Responsive : grid 2→3→4 colonnes, filtres en Sheet sur mobile
- SEO : JSON-LD (Product + WebSite), OpenGraph dynamique, metadata template

**Acceder au frontend :**

```bash
# Demarrer le frontend
pnpm --filter @bigtank/web dev
```

Puis ouvrir http://localhost:3000.

> Les pages de recherche et detail necessitent les services backend (`api-gateway` + `listing-service`) pour afficher les donnees.

---

## Donnees de seed

Apres `pnpm db:seed`, les comptes suivants sont disponibles :

| Role | Email | Note |
|------|-------|------|
| ADMIN | admin@bigtank.com | Mot de passe placeholder (non fonctionnel via API) |
| SELLER | vendeur@test.com | Mot de passe placeholder (non fonctionnel via API) |
| USER | acheteur@test.com | Mot de passe placeholder (non fonctionnel via API) |

> Les comptes de seed utilisent un hash placeholder. Pour tester l'API, creez de nouveaux comptes via `/auth/register`.

3 annonces de test sont egalement creees (Nike Air Max 90, Adidas Yeezy Boost 350, Puma RS-X).

## Licence

Projet prive.
