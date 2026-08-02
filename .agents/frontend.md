# Frontend Reference (`frontend/`)

Next.js 16.2.12 (App Router) + React 19.2.4 + TypeScript 5 (strict) + Tailwind CSS v4 + shadcn/ui + Prisma 7 + better-auth 1.6.25. Package manager is **pnpm**.

## Directory structure

```
frontend/
├── package.json                # scripts + deps (see below)
├── pnpm-workspace.yaml         # only native-build allowlist; NOT a workspace root
├── pnpm-lock.yaml
├── tsconfig.json               # path alias: "@/*" → "./src/*"
├── next.config.ts              # reactCompiler: true
├── eslint.config.mjs           # ESLint 9 flat config (next/core-web-vitals + next/typescript)
├── postcss.config.mjs          # @tailwindcss/postcss only
├── components.json             # shadcn config (style: base-nova, icon: lucide)
├── prisma.config.ts            # Prisma CLI config (reads DATABASE_URL from env)
├── prisma/
│   ├── schema.prisma           # User, Session, Account, Verification, Site models
│   └── migrations/             # SQL migrations
├── public/                     # default Next.js SVGs
├── src/
│   ├── app/
│   │   ├── layout.tsx          # root layout (Geist fonts, flex column body)
│   │   ├── page.tsx            # marketing landing page for "RouteDNS" (782 lines, self-contained)
│   │   ├── globals.css         # Tailwind v4 + shadcn theme (OKLCH vars, dark mode)
│   │   ├── favicon.ico
│   │   ├── (auth)/
│   │   │   ├── signin/page.tsx # email+password sign-in (RHF + zod)
│   │   │   └── signup/page.tsx # name+email+password sign-up (RHF + zod)
│   │   └── api/
│   │       └── auth/[...all]/route.ts   # better-auth catch-all handler
│   ├── components/
│   │   └── ui/                 # shadcn components: button, card, form, input, label
│   ├── db/
│   │   └── index.ts            # Prisma client singleton (@prisma/adapter-pg)
│   ├── generated/prisma/       # generated Prisma client (gitignored)
│   └── lib/
│       ├── auth.ts             # server-side better-auth config
│       ├── authClient.ts       # client-side better-auth client
│       └── utils.ts            # cn() helper
```

## Routes

| Route | File | Type |
|---|---|---|
| `/` | `src/app/page.tsx` | Server component (marketing landing) |
| `/signin` | `src/app/(auth)/signin/page.tsx` | Client component |
| `/signup` | `src/app/(auth)/signup/page.tsx` | Client component |
| `/api/auth/*` | `src/app/api/auth/[...all]/route.ts` | Route handler (better-auth) |

Note: `(auth)` is a **route group** — it does not add a URL segment, but it lets you share layouts later.

## Key dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.12 | Framework |
| `react` / `react-dom` | 19.2.4 | UI |
| `@base-ui/react` | ^1.6.0 | Headless UI primitives (Button, Input) |
| `@radix-ui/react-slot` | ^1.3.3 | Slot primitive (used by `FormControl`) |
| `class-variance-authority` | ^0.7.1 | Button variants |
| `clsx` + `tailwind-merge` | ^2 / ^3 | `cn()` utility |
| `lucide-react` | ^1.28.0 | Icons |
| `react-hook-form` | ^7.84 | Form state |
| `@hookform/resolvers` | ^5.6 | RHF ↔ zod bridge |
| `zod` | ^4.4.3 | Schema validation |
| `better-auth` | ^1.6.25 | Auth (server + client) |
| `@prisma/adapter-pg` | ^7.9 | Prisma driver adapter for Postgres |
| `shadcn` | ^4.16.1 | shadcn CLI |

## Path aliases

```jsonc
// tsconfig.json
"paths": { "@/*": ["./src/*"] }
```

- `@/components/ui/...` → `src/components/ui/...`
- `@/lib/...` → `src/lib/...`
- `@/db` → `src/db/index.ts`
- `@/generated/prisma/client` → generated client entry

**Always use `@/` aliases.** Never use relative imports that traverse multiple directories (`../../...`).

## Packages & scripts

```jsonc
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

`next.config.ts` enables the React Compiler (`reactCompiler: true`), which auto-memoizes components. Don't waste effort hand-memoizing with `useMemo`/`useCallback` unless there's a real reason.

## Auth

### Server side — `src/lib/auth.ts`

```ts
import prisma from "@/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  baseURL: "http://localhost:3000",
});
```

### Client side — `src/lib/authClient.ts`

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});
```

