# Samadal — Guide de setup complet
> Pour les développeurs qui forkent le projet et qui veulent tout faire tourner en local.

---

## Prérequis obligatoires

Installe exactement ces versions. Des écarts causent des erreurs silencieuses.

### Node.js >= 20

```bash
# Vérifier
node --version   # doit afficher v20.x.x ou supérieur

# Installer via nvm (recommandé)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # ou ~/.zshrc selon ton shell
nvm install 20
nvm use 20
nvm alias default 20
```

### pnpm 10.29.3 (version exacte du projet)

```bash
# Installer pnpm via corepack (recommandé)
corepack enable
corepack prepare pnpm@10.29.3 --activate

# Ou via npm
npm install -g pnpm@10.29.3

# Vérifier
pnpm --version   # doit afficher 10.29.3
```

### Docker & Docker Compose

```bash
# Docker Engine (Linux)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Vérifier
docker --version          # Docker 24+ recommandé
docker compose version    # Docker Compose v2.x (pas v1 "docker-compose")

# IMPORTANT : si tu as encore "docker-compose" (avec tiret), upgrade Docker
```

### Git

```bash
git --version   # n'importe quelle version récente
```

---

## 1. Cloner le projet

```bash
git clone https://github.com/TON_USERNAME/samadal.git
cd samadal
```

---

## 2. Installer toutes les dépendances

Une seule commande depuis la racine — pnpm installe tout le monorepo :

```bash
pnpm install
```

Ce qui est installé :
- **Frontend** : Next.js 14, React 18, Tailwind CSS 4, shadcn/ui (Radix UI), Socket.io client, Zod
- **Backend (tous les services)** : NestJS 11, Passport, JWT, bcrypt, Prisma Client, Redis (ioredis), Meilisearch, AWS S3 SDK, Socket.io, sanitize-html
- **Packages partagés** : shared-types, shared-utils, shared-config
- **Outils** : Turborepo, TypeScript, Prettier, ESLint, tsx, dotenv-cli, Prisma CLI

> Si tu vois des erreurs `EACCES` (permissions), ne fais PAS `sudo pnpm`. Fixe d'abord les permissions npm : [voir doc officielle](https://docs.npmjs.com/resolving-eacces-permissions-errors)

---

## 3. Configurer les variables d'environnement

### Fichier `.env` (racine — pour tous les services backend)

```bash
cp .env.example .env
```

Le fichier `.env` par défaut **fonctionne directement en développement**. Aucune clé externe n'est requise pour démarrer.

Vérifie les valeurs critiques dans `.env` :

```env
# Base de données (PostgreSQL sur port 5433 — pas 5432 !)
DATABASE_URL=postgresql://samadal:samadal_dev_2024@localhost:5433/samadal?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT — change en prod, OK en dev
JWT_SECRET=change_me_in_production_use_a_long_random_string
JWT_REFRESH_SECRET=change_me_too_another_long_random_string
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=samadal_meili_dev_key

# MinIO (stockage images)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=samadal_minio
S3_SECRET_KEY=samadal_minio_secret
S3_BUCKET=samadal-images
S3_REGION=us-east-1

# Ports
API_GATEWAY_PORT=4000
AUTH_SERVICE_PORT=4001
LISTING_SERVICE_PORT=4002
CHAT_SERVICE_PORT=4003

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Fichier `apps/web/.env.local` (pour le frontend Next.js)

Ce fichier n'est **pas copié automatiquement**. Il faut le créer manuellement :

```bash
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
```

> Sans ce fichier, le frontend ne sait pas où appeler l'API — tu auras des erreurs de fetch.

---

## 4. Démarrer l'infrastructure Docker

```bash
pnpm docker:up
```

Cette commande lance 4 conteneurs (+ 1 setup qui s'arrête tout seul) :

| Conteneur | Port | Rôle |
|-----------|------|------|
| `samadal-postgres` | `5433` | Base de données PostgreSQL 16 |
| `samadal-redis` | `6379` | Cache et sessions |
| `samadal-meilisearch` | `7700` | Moteur de recherche full-text |
| `samadal-minio` | `9000` / `9001` | Stockage images (S3-compatible) |
| `samadal-minio-setup` | — | Crée le bucket, s'arrête ensuite (normal) |

### Vérifier que tout est healthy

```bash
docker ps
```

Tous les conteneurs (sauf `minio-setup`) doivent afficher `healthy` dans la colonne STATUS. Attends 30-60 secondes si c'est la première fois.

```bash
# Si un conteneur n'est pas healthy, voir ses logs :
docker logs samadal-postgres
docker logs samadal-redis
docker logs samadal-meilisearch
docker logs samadal-minio
```

### Erreur fréquente : port déjà utilisé

Si tu vois `Bind for 0.0.0.0:5433 failed: port is already allocated` :

```bash
# Trouver le processus qui utilise le port
sudo lsof -i :5433
sudo lsof -i :6379
sudo lsof -i :7700
sudo lsof -i :9000

