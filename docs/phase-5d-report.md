# Phase 5d — UX Polish & Features Frontend

> Date : 19/02/2026

---

## Objectif

Améliorer l'expérience utilisateur du frontend avec des features manquantes identifiées lors des tests : autocomplete de recherche, articles similaires, pagination, toasts, dates relatives, breadcrumb, pages statiques, partage, et optimisations performances.

---

## Bug critique corrigé

### `apiFetch` — mauvaise extraction des résultats paginés

**Problème :** `apiFetch` faisait `json.data !== undefined ? json.data : json`. L'auth-service enveloppe ses réponses dans `{ success: true, data: ... }` → le unwrap était correct. Mais le listing-service retourne directement `{ data: [...hits], total, cursor, hasMore }` (PaginatedResult) sans enveloppe. Le unwrap extrayait seulement le tableau de hits, cassant `result.data`, `result.total`, `result.hasMore` sur toutes les pages paginées.

**Fix (`src/lib/api.ts`) :**
```ts
// Avant
return json.data !== undefined ? json.data : json;

// Après — ne dépaqueter que si json.data n'est PAS un tableau
if (json.data !== undefined && !Array.isArray(json.data)) {
  return json.data as T;
}
return json as T;
```

**Impact :** SearchResults, SearchFilters, articles similaires sur la fiche détail, Load More — tout fonctionnait mal silencieusement avant ce fix.

---

## Fichiers créés (9)

