# Migration PayTech → Intech API V2

**Date** : 6 mars 2026
**Auteur** : Tine (assisté par Claude)
**Statut** : Implémenté — en attente de test avec clé API Intech

---

## Pourquoi ce changement ?

PayTech fonctionnait avec une **redirection** : le vendeur était envoyé sur une page PayTech pour payer, puis renvoyé sur BigTank. C'était pas terrible côté UX.

**Intech API V2** offre une approche plus directe :
- **Push USSD** : on envoie le numéro du vendeur, et il reçoit la demande de paiement directement sur son téléphone (pas de page externe)
- **Cash-out** : possibilité de rembourser un vendeur directement sur son mobile money
- **WhatsApp** : notification automatique au vendeur quand son annonce est publiée
- Supporte **Orange Money**, **Wave** et **Free Money**

---

## Ce qui a changé (fichiers modifiés)

### 1. Schema Prisma
**Fichier** : `packages/database/prisma/schema.prisma`

| Changement | Avant | Après |
|---|---|---|
| Enum `PaymentProvider` | `PAYDUNYA, PAYTECH, NABOOPAY` | `PAYDUNYA, PAYTECH, NABOOPAY, INTECH` |
| Enum `ListingPaymentStatus` | `PENDING, COMPLETED, FAILED, FREE` | `PENDING, COMPLETED, FAILED, FREE, REFUNDED` |
| Champ `ListingPayment` | `paymentToken` | `intechTransactionId` |

> Après modification, lancer `pnpm db:push` pour appliquer.

### 2. Variables d'environnement
**Fichiers** : `.env`, `.env.example`

| Avant (PayTech) | Après (Intech) |
|---|---|
| `PAYTECH_API_KEY=` | `INTECH_API_KEY=` |
| `PAYTECH_API_SECRET=` | _(supprimé — Intech n'a qu'une seule clé)_ |
| `PAYTECH_ENV=test` | `INTECH_BASE_URL=https://api.intech.sn` |

> `WEB_URL` reste inchangé.

### 3. Backend — Payment Service
**Fichier** : `apps/payment-service/src/payments/payments.service.ts`

**Méthodes modifiées :**
- `initiate(sellerId, listingId, phone, paymentMethod)` — Envoie un push USSD via Intech au lieu de créer une session PayTech. Prend maintenant le numéro de téléphone et la méthode de paiement en paramètres.
- `handleWebhook(body)` — Vérifie la signature SHA256 d'Intech (`SHA256(transactionId|externalTransactionId|apiKey)`) au lieu du hash PayTech.

**Nouvelles méthodes :**
- `refundPayment(paymentId)` — Rembourse un vendeur via cash-out Intech (admin uniquement)
- `sendWhatsAppNotification(phone, message)` — Envoie un WhatsApp au vendeur via Intech
- `checkTransactionStatus(refCommand)` — Retourne le statut d'un paiement (utilisé pour le polling frontend)
- `getBalance()` — Vérifie le solde du compte Intech (admin uniquement)

### 4. Backend — Payment Controller
**Fichier** : `apps/payment-service/src/payments/payments.controller.ts`

| Endpoint | Méthode | Description | Auth |
|---|---|---|---|
| `POST /payments/initiate` | Modifié | Accepte `{ listingId, phone, paymentMethod }` | Utilisateur |
| `POST /payments/webhook` | Modifié | Reçoit le callback JSON d'Intech | Aucune (Intech) |
| `POST /payments/refund` | **Nouveau** | Rembourse un paiement `{ paymentId }` | Admin |
| `GET /payments/balance` | **Nouveau** | Solde du compte Intech | Admin |
| `GET /payments/status/:refCommand` | **Nouveau** | Statut d'un paiement (pour polling) | Utilisateur |
| `GET /payments/listing/:listingId` | Inchangé | Dernier paiement d'une annonce | Utilisateur |
| `GET /payments/preview/:listingId` | Inchangé | Aperçu commission | Public |

### 5. Frontend — API Routes (Next.js)
| Route | Changement |
|---|---|
| `apps/web/src/app/api/payments/webhook/route.ts` | Simplifié : reçoit uniquement du JSON (plus de form-urlencoded PayTech) |
| `apps/web/src/app/api/payments/initiate/route.ts` | Passe `phone` + `paymentMethod` au backend |
| `apps/web/src/app/api/payments/status/[refCommand]/route.ts` | **Nouveau** : polling du statut de paiement |

### 6. Frontend — Page de paiement
**Fichier** : `apps/web/src/app/dashboard/pay/[id]/page.tsx`

Refonte complète de l'UI :

**Avant (PayTech)** :
- Bouton "Payer" → redirection vers la page PayTech → retour sur BigTank

