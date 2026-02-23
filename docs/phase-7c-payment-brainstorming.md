# Phase 7c — Système de paiement BigTank

**Date :** 23 Février 2026
**Statut :** Implémenté ✅

---

## 1. Modèle économique retenu

BigTank **monétise la publication d'annonces**. Le vendeur paie une commission à BigTank pour rendre son annonce visible. La transaction acheteur/vendeur se fait hors-plateforme (cash, Wave direct, etc.).

### Paramètres retenus

| Paramètre | Valeur |
|-----------|--------|
| Taux de commission | **2% flat** sur le prix de l'annonce |
| Commission minimum | **100 FCFA** |
| Prix minimum d'annonce | **3 000 FCFA** |
| Durée de publication | **30 jours** (`expiresAt`) |
| 1ère annonce | **Gratuite** (via `commissionFreeRemaining = 1`) |
| Republication | Repayer à chaque publication (après expiration ou suppression) |
| Remboursement | Aucun (CGV) |
| Fournisseur de paiement | **PayTech** (Wave / Orange Money / CB) |

### Exemples de commission

| Prix annonce | Commission |
|---|---|
| 3 000 FCFA | 100 FCFA (minimum appliqué) |
| 5 000 FCFA | 100 FCFA (minimum appliqué) |
| 10 000 FCFA | 200 FCFA |
| 50 000 FCFA | 1 000 FCFA |
| 200 000 FCFA | 4 000 FCFA |
| 500 000 FCFA | 10 000 FCFA |

---

## 2. Flow complet

```
[Vendeur]                    [Web :3000]           [payment-service :4004]      [PayTech]
   |                              |                          |                      |
   | 1. Crée annonce              |                          |                      |
   |──────────────────────────→  |                          |                      |
   |                              | POST /listings           |                      |
   |                              |──────────→ listing-service (:4002)             |
   |                              | status: DRAFT ←─────────|                      |
   |                              |                          |                      |
   | 2. Redirect /dashboard/pay/:id                          |                      |
   |                              |                          |                      |
   | 3. Voit commission preview   |                          |                      |
   |                              | GET /api/payments/preview/:id                  |
   |                              |──────────────────────── →|                      |
   |                              |←── {commission, isFree} ─|                      |
   |                              |                          |                      |
   | [Si 1ère annonce gratuite]   |                          |                      |
   | 4a. Clique "Publier gratuit" |                          |                      |
   |                              | POST /api/payments/initiate {listingId}         |
   |                              |──────────────────────────→|                      |
   |                              |  → freeRemaining > 0     |                      |
   |                              |  → ACTIVE + expiresAt    |                      |
   |                              |  → commissionFreeRemaining-- |                 |
   |                              |←── {isFree: true} ───────|                      |
   |  Redirect /payment/success   |                          |                      |
   |                              |                          |                      |
   | [Si paiement requis]         |                          |                      |
   | 4b. Clique "Payer via PayTech"|                         |                      |
   |                              | POST /api/payments/initiate {listingId}         |
   |                              |──────────────────────────→|                      |
   |                              |  → Crée ListingPayment PENDING                  |
   |                              |  → POST paytech.sn/api/payment/request-payment─→|
   |                              |←── {redirect_url, token} ──────────────────────|
   |                              |←── {redirectUrl} ────────|                      |
   | window.location = redirectUrl|                          |                      |
   |──────────────────────────────────────────────────────────────────────────────→|
   |        [Vendeur paie sur PayTech — Wave / Orange Money / CB]                   |
   |                              |                          |                      |
   |                              |                          |←── IPN POST (webhook)|
   |                              |  POST /api/payments/webhook                     |
   |                              |──────────────────────────→|                      |
   |                              |  → Vérifie SHA256(API_KEY) + SHA256(API_SECRET) |
   |                              |  → type_event = sale_complete                   |
   |                              |  → ListingPayment → COMPLETED                   |
   |                              |  → Listing → ACTIVE + expiresAt (+30 jours)     |
   |                              |                          |                      |
   | Redirect /dashboard/payment/success                     |                      |
```

---

## 3. Architecture technique

### Nouveaux fichiers

