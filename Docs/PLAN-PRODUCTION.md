# BigTank — Plan de mise en production

> Derniere mise a jour : 2026-03-10
> Ce fichier liste TOUT ce qu'il reste a faire avant de passer en production.
> On coche au fur et a mesure qu'on avance.

---

## LEGENDE

- [ ] A faire
- [x] Deja fait

---

## PHASE 1 — SECURITE (URGENT, a faire en premier)

Ces problemes peuvent etre exploites par des hackers. A fixer AVANT tout deploiement.

### 1.1 Fixer le CORS WebSocket
- [x] `apps/chat-service/src/chat/chat.gateway.ts` — changer `cors: { origin: '*' }` par `origin: process.env.CORS_ORIGIN`
- **Pourquoi :** N'importe quel site peut se connecter a ton chat et lire/envoyer des messages

### 1.2 Supprimer les fallback JWT secrets
- [x] `apps/auth-service` — jeter une erreur au demarrage si `JWT_SECRET` ou `JWT_REFRESH_SECRET` n'est pas defini
- [x] `apps/api-gateway` — idem pour le JWT_SECRET du middleware
- [x] `apps/chat-service` — gateway + ws-auth guard
- **Pourquoi :** Si tu oublies de mettre la variable en prod, le secret par defaut est utilise = n'importe qui peut forger des tokens

### 1.3 Proteger les endpoints internes
- [x] `POST /notifications/send` — ajouter un header secret (`X-Internal-Key`) que seuls les autres services connaissent
- [x] `PATCH /listings/:id/activate` — idem, verifier le header secret venant du payment-service
- [x] Tous les appelants (auth, listing, chat, payment) envoient le header
- **Pourquoi :** Sans ca, n'importe qui peut envoyer des fausses notifications ou activer des annonces sans payer

### 1.4 Verifier les participants avant join WebSocket
- [x] `apps/chat-service/src/chat/chat.gateway.ts` — dans `handleJoinConversation`, verifier que l'utilisateur est bien participant de la conversation avant de le join dans la room
- **Pourquoi :** Un utilisateur malicieux pourrait espionner les conversations des autres

### 1.5 Empecher les fallbacks localhost en production
- [x] Ajouter des checks au demarrage de chaque service : si `NODE_ENV=production` et qu'une variable critique manque (WEB_URL, CORS_ORIGIN, DATABASE_URL, etc.) → crash immediat avec message clair
- **Pourquoi :** En prod, un fallback vers localhost = service casse silencieusement

---

## PHASE 2 — EMAILS & NOTIFICATIONS (Resend)

Le code est pret, il faut juste configurer.

### 2.1 Configurer Resend (a faire par Tine)
- [ ] Creer un compte sur resend.com
- [ ] Configurer et verifier ton domaine (ex: bigtank.sn) dans Resend
- [ ] Mettre la cle API dans `.env` : `RESEND_API_KEY=re_xxxxxxxxx`
- [ ] Mettre l'adresse d'envoi : `EMAIL_FROM=BigTank <noreply@bigtank.sn>`
- [ ] Tester en dev : s'inscrire → verifier qu'un email de bienvenue arrive

### 2.2 Templates email deja prets
- [x] Email de bienvenue (inscription)
- [x] Nouveau message (chat)
- [x] Annonce publiee
- [x] Annonce vendue

### 2.3 Templates email a ajouter
- [x] Email de paiement reussi (confirmation avec recapitulatif) — `sendPaymentSuccess`
- [x] Email d'expiration d'annonce (rappel avant les 60 jours) — `sendListingExpiringSoon`
- [x] Email de reinitialisation de mot de passe (forgot password) — `sendPasswordReset`
- [x] Tous branches dans NotificationsService (PAYMENT_RECEIVED, LISTING_EXPIRING)

---

## PHASE 3 — FONCTIONNALITES MANQUANTES

### 3.1 Mot de passe oublie (Forgot Password)
- [x] Backend : endpoint `POST /auth/forgot-password` → genere un token + envoie email
- [x] Backend : endpoint `POST /auth/reset-password` → verifie token + change mot de passe
- [x] Frontend : page `/forgot-password` avec formulaire email/telephone
- [x] Frontend : page `/reset-password?token=xxx` avec formulaire nouveau mot de passe
- [x] Template email Resend pour le lien de reinitialisation

