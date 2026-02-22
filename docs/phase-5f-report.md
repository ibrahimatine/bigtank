# Phase 5f — Corrections & Bug Fixes

> Date : 22/02/2026

---

## Objectif

Corriger les bugs signalés après les tests utilisateur : validation téléphone, tailles négatifs, auto-fill taille, ville optionnelle, CTA vendeur contextuel, filtres qui ne se réinitialisent pas, badge chat non visible, notifications qui ne s'auto-actualisent pas.

---

## Bugs corrigés (8)

### 1. Numéro de téléphone — contrainte +221 supprimée + validation à l'inscription

**Problème** : Le placeholder imposait le format `+221` et aucune validation de format n'existait.

**Fix** :
- `validations.ts` — Ajout d'un `phoneSchema` avec regex Sénégalais :
  - Accepte : `77 000 00 00`, `+221770000000`, `00221770000000`
  - Refuse : `123`, `hello`, etc.
  - Message d'erreur : `"Numero invalide (ex: 77 000 00 00)"`
- `register-form.tsx` — Placeholder → `"77 000 00 00"`
- `profile-form.tsx` — Placeholder → `"77 000 00 00"`

**Fix 5f** (bug découvert) : Le `phoneSchema` initial utilisait `.optional().or(z.literal(''))` — dans Zod, cette union "avale" le message d'erreur du `refine`. Simplifié en `z.string().refine(...)` direct, qui gère `''` via `if (!v) return true`.

---

### 2. Tailles US/UK — pas de négatifs + auto-fill EU

**Fix** (`listing-form.tsx`) :
- `min={5}` sur US, `min={4}` sur UK — empêche les valeurs négatives
- Auto-fill bidirectionnel :
  - Saisir **US** → EU se remplit automatiquement (EU = US + 33)
  - Saisir **UK** → EU se remplit automatiquement (EU = UK + 33)
  - Saisir **EU** → US et UK se remplissent si vides

---

### 3. Ville non obligatoire

**Fix** :
- `validations.ts` — `locationCity` → `z.string().optional().or(z.literal(''))`
- `listing-form.tsx` — Label "Ville" (sans astérisque), placeholder "Dakar (optionnel)", body nettoyé si vide
- `create-listing.dto.ts` (backend) — `@IsOptional()` + `locationCity?: string`
- `listing.service.ts` (backend) — `const locationCity = dto.locationCity || ''`

---

### 4. Landing — CTA contextuel selon le rôle

**Fix** (`seller-cta.tsx` — nouveau Client Component) :
- **Vendeur/Admin** connecté → "Publier une annonce" + "Mes annonces"
- **Acheteur** connecté → "Activer le mode vendeur" (→ /profile)
- **Non connecté** → "Créer un compte vendeur"
- `page.tsx` — Remplace le bloc statique par `<SellerCta />`

---

### 5. Filtres — inputs ne se vident pas au reset + bug taille

**Problème** : Les inputs taille et prix utilisaient `defaultValue` (non contrôlé). Au reset de l'URL, les champs gardaient leurs anciennes valeurs.

**Fix** (`search-filters.tsx`) :
- Inputs taille et prix convertis en **contrôlés** avec état local `useState`
- `useEffect` synchronise l'état local avec `searchParams` → les inputs se vident automatiquement au reset
- `onKeyDown` Enter → déclenche la recherche sans quitter le champ
- `BrandCombobox` synchro via `useEffect` sur `value` prop

---

### 6. Notifications chat — badge visible avant ouverture du menu

**Fix** (`user-nav.tsx`) : Badge rouge `absolute -top-1 -right-1` sur l'avatar, visible directement dans le header sans ouvrir le menu dropdown.

---

### 7. Notifications — auto-update

**Problèmes** :
1. Le badge s'incrémentait même pour les messages envoyés par l'utilisateur lui-même (le serveur broadcast à tous les participants de la room)
2. Le compteur ne redescendait jamais (aucun `decrementUnread` appelé)
3. Pas de fallback si le WebSocket ratait un événement

**Fix** (`socket-provider.tsx`) :
- Check `message.senderId !== user.id` → n'incrémente que pour les messages des autres
- Polling de secours toutes les **30 secondes** → resynchronisation avec la base de données
- Ajout de `refreshUnreadCount()` exposé dans le contexte

**Fix** (`message-thread.tsx`) :
- À l'ouverture d'une conversation → `refreshUnreadCount()` → badge se remet immédiatement à jour
- Quand un message arrive pendant la lecture → `refreshUnreadCount()` → badge reste à 0

---

## Fichiers modifiés (10)

| Fichier | Modification |
|---|---|
| `apps/web/src/lib/validations.ts` | phoneSchema simplifié + locationCity optionnel |
| `apps/web/src/components/auth/register-form.tsx` | Placeholder téléphone |
| `apps/web/src/components/profile/profile-form.tsx` | Placeholder téléphone |
| `apps/web/src/components/dashboard/listing-form.tsx` | Size auto-fill, min US/UK, ville optionnelle |
| `apps/web/src/components/search/search-filters.tsx` | Inputs contrôlés, sync URL, Enter key |
| `apps/web/src/components/layout/user-nav.tsx` | Badge unread sur l'avatar |
| `apps/web/src/components/providers/socket-provider.tsx` | Fix sender check, polling 30s, refreshUnreadCount |
| `apps/web/src/components/chat/message-thread.tsx` | refreshUnreadCount à l'ouverture |
| `apps/listing-service/src/listing/dto/create-listing.dto.ts` | locationCity optionnel |
| `apps/listing-service/src/listing/listing.service.ts` | locationCity fallback '' |

## Fichiers créés (1)

| Fichier | Role |
|---|---|
| `apps/web/src/components/home/seller-cta.tsx` | CTA vendeur contextuel (Client Component) |

---

## Règles rappelées

- Ne pas commiter sans demande explicite
- Un rapport par session
- Panel admin : en attente d'approbation