```
apps/
├── payment-service/               ← Nouveau service (port 4004)
│   └── src/
│       ├── database/
│       │   └── database.module.ts
│       ├── common/
│       │   ├── filters/http-exception.filter.ts
│       │   └── interceptors/transform.interceptor.ts
│       ├── payments/
│       │   ├── payments.service.ts   ← Logique principale
│       │   ├── payments.controller.ts
│       │   └── payments.module.ts
│       └── app.module.ts
│
├── listing-service/src/
│   ├── listing/
│   │   ├── listing.service.ts     ← +activateAfterPayment(), DRAFT par défaut
│   │   ├── listing.controller.ts  ← +PATCH :id/activate
│   │   └── dto/create-listing.dto.ts  ← Min price 3000→
│
├── api-gateway/src/
│   └── payment-proxy.controller.ts  ← Proxy /api/payments/* → :4004
│
└── web/src/app/
    ├── api/payments/
    │   ├── initiate/route.ts
    │   ├── webhook/route.ts
    │   └── preview/[listingId]/route.ts
    └── dashboard/
        ├── pay/[id]/page.tsx          ← Page paiement
        └── payment/
            ├── success/page.tsx
            └── cancel/
                ├── page.tsx           ← Suspense wrapper
                └── cancel-content.tsx ← useSearchParams
```

### Schéma DB — Migrations appliquées

**Migration :** `20260223173952_add_publication_payment`

```sql
-- Nouveaux statuts ListingStatus
ALTER TYPE "ListingStatus" ADD VALUE 'DRAFT';
ALTER TYPE "ListingStatus" ADD VALUE 'EXPIRED';

-- Nouveau champ Listing
ALTER TABLE "listings" ADD COLUMN "expires_at" TIMESTAMP;

-- Nouveau enum
CREATE TYPE "ListingPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'FREE');

-- Nouvelle table
CREATE TABLE "listing_payments" (
  id             TEXT PRIMARY KEY,
  listing_id     TEXT NOT NULL,
  seller_id      TEXT NOT NULL,
  amount         INTEGER NOT NULL,
  listing_price  INTEGER NOT NULL,
  status         "ListingPaymentStatus" DEFAULT 'PENDING',
  ref_command    TEXT UNIQUE NOT NULL,
  payment_token  TEXT,
  payment_method TEXT,
  ipn_payload    JSONB,
  paid_at        TIMESTAMP,
  created_at     TIMESTAMP DEFAULT now(),
  updated_at     TIMESTAMP
);
```

---

## 4. API Reference

### payment-service (:4004)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/payments/initiate` | `x-user-id` | Initie paiement ou publication gratuite |
| POST | `/payments/webhook` | Aucune (HMAC) | IPN PayTech — active l'annonce |
| GET | `/payments/listing/:listingId` | `x-user-id` | Dernier paiement d'une annonce |
| GET | `/payments/preview/:listingId` | Aucune | Aperçu commission avant paiement |

### listing-service (:4002) — Nouveau endpoint

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| PATCH | `/listings/:id/activate` | `x-user-id` | Active une annonce après paiement confirmé |

### Web — Routes API Next.js

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/payments/initiate` | Proxy → gateway → payment-service |
| POST | `/api/payments/webhook` | IPN direct (JSON + form-urlencoded) |
| GET | `/api/payments/preview/[listingId]` | Commission preview |

---

## 5. Variables d'environnement

Dans `.env` (à la racine du monorepo) :

```env
# Déjà configuré :
PAYTECH_ENV=test          # "prod" en production
WEB_URL=http://localhost:3000

