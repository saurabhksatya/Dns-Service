# Agent Documentation Index

This folder contains reference documentation for AI agents (and humans) working on the **dns-distributed** codebase. Read the relevant file before making changes — these docs capture the project's structure, conventions, and gotchas so you don't have to re-derive them.

## What this project is

**dns-distributed** is an authoritative DNS hosting platform. Users register domains (sites) on the platform, point their domain's NS records at our nameservers, and we serve authoritative DNS responses. The platform verifies that the user's domain actually delegates to our nameservers before marking a site as verified.

It is a small polyglot system:

| Layer                         | Tech                                                      | Path           | Purpose                                                                            |
| ----------------------------- | --------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| **Frontend (UI + Auth + DB)** | Next.js 16 (App Router) + React 19 + Prisma + better-auth | `frontend/`    | Marketing landing, sign-in/sign-up, site management UI                             |
| **DNS authoritative server**  | Go 1.25 + miekg/dns + Echo                                | `backend/`     | The actual DNS server responding to queries, plus HTTP helpers for NS verification |
| **Infrastructure**            | Docker Compose (Postgres + Redis)                         | `compose.yaml` | Shared infra for dev                                                               |
| **Testing infra**             | CoreDNS in Docker                                         | `testing/`     | Mock NS server used during development to test the verification flow               |

There is **no monorepo tooling** (no turbo / nx / pnpm workspace at root). The two services are loosely coupled siblings under one repo, sharing only the Postgres database.

## How to use these docs

| If you're working on…                              | Read…                                      |
| -------------------------------------------------- | ------------------------------------------ |
| **Anything new / unfamiliar**                      | [`overview.md`](./overview.md) first       |
| **Frontend (Next.js, components, pages, auth UI)** | [`frontend.md`](./frontend.md)             |
| **Backend (Go, DNS server, HTTP API)**             | [`backend.md`](./backend.md)               |
| **Docker compose, CoreDNS, dev environment**       | [`infrastructure.md`](./infrastructure.md) |
| **Database schema, Prisma, migrations**            | [`database.md`](./database.md)             |
| **Code style, conventions, best practices**        | [`conventions.md`](./conventions.md)       |

## Quick-start (TL;DR)

```bash
# 1. Infra (Postgres + Redis)
docker compose up -d

# 2. Backend (terminal 1)
cd backend
go run .

# 3. Frontend (terminal 2)
cd frontend
pnpm install
pnpm prisma generate
pnpm dev
```

Optional, for testing the NS verification flow against a real local DNS server:

```bash
cd testing
docker compose up -d   # starts CoreDNS at 127.0.0.1:4000
```

Default ports:

- Frontend (Next.js): `http://localhost:3000`
- Backend HTTP (Echo): `http://localhost:8000`
- Backend DNS (miekg/dns): `:8001` UDP + TCP
- Postgres: `localhost:5432` (user/pass/db = `postgres/postgres/app`)
- Redis: `localhost:6379`
- CoreDNS (testing): `127.0.0.1:4000` UDP

## Agent rules of thumb

1. **Use shadcn/ui wherever a UI primitive is needed.** Never hand-roll buttons, inputs, cards, dialogs, etc. — install via `pnpm dlx shadcn@latest add <name>`. The project uses the **`base-nova`** style on top of `@base-ui/react` (not Radix). See `frontend.md` for details.
2. **Use react-hook-form + zod for any form** (signin/signup already do — match that pattern).
3. **Follow the path alias `@/*` → `./src/*`** in frontend. Never use relative `../../` imports across folders.
4. **Don't add comments to code** unless asked. Code should be self-documenting.
5. **Run `pnpm lint` after frontend changes** and `go build ./...` after backend changes.
6. **Never commit secrets.** The `.env` file is for local dev only — keys like `BETTER_AUTH_SECRET` must be regenerated for any environment that matters.
7. **Prisma client is generated to `src/generated/prisma/`** (gitignored). Always run `pnpm prisma generate` after pulling schema changes.
8. **Backend HTTP routes are currently unauthenticated.** When wiring frontend → backend calls, auth is the frontend's responsibility (via better-auth session).
