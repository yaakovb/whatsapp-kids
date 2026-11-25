# WhatsApp Kids

A **minimal family messenger** with built-in parent content review.

This is **not** WhatsApp, not a WhatsApp scrape, and not an unofficial bridge. Families message through our own thin pipe so parents can review kid↔peer content automatically or on demand — without requiring the child to share anything.

> **Scaffold status (v0):** Runnable skeleton only. Auth is a stub, UI is bare, retention is documented/enforced as a simple purge hook. Not a shipping product.

## Product decisions (locked 2026-11-25)

| Decision | Choice |
| --- | --- |
| Chat pipe | Own thin messenger (no WhatsApp integration) |
| Content review | Parent-initiated or automatic — **no kid share required** |
| Platforms | Android first → web parent → iOS later |
| Retention | **30 days** |

## Architecture (v0)

```
┌─────────────────┐     ┌─────────────────┐
│  Android app    │     │  Web parent     │
│  Kid / Parent   │────▶│  review stub    │
│  modes          │     └────────┬────────┘
└────────┬────────┘              │
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │  services/api   │
            │  auth stub      │
            │  send / list    │
            │  30-day purge   │
            └─────────────────┘
```

- **`apps/android`** — Kotlin stub with Kid mode (send/list) and Parent mode (review inbox).
- **`apps/web-parent`** — Vite + React stub for parent message review.
- **`services/api`** — Node/Express + SQLite: stub auth, send/list messages, 30-day retention note + purge.

There is **no** WhatsApp API, Accessibility scrape, or linked-device bridge in this repo.

## Prerequisites

- Node.js 20+
- npm 10+
- (Optional) Android Studio / JDK 17 for the Android stub

## Run locally

### 1. API

```bash
cd services/api
npm install
npm start
```

API listens on `http://127.0.0.1:8787`.

Quick smoke:

```bash
# Dev login (stub) — returns a bearer token
curl -s -X POST http://127.0.0.1:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"role":"kid","displayName":"Ava"}'

# Send a message (use token from login)
curl -s -X POST http://127.0.0.1:8787/messages \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"body":"hello from kid"}'

# List messages (parent or kid token)
curl -s http://127.0.0.1:8787/messages \
  -H "Authorization: Bearer <token>"
```

### 2. Web parent

```bash
cd apps/web-parent
npm install
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`). Point the UI at the API base URL if prompted; default is `http://127.0.0.1:8787`.

### 3. Android (stub)

Open `apps/android` in Android Studio, sync Gradle, run on an emulator or device. The stub talks to `http://10.0.2.2:8787` (emulator → host loopback) by default.

Kid mode: log in as kid, send/list.  
Parent mode: log in as parent, review the same inbox.

## API surface (v0)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/auth/login` | Stub login `{ role, displayName }` → `{ token, user }` |
| `GET` | `/messages` | List messages (auth required); auto-purges >30 days |
| `POST` | `/messages` | Send `{ body }` (auth required) |

## Retention

Messages older than **30 days** are deleted on list (and via `POST /admin/purge` for an explicit run). This is intentional product policy, not a bug.

## License

MIT — see [LICENSE](./LICENSE).
