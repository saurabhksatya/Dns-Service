# DNS Distributed

A polyglot DNS-hosting platform with a Next.js frontend and Go-based DNS server/backend. Two loosely-coupled services sharing only a PostgreSQL database — no monorepo tooling.

## Architecture

| Layer | Technology | Path | Ports |
|-------|------------|------|-------|
| **Frontend** | Next.js 16 (App Router), React 19, Prisma 7, better-auth, pnpm | `frontend/` | 3000 |
| **Backend (DNS + HTTP API)** | Go 1.25, Echo v5, miekg/dns | `backend/` | HTTP 8000, DNS 8001 |
| **Database** | PostgreSQL 18 | `compose.yaml` | 5432 |
| **Mock NS (testing)** | CoreDNS in Docker | `testing/` | 4000 UDP |

## Features

- **User authentication** via better-auth (email/password)
- **Site registration** — add domains to your account
- **NS verification** — verify ownership by delegating to RouteDNS nameservers (`ns1.example.com`, `ns2.example.com`)
- **DNS record management** — A, AAAA, CNAME records (DB-only via Next.js server actions)
- **Dashboard** — view site status (PENDING / VERIFIED / FAILED), last check time, failure reasons
- **Real DNS server** — Go-based authoritative DNS server on port 8001

## Installation

```bash
# Clone and enter
git clone https://github.com/saurabhksatya/Dns-Service.git
cd Dns-Service

# Frontend dependencies
cd frontend && pnpm install

# Backend dependencies
cd ../backend && go mod download

# Generate Prisma client (frontend)
cd ../frontend && pnpm prisma generate
```

## Development

```bash
# Terminal 1: Start PostgreSQL
docker compose up -d

# Terminal 2: (Optional) Start mock nameserver for NS verification testing
cd testing && docker compose up -d

# Terminal 3: Backend with hot reload (air)
cd backend
go install github.com/air-verse/air@latest   # one-time
air

# Terminal 4: Frontend dev server
cd frontend && pnpm dev
```

- Frontend: <http://localhost:3000>
- Backend HTTP API: <http://localhost:8000>
- Backend DNS: `localhost:8001`

## Production Build

```bash
# Frontend
cd frontend && pnpm build && pnpm start

# Backend
cd backend && go build -o bin/dns-server .
./bin/dns-server
```

Or with Docker (example):
```bash
# Build images
docker build -t dns-frontend ./frontend
docker build -t dns-backend ./backend

# Run with compose (add to compose.yaml for prod)
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

## Project Structure

```
dns-distributed/
├── .agents/              # Deep-dive docs per area (read before major work)
├── backend/              # Go DNS server + HTTP API
│   ├── main.go           # Entry: starts HTTP + DNS listeners
│   ├── db.go             # Database connection
│   ├── resolver.go       # DNS request handling
│   ├── types/            # Domain types (CheckNS, errors)
│   └── utils/            # Domain validation (note: IsValidDomain returns true=INVALID)
├── frontend/             # Next.js 16 app
│   ├── prisma/schema.prisma  # DB schema (Site, DnsRecord, User, Account, Session)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Sign in / up pages
│   │   │   ├── user/
│   │   │   │   ├── dashboard/ # Sites list + verify/delete
│   │   │   │   └── sites/[siteId]/  # DNS record management (verified only)
│   │   │   └── api/auth/      # better-auth route handler
│   │   ├── components/ui/     # shadcn/base-nova components
│   │   ├── lib/auth.ts        # Server auth helper
│   │   └── db.ts              # Prisma client
│   └── .env                   # DATABASE_URL, AUTH_SECRET, etc.
├── testing/              # CoreDNS config for mock NS verification
└── compose.yaml          # Postgres
```

## Key Gotchas

### Backend (Go)
- `utils.IsValidDomain` returns **true when the domain is INVALID** — call sites check `if utils.IsValidDomain(d) { return 400 }`
- NS expectations hard-coded: `ns1.example.com` / `ns2.example.com`
- `/checkNS/:domain` → real `net.LookupNS` (needs live delegation)
- `/test/:domain` → queries local CoreDNS (`127.0.0.1:4000`) — use for local testing
- Verify with `go build ./... && go vet ./...` (no tests exist)
- Use `slog`, not `println`

### Frontend (Next.js)
- **shadcn is `base-nova` style on `@base-ui/react`, NOT Radix** — component APIs differ
- Path alias `@/*` → `./src/*` — never use `../../` imports
- Forms: **react-hook-form + zod** (see `signin/page.tsx`)
- `authClient` is client-only (`"use client"`) — no middleware; guard server pages with `auth.api.getSession({ headers: await headers() })` + `redirect("/signin")`
- DNS record management is **DB-only via server actions** (`addDnsRecord`/`updateDnsRecord`/`deleteDnsRecord` in `dashboard/actions.ts`) — all verify session + site ownership + `VERIFIED` status
- `src/generated/prisma/` is **gitignored** — always run `pnpm prisma generate` after pulling or editing schema
- Backend HTTP routes are unauthenticated; auth is entirely the frontend's job

### Database
- Schema: `frontend/prisma/schema.prisma`
- After editing: `pnpm prisma generate && pnpm prisma migrate dev --name <name>`
- Fresh DB: `pnpm prisma migrate deploy`
- Models: `Site` (status: PENDING/VERIFIED/FAILED), `DnsRecord` (type: A/AAAA/CNAME), `User`, `Account`, `Session`
- Relations: `Site.dnsRecords` (cascade delete), `Site.userId` → `User.id`

## Verification Commands

```bash
# Frontend
cd frontend && npx tsc --noEmit && pnpm lint && pnpm build

# Backend
cd backend && go build ./... && go vet ./...
```

## Environment Variables

Create `frontend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dns?schema=public"
AUTH_SECRET="your-secret-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Backend uses the same `DATABASE_URL` (via shared compose network).

## Testing NS Verification Locally

1. Add a site with domain `example1.com`
2. Click **Verify** — frontend calls `GET http://localhost:8000/test/example1.com.`
3. Backend queries CoreDNS at `127.0.0.1:4000` for NS records
4. CoreDNS (`testing/Corefile`) returns `ns1.example.com` / `ns2.example.com` → verification passes

## License

MIT