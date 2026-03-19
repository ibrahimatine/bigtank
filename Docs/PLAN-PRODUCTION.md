# Samadal — Plan de mise en production

> Derniere mise a jour : 2026-03-19
> Ce fichier liste TOUT ce qu'il reste a faire avant de passer en production.
> On coche au fur et a mesure qu'on avance.

---

## LEGENDE

- [ ] A faire
- [x] Deja fait

---

## PHASE 1 — SECURITE ✅ TERMINEE

- [x] CORS WebSocket restreint a CORS_ORIGIN
- [x] JWT secrets obligatoires (crash si manquant)
- [x] Endpoints internes proteges (X-Internal-Key) — supprime en monolithe (injection directe)
- [x] Verification participants WebSocket avant join
- [x] Validation env au demarrage en production

---

## PHASE 2 — EMAILS & NOTIFICATIONS ✅ TERMINEE

- [x] Compte Resend cree et domaine `send.samadal.net` verifie
- [x] Cle API configuree dans `.env`
- [x] Emails fonctionnels et testes (bienvenue, reset mdp, notifications)
- [x] Templates responsive (media queries mobile)
- [x] Templates : bienvenue, nouveau message, annonce publiee, annonce vendue, paiement, expiration, reset mdp
- [x] Template email admin broadcast (corrige 2026-03-19 — envoyait le template welcome)

---

## PHASE 3 — FONCTIONNALITES ✅ TERMINEE

### 3.1 Mot de passe oublie — ✅ FAIT
- [x] Backend + Frontend + Email template

### 3.2 Expiration des annonces — ✅ FAIT
- [x] CRON job + rappel 3 jours + affichage dashboard

### 3.3 Upload d'images — ✅ FAIT
- [x] Verifier le composant `ImageUploadWrapper` en creation ET edition (bug fix: refresh images)
- [x] Flux complet : presign URL → upload S3/R2 → confirm (fonctionne en prod)
- [x] Limite 5 Mo + compression client

### 3.4 Search — ✅ FAIT
- [x] Meilisearch integre directement dans le monolithe
- [x] Migration vers PostgreSQL ILIKE (Meilisearch supprime pour reduire les couts — 2026-03-18)

### 3.5 Profil utilisateur — ✅ FAIT
- [x] Changement mot de passe
- [x] Upload avatar
- [x] Historique ventes/achats (cursor pagination)
- [x] Suivi transactions admin (AuditLog)

### 3.6 OAuth Google — ✅ FAIT
- [x] Strategie Passport Google
- [x] Routes backend + callback
- [x] Boutons frontend (login + register)
- [x] App Google Cloud Console creee + cles configurees
- [x] Separation login/register (register bloque si compte existant)
- [x] Facebook OAuth supprime (2026-03-19) — pas utilise, simplifie le code

### 3.7 Migration monolithe — ✅ FAIT
- [x] `apps/api` = backend unique (port 4000)
- [x] Anciens microservices archives dans `_archive/`
- [x] Frontend mis a jour (WebSocket, URLs API)
- [x] Refresh token automatique sur toutes les routes
- [x] Build OK, teste en dev + mobile

### 3.8 Responsive mobile — ✅ FAIT
- [x] Formulaires profil/annonce adaptes
- [x] Notifications dropdown, page recherche, grille annonces, admin, page produit
- [x] Teste sur telephone

### 3.9 Branding — ✅ FAIT
- [x] Logo "Samadal" partout (header + footer)
- [x] Marketplace toutes tailles (plus "grandes tailles uniquement")
- [x] Filtres rapides : EU 38-39, 40-41, 42-43, 44-45, 46+
- [x] Filtres landing page en mode toggle (comme mobile)

### 3.10 Verification email — ✅ FAIT
- [x] Token genere a l'inscription
- [x] Endpoint POST /auth/verify-email + POST /auth/resend-verification
- [x] Template email de verification (Resend)
- [x] Page frontend /verify-email?token=xxx

### 3.11 Messages d'erreur — ✅ FAIT
- [x] Propagation correcte backend → frontend (data.message en priorite)
- [x] Affichage visible dans les formulaires (register, login)

### 3.12 Paiements en pause — ✅ FAIT
- [x] Annonces publiees directement en ACTIVE (gratuit pour tous)
- [x] Pas de redirection vers la page de paiement

### 3.13 Admin ameliorations — ✅ FAIT
- [x] Changement de statut sync avec Meilisearch (ACTIVE = indexe, autres = retire)
- [x] Mobile UX : barre de navigation en bas + cartes au lieu de tableaux
- [x] Compte admin configure (ibrahimatine29@gmail.com)
- [x] Bottom sheet pour changement de statut (mobile-friendly)
- [x] Bouton "Reindexer" pour resync Meilisearch

