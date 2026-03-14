# Samadal — Plan de mise en production

> Derniere mise a jour : 2026-03-14
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

### 3.5 Profil utilisateur — ✅ FAIT
- [x] Changement mot de passe
- [x] Upload avatar
- [x] Historique ventes/achats (cursor pagination)
- [x] Suivi transactions admin (AuditLog)

### 3.6 OAuth Google/Facebook — ✅ GOOGLE OK, FACEBOOK EN ATTENTE
- [x] Strategies Passport Google + Facebook
- [x] Routes backend + callback
- [x] Boutons frontend (login + register)
- [x] App Google Cloud Console creee + cles configurees
- [x] Separation login/register (register bloque si compte existant)
- [ ] Creer l'app Facebook Developers (en attente verification SMS)

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

---

## PHASE 4 — PAIEMENTS (Intech)

### 4.1 Configuration
- [ ] S'assurer que `INTECH_API_KEY` est configure avec la cle de production
- [ ] Tester le flux complet : initier paiement → push USSD → webhook → activation annonce
- [ ] Verifier que le webhook Intech est accessible depuis l'exterieur (URL publique)

### 4.2 Robustesse
- [x] Timeout sur les appels HTTP (AbortSignal.timeout)
- [x] Idempotence webhook (check status !== PENDING)
- [x] Log structure pour chaque transaction (suivi financier)

---

## PHASE 5 — DEPLOIEMENT ✅ QUASI TERMINEE

> API sur Railway, Frontend sur Vercel, Images sur Cloudflare R2, Search sur Meilisearch Cloud.
> DNS en cours de propagation (samadal.net → Vercel, api.samadal.net → Railway).

### 5.1 Railway ✅
- [x] Creer le projet Railway
- [x] Deployer l'API monolithe (apps/api) — Dockerfile single-stage
- [x] Deployer le frontend sur Vercel (apps/web)
- [x] Configurer PostgreSQL (Railway addon)
- [x] Configurer Redis (Railway addon)

### 5.2 Services externes ✅
- [x] Configurer Meilisearch (Meilisearch Cloud)
- [x] Configurer S3 (Cloudflare R2) pour les images
- [x] R2 public URL + CORS configure

### 5.3 DNS & Domaine ⏳
- [x] Domaine samadal.net achete (LWS)
- [x] api.samadal.net CNAME → Railway (propage)
- [x] samadal.net A record → 76.76.21.21 (Vercel) — propagation en cours
- [ ] SSL automatique (en attente propagation DNS)

### 5.4 Base de donnees
- [x] Passer de `db:push` a de vraies migrations (`pnpm db:migrate`)
- [ ] Backup automatique PostgreSQL
- [ ] Connection pooling si necessaire

### 5.5 Variables d'environnement production ✅
- [x] JWT_SECRET (genere)
- [x] DATABASE_URL (Railway PostgreSQL)
- [x] REDIS_URL (Railway Redis)
- [x] RESEND_API_KEY
- [x] INTECH_API_KEY
- [x] S3 credentials (Cloudflare R2 : S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL)
- [x] MEILISEARCH_URL + MEILISEARCH_API_KEY
- [x] CORS_ORIGIN configure
- [x] WEB_URL configure
- [x] Google OAuth keys (configurees sur Railway)
- [x] SENTRY_DSN (Railway) + NEXT_PUBLIC_SENTRY_DSN (Vercel)
- [ ] Facebook OAuth keys (en attente verification SMS)

---

## PHASE 6 — QUALITE & MONITORING

### 6.1 Monitoring (prioritaire) ✅
- [x] Sentry installe (frontend Next.js + backend NestJS)
- [x] DSN configure sur Vercel + Railway
- [x] Health checks avec verification DB/Redis

### 6.2 Logging (optionnel pour le lancement)
- [ ] Logger structure (Winston/Pino)
- [ ] Niveaux de log + contexte (userId, requestId)

### 6.3 Tests (optionnel pour le lancement)
- [ ] Tests endpoints critiques : auth, listing, payment
- [ ] Tests E2E Playwright (optionnel)

### 6.4 CI/CD (optionnel pour le lancement)
- [ ] `.github/workflows/ci.yml` : lint + build
- [ ] Deploy automatique via Railway (git push)

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
- [x] Tous les secrets de production configures (17 vars sur Railway)
- [x] `.env` pas dans le repo git (gitignore OK)
- [x] HTTPS samadal.net (SSL Vercel OK)
- [x] Emails fonctionnels (Resend + domaine verifie)
- [x] Paiements en pause (gratuit pour tous, code pret)
- [x] Chat temps reel OK
- [x] Admin moderation OK
- [x] Images upload OK (Cloudflare R2)
- [x] Recherche Meilisearch OK (Meilisearch Cloud)
- [x] Rapide sur mobile (240ms TTFB, ~60KB HTML)
- [x] Google OAuth OK
- [x] Sentry monitoring OK
- [x] SEO complet (sitemap, OG, JSON-LD, favicon, PWA)
- [ ] Facebook OAuth (en attente verification SMS)
- [ ] Test multi-navigateurs + appareils
- [x] Google Search Console (propriete verifiee, sitemap soumis)

### 8.2 Donnees initiales
- [x] Compte ADMIN cree
- [x] Comptes test + annonces test supprimes (base nettoyee)
- [x] Meilisearch cle de production

---

## RESUME PAR PRIORITE

| Priorite | Phase | Description | Statut |
|----------|-------|-------------|--------|
| CRITIQUE | Phase 1 | Securite | ✅ FAIT |
| HAUTE | Phase 2 | Emails Resend | ✅ FAIT |
| HAUTE | Phase 3 | Fonctionnalites | ✅ FAIT (reste Facebook OAuth) |
| HAUTE | Phase 4 | Paiements Intech | ⏸ EN PAUSE (gratuit pour tous) |
| HAUTE | Phase 5 | Deploiement Railway+Vercel | ✅ FAIT |
| MOYENNE | Phase 6 | Monitoring (Sentry) | ✅ FAIT |
| BASSE | Phase 7 | Polish frontend / SEO | ✅ SEO FAIT (reste accessibilite, perf) |
| FINALE | Phase 8 | Checklist | ✅ QUASI PRET (reste Facebook, tests, Search Console) |

---

## NOTES

- Architecture : monolithe NestJS (`apps/api`) + Next.js (`apps/web`)
- Deploiement prevu sur Railway (simplifie vs VPS)
- Anciens microservices archives dans `_archive/`
- On met a jour ce fichier a chaque session
