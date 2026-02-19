# BigTank — Rapport UI/UX
> Date : 19/02/2026 | Version : 1.0

---

## 1. Modifications appliquées dans cette session

| Fichier | Changement |
|---|---|
| `hero.tsx` | Suppression des mentions Wave / Orange Money / Free Money |
| `footer.tsx` | Section paiements avec badges colorés + liens secondaires (CGU, Confidentialité, Contact) |
| `page.tsx` | Barre de filtres rapides scrollable + section "Pourquoi BigTank?" + CTA vendeur amélioré |

---

## 2. Checklist UI/UX — Priorités

### ✅ Déjà en place
- [x] Header sticky avec SearchBar globale unique
- [x] Hero compact, orienté conversion, sans mentions paiement
- [x] Filtres rapides (marques + tailles + état) sous le hero
- [x] Cards annonces avec badge taille sur fond solide (jamais texte sur image brute)
- [x] Skeleton loaders sur toutes les grilles
- [x] Middleware de protection des routes auth
- [x] Combobox marque avec saisie libre
- [x] Chat : bulles rouge/gris distincts, scroll correct, ordre ASC
- [x] Badge "Messages non lus" dans le menu utilisateur
- [x] Responsive header (SearchBar repliée sur mobile)
- [x] JSON-LD SEO sur landing + detail annonce

### 🔶 À faire — Priorité haute
- [ ] **Toast notifications** : confirmer actions (annonce publiée, message envoyé, profil mis à jour). Utiliser `sonner` ou un composant Toast shadcn/ui
- [ ] **Bouton "Faire une offre"** : activer en Phase 6 (payment-service). Pour l'instant afficher un tooltip "Bientôt disponible" au survol au lieu de le griser sans explication
- [ ] **Empty states illustrés** : page `/search` sans résultats, `/chat` sans conversations, `/dashboard` sans annonces — remplacer les textes nus par des illus légères + CTA contextuel
- [ ] **Erreurs fetch** : boundary d'erreur sur RecentListings et SearchResults avec message + bouton "Réessayer"
- [ ] **Image annonce** : fallback emoji 👟 OK mais ajouter shimmer loader pendant le chargement (`loading="lazy"` + skeleton)
- [ ] **Page 404** : améliorer le design (actuellement texte basique)

### 🔵 À faire — Priorité moyenne
- [ ] **Accessibilité** : vérifier contrast ratio (WCAG AA) sur accent #e94560 sur blanc — ratio actuel ~4.1:1, limite AA = 4.5:1. Légèrement insuffisant pour corps de texte, OK pour grands titres
- [ ] **Focus visible** : ajouter `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` sur tous les éléments interactifs
- [ ] **Meta Open Graph** : ajouter image OG par défaut (logo BigTank) pour partages sans annonce spécifique
- [ ] **Compteur annonces** dans le header ou la section récentes ("234 annonces disponibles")
- [ ] **Breadcrumb** sur la page detail annonce pour le SEO
- [ ] **Barre de progression** sur les formulaires multi-étapes (création annonce)

