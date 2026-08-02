# Infrastructure & Development Environment

How the pieces fit together for local development.

## Docker Compose files

### Root `compose.yaml` — shared infra

| Service | Image | Ports | Volumes | Notes |
|---|---|---|---|---|
| `db` | `postgres:18` | `5432:5432` | `db_data` → `/var/lib/postgresql` | user/pass/db = `postgres/postgres/app`; healthcheck `pg_isready` |
| `redis` | `redis:8-alpine` | `6379:6379` | `redis_data` → `/data` | `--appendonly yes`; healthcheck `redis-cli ping` |

Redis is provisioned but **currently unused** by either app — it's reserved for future caching/queues.

### `testing/compose.yaml` — CoreDNS mock

| Service | Image | Ports | Volumes | Notes |
|---|---|---|---|---|
| `CoreDns` | `coredns/coredns:latest` | `4000:53/udp` | `./Corefile` → `/etc/coredns/Corefile:ro` | command `-conf /etc/coredns/Corefile` |

This is the mock nameserver the backend's `GET /test/:domain` endpoint queries (`127.0.0.1:4000`).

## CoreDNS config — `testing/Corefile`

```coredns
example1.com:53 {
    template IN NS . {
        match ".*\.?example1\.com\."
        answer "{{ .Name }} 300 IN NS ns1.example.com."
        answer "{{ .Name }} 300 IN NS ns2.example.com."
    }
    log
    errors
}

.:53 {
    forward . 1.1.1.1
    log
    errors
}
```

- For any name under `example1.com`, responds with NS records `ns1.example.com.` and `ns2.example.com.` — exactly what the backend expects to validate against.
- All other names are forwarded to `1.1.1.1`.

## Port map

| Port | Service |
|---|---|
| `3000` | Next.js frontend |
| `8000` | Backend HTTP (Echo) |
| `8001` | Backend DNS (miekg/dns, UDP + TCP) |
| `5432` | Postgres |
| `6379` | Redis |
| `4000` | CoreDNS (testing, UDP only) |

## Full local startup

```bash
# 1. Infra (Postgres + Redis)
docker compose up -d

# 2. CoreDNS (only if you'll exercise the /test/:domain verification flow)
cd testing
docker compose up -d

# 3. Backend (terminal 1)
cd backend
go run .

# 4. Frontend (terminal 2)
cd frontend
pnpm install
pnpm prisma generate
pnpm dev
```

## First-time database setup

```bash
cd frontend
pnpm prisma migrate deploy   # apply existing migrations to the fresh Postgres
pnpm prisma generate         # generate the client (gitignored)
```

## Smoke-test the services

```bash
# Backend HTTP health check
curl http://localhost:8000/
# => Hello, World!

# Public NS verification (real DNS)
curl http://localhost:8000/checkNS/example1.com
# => {"success":true}  (or a 400 error with an actionable message)

# Local CoreDNS verification
curl http://localhost:8000/test/example1.com
# => {"success":true}

# Frontend
open http://localhost:3000/signin

# Direct DNS query against the authoritative server (port 8001)
dig @127.0.0.1 -p 8001 example.com A
# => answers 102.100.1.1
```

## Gotchas

- **`testing/compose.yaml` and root `compose.yaml` are separate compose files.** Run them from their respective directories (`cd testing`, `cd .`).
- CoreDNS only exposes UDP (`4000:53/udp`); TCP mapping is commented out. The backend's DNS client exchanges over UDP by default — fine for the current flow.
- The backend depends on CoreDNS being up for `/test/:domain`; `/checkNS/:domain` does a real public lookup and doesn't need it.
- Postgres data persists in the `db_data` volume — `docker compose down -v` wipes it.
- There's no root-level orchestration; you must start frontend, backend, and infra separately. No Dockerfiles exist for the apps themselves yet.