### API route — `src/app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

Common client calls:
- `authClient.signIn.email({ email, password })`
- `authClient.signUp.email({ email, password, name })`
- `authClient.signOut()`
- `authClient.useSession()` (hook) or `await authClient.getSession()`

**Gotchas**
- `baseURL` is hardcoded to `http://localhost:3000`. For a real deployment, move it to env vars (`BETTER_AUTH_URL`).
- `authClient` must only be used in **client components** (`"use client"`).
- There is **no middleware** yet, so routes are not protected server-side. Protected-route guards are future work.

## Styling & shadcn

### Theme

- Tailwind v4 (no `tailwind.config.js`). Theme lives in `src/app/globals.css` via `@theme` + `:root` / `.dark` OKLCH CSS variables.
- Base styles: `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`.
- Dark mode toggles via the `.dark` class on `<html>`.
- Semantic tokens: `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-primary`, `bg-destructive`, `text-muted-foreground`, `bg-muted`, `text-primary`, etc. **Use these instead of raw hex/oklch values.**

### shadcn config — `components.json`

```jsonc
{
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

> **Important:** This project uses the **`base-nova`** style, which is built on **`@base-ui/react`** (headless, from the MUI team) rather than Radix UI. Installed components look different from the classic Radix shadcn components. Don't assume a component API you remember from Radix-based shadcn is the same here — read the installed source before using.

### Installing components

Always use the shadcn CLI to add components — do not hand-write them:

```bash
npx shadcn@latest add <component> --cwd frontend --yes
```

Installed so far: `button`, `card`, `form`, `input`, `label`.

**Gotcha:** The `form` component is **not in the base-nova registry**. If `npx shadcn@latest add form` produces no files, create it manually — the current `src/components/ui/form.tsx` was written by hand and works (uses `FormProvider`, `Controller`, `FormFieldContext`, `Slot`). If you add it fresh, mirror that file.

### Using components

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

- Button variants: `default` | `outline` | `secondary` | `ghost` | `destructive` | `link`
- Button sizes: `default` | `xs` | `sm` | `lg` | `icon` | `icon-xs` | `icon-sm` | `icon-lg`

## Forms (react-hook-form + zod)

This is the **mandatory** pattern for all forms — see `src/app/(auth)/signin/page.tsx` and `signup/page.tsx`.

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

export default function MyForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: Values) => {
    // handle submit; on failure:
    // form.setError("root", { message: "..." });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
          Submit
        </Button>
      </form>
    </Form>
  );
}
```

**Conventions**
- Schema first, then `z.infer`.
- Per-field errors via `<FormMessage />` inside `<FormItem>`.
- Cross-cutting / server errors via `form.setError("root", { message })`, rendered manually.
- Loading state via `form.formState.isSubmitting` (RHF drives `isSubmitting` around the async handler).
- Icons from `lucide-react` (e.g., `Loader2` for the spinner).

## Database

- Prisma 7 with the `prisma-client` generator outputting to `src/generated/prisma/` (gitignored).
- Singleton client at `src/db/index.ts` using `@prisma/adapter-pg`:

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
```

Import: `import prisma from "@/db";`

Schema & migration workflow → see `database.md`.

## Landing page note

`src/app/page.tsx` is a **782-line self-contained marketing page** (RouteDNS branding, hero, features, "how it works", monitoring dashboard mockup, CTA, footer) with inline SVG helpers (`NetworkDiagram`, `DashboardCard`, `Node`) and lucide icons. If you add a sign-in / nav CTA or restructure it, be careful — it is one big file, not split into components yet.

## Env vars (`frontend/.env` — local dev only)

| Variable | Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/app?schema=public` | Prisma / Postgres connection |
| `BETTER_AUTH_SECRET` | (random string) | better-auth session signing |

`.env*` is gitignored — never commit real secrets.

## Commands

```bash
pnpm install              # install deps
pnpm dev                  # start dev server (port 3000)
pnpm build                # production build
pnpm start                # serve production build
pnpm lint                 # eslint
pnpm prisma generate      # regenerate client into src/generated/prisma
pnpm prisma migrate dev   # create + apply a migration
npx tsc --noEmit          # type check
```
