# Phase 5e — UX Polish Suite & SEO

> Date : 19/02/2026

---

## Objectif

Finaliser les items prioritaires du backlog UX : empty states illustrés, sitemap.xml dynamique, robots.txt, OG image par défaut, et focus-visible ring cohérent.

---

## Fichiers créés (3)

| Fichier | Role |
|---|---|
| `src/app/sitemap.ts` | Sitemap dynamique — routes statiques + toutes les annonces actives (`/shoes/[slug]`) |
| `src/app/robots.ts` | robots.txt — permet l'indexation publique, bloque `/dashboard`, `/profile`, `/chat`, `/api` |
| `src/app/opengraph-image.tsx` | OG image générée côté edge (Satori/ImageResponse) — fond `#1a1a2e`, texte BigTank + tagline |

---

## Fichiers modifiés (4)

| Fichier | Modification |
|---|---|
| `src/components/search/search-results.tsx` | Empty state illustré avec SVG loupe + CTA contextuel (effacer filtres / retour accueil) |
| `src/components/chat/conversation-list.tsx` | Empty state illustré avec SVG bulles de chat + CTA "Explorer les annonces" |
| `src/app/layout.tsx` | `metadataBase`, openGraph complet (url, title, description), twitter card |
| `src/app/globals.css` | `:focus-visible` global — outline 2px accent, offset 2px |

---

## Fonctionnalités détaillées

### 1. Empty state illustré — /search sans résultats

Géré dans `<SearchResults>` (a accès aux `filters` pour le contexte) :

- **SVG inline** : loupe avec un X à l'intérieur (simple, lisible, pas de dépendance)
- **Contexte-aware** :
  - Si `filters.query` est présent → affiche `"Aucun résultat pour "terme""` + conseil orthographe
  - Sinon → `"Aucune annonce ne correspond à vos filtres"`
- **CTAs** :
  - Si des filtres sont actifs → bouton accent "Effacer les filtres" (lien `/search`)
  - Toujours → bouton outline "Retour à l'accueil"

### 2. Empty state illustré — /chat sans conversations

Amélioré dans `<ConversationList>` :

- **SVG inline** : deux bulles de chat imbriquées (acheteur + vendeur)
- **Message** : "Vous n'avez pas encore de messages. Trouvez une annonce et contactez le vendeur pour démarrer une conversation."
- **CTA** : bouton accent "Explorer les annonces" (lien `/search`) avec icône `MessageCircle`

### 3. sitemap.xml dynamique

`src/app/sitemap.ts` — convention Next.js App Router (`export default async function sitemap()`).

Routes incluses :
| Route | changeFrequency | priority |
|---|---|---|
| `/` | daily | 1.0 |
| `/search` | hourly | 0.9 |
| `/shoes/[slug]` (toutes annonces actives) | weekly | 0.8 |
| `/about` | monthly | 0.5 |
| `/contact` | monthly | 0.4 |
| `/terms` | yearly | 0.3 |
| `/privacy` | yearly | 0.3 |

Fetch des slugs : `GET /listings/search?limit=500&sortBy=date` — revalidation 1h.

### 4. robots.txt

`src/app/robots.ts` — convention Next.js.

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /profile/
Disallow: /chat/
Disallow: /api/

Sitemap: https://bigtank.sn/sitemap.xml
```

### 5. OG image par défaut

`src/app/opengraph-image.tsx` — fichier spécial Next.js qui génère automatiquement `<meta og:image>` pour toutes les pages sans OG image propre.

- Runtime `edge` (Satori/ImageResponse)
- Dimensions : 1200×630px (standard OG)
- Design : fond `#1a1a2e` (primary), titre "BigTank" en blanc, ligne accent `#e94560`, sous-titre et badge URL

Automatiquement hérité par toutes les pages sauf celles qui définissent leur propre `og:image` (ex: fiche détail avec photo de la chaussure).

### 6. Focus visible ring cohérent

Dans `globals.css` :

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

- Utilise `--color-accent` (`#e94560`) — couleur de marque
- `focus-visible` (pas `focus`) → ne s'affiche qu'à la navigation clavier, invisible à la souris
- S'applique à tous les éléments interactifs : boutons, liens, inputs, selects

---

## Backlog UX — état actualisé

### ✅ Complété cette session
- [x] **Empty state illustré /search** — SVG loupe + CTA contextuel
- [x] **Empty state illustré /chat** — SVG bulles + CTA "Explorer"
- [x] **sitemap.xml dynamique** — toutes les annonces + routes statiques
- [x] **robots.txt** — indexation correcte, pages auth bloquées
- [x] **OG image par défaut** — générée côté edge (ImageResponse)
- [x] **Focus visible ring** — `:focus-visible` global en CSS

### 🔵 Restant — Priorité moyenne
- [ ] Compteur total annonces dans la section RecentListings

### ⚪ Restant — Priorité basse
- [ ] PWA manifest (mobile Afrique)
- [ ] Badge "Vérifié" pour vendeurs actifs (phase 8)
- [ ] Dark mode

---

## Prochaines étapes

| Phase | Contenu |
|---|---|
| Phase 6 | Panneau Admin (gestion utilisateurs, annonces, modération) — en attente approbation |
| Phase 7 | Déploiement (Vercel + Railway + Cloudflare R2) |
| Phase 8 | Payment-service (offres, Wave/Orange Money) |
