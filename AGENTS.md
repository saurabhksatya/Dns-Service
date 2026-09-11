# AGENTS.md

Polyglot DNS-hosting platform. Two loose siblings under one repo, **no monorepo tooling**; they share only Postgres. Deep per-area docs live in `.agents/` — read `.agents/README.md` → `overview.md` → the area file (`frontend.md`, `backend.md`, `database.md`, `infrastructure.md`) before major work. This file only lists what's easy to get wrong.

## Layout & services

| Layer | Tech | Path | Port |
|---|---|---|---|
| Frontend (UI + auth + DB) | Next.js 16 App Router, React 19, Prisma 7, better-auth, pnpm | `frontend/` | 3000 |
| DNS server + verify HTTP API | Go 1.25 (module `dns`), Echo v5, miekg/dns | `backend/` | HTTP 8000, DNS 8001 |
| Dev infra | Docker Compose (Postgres 18 + Redis 8) | `compose.yaml` | 5432, 6379 |
| Mock NS for testing | CoreDNS in Docker | `testing/` | 4000 UDP |

## Startup

```bash
docker compose up -d                  # Postgres + Redis (repo root)
cd testing && docker compose up -d    # CoreDNS, only if exercising NS verification
cd backend && go run .                # starts HTTP :8000 + DNS :8001
cd frontend && pnpm install && pnpm prisma generate && pnpm dev
```

Backend must be running for the dashboard's Verify button (frontend calls `http://localhost:8000/test/:domain` with a trailing dot via server actions in `src/app/user/dashboard/actions.ts`; the real `checkNS` path is commented out).

## Backend (Go) gotchas

- `utils.IsValidDomain` returns **true when the domain is INVALID** (the bool means "has error"). Call sites use `if utils.IsValidDomain(d) { → 400 }`. Don't "fix" the name without updating both callers.
- NS expectations are **hard-coded**: `ns1.example.com` / `ns2.example.com`. The two handlers differ on trailing dots (`/checkNS` without, `/test` with) — keep them consistent if you touch one.
- `/checkNS/:domain` does a real `net.LookupNS` (needs live delegation); `/test/:domain` queries local CoreDNS (`127.0.0.1:4000`) — use `/test` for local verification of `example1.com`.
- Verify with `go build ./...` and `go vet ./...`. No tests exist. Use `slog`, not `println` (leftover debug `println`s exist in `main.go`).

## Frontend (Next.js) gotchas

- **shadcn is `base-nova` style on `@base-ui/react`, NOT Radix.** Component APIs differ from classic shadcn — read the installed source before use. Install via `npx shadcn@latest add <name>`. The `form` component is **not in the base-nova registry**; `src/components/ui/form.tsx` is hand-written — mirror it, don't re-add.
- Path alias `@/*` → `./src/*`. Never use `../../` imports.
- Every form uses **react-hook-form + zod** (see `src/app/(auth)/signin/page.tsx` for the pattern).
- `authClient` (better-auth) is client-only (`"use client"`). There is **no middleware** — guard server pages by calling `auth.api.getSession({ headers: await headers() })` and `redirect("/signin")` (see `src/app/user/dashboard/page.tsx`).
- DNS record management is **DB-only via Next.js server actions** (no backend calls): `addDnsRecord`/`updateDnsRecord`/`deleteDnsRecord` in `src/app/user/dashboard/actions.ts`. All verify session + site ownership and require the site to be `VERIFIED` (the config page `src/app/user/sites/[siteId]/` only shows for verified sites). Edit/delete run client-side in `dns-records-client.tsx` and re-fetch server records on `router.refresh()`.
- `src/generated/prisma/` is **gitignored** — always `pnpm prisma generate` after pulling or editing the schema.
- Backend HTTP routes are unauthenticated; auth is entirely the frontend's job.

## Database

- Schema: `frontend/prisma/schema.prisma`; `prisma.config.ts` loads `DATABASE_URL` from `frontend/.env` via dotenv. Client generator `prisma-client` outputs TS to `src/generated/prisma`.
- After editing schema: `pnpm prisma generate` then `pnpm prisma migrate dev --name <name>` (applies + creates SQL). Fresh DB: `pnpm prisma migrate deploy`.
- `Site` model + `SiteStatus` enum (`PENDING`/`VERIFIED`/`FAILED`) and `DnsRecord` model + `DnsRecordType` enum (`A`/`AAAA`/`CNAME`/`TXT`) already exist; `id`/timestamps have defaults. `Site` has a `dnsRecords` relation (`DnsRecord.siteId` → `Site.id`, cascade delete). Table names use lowercase `@@map("...")`; timestamps are `@db.Timestamptz(3)`.

## Verification commands

Frontend: `npx tsc --noEmit` → `pnpm lint` → `pnpm build` (from `frontend/`). Backend: `go build ./...` + `go vet ./...` (from `backend/`). No test suites exist.

## Stale-doc caveat

`.agents/overview.md` and `database.md` still claim the site-management UI doesn't exist — it does now (`src/app/user/dashboard/`), and the DNS-record config page lives at `src/app/user/sites/[siteId]/`. Trust the code over the docs.