**Après (Intech)** :
1. Le vendeur choisit sa méthode : **Orange Money**, **Wave** ou **Free Money**
2. Il entre (ou confirme) son **numéro de téléphone** (pré-rempli depuis son profil)
3. Au clic "Payer" → un **push USSD** arrive sur son téléphone
4. La page affiche **"En attente de confirmation..."** avec un polling toutes les 5 secondes
5. Le vendeur valide sur son téléphone avec son **code PIN**
6. Dès que le webhook confirme le paiement → **redirection automatique** vers la page succès
7. Le vendeur reçoit un **WhatsApp** : "Votre annonce a été publiée !"

---

## Mapping méthodes de paiement → Intech

| Choix utilisateur | codeService Intech (cash-in) | codeService Intech (cash-out/remboursement) |
|---|---|---|
| Orange Money | `ORANGE_SN_API_CASH_IN` | `ORANGE_SN_API_CASH_OUT` |
| Wave | `WAVE_SN_API_CASH_IN` | `WAVE_SN_API_CASH_OUT` |
| Free Money | `FREE_SN_WALLET_CASH_IN` | `FREE_SN_WALLET_CASH_OUT` |

---

## Flux technique complet

```
Vendeur clique "Payer" sur /dashboard/pay/[id]
    │
    ├── Frontend envoie POST /api/payments/initiate
    │   { listingId, phone: "770000000", paymentMethod: "ORANGE_MONEY" }
    │
    ├── Backend appelle Intech API
    │   POST https://api.intech.sn/api-services/operation
    │   { phone, amount, codeService: "ORANGE_SN_API_CASH_IN", ... }
    │
    ├── Intech déclenche un push USSD sur le téléphone du vendeur
    │
    ├── Frontend affiche "En attente..." + polling GET /api/payments/status/:ref toutes les 5s
    │
    ├── Le vendeur valide avec son code PIN sur son téléphone
    │
    ├── Intech appelle POST /api/payments/webhook avec signature SHA256
    │   Backend vérifie : SHA256(transactionId|externalTransactionId|apiKey)
    │   Backend met le paiement en COMPLETED + active l'annonce
    │
    ├── Le polling détecte status=COMPLETED → redirection vers /dashboard/payment/success
    │
    └── Backend envoie un WhatsApp au vendeur via Intech (WHATSAPP_MESSAGING)
```

---

## Sécurité du webhook

Intech signe chaque callback avec un hash SHA256 :

```
SHA256( transactionId | externalTransactionId | apiKey )
```

Le backend vérifie ce hash avant de traiter le paiement. Si le hash ne correspond pas → `403 Forbidden`.

---

## Comment tester

### Pré-requis
1. Obtenir une clé API Intech (demander sur https://intech.sn)
2. Mettre la clé dans `.env` : `INTECH_API_KEY=ta_cle_ici`
3. Appliquer le schema : `pnpm db:push`
4. Relancer les services : `pnpm dev`

### Test manuel
1. Se connecter en tant que vendeur
2. Créer une annonce (elle sera en DRAFT)
3. Aller sur `/dashboard/pay/[id]`
4. Choisir Orange Money / Wave / Free Money
5. Entrer un numéro de téléphone
6. Cliquer "Payer"
7. Vérifier qu'un push USSD arrive sur le téléphone
8. Valider le paiement sur le téléphone
9. Vérifier que la page redirige automatiquement vers succès
10. Vérifier que l'annonce passe en ACTIVE dans la base

### Simuler un webhook Intech (sans vrai paiement)
```bash
# Remplacer les valeurs par les vraies
REF="BT_listingId_timestamp"
TRANSACTION_ID="intech_123"
API_KEY="ta_cle_api"

# Calculer le hash
HASH=$(echo -n "${TRANSACTION_ID}|${REF}|${API_KEY}" | sha256sum | cut -d' ' -f1)

curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"SUCCESS\",
    \"sha256Hash\": \"${HASH}\",
    \"transaction\": {
      \"transactionId\": \"${TRANSACTION_ID}\",
      \"externalTransactionId\": \"${REF}\",
      \"amount\": 100,
      \"codeService\": \"ORANGE_SN_API_CASH_IN\",
      \"status\": \"SUCCESS\"
    }
  }"
```

---

## Ce qui n'a PAS changé

- La logique de **première annonce gratuite** (commissionFreeRemaining)
- Le calcul de la **commission** (2%, minimum 100 FCFA)
- Les **notifications admin** (in-app) à chaque nouvelle publication
- L'endpoint `GET /payments/preview/:listingId` (aperçu commission)
- L'endpoint `GET /payments/listing/:listingId` (statut paiement d'une annonce)
- La durée de publication (60 jours)
