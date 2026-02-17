# Phase 4 — Rapport : Chat Service

> Date : 17/02/2026
> Statut : TERMINE

---

## Objectif

Implementer le service de chat temps reel entre acheteurs et vendeurs, lie aux annonces. WebSocket via Socket.io pour les messages en direct, indicateurs de frappe et statut de lecture. Endpoints REST pour la gestion des conversations.

---

## Travail realise

### 1. Fichiers crees (14 fichiers)

**Infrastructure commune :**
- `chat-service/src/database/database.module.ts` — Module global PRISMA + REDIS
- `chat-service/src/common/filters/http-exception.filter.ts` — Erreurs en francais
- `chat-service/src/common/interceptors/transform.interceptor.ts` — Wrap {success, data}
- `chat-service/src/common/guards/gateway-auth.guard.ts` — Auth REST via headers x-user-id/x-user-role
- `chat-service/src/common/guards/ws-auth.guard.ts` — Auth WebSocket via JWT dans handshake
- `chat-service/src/common/decorators/current-user.decorator.ts` — @CurrentUser()

**DTOs :**
- `chat-service/src/chat/dto/start-conversation.dto.ts` — listingId + message (premier message)
- `chat-service/src/chat/dto/send-message.dto.ts` — conversationId + content
- `chat-service/src/chat/dto/get-messages.dto.ts` — cursor pagination query params

**Logique metier :**
- `chat-service/src/chat/chat.module.ts` — Module principal
- `chat-service/src/chat/chat.service.ts` — Business logic (conversations, messages, read, unread count)
- `chat-service/src/chat/chat.controller.ts` — 5 endpoints REST
- `chat-service/src/chat/chat.gateway.ts` — WebSocket gateway Socket.io

**API Gateway :**
- `api-gateway/src/chat-proxy.controller.ts` — Proxy /api/chat/* → chat-service:4003

### 2. Fichiers modifies

- `chat-service/src/app.module.ts` — Import DatabaseModule, ChatModule, global filter/interceptor, envFilePath
- `api-gateway/src/app.module.ts` — Ajout ChatProxyController
- `api-gateway/src/listing-proxy.controller.ts` — Fix route racine @All() + @All('*')
- `api-gateway/src/auth-proxy.controller.ts` — Fix route racine @All() + @All('*')

---

## Architecture chat-service

```
apps/chat-service/src/
├── main.ts
├── app.module.ts
├── health.controller.ts
├── database/
│   └── database.module.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── guards/
│   │   ├── gateway-auth.guard.ts
│   │   └── ws-auth.guard.ts
│   └── decorators/
│       └── current-user.decorator.ts
└── chat/
    ├── chat.module.ts
    ├── chat.service.ts
    ├── chat.controller.ts
    ├── chat.gateway.ts
    └── dto/
        ├── start-conversation.dto.ts
        ├── send-message.dto.ts
        └── get-messages.dto.ts
```

---

## Endpoints REST (5 routes)

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /chat/conversations | Oui | Demarrer une conversation (listingId + premier message) |
| GET | /chat/conversations | Oui | Lister mes conversations (dernier message, unread count) |
| GET | /chat/conversations/:id | Oui | Detail conversation (verifie participant) |
| GET | /chat/conversations/:id/messages | Oui | Messages pagines (cursor) |
| GET | /chat/unread-count | Oui | Nombre total de messages non lus |

Tous accessibles via le gateway : `http://localhost:4000/api/chat/*`

---

## WebSocket Events (Socket.io)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `send_message` | Client → Server | `{ conversationId, content }` | Envoyer un message |
| `new_message` | Server → Client | Message object | Nouveau message recu |
| `typing` | Client → Server | `{ conversationId, isTyping }` | Indicateur de frappe |
| `user_typing` | Server → Client | `{ conversationId, userId, isTyping }` | L'autre tape |
| `mark_read` | Client → Server | `{ conversationId }` | Marquer messages comme lus |
| `messages_read` | Server → Client | `{ conversationId, readBy, readAt }` | Confirmation lecture |
| `join_conversation` | Client → Server | `{ conversationId }` | Rejoindre une room |

### Authentification WebSocket
```typescript
io('ws://localhost:4003', { auth: { token: 'Bearer <jwt>' } })
```
Le JWT est decode cote serveur avec `jsonwebtoken` (meme secret que le gateway).

### Rooms
- Chaque conversation = 1 room `conversation:{id}`
- Auto-join de toutes les conversations a la connexion
- Les events sont emis dans la room (seuls les participants recoivent)

---

## Logique cle

### Demarrer une conversation
1. Verifie que l'annonce existe et est ACTIVE/RESERVED
2. Verifie que l'utilisateur n'est PAS le vendeur (pas de self-chat)
3. Upsert conversation (@@unique [listingId, buyerId, sellerId])
4. Cree le premier message, met a jour lastMessageAt

### Envoyer un message
1. Verifie que l'utilisateur est participant (buyerId ou sellerId)
2. Sanitize content (XSS, max 1000 caracteres)
3. Cree Message en DB, update lastMessageAt
4. Emet `new_message` dans la room conversation

### Marquer comme lu
1. Update `readAt = now()` sur les messages non lus envoyes par l'autre
2. Emet `messages_read` dans la room

### Lister conversations
- Cursor pagination par lastMessageAt DESC
- Include : listing (title, slug, 1ere image), buyer/seller (name, avatar), dernier message, unread count

---

## Securite

| Mesure | Implementation |
|--------|---------------|
| Participant-only | Seuls buyerId/sellerId accedent a la conversation |
| No self-chat | Impossible de chatter sur sa propre annonce |
| XSS sanitize | sanitize-html (zero tags) sur tous les messages |
| Max 1000 chars | Validation DTO + sanitize |
| JWT WebSocket | Token verifie dans le handshake, deconnexion si invalide |
| Auth REST | GatewayAuthGuard via headers x-user-id/x-user-role |

---

## Correctif gateway (NestJS 11 / Express 5)

**Probleme** : `@All('*')` dans NestJS 11 (Express 5) ne matche pas la route racine du controller. `POST /api/listings` retournait 404 alors que `GET /api/listings/search` fonctionnait.

**Solution** : Ajout de `@All()` (route racine) en plus de `@All('*')` (sous-routes) dans les 3 proxy controllers (auth, listings, chat).

---

## Tests effectues

| Test | Resultat |
|------|----------|
| POST /chat/conversations (acheteur demarre convo) | OK — conversation + message crees |
| GET /chat/conversations (lister mes convos) | OK — listing, buyer, seller, lastMessage, unreadCount |
| GET /chat/conversations/:id/messages | OK — messages pagines avec sender info |
| GET /chat/unread-count (vendeur) | OK — 1 message non lu |
| POST /api/listings via gateway (fix @All) | OK — route racine fonctionne |
| Build 11/11 | OK |

---

## Dependances ajoutees

**chat-service :**
- `@prisma/client` — ORM
- `ioredis` — Redis connection
- `class-validator`, `class-transformer` — Validation DTO
- `jsonwebtoken`, `@types/jsonwebtoken` — Auth WebSocket
- `sanitize-html`, `@types/sanitize-html` — Protection XSS
- `@types/express`, `@types/node` — Types dev

(Socket.io, @nestjs/websockets, @nestjs/platform-socket.io etaient deja installes)

---

## Prochaine etape

**Phase 5** : Frontend Next.js ou Notification service, selon priorite.