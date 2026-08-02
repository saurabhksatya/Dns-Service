# Conventions & Best Practices

Rules to follow when modifying this codebase. These are derived from what already exists — match the established patterns.

## 1. Frontend — UI

- **Use shadcn/ui for every UI primitive.** Do not hand-roll buttons, inputs, labels, cards, dialogs, dropdowns, etc.
- **Install components via the CLI**, never by copying from memory:
  ```bash
  cd frontend
  npx shadcn@latest add <component> --yes
  ```
- This project uses the **`base-nova`** shadcn style built on **`@base-ui/react`** (not Radix). Component APIs differ from classic Radix-based shadcn — read the installed source before use.
- Import from `@/components/ui/...`, never by relative path.
- Use semantic Tailwind tokens (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `text-primary`, ...) instead of raw colors. Colors come from the OKLCH CSS variables in `globals.css`.
- Icons come from `lucide-react`. Prefer `[&_svg]:size-4`-style sizing where the component supports it; icons inside buttons are auto-sized by the Button component.
- Use the existing component sizes/variants (Button has `default`/`xs`/`sm`/`lg`/`icon` sizes and `default`/`outline`/`secondary`/`ghost`/`destructive`/`link` variants).

## 2. Frontend — forms

- **Every form uses react-hook-form + zod.** This is the established pattern in `(auth)/signin` and `(auth)/signup`.
- Structure: define a zod schema → `type Values = z.infer<typeof schema>` → `useForm<Values>({ resolver: zodResolver(schema), defaultValues })`.
- Render fields via the shadcn `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` components.
- Per-field errors surface through `<FormMessage />`. Cross-cutting/auth errors go through `form.setError("root", { message })`.
- Use `form.formState.isSubmitting` for loading state (a `Loader2` spinner inside the submit `Button`).

## 3. Frontend — structure & imports

- Path alias: `@/*` → `./src/*`. Use `@/components`, `@/lib`, `@/db`, `@/components/ui`.
- Pages live in `src/app/<route>/page.tsx` (App Router). Use route groups `(name)` for layout grouping without URL segments.
- Client components that need hooks/interactivity start with `"use client"`.
- Keep pages self-contained unless a component is shared. The landing page is one 782-line file — match that granularity (small shared pieces may be extracted into `components/`).
- **No comments in code** unless explicitly asked. Code should be self-documenting.

## 4. Frontend — auth

- Server config: `@/lib/auth`. Client: `@/lib/authClient`.
- `authClient` methods (`signIn.email`, `signUp.email`, `signOut`, `useSession`) are for **client components only**.
- The better-auth API catch-all route is already mounted at `/api/auth/[...all]` — don't add per-endpoint route handlers.
- Auth pages redirect with `router.push("/")` after success. Match that flow.

## 5. Frontend — database

- Import the singleton: `import prisma from "@/db";`
- After editing `prisma/schema.prisma`: `pnpm prisma generate` (and `pnpm prisma migrate dev --name <name>` if schema changed).
- Keep `@@map("<lowercase>")` table names and `@db.Timestamptz(3)` on timestamps.
- The `Site` model (with `SiteStatus` enum) exists and is ready for use — new UI/API for sites should use it.

## 6. Backend (Go)

- Handlers: `func(c *echo.Context) error`; success via `c.JSON(http.StatusOK, ...)`, errors via `c.JSON(status, &types.ErrorResponse{Message: "..."})`.
- Shared HTTP response types live in `types/` (e.g., `ErrorResponse`, `CheckNameServerResponse`). Add new ones there.
- Shared helpers live in `utils/`. Use `utils.IsValidDomain` for domain validation (note: returns true when **invalid**).
- Export (`CapitalCase`) only what other packages need; keep the rest private.
- Use `log/slog` for logging — do **not** use `println`. Remove existing `println` debug lines if you touch those handlers.
- DNS work uses miekg/dns (`dns.Msg`, `dns.Client`, `dns.ResponseWriter`). Keep the authoritative responder in `main.go` unless it grows.
- After changes: `go build ./...` and `go vet ./...`.

## 7. Security

- **Never commit secrets.** `frontend/.env` is gitignored and holds `DATABASE_URL` + `BETTER_AUTH_SECRET`. For any real environment, regenerate the auth secret.
- Backend HTTP routes are currently unauthenticated — do not assume auth on the backend; treat it as public until documented otherwise.
- Don't add new secrets to code; use env vars and the frontend `.env` pattern.

## 8. Verification before finishing

| Change | Command (from repo root unless noted) |
|---|---|
| Frontend TS | `cd frontend && npx tsc --noEmit` |
| Frontend lint | `cd frontend && pnpm lint` |
| Frontend build | `cd frontend && pnpm build` |
| Backend compile | `cd backend && go build ./...` |
| Backend vet | `cd backend && go vet ./...` |

## 9. Documentation

- This `.agents/` folder is the single source of truth for agent docs. Update the relevant file when you change structure, conventions, or gotchas.
- Start from `.agents/README.md` (index) → `.agents/overview.md` → the area-specific file (`frontend.md`, `backend.md`, `database.md`, `infrastructure.md`).
