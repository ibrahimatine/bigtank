# Phase 5a — Frontend Next.js (Pages Publiques SEO)

> Date : 17/02/2026

---

## Objectif

Construire les pages publiques SEO-first du frontend Next.js : landing page, recherche avec filtres, et page detail annonce SSR. Pas d'auth ni dashboard dans cette phase.

---

## Stack Frontend

| Technologie | Version | Role |
|---|---|---|
| Next.js | 14.2 (App Router) | Framework React SSR/SSG |
| Tailwind CSS | v4 | Styling utilitaire |
| shadcn/ui | latest | Composants UI (Radix + CVA) |
| Lucide React | latest | Icones |
| Google Fonts | Inter + Space Grotesk | Typographie |

---

## Fichiers crees (15)

### Composants Layout
| Fichier | Role |
|---|---|
| `src/components/layout/header.tsx` | Header sticky : logo, SearchBar, nav |
| `src/components/layout/footer.tsx` | Footer 4 colonnes : brand, liens, tailles, paiements |
| `src/components/search/search-bar.tsx` | Client Component : input recherche → redirect /search |

### Composants Listing
| Fichier | Role |
|---|---|
| `src/components/listing/listing-card.tsx` | Card : placeholder image, brand, titre, taille badge, prix FCFA |
| `src/components/listing/listing-grid.tsx` | Grid responsive 2/3/4 colonnes + skeleton loading |
| `src/components/listing/listing-gallery.tsx` | Client Component : galerie images avec thumbnails |

### Composants Search
| Fichier | Role |
|---|---|
| `src/components/search/search-filters.tsx` | Client Component : filtres sidebar desktop + Sheet mobile |
| `src/components/search/search-results.tsx` | Wrapper resultats avec compteur |

### Composants Home
| Fichier | Role |
|---|---|
| `src/components/home/hero.tsx` | Hero section avec titre, description, SearchBar |
| `src/components/home/recent-listings.tsx` | Server Component async : fetch 8 annonces recentes |

### Pages
| Fichier | Route | Rendu |
|---|---|---|
| `src/app/page.tsx` | `/` | Static (SSG) — Hero + RecentListings + CTA + JSON-LD WebSite |
| `src/app/search/page.tsx` | `/search` | Dynamic (ISR 60s) — Filtres + resultats + metadata dynamique |
| `src/app/[slug]/page.tsx` | `/:slug` | Dynamic (force-dynamic SSR) — Galerie + infos + JSON-LD Product |
| `src/app/not-found.tsx` | 404 | Static — Message + liens retour |

### Lib
| Fichier | Role |
|---|---|
| `src/lib/api.ts` | apiFetch wrapper, searchListings, getListingBySlug, getRecentListings |
| `src/lib/seo.ts` | JSON-LD Product + WebSite generators |
| `src/lib/utils.ts` | Helper cn() (shadcn) |
| `src/types/index.ts` | SearchFilterState, CONDITION_LABELS, SORT_OPTIONS, POPULAR_BRANDS |

### UI (shadcn)
8 composants installes : button, card, badge, input, select, separator, skeleton, sheet

---

## Fichiers modifies (5)

| Fichier | Modification |
|---|---|
| `src/app/layout.tsx` | Reecrit : Google Fonts, Header/Footer, metadata template, CSS vars |
| `src/app/globals.css` | Reecrit : Tailwind v4 @import + @theme Samadal |
| `packages/shared-types/src/listing.ts` | Ajout `slug: string` a l'interface Listing |
| `packages/shared-config/tsconfig.nextjs.json` | Ajout `"DOM"` + `"DOM.Iterable"` dans lib |
| `packages/database/src/seed.ts` | Ajout `slug` aux 3 listings de seed |
| `turbo.json` | Ajout NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL a globalEnv |

---

## Design

| Element | Valeur |
|---|---|
| Primary | #1a1a2e (navy fonce) |
| Accent | #e94560 (rouge Samadal) |
| Background | #f5f5f5 |
| Font body | Inter |
| Font display | Space Grotesk (titres, prix) |
| Grid | 2 cols mobile → 3 cols tablette → 4 cols desktop |
| Filtres mobile | Sheet (slide-in depuis la gauche) |

---

## SEO

- **JSON-LD WebSite** sur la landing page (avec SearchAction)
- **JSON-LD Product** sur chaque page detail (brand, offers XOF, condition, seller)
- **OpenGraph** dynamique avec images pour les annonces
- **Metadata template** : `%s | Samadal` pour toutes les pages
- **SSR** pour les pages detail (force-dynamic) — Google indexe le contenu complet
- **ISR 60s** pour la recherche — contenu frais avec cache performant

---

## Build Output

```
Route (app)                  Size     First Load JS
┌ ○ /                        1.37 kB  97.3 kB
├ ○ /_not-found              138 B    87.4 kB
├ ƒ /[slug]                  6.24 kB  103 kB
└ ƒ /search                  32 kB    137 kB
+ First Load JS shared       87.3 kB

○ Static    ƒ Dynamic
```

Build : **11/11 packages OK**

---

## Filtres Recherche

| Filtre | Type | Options |
|---|---|---|
| Marque | Select | Nike, Adidas, New Balance, Puma, Jordan, Reebok, Timberland, Vans, Converse |
| Taille EU | Range (min/max) | 36-60 |
| Prix FCFA | Range (min/max) | Libre |
| Etat | Select | Neuf, Comme neuf, Bon etat, Etat correct |
| Tri | Select | Plus recents, Prix croissant, Prix decroissant, Populaires |

---

## Notes

- Les **images ne sont pas retournees par Meilisearch** dans les resultats de recherche → listing cards affichent un placeholder "Pas de photo". Normal pour Phase 5a.
- Les boutons **"Contacter le vendeur"** et **"Faire une offre"** sont presents mais **desactives** (opacity 50%, cursor not-allowed). Ils seront actives en Phase 5b/5c.
- La recherche communique avec l'API via `NEXT_PUBLIC_API_URL` (http://localhost:4000/api en dev).

---

## Prochaines etapes

| Phase | Contenu |
|---|---|
| Phase 5b | Pages authentifiees (login, register, dashboard vendeur, profil) |
| Phase 5c | Chat UI temps reel (Socket.io client, pages conversation) |