### 3.14 UX plateforme — ✅ FAIT
- [x] Blocage login tant que email non verifie
- [x] 2 colonnes d'annonces sur mobile (au lieu d'1)
- [x] Carousel d'images sur les cartes d'annonces (swipe + fleches)
- [x] Suppression photo de profil
- [x] "sneakers" remplace par "chaussures" partout
- [x] Chat : correction messages suivants qui ne passaient pas (dep array socket)
- [x] Bouton "Vendre mes chaussures" dans le hero fonctionne
- [x] Nouveau logo Samadal

### 3.15 Chat systeme admin — ✅ FAIT (2026-03-18/19)
- [x] Conversations systeme (isSystem flag, listingId nullable)
- [x] Messages admin (suspend, ban, unban, activate, delete listing) apparaissent dans le chat
- [x] Design bulle Samadal (avatar S accent, nom "Samadal", style distinct)
- [x] Input masque pour les conversations systeme (lecture seule)
- [x] Emission WebSocket pour affichage temps reel (corrige 2026-03-19)

### 3.16 Infra simplifiee — ✅ FAIT (2026-03-18)
- [x] Meilisearch supprime — recherche 100% PostgreSQL (ILIKE)
- [x] Redis supprime — rate limiting en memoire (MemoryStoreService)
- [x] Economie couts Railway

---

## PHASE 4 — PAIEMENTS (Intech) ⏸ EN PAUSE

> En pause — annonces publiees gratuitement pour attirer les premiers vendeurs.
> A reactiver quand le volume le justifie.

### 4.1 Configuration
- [ ] S'assurer que `INTECH_API_KEY` est configure avec la cle de production
- [ ] Tester le flux complet : initier paiement → push USSD → webhook → activation annonce
- [ ] Verifier que le webhook Intech est accessible depuis l'exterieur (URL publique)

### 4.2 Robustesse
- [x] Timeout sur les appels HTTP (AbortSignal.timeout)
- [x] Idempotence webhook (check status !== PENDING)
- [x] Log structure pour chaque transaction (suivi financier)

---

## PHASE 5 — DEPLOIEMENT ✅ TERMINEE

> API sur Railway, Frontend sur Vercel, Images sur Cloudflare R2.
> PostgreSQL seul (Redis et Meilisearch supprimes pour reduire les couts).

### 5.1 Railway ✅
- [x] Creer le projet Railway
- [x] Deployer l'API monolithe (apps/api) — Dockerfile single-stage
- [x] Deployer le frontend sur Vercel (apps/web)
- [x] Configurer PostgreSQL (Railway addon)
- [x] ~~Redis~~ (supprime 2026-03-18, remplace par memoire)

### 5.2 Services externes ✅
- [x] ~~Meilisearch~~ (supprime 2026-03-18, remplace par PostgreSQL ILIKE)
- [x] Configurer S3 (Cloudflare R2) pour les images
- [x] R2 public URL + CORS configure

### 5.3 DNS & Domaine ✅
- [x] Domaine samadal.net achete (LWS)
- [x] api.samadal.net CNAME → Railway
- [x] samadal.net → Vercel
- [x] SSL automatique (Vercel + Railway)

### 5.4 Base de donnees
- [x] Passer de `db:push` a de vraies migrations (`pnpm db:migrate`)
- [ ] Backup automatique PostgreSQL
- [ ] Connection pooling si necessaire

### 5.5 Variables d'environnement production ✅
- [x] JWT_SECRET (genere)
- [x] DATABASE_URL (Railway PostgreSQL)
- [x] ~~REDIS_URL~~ (supprime)
- [x] RESEND_API_KEY
- [x] INTECH_API_KEY
- [x] S3 credentials (Cloudflare R2 : S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL)
- [x] ~~MEILISEARCH_URL + MEILISEARCH_API_KEY~~ (supprime)
- [x] CORS_ORIGIN configure
- [x] WEB_URL configure
- [x] Google OAuth keys (configurees sur Railway)
- [x] SENTRY_DSN (Railway) + NEXT_PUBLIC_SENTRY_DSN (Vercel)
- [x] ~~Facebook OAuth~~ (supprime 2026-03-19, pas utilise)

---

## PHASE 6 — QUALITE & MONITORING

### 6.1 Monitoring ✅
- [x] Sentry installe (frontend Next.js + backend NestJS)
- [x] DSN configure sur Vercel + Railway
- [x] Health checks avec verification DB

### 6.2 Logging (optionnel pour le lancement)
- [ ] Logger structure (Winston/Pino)
- [ ] Niveaux de log + contexte (userId, requestId)

### 6.3 Tests (optionnel pour le lancement)
- [ ] Tests endpoints critiques : auth, listing, payment
- [ ] Tests E2E Playwright (optionnel)

### 6.4 CI/CD ✅ FAIT
- [x] `.github/workflows/ci.yml` : lint + build (PostgreSQL service, Prisma generate+push)
- [ ] Deploy automatique via Railway (git push) — optionnel, deploy manuel via `railway up`