### 3.2 Expiration des annonces
- [x] Backend : CRON job qui desactive les annonces expirees (apres 60 jours)
- [x] Backend : CRON job de rappel (email/notif 3 jours avant expiration)
- [x] Frontend : afficher "Expire dans X jours" sur le dashboard vendeur

### 3.3 Upload d'images sur les annonces
- [ ] Verifier que le composant `ImageUploadWrapper` fonctionne bien en creation ET en edition
- [ ] Tester le flux complet : presign URL → upload vers MinIO → confirm image
- [x] Limiter la taille des images (max 5 Mo par image) — validation frontend + backend
- [x] Compression/redimensionnement des images cote client (max 1200px, JPEG 85%)

### 3.4 Search Service
- [x] Decider : search-service supprime (port 4006) — Meilisearch est appele directement depuis listing-service
- [ ] Verifier la synchronisation Meilisearch : quand une annonce est creee/modifiee/supprimee, l'index est-il mis a jour ?

### 3.5 Gestion du profil utilisateur
- [x] Permettre le changement de mot de passe (depuis la page profil)
- [ ] Permettre l'upload d'une photo de profil (avatar)
- [ ] Afficher l'historique des ventes/achats

---

## PHASE 4 — PAIEMENTS (Intech)

### 4.1 Configuration
- [ ] S'assurer que `INTECH_API_KEY` est configure avec la cle de production
- [ ] Tester le flux complet : initier paiement → push USSD → webhook → activation annonce
- [ ] Verifier que le webhook Intech est accessible depuis l'exterieur (URL publique)

### 4.2 Robustesse
- [x] Ajouter un timeout sur les appels HTTP inter-services (10-15 secondes) — AbortSignal.timeout
- [x] Gerer le cas ou le webhook arrive en double (idempotence) — deja implemente (check status !== PENDING)
- [ ] Ajouter un log structure pour chaque transaction (suivi financier)

---

## PHASE 5 — INFRASTRUCTURE & DEPLOIEMENT

### 5.1 Reverse proxy + SSL
- [ ] Installer nginx comme reverse proxy devant tous les services
- [ ] Configurer SSL avec Let's Encrypt (HTTPS obligatoire)
- [ ] Rediriger HTTP → HTTPS
- [ ] Configurer le proxy WebSocket pour le chat

### 5.2 Gestion de processus
- [ ] Remplacer `nohup` par PM2 ou systemd pour gerer les services
- [x] Creer un fichier `ecosystem.config.js` (PM2) avec tous les services — avec max_memory_restart et log rotation
- [ ] Configurer le redemarrage automatique en cas de crash
- [ ] Configurer la rotation des logs

### 5.3 Docker (optionnel mais recommande)
- [ ] Creer un Dockerfile pour chaque microservice
- [ ] Creer un `docker-compose.prod.yml`
- [ ] Creer un `.dockerignore`

### 5.4 Base de donnees
- [ ] Passer de `db:push` a de vraies migrations (`pnpm db:migrate`) en production
- [ ] Mettre en place un backup automatique PostgreSQL (quotidien)
- [ ] Configurer le connection pooling (PgBouncer ou Prisma Accelerate)

### 5.5 Stockage images
- [ ] En production : migrer de MinIO vers AWS S3 (ou garder MinIO auto-heberge)
- [ ] Configurer un CDN devant le stockage images (CloudFront, Cloudflare, etc.)
- [ ] Mettre des headers de cache sur les images

### 5.6 DNS & Domaine
- [ ] Acheter/configurer le domaine (ex: bigtank.sn)
- [ ] Configurer les enregistrements DNS (A, CNAME pour api.bigtank.sn, etc.)
- [ ] Configurer les variables d'environnement avec les URLs de production

---

## PHASE 6 — QUALITE & MONITORING

### 6.1 Logging structure
- [ ] Installer Winston ou Pino dans chaque service
- [ ] Remplacer tous les `console.log` par le logger structure
- [ ] Ajouter des niveaux de log (debug, info, warn, error)
- [ ] Ajouter des timestamps et du contexte (userId, requestId, etc.)