| Fichier | Role |
|---|---|
| `src/components/search/load-more.tsx` | Client Component : bouton "Charger plus" avec fetch client, skeletons pendant chargement |
| `src/components/listing/share-button.tsx` | Client Component : dropdown Partager (WhatsApp + Copier le lien) |
| `src/app/about/page.tsx` | Page statique A propos (histoire, valeurs, mission BigTank) |
| `src/app/contact/page.tsx` | Page statique Contact (3 canaux + formulaire mailto) |
| `src/app/terms/page.tsx` | Page statique CGU (9 articles) |
| `src/app/privacy/page.tsx` | Page statique Confidentialite (RGPD-compatible) |
| `src/app/error.tsx` | Boundary d'erreur global (Client Component) avec boutons Réessayer / Accueil |
| `docs/SETUP.md` | Guide complet pour forker le projet (prérequis, commandes, 11 cas d'erreur) |

---

## Fichiers modifiés (12)

| Fichier | Modification |
|---|---|
| `src/lib/api.ts` | Fix bug apiFetch paginated results (voir section ci-dessus) |
| `src/components/search/search-bar.tsx` | Autocomplete avec debounce 300ms, dropdown suggestions, fermeture Escape/click extérieur |
| `src/components/search/search-results.tsx` | Ajout prop `filters` + intégration `<LoadMore />` |
| `src/components/listing/listing-card.tsx` | `next/image` pour les thumbnails + dates relatives ("il y a X jours") |
| `src/components/dashboard/my-listing-card.tsx` | `next/image` pour les thumbnails dashboard |
| `src/components/dashboard/listing-actions.tsx` | Toasts : "Marquée comme vendue", "Remise en vente", "Annonce supprimée", erreurs |
| `src/components/dashboard/listing-form.tsx` | Toast "Annonce mise à jour" en mode edit |
| `src/components/profile/profile-form.tsx` | Toasts : "Profil mis à jour", "Vous êtes maintenant vendeur !" — remplace banners inline |
| `src/components/home/hero.tsx` | SearchBar avec autocomplete ajoutée dans le hero (visible sans scroller) |
| `src/app/shoes/[slug]/page.tsx` | Breadcrumb nav + `<ShareButton />` + section "Annonces similaires" |
| `src/app/search/page.tsx` | Passe `filters` à `<SearchResults />` pour la pagination |
| `src/app/layout.tsx` | `<Toaster position="bottom-right" richColors closeButton />` (Sonner) |

---

## Fonctionnalités détaillées

### 1. Autocomplete dans la SearchBar

- Déclenché dès 2 caractères, debounce 300ms
- Paramètre `?query=` (pas `?q=`) — conforme au DTO backend
- Dropdown avec thumbnail, marque · taille EU, titre, prix FCFA
- Clic suggestion → navigate vers fiche annonce + vide le champ
- Bouton "Voir tous les résultats" en bas → redirect `/search?query=...`
- Fermeture : clic extérieur ou touche `Escape`

### 2. Articles similaires sur la fiche détail

- Requête server-side : `searchListings({ brand: listing.brand, limit: 5 })`
- Filtre l'annonce courante, affiche max 4 résultats
- Grille 2→3→4 colonnes avec `ListingCard`
- Section masquée si aucun résultat

### 3. Load More sur la page search

- Première page : Server Component SSR (SEO préservé)
- Load More : Client Component — fetch direct vers l'API avec le cursor
- Cumul des résultats dans `extraListings` state
- Skeletons (4 cards) pendant le chargement
- Disparaît quand `hasMore = false`

### 4. Toast notifications (Sonner)

Package : `sonner@latest`

| Action | Toast |
|---|---|
| Annonce marquée vendue | ✅ "Marquée comme vendue" |
| Annonce remise en vente | ✅ "Remise en vente" |
| Annonce supprimée | ✅ "Annonce supprimée" |
| Annonce mise à jour (edit) | ✅ "Annonce mise à jour" |
| Profil sauvegardé | ✅ "Profil mis à jour" |
| Activation vendeur | ✅ "Vous êtes maintenant vendeur !" |
| Lien copié | ✅ "Lien copié !" |
| Erreurs API | ❌ Toast rouge avec message |

### 5. Dates relatives sur les ListingCard

```ts
function timeAgo(ts: number): string {
  const ms = ts < 1e10 ? ts * 1000 : ts; // Meilisearch stocke en secondes Unix
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return "a l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  if (diff < 2592000) return `il y a ${Math.floor(diff / 604800)} sem`;
  return `il y a ${Math.floor(diff / 2592000)} mois`;
}
```

### 6. Breadcrumb sur la fiche détail

```
Accueil > Annonces > Nike > Jordan 1 Retro EU 48
```
Le lien de la marque redirige vers `/search?brand=Nike`.

### 7. Bouton Partager (WhatsApp + copier le lien)

- Dropdown avec SVG WhatsApp (vert) et bouton copier (Clipboard API)
- WhatsApp : `wa.me/?text=Titre — URL`
- Toast de confirmation "Lien copié !"
- Remplace le bouton "Faire une offre" désactivé

### 8. next/image

- `ListingCard` : `fill` + `sizes="(max-width: 640px) 50vw, ..."`
- `MyListingCard` : `fill` + `sizes` responsive dashboard
- `ListingGallery` : déjà en next/image depuis Phase 5a ✅

### 9. Pages statiques

| Route | Contenu |
|---|---|
| `/about` | Histoire BigTank, valeurs (Simplicité, Confiance, Communauté) |
| `/contact` | Email, support, délai réponse + formulaire mailto |
| `/terms` | 9 articles CGU (obligations vendeur/acheteur, responsabilité, IP) |
| `/privacy` | Données collectées, droits utilisateur, cookies httpOnly, conservation |

---

## Backlog UX — état actualisé

### ✅ Complété cette session
- [x] Toast notifications (Sonner)
- [x] "Il y a X jours" sur ListingCard
- [x] Breadcrumb sur `/shoes/[slug]`
- [x] Pages `/about`, `/terms`, `/privacy`, `/contact`
- [x] Autocomplete SearchBar avec suggestions
- [x] Articles similaires sur la fiche détail
- [x] Load More pagination sur `/search`
- [x] next/image sur listing-card et my-listing-card
- [x] Bouton Partager (WhatsApp + clipboard)
- [x] SearchBar dans le hero (landing page)
- [x] Error boundary global (`error.tsx`)
- [x] Fix bug apiFetch résultats paginés

### 🔶 Restant — Priorité haute
- [ ] **Empty states illustrés** : `/search` sans résultat, `/chat` sans conversation
- [ ] **Tooltip "Bientôt disponible"** sur "Faire une offre" (phase 6)
- [ ] **Focus ring** cohérent sur tous les éléments interactifs

### 🔵 Restant — Priorité moyenne
- [ ] `sitemap.xml` dynamique (routes `/shoes/[slug]`)
- [ ] `robots.txt`
- [ ] OG image par défaut (logo BigTank pour partages sans annonce)
- [ ] Compteur total annonces dans la section RecentListings

### ⚪ Restant — Priorité basse
- [ ] PWA manifest (mobile Afrique)
- [ ] Badge "Vérifié" pour vendeurs actifs (phase 8)
- [ ] Dark mode

---

## Stack ajoutée

| Package | Version | Usage |
|---|---|---|
| `sonner` | latest | Toast notifications |

---

## Prochaines étapes

| Phase | Contenu |
|---|---|
| Phase 6 | Panneau Admin (gestion utilisateurs, annonces, modération) — en attente approbation |
| Phase 7 | Déploiement (Vercel + Railway + Cloudflare R2) |
| Phase 8 | Payment-service (offres, Wave/Orange Money) |