### ⚪ À faire — Priorité basse
- [ ] Pages statiques : `/about`, `/terms`, `/privacy`, `/contact` (liens footer morts pour l'instant)
- [ ] `sitemap.xml` dynamique
- [ ] `robots.txt`
- [ ] PWA manifest pour "Ajouter à l'écran d'accueil" (mobile Afrique)

---

## 3. Analyse UI/UX — Sites inspirants

### Vinted (vinted.fr)
**Points forts :**
- Grid listings très dense, thumbnail carré, peu d'infos → scroll rapide
- Filtres inline toujours visibles en desktop (pas dans un Sheet/drawer)
- Barre de recherche centrale et omniprésente
- Badge "Favoris" sur chaque card (cœur) sans quitter la liste

**Adapté BigTank :**
- Ajouter un bouton favori (cœur) sur les ListingCard sans navigation
- Considérer filtres inline en sidebar fixe desktop (déjà fait) ✅

### StockX (stockx.com)
**Points forts :**
- Identité sneaker assumée : dark mode, typo premium
- "Last Sale" affiché en gros sur chaque card → pricing transparent
- Authentification des paires mise en avant visuellement
- Grid avec ratio 1:1 strict, fond blanc uniforme pour les images

**Adapté BigTank :**
- Mettre le prix en taille plus grande sur les cards ✅ (partiellement fait)
- Fond blanc uniforme sur les images quand pas de photo (déjà fait ✅)
- Envisager dark mode pour donner un feel premium à terme

### GOAT (goat.com)
**Points forts :**
- Photos produit très propres (fond blanc, plusieurs angles)
- Badge "Verified" visible partout → trust signal fort
- Section "How It Works" très simple (3 étapes)
- Filtres par "New" / "Used" très clairs

**Adapté BigTank :**
- Section "Pourquoi BigTank ?" ajoutée ✅ (3 bénéfices)
- Ajouter à terme un badge "Vérifié" pour les vendeurs actifs (Phase 8)
- Section "Comment ça marche" en 3 étapes sur la landing

### Le Bon Coin (leboncoin.fr)
**Points forts :**
- Recherche géographique native → très important pour marché local
- Thumbnail avec ratio 4:3 ✅ (déjà adapté)
- Filtres très accessibles, pas cachés derrière un bouton
- "Il y a X heures" sur chaque card → fraîcheur perçue

**Adapté BigTank :**
- Afficher "Il y a X jours" sur les ListingCard → ajouter `createdAt` dans `ListingSearchResult`
- Filtre région/ville plus proéminent dans les filtres (déjà dans FilterForm mais pas mis en avant)

### Kickz (kickz.com)
**Points forts :**
- Hero avec lifestyle photography (vrais porteurs)
- Catégories visuelles en grid 2x2 avec image de fond
- Barre de filtres rapides horizontale sous le hero ✅ (ajouté)

**Adapté BigTank :**
- Catégories visuelles à envisager en Phase 2 UI (quand on aura des images réelles)

---

## 4. Mockups textuels

### Landing page — structure actuelle après modifications

```
┌─────────────────────────────────────────────────┐
│  HEADER sticky                                   │
│  BigTank   [SearchBar          ]   Explorer  👤  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  HERO  bg-primary py-12                          │
│                                                  │
│  Marketplace #1 au Senegal                       │
│  Chaussures GRANDES TAILLES                      │
│  EU 46 et plus                                   │
│  "Nike, Jordan, Adidas..."                       │
│                                                  │
│  [Explorer les chaussures ↓]  [Toutes les ann.] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  FILTRES RAPIDES — scroll horizontal             │
│  Nike  Jordan  Adidas  NB  EU46  EU47  EU48...  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ANNONCES RECENTES                               │
│                                                  │
│  [Card][Card][Card][Card]                        │
│  [Card][Card][Card][Card]              Voir tout │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  POURQUOI BIGTANK ?                              │
│                                                  │
│  [🔍 Spécialisé]  [🏷 Prix local]  [🛡 Sécurisé] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  CTA VENDEUR  bg-primary                         │
│  Vous avez des chaussures à vendre ?             │
│  [Créer un compte vendeur]  [Explorer d'abord]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  FOOTER  bg-secondary                            │
│  BigTank | Explorer | Informations | Paiements  │
│  ─────────────────────────────────────────────  │
│  © 2026 BigTank   CGU  Confidentialité  🇸🇳     │
└─────────────────────────────────────────────────┘
```

### Footer — section paiements

```
Moyens de paiement
● Wave        ● Orange Money
● Free Money  ● Carte bancaire

(badges pills avec point coloré = Wave bleu,
Orange Money orange, Free Money rouge)
```

---

## 5. Atomic changes restants (backlog UI)

```
[ ] Ajouter Toast provider (sonner) + useToast hook
[ ] Toast sur: login, logout, création annonce, mise à jour profil, envoi message
[ ] Tooltip "Bientôt disponible" sur bouton "Faire une offre"
[ ] Empty state illustré sur /search (no results)
[ ] Empty state illustré sur /chat (no conversations)
[ ] "Il y a X jours" sur ListingCard
[ ] Breadcrumb sur /shoes/[slug]
[ ] Pages /about /terms /privacy /contact (contenu minimal)
[ ] Compteur annonces disponibles dans RecentListings title
[ ] Focus ring cohérent sur tous les interactifs
[ ] OG image par défaut dans metadata
[ ] sitemap.xml dynamique
[ ] robots.txt
```

---

## 6. Palettes & typographie — conformité

| Token | Valeur | Usage |
|---|---|---|
| `--color-primary` | `#1a1a2e` | Header, Hero, Footer CTA |
| `--color-accent` | `#e94560` | CTA, prix, badges, liens actifs |
| `--color-secondary` | `#16213e` | Footer |
| `--color-background` | `#f5f5f5` | Body |
| `--color-border` | `#e5e7eb` | Borders, séparateurs |
| Font body | Inter | Texte courant |
| Font display | Space Grotesk | Titres, prix |

**Contraste à surveiller :** accent `#e94560` sur blanc `#ffffff` = ratio 4.1:1.
- ✅ OK pour texte ≥ 18px (large text, WCAG AA)
- ⚠️ Insuffisant pour corps de texte < 18px — ne pas utiliser l'accent comme couleur de texte principal

---

> Prochaine phase : **Phase 6 — payment-service** (offres, escrow, PayDunya/PayTech)
