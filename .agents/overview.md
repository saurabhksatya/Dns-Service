# Project Overview

## What we're building

A self-service authoritative DNS hosting platform. The user-facing flow:

1. User signs up at `/signup`, signs in at `/signin`.
2. User adds a "site" (domain) they want to host on our nameservers.
3. The platform tells them to set their domain's NS records to `ns1.example.com` and `ns2.example.com`.
4. The platform verifies the NS delegation (using either a public DNS lookup or a local CoreDNS instance for testing).
5. Once verified, queries for the user's domain hit our authoritative DNS server and get answered.

The current codebase is **early-stage scaffolding**: auth works end-to-end, the landing page is built, the DNS server can answer queries, and the NS verification logic exists. The site-management UI (add/list/delete sites) is **not yet built** — only the database model is in place.

## Top-level layout

```
dns-distributed/
├── .agents/                    ← this documentation folder
├── compose.yaml                ← Postgres + Redis for local dev
├── backend/                    ← Go DNS authoritative server + verification HTTP API
│   ├── main.go
│   ├── go.mod / go.sum
│   ├── types/                  ← shared HTTP response types
│   └── utils/                  ← domain validation helpers
├── frontend/                   ← Next.js admin UI + better-auth
│   ├── package.json
│   ├── prisma/                 ← schema + migrations
│   ├── src/
│   │   ├── app/                ← Next.js App Router pages
│   │   ├── components/ui/      ← shadcn components
│   │   ├── db/                 ← Prisma client singleton
│   │   └── lib/                ← auth, auth client, utils
│   └── .agents/                ← skills/ folder (Prisma-related agent skills)
└── testing/                    ← CoreDNS mock for local NS verification tests
    ├── compose.yaml
    └── Corefile
```

## Service map

```
                    ┌──────────────────────┐
                    │   Browser / Client   │
                    └──────────┬───────────┘
                               │ HTTP
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
   ┌──────────────────────┐        ┌──────────────────────┐
   │  Next.js (port 3000) │        │  Echo HTTP (port 8000)│
   │  /signin /signup     │        │  /checkNS/:domain     │
   │  /api/auth/* (BA)    │        │  /test/:domain        │
   │  future: /sites etc. │        └──────────┬───────────┘
   └──────────┬───────────┘                   │
              │                               │
              │ Prisma                         │ miekg/dns
              ▼                               ▼
   ┌──────────────────────┐        ┌──────────────────────┐
   │  Postgres (5432)     │        │  DNS server (8001)   │
   │  - user / session    │        │  UDP + TCP           │
   │  - site              │        │  answers 102.100.1.1 │
   └──────────────────────┘        └──────────────────────┘
              ▲
              │
              │ shared infra
   ┌──────────────────────┐        ┌──────────────────────┐
   │  Redis (6379)        │        │  CoreDNS (4000)      │
   │  (reserved / unused) │        │  testing/ only       │
   └──────────────────────┘        └──────────────────────┘
```

## Data flow for "verify a domain"

1. User submits domain on a (future) frontend form.
2. Frontend calls backend `GET /checkNS/:domain` (real public lookup) **or** `GET /test/:domain` (local CoreDNS for testing).
3. Backend validates the domain via `idna.Lookup.ToASCII`.
4. Backend performs the NS lookup.
5. Backend compares the returned NS records against the expected set `{ns1.example.com, ns2.example.com}`.
6. Returns `{ "success": true }` on match, or a 400 with an actionable error message on mismatch.
7. Frontend updates the `Site` row's `status` to `VERIFIED` (or `FAILED` with `failReason`).

## Tech stack summary

| Concern | Choice |
|---|---|
| Frontend framework | Next.js 16.2.12 (App Router) + React 19.2.4 |
| Frontend language | TypeScript 5 (strict) |
| Frontend styling | Tailwind CSS v4 + shadcn (`base-nova` style) on `@base-ui/react` |
| Frontend forms | react-hook-form + zod |
| Frontend auth | better-auth 1.6.25 |
| Frontend DB | Prisma 7 + `@prisma/adapter-pg` |
| Frontend icons | lucide-react |
| Backend framework | Echo v5 |
| Backend DNS | miekg/dns |
| Backend IDN | `golang.org/x/net/idna` |
| Backend logging | `log/slog` |
| DB | Postgres 18 (Docker) |
| Cache / queue | Redis 8 (Docker, currently unused) |
| Local DNS testing | CoreDNS in Docker |

## Where to read next

- **Adding a page or component?** → `frontend.md`
- **Adding a DNS handler or HTTP route?** → `backend.md`
- **Changing the database schema?** → `database.md`
- **Setting up the dev environment from scratch?** → `infrastructure.md`
- **Not sure what naming or pattern to use?** → `conventions.md`