# Arrêter l'ancien conteneur Docker s'il existe
docker stop $(docker ps -q)
```

> **Attention :** PostgreSQL tourne sur le port **5433** (pas 5432) pour éviter les conflits avec un PostgreSQL local.

---

## 5. Initialiser la base de données

Ces 3 commandes doivent être lancées dans l'ordre depuis la racine :

```bash
# 1. Générer le client Prisma (TypeScript types pour la BDD)
pnpm db:generate

# 2. Créer les tables dans PostgreSQL
pnpm db:push

# 3. Insérer les données de test
pnpm db:seed
```

### Ce que le seed crée

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| ADMIN | admin@samadal.com | ⚠️ hash placeholder — compte non fonctionnel via API |
| SELLER | vendeur@test.com | ⚠️ hash placeholder — compte non fonctionnel via API |
| USER | acheteur@test.com | ⚠️ hash placeholder — compte non fonctionnel via API |

> Les comptes de seed ont un hash placeholder. **Pour tester l'API, crée de nouveaux comptes via `POST /api/auth/register`.**

3 annonces de test sont aussi créées : Nike Air Max 90 (EU 47), Adidas Yeezy Boost 350 (EU 48), Puma RS-X (EU 46).

---

## 6. Compiler les packages partagés

Avant de démarrer les services, les packages partagés doivent être compilés (TypeScript → JavaScript) :

```bash
pnpm build --filter=@samadal/shared-types
pnpm build --filter=@samadal/shared-utils
pnpm build --filter=@samadal/database
```

> Turborepo gère normalement cela automatiquement avec `pnpm dev`, mais en cas d'erreur de module introuvable, lance ces builds manuellement en premier.

---

## 7. Démarrer tous les services

```bash
pnpm dev
```

Turborepo lance tous les services en parallèle. Attends que tous soient prêts (~30 secondes) :

| Service | Port | Prêt quand |
|---------|------|-----------|
| API Gateway | `:4000` | `[Nest] Application is running on: http://[::1]:4000` |
| Auth Service | `:4001` | `[Nest] Application is running on: http://[::1]:4001` |
| Listing Service | `:4002` | `[Nest] Application is running on: http://[::1]:4002` |
| Chat Service | `:4003` | `[Nest] Application is running on: http://[::1]:4003` |
| Frontend | `:3000` | `✓ Ready in X.Xs` |

### Démarrer les services séparément (optionnel)

```bash
# Un seul service
pnpm --filter @samadal/api-gateway dev
pnpm --filter @samadal/auth-service dev
pnpm --filter @samadal/listing-service dev
pnpm --filter @samadal/chat-service dev
pnpm --filter @samadal/web dev
```

---

## 8. Vérifier que tout fonctionne

### Health check de l'API Gateway

```bash
curl http://localhost:4000/api/health
# Réponse attendue : {"status":"ok"} ou similaire
```

### Créer un compte de test

```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "phone": "221770001122",
    "city": "Dakar",
    "region": "Dakar"
  }' | jq .
```

Réponse attendue : objet `user` + `accessToken` + `refreshToken`.

### Vérifier la recherche (Meilisearch)

```bash
curl "http://localhost:4000/api/listings/search?q=nike"
```

### Ouvrir le frontend

```
http://localhost:3000
```

---

## 9. Outils de développement

### Prisma Studio (interface graphique de la BDD)

```bash
pnpm db:studio
# Ouvre http://localhost:5555
```

### Meilisearch Dashboard

```
http://localhost:7700
Clé : samadal_meili_dev_key
```

### MinIO Console (gestion des images)

```
http://localhost:9001
User : samadal_minio
Password : samadal_minio_secret
```

---

## 10. Flux utilisateur complet

Pour tester tous les rôles :

