# Database Reference

PostgreSQL via Prisma 7. The Prisma client is generated with the new `prisma-client` generator into `frontend/src/generated/prisma/` (gitignored). Connections use the **driver adapter** pattern (`@prisma/adapter-pg`).

## Schema — `frontend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

> Note: the `prisma-client` generator (not `prisma-client-js`) outputs TypeScript into the repo. There is **no** `DATABASE_URL` hardcoded in the datasource — the CLI config in `prisma.config.ts` supplies it from env.

### Models

**User** — a platform user (better-auth standard shape).
| Field | Type | Notes |
|---|---|---|
| `id` | String @id | |
| `name` | String | |
| `email` | String @unique | |
| `emailVerified` | Boolean | |
| `image` | String? | |
| `createdAt` / `updatedAt` | DateTime `@db.Timestamptz(3)` | |
| `sessions` / `accounts` / `sites` | relations | |

Table: `@@map("user")`.

**Session** — better-auth session.
| Field | Type |
|---|---|
| `id` @id, `userId` (FK→user), `token` @unique, `expiresAt` | |
| `ipAddress?`, `userAgent?` | |
| `createdAt` / `updatedAt` | |

Table: `@@map("session")`.

**Account** — better-auth account (OAuth + password).
| Field | Type |
|---|---|
| `id` @id, `userId` (FK→user), `accountId`, `providerId` | |
| `accessToken?`, `refreshToken?`, `accessTokenExpiresAt?`, `refreshTokenExpiresAt?`, `scope?`, `idToken?`, `password?` | |
| `createdAt` / `updatedAt` | |

Table: `@@map("account")`.

**Verification** — better-auth email-verification tokens.
| Field | Type |
|---|---|
| `id` @id, `identifier`, `value`, `expiresAt` | |
| `createdAt` / `updatedAt` | |

Table: `@@map("verification")`.

**Site** — a domain a user wants to host on the platform.
| Field | Type | Notes |
|---|---|---|
| `id` | String @id | |
| `user` / `userId` | FK → user, `onDelete: Cascade` | |
| `domain` | String | |
| `status` | `SiteStatus` enum | |
| `lastChecked` | DateTime? `@db.Timestamptz(3)` | |
| `failReason` | String? | |
| `createdAt` / `updatedAt` | DateTime `@db.Timestamptz(3)` | |

Constraints: `@@unique([userId, domain])`. Table: `@@map("site")`.

**SiteStatus enum**

```prisma
enum SiteStatus {
  PENDING
  VERIFIED
  FAILED
}
```

## Migrations — `frontend/prisma/migrations/`

| Migration | Contents |
|---|---|
| `20260802061937_ath` | Creates `user`, `session`, `account`, `verification` tables (better-auth base) |
| `20260802113452_add_sites` | Adds `SiteStatus` enum + `site` table with FK to `user` (ON DELETE CASCADE) |

## Prisma client singleton — `frontend/src/db/index.ts`

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

Use: `import prisma from "@/db";`

## CLI config — `frontend/prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

## Workflow

```bash
cd frontend

# After editing schema.prisma:
pnpm prisma generate           # regenerate client into src/generated/prisma
pnpm prisma migrate dev --name <name>   # create + apply a migration

# Apply migrations to a fresh DB:
pnpm prisma migrate deploy

# Open the DB UI:
pnpm prisma studio
```

## Gotchas

- `src/generated/prisma` is gitignored — always run `pnpm prisma generate` after pulling.
- `prisma.config.ts` loads `.env` itself via `dotenv/config`, so `DATABASE_URL` comes from `frontend/.env`.
- When you add a model for better-auth, keep the `@@map` lowercase-table convention and `@db.Timestamptz(3)` on timestamps.
- The `Site` model already exists but has **no UI or API yet** — the migration `add_sites` is applied, so the table is ready.
