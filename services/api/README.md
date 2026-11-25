# API (v0)

Node.js + Express + SQLite scaffold.

- Stub auth: `POST /auth/login` with `{ role, displayName }`
- Messages: `GET|POST /messages`
- Retention: **30 days** — purge runs on `GET /messages` and `POST /admin/purge`

```bash
npm install
npm start
# http://127.0.0.1:8787
```

SQLite file defaults to `data/messages.sqlite` (gitignored).