```bash
# 1. Créer un compte (role USER par défaut)
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Moussa","email":"moussa@test.com","password":"Test1234!","phone":"221771234567","city":"Dakar","region":"Dakar"}' \
  | jq -r '.accessToken')

# 2. Passer en mode vendeur (role SELLER)
curl -s -X POST http://localhost:4000/api/auth/upgrade-to-seller \
  -H "Authorization: Bearer $TOKEN"

# 3. Re-login pour obtenir un token avec role SELLER
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"moussa@test.com","password":"Test1234!"}' \
  | jq -r '.accessToken')

# 4. Créer une annonce
curl -s -X POST http://localhost:4000/api/listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Jordan 1 Retro - EU 48",
    "description": "Paire neuve jamais portée, coloris chicago.",
    "brand": "Nike",
    "sizeEu": 48,
    "condition": "NEW",
    "color": "Rouge/Blanc",
    "priceXof": 75000,
    "locationCity": "Dakar",
    "locationRegion": "Dakar"
  }' | jq .
```

---

## 11. Résolution des problèmes fréquents

### ❌ `Cannot find module '@samadal/shared-types'`

Les packages partagés ne sont pas compilés. Solution :

```bash
pnpm build --filter=@samadal/shared-types
pnpm build --filter=@samadal/shared-utils
pnpm build --filter=@samadal/database
```

### ❌ `ECONNREFUSED localhost:5433`

PostgreSQL n'est pas démarré ou pas encore healthy.

```bash
pnpm docker:up
docker ps   # vérifier que samadal-postgres est healthy
```

### ❌ `ECONNREFUSED localhost:6379`

Redis n'est pas démarré.

```bash
docker start samadal-redis
```

### ❌ Le frontend affiche des erreurs de fetch

Le fichier `apps/web/.env.local` est manquant.

```bash
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
```

### ❌ `P1001: Can't reach database server`

La `DATABASE_URL` dans `.env` utilise le port 5433 (pas 5432). Vérifie :

```bash
grep DATABASE_URL .env
# doit contenir : postgresql://...@localhost:5433/samadal...
```

### ❌ `pnpm: command not found`

```bash
npm install -g pnpm@10.29.3
```

### ❌ Erreur `Meilisearch index not found` sur la recherche

Le listing-service indexe les annonces automatiquement au démarrage. Attends que le service soit complètement démarré, puis relance une recherche. Alternativement :

```bash
curl -s -X DELETE 'http://localhost:7700/indexes/listings' \
  -H 'Authorization: Bearer samadal_meili_dev_key'
# puis redémarre le listing-service
```

### ❌ Images qui ne s'affichent pas

MinIO n'est pas configuré ou le bucket n'a pas été créé.

```bash
# Vérifier que le bucket existe
docker logs samadal-minio-setup
# Doit afficher : "Bucket samadal-images created and configured"

# Si le conteneur setup n'a pas tourné, le relancer manuellement :
docker compose -f docker/docker-compose.dev.yml run minio-setup
```

### ❌ `nest: command not found` lors du dev

NestJS CLI est une devDependency de chaque app. Il faut utiliser pnpm (pas npm global) :

```bash
# Ne pas faire : npm install -g @nestjs/cli
# Faire à la place depuis la racine :
pnpm dev
# ou
pnpm --filter @samadal/auth-service dev
```

### ❌ Le chat (Socket.io) ne se connecte pas

Le chat-service doit être démarré et le frontend doit être connecté. Vérifier :

1. `http://localhost:4003` est accessible (le chat-service tourne)
2. L'utilisateur est connecté (cookie `bt_access` présent)
3. Ouvrir la console navigateur et chercher des erreurs Socket.io

---

## 12. Arrêter proprement

```bash
# Arrêter les services Node.js
Ctrl+C dans le terminal qui tourne `pnpm dev`

# Arrêter Docker (données conservées)
pnpm docker:down

# Arrêter Docker ET effacer toutes les données (reset complet)
docker compose -f docker/docker-compose.dev.yml down -v
```

---

## Récapitulatif rapide (TL;DR)

```bash
# 1. Prérequis : Node 20+, pnpm 10.29.3, Docker

# 2. Setup
git clone https://github.com/TON_USERNAME/samadal.git && cd samadal
pnpm install
cp .env.example .env
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000" > apps/web/.env.local

# 3. Infrastructure
pnpm docker:up
# Attendre que les conteneurs soient healthy (30-60s)

# 4. Base de données
pnpm db:generate && pnpm db:push && pnpm db:seed

# 5. Lancer
pnpm dev

# 6. Tester
open http://localhost:3000
curl http://localhost:4000/api/health
```