# À remplir avec vos clés PayTech :
PAYTECH_API_KEY=          # Depuis paytech.sn/espace-pro
PAYTECH_API_SECRET=       # Depuis paytech.sn/espace-pro
```

---

## 6. Guide de test complet

### Prérequis

1. Avoir un compte PayTech Test → [paytech.sn](https://paytech.sn)
2. Renseigner `PAYTECH_API_KEY` et `PAYTECH_API_SECRET` dans `.env`
3. Redémarrer payment-service : `bash start-services.sh`

---

### Test 1 — Commission preview

```bash
# Récupérer un listingId existant en DRAFT depuis la DB
# puis tester :
curl http://localhost:4004/payments/preview/<listingId>
# Attendu :
# {"success":true,"data":{"listingPrice":15000,"commission":300,"rate":"2%","minimumFee":100}}
```

---

### Test 2 — 1ère annonce gratuite (sans PayTech)

1. Connectez-vous avec un compte **SELLER qui n'a pas encore publié d'annonce**
   (`commissionFreeRemaining = 1` par défaut)
2. Créer une nouvelle annonce : `/dashboard/new`
3. Remplir le formulaire → cliquer "Continuer vers le paiement →"
4. Page `/dashboard/pay/[id]` s'affiche avec :
   - Badge **"1ère annonce offerte !"**
   - Commission : **0 FCFA**
   - Bouton **"Publier gratuitement"**
5. Cliquer → redirect vers `/dashboard/payment/success`
6. **Vérifier en DB :**
   ```sql
   SELECT status, expires_at FROM listings WHERE id = '<id>';
   -- Attendu: status = 'ACTIVE', expires_at = now() + 30 jours

   SELECT status, amount FROM listing_payments WHERE listing_id = '<id>';
   -- Attendu: status = 'FREE', amount = 0

   SELECT commission_free_remaining FROM seller_stats WHERE user_id = '<sellerId>';
   -- Attendu: 0 (décrémenté)
   ```

---

### Test 3 — Paiement PayTech (mode test)

> Nécessite les clés PayTech renseignées.

1. Avec un compte vendeur dont `commissionFreeRemaining = 0`
2. Créer une annonce à **10 000 FCFA**
3. Page paiement affiche : commission **200 FCFA**
4. Cliquer **"Payer via PayTech"**
5. Redirect vers `paytech.sn/payment/...`
6. Utiliser le numéro test Wave : `+221 77 000 00 00` (ou voir doc PayTech test)
7. Après confirmation PayTech :
   - Redirect vers `/dashboard/payment/success`
8. **Vérifier en DB :**
   ```sql
   SELECT status, expires_at FROM listings WHERE id = '<id>';
   -- Attendu: status = 'ACTIVE', expires_at = now() + 30j

   SELECT status, paid_at, payment_method FROM listing_payments WHERE listing_id = '<id>';
   -- Attendu: status = 'COMPLETED', paid_at not null
   ```

---

### Test 4 — Annulation paiement

1. Créer une annonce → page paiement → cliquer "Payer via PayTech"
2. Sur PayTech, cliquer "Annuler" / fermer la page
3. Redirect vers `/dashboard/payment/cancel?listingId=<id>`
4. Page affiche bouton "Réessayer le paiement"
5. Cliquer → retour sur `/dashboard/pay/<id>`
6. **Vérifier en DB :**
   ```sql
   SELECT status FROM listings WHERE id = '<id>';
   -- Attendu: status = 'DRAFT' (toujours en attente)

   SELECT status FROM listing_payments WHERE listing_id = '<id>';
   -- Attendu: status = 'FAILED' (annulé automatiquement au prochain initiate)
   ```

---

### Test 5 — Webhook IPN (simulé sans PayTech)

```bash
# Calculer les hashes de test
API_KEY="votre_api_key"
API_SECRET="votre_api_secret"
KEY_HASH=$(echo -n "$API_KEY" | sha256sum | cut -d' ' -f1)
SECRET_HASH=$(echo -n "$API_SECRET" | sha256sum | cut -d' ' -f1)

# Récupérer un ref_command PENDING depuis la DB
REF="BT_<listingId>_<timestamp>"

curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"type_event\": \"sale_complete\",
    \"ref_command\": \"$REF\",
    \"api_key_sha256\": \"$KEY_HASH\",
    \"api_secret_sha256\": \"$SECRET_HASH\",
    \"payment_method\": \"wave\"
  }"
# Attendu: {"processed":true,"listingId":"..."}
```

---

### Test 6 — Middleware / Validation prix minimum

```bash
# Tester qu'une annonce < 3000 FCFA est rejetée
curl -X POST http://localhost:4002/listings \
  -H "Content-Type: application/json" \
  -H "x-user-id: <sellerId>" \
  -d '{"title":"Test","description":"Description test longue","brand":"Nike","model":"Air Max","sizeEu":42,"condition":"GOOD","color":"noir","priceXof":2000,"locationRegion":"Dakar"}'
# Attendu: 400 Bad Request — "Le prix minimum est de 3 000 FCFA"
```

---

## 7. Commandes utiles

```bash
# Redémarrer tous les services
bash start-services.sh

# Voir les logs en direct
tail -f logs/payment.log
tail -f logs/listing.log
tail -f logs/gateway.log

# Inspecter les paiements en DB
psql $DATABASE_URL -c "SELECT id, listing_id, amount, status, paid_at FROM listing_payments ORDER BY created_at DESC LIMIT 10;"

# Inspecter les annonces
psql $DATABASE_URL -c "SELECT id, title, status, price_xof, expires_at FROM listings ORDER BY created_at DESC LIMIT 10;"

# Tester health des services
for port in 4001 4002 4003 4004 4005 4007; do curl -s http://localhost:$port/health | grep -o '"status":"[^"]*"'; done
```

---

## 8. Points d'attention pour la production

| Item | Action requise |
|------|---------------|
| Clés PayTech | Changer `PAYTECH_ENV=prod` + vraies clés |
| `WEB_URL` | Mettre le vrai domaine HTTPS (pour IPN PayTech) |
| IPN publiquement accessible | `/api/payments/webhook` doit être accessible depuis Internet |
| Expiration des annonces | Ajouter un cron job pour passer les annonces `ACTIVE` en `EXPIRED` quand `expiresAt < now()` |
| Dashboard DRAFT | Le dashboard liste les annonces DRAFT — ajouter bouton "Payer" sur les cards DRAFT |

---

*Rapport généré le 23/02/2026 — Phase 7c terminée.*