### 6.2 Monitoring
- [ ] Installer un service d'erreurs (Sentry ou equivalent) — capture automatique des crashs
- [x] Ameliorer les health checks : verifier DB, Redis dans chaque `/health` — retourne status degraded si erreur
- [ ] (Optionnel) Prometheus + Grafana pour les metriques

### 6.3 Tests
- [ ] Ecrire des tests pour les endpoints critiques :
  - [ ] Auth : register, login, refresh token
  - [ ] Listing : create, search, activate
  - [ ] Payment : initiate, webhook
- [ ] (Optionnel) Tests end-to-end avec Playwright sur le frontend

### 6.4 CI/CD
- [ ] Creer `.github/workflows/ci.yml` : lint + build + tests a chaque push
- [ ] (Optionnel) Pipeline de deploiement automatique

---

## PHASE 7 — POLISH FRONTEND

### 7.1 Accessibilite
- [ ] Ajouter des `aria-label` sur les boutons icones (menu, theme toggle, etc.)
- [ ] Verifier la navigation au clavier sur les formulaires
- [ ] Tester avec un lecteur d'ecran (VoiceOver, NVDA)

### 7.2 Performance
- [ ] Utiliser `next/image` partout pour l'optimisation automatique des images
- [ ] Ajouter le lazy loading sur les grilles d'annonces
- [ ] Verifier les Core Web Vitals (LCP, FID, CLS)

### 7.3 UX
- [ ] Scroll automatique vers le bas dans le chat quand un nouveau message arrive
- [ ] Ajouter un retry automatique sur les appels API qui echouent (avec backoff)
- [ ] Ameliorer la page contact (formulaire qui envoie vraiment un email au lieu d'un mailto)

### 7.4 SEO
- [ ] Verifier que le sitemap gere plus de 500 annonces (pagination)
- [ ] Verifier les meta tags OpenGraph sur chaque page
- [ ] Soumettre le sitemap a Google Search Console

---

## PHASE 8 — AVANT LE LANCEMENT

### 8.1 Checklist finale
- [ ] Tous les secrets de production sont configures (JWT, Intech, Resend, S3, etc.)
- [ ] Le `.env` n'est PAS dans le repo git (verifie `.gitignore`)
- [ ] HTTPS fonctionne partout
- [ ] Les emails partent bien (tester inscription, message, paiement)
- [ ] Les paiements fonctionnent (tester avec Intech en sandbox puis en prod)
- [ ] Le chat fonctionne en temps reel
- [ ] L'admin peut moderer (suspendre users, changer statut annonces)
- [ ] Les images s'uploadent et s'affichent correctement
- [ ] La recherche fonctionne (Meilisearch indexe bien)
- [ ] Le site est rapide sur mobile (< 3s de chargement)
- [ ] Tester sur differents navigateurs (Chrome, Safari, Firefox)
- [ ] Tester sur differents appareils (iPhone, Android, tablette)

### 8.2 Donnees initiales
- [ ] Creer le compte ADMIN
- [ ] Seeder quelques annonces de test (ou les supprimer avant le vrai lancement)
- [ ] Configurer Meilisearch avec la cle de production (pas la cle de dev)

---

## RESUME PAR PRIORITE

| Priorite | Phase | Description | Effort estime |
|----------|-------|-------------|---------------|
| CRITIQUE | Phase 1 | Securite (CORS, JWT, endpoints) | 1 session |
| HAUTE | Phase 2 | Emails Resend | 1 session |
| HAUTE | Phase 3 | Forgot password + expiration annonces | 2-3 sessions |
| HAUTE | Phase 4 | Paiements Intech | 1 session |
| HAUTE | Phase 5 | Infra (nginx, SSL, PM2, backups) | 2-3 sessions |
| MOYENNE | Phase 6 | Logging, monitoring, tests | 2-3 sessions |
| BASSE | Phase 7 | Polish frontend | 1-2 sessions |
| FINALE | Phase 8 | Checklist avant lancement | 1 session |

**Total estime : 10-15 sessions de travail**

---

## NOTES

- Ce plan est ordonne par priorite : on commence par la securite, on finit par le polish
- Chaque phase peut etre faite independamment des autres (sauf Phase 8 qui est la derniere)
- On met a jour ce fichier a chaque session pour suivre l'avancement