---

## PHASE 7 — POLISH FRONTEND ✅ SEO FAIT

- [ ] Accessibilite (aria-labels, navigation clavier)
- [ ] Performance (next/image, lazy loading, Core Web Vitals)
- [ ] UX (scroll chat, retry API, page contact)
- [x] SEO : sitemap dynamique, robots.txt, JSON-LD, OpenGraph
- [x] Favicon + Apple icon (logo S rouge)
- [x] Images OG dynamiques par annonce (titre + prix + photo)
- [x] PWA manifest (installable sur mobile)
- [x] noindex sur pages privees (dashboard, chat)
- [x] theme-color meta tag
- [x] Google Search Console (propriete verifiee, sitemap soumis)

---

## PHASE 8 — CHECKLIST AVANT LANCEMENT

### 8.1 Checklist
- [x] Tous les secrets de production configures
- [x] `.env` pas dans le repo git (gitignore OK)
- [x] HTTPS samadal.net (SSL Vercel OK)
- [x] Emails fonctionnels (Resend + domaine verifie)
- [x] Paiements en pause (gratuit pour tous, code pret)
- [x] Chat temps reel OK (+ messages systeme admin)
- [x] Admin moderation OK (+ email broadcast corrige)
- [x] Images upload OK (Cloudflare R2)
- [x] Recherche PostgreSQL OK (Meilisearch supprime)
- [x] Rapide sur mobile (240ms TTFB, ~60KB HTML)
- [x] Google OAuth OK
- [x] Sentry monitoring OK
- [x] SEO complet (sitemap, OG, JSON-LD, favicon, PWA)
- [x] ~~Facebook OAuth~~ (supprime, pas utilise)
- [x] CI/CD GitHub Actions (lint + build)
- [ ] Test multi-navigateurs + appareils
- [x] Google Search Console (propriete verifiee, sitemap soumis)

### 8.2 Donnees initiales
- [x] Compte ADMIN cree
- [x] Comptes test + annonces test supprimes (base nettoyee)

---

## PHASE 9 — ACQUISITION & CROISSANCE (NOUVEAU)

> Voir `Docs/STRATEGIE-100-VENDEURS.md` pour le plan detaille.

### 9.1 Features produit pour acquisition
- [ ] Badge "Vendeur Pionnier" (100 premiers vendeurs)
- [ ] Bouton partage WhatsApp sur chaque annonce
- [ ] Compteur de vues par annonce (visible par le vendeur)
- [ ] Tableau de bord vendeur simple (vues totales, messages, ventes)
- [ ] Lien partageable avec preview Open Graph (deja en place)

### 9.2 Features produit pour retention
- [ ] Notification "ton annonce a ete vue X fois"
- [ ] Gamification : badges (Actif, Top Vendeur)
- [ ] Classement mensuel Top 10 vendeurs

### 9.3 Monetisation (plus tard)
- [ ] Boost d'annonces payant (500-1000 FCFA)
- [ ] Abonnement "Samadal Pro" (2000 FCFA/mois)
- [ ] Commission sur vente securisee (3-5%)

### 9.4 Marketing terrain
- [ ] Compte Instagram @samadal.sn cree
- [ ] Premiers DM envoyes (objectif 150+)
- [ ] Premiers vendeurs inscrits (objectif 20-30 en 7 jours)
- [ ] Contenu publie (posts, stories, reels)

---

## RESUME PAR PRIORITE

| Priorite | Phase | Description | Statut |
|----------|-------|-------------|--------|
| CRITIQUE | Phase 1 | Securite | ✅ FAIT |
| HAUTE | Phase 2 | Emails Resend | ✅ FAIT |
| HAUTE | Phase 3 | Fonctionnalites | ✅ FAIT |
| HAUTE | Phase 4 | Paiements Intech | ⏸ EN PAUSE (gratuit pour tous) |
| HAUTE | Phase 5 | Deploiement Railway+Vercel | ✅ FAIT |
| MOYENNE | Phase 6 | Monitoring + CI/CD | ✅ FAIT |
| BASSE | Phase 7 | Polish frontend / SEO | ✅ SEO FAIT (reste accessibilite, perf) |
| FINALE | Phase 8 | Checklist | ✅ PRET (reste tests multi-navigateurs) |
| ACTIVE | Phase 9 | Acquisition & Croissance | 🚀 EN COURS |

---

## NOTES

- Architecture : monolithe NestJS (`apps/api`) + Next.js (`apps/web`)
- Deploiement : Railway (API + PostgreSQL) + Vercel (frontend)
- Anciens microservices archives dans `_archive/`
- Redis et Meilisearch supprimes (2026-03-18) — PostgreSQL + memoire suffisants
- On met a jour ce fichier a chaque session
