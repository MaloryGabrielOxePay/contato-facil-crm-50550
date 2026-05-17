# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> The repo `README.md` is unmodified Lovable boilerplate and does not describe the real product. Use this file instead.

## Product

**GPD — Gestor Político Digital**: a multi-tenant SaaS for managing Brazilian political campaigns and elected-office mandates. UI text is pt-BR; route paths are pt-BR; data formats are Brazil-specific (CPF, CEP, WhatsApp, BRL). The repo name `contato-facil-crm-50550` is a vestige of an earlier generic-CRM template — see "Legacy template residue" below.

Live: `campanha.grupomalory.com` (served from the `gh-pages` branch).

## Commands

```sh
npm i                 # install deps (bun.lockb also present; npm is canonical here)
npm run dev           # Vite dev server on port 8080, host '::'
npm run build         # production build → dist/
npm run build:dev     # build with mode=development (keeps lovable-tagger, dev source maps)
npm run preview       # preview built dist/
npm run lint          # eslint (flat config, eslint.config.js)
```

No test framework is configured.

**Vite `base`** (vite.config.ts): defaults to `/contato-facil-crm-50550/` in production and `/` in dev. The custom-domain deploy (`campanha.grupomalory.com`) requires `base: '/'`; recent gh-pages commits rebuild with that override. Check the latest gh-pages commit message before deploying.

## Tech stack

Vite + React 18 + TypeScript (SWC) · shadcn/ui (Radix) on Tailwind · Supabase (auth + Postgres + RLS) · React Router v6 (`BrowserRouter`) · React Hook Form + Zod · TanStack Query · recharts · sonner (toasts) · PWA via `public/sw.js`.

TypeScript is intentionally loose (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`) — don't try to tighten it piecemeal. Path alias `@/*` → `src/*`.

## Architecture

### Provider stack (src/App.tsx)

```
QueryClientProvider → TooltipProvider → BrowserRouter
  → AuthProvider → OrganizationProvider → CampaignProvider → Routes
```

The order matters — each context **depends on the user/org from the one above it**:

- **AuthContext** (`src/contexts/AuthContext.tsx`) — wraps `supabase.auth`, exposes `user`, `session`, `profile` (from `public.profiles`), and `signIn`/`signUp`/`signOut`. Profile fetch inside `onAuthStateChange` is intentionally deferred with `setTimeout(..., 0)` to avoid a Supabase deadlock during the auth event — do not "fix" this.
- **OrganizationContext** — loads orgs the user owns (`organizations.owner_id`) plus orgs reached via `user_roles`, merges them, persists the active org id in `localStorage` (`gpd_active_org_id`).
- **CampaignContext** — loads campaigns for the active org, persists active campaign id in `localStorage` (`gpd_active_campaign_id`).

Most data fetching in pages reads `useCampaign().campaign.id` and queries Supabase scoped to that campaign. **Always scope queries by the active campaign (or org)** — do not assume RLS is the only guard; the UI filters by id too.

### Routing & gating (src/App.tsx, src/components/PrivateRoute.tsx)

- Public routes (no layout): `/login`, `/register`, `/onboarding`.
- Everything else is wrapped in `PrivateRoute` → `MainLayout` (sidebar + topnav) → `<Suspense>` with **lazy-loaded** page components. Add new pages the same way (`lazy(() => import(...))`).
- `PrivateRoute` redirects: no user → `/login`; user but no org → `/onboarding`.
- Active route slugs (pt-BR): `/dashboard`, `/eleitores` (Voters), `/liderancas` (Leaders), `/demandas` (Demands), `/financeiro` (Finances), `/agenda` (Events), `/materiais` (Materials), `/territorio`, `/editorial`, `/pesquisas` (Surveys), `/adversarios` (Opponents), `/documentos`, `/relatorios`, `/configuracoes`.

### Supabase integration

- Client: `src/integrations/supabase/client.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env` (committed; anon key only). `localStorage` session persistence + auto-refresh.
- **`src/integrations/supabase/types.ts` is generated** — never hand-edit. Regenerate via the Supabase MCP `generate_typescript_types` tool (or `supabase gen types typescript`) after any schema change.
- The generated `types.ts` currently only includes legacy template tables (`contacts`, `deals`, etc.) and is **out of sync** with the GPD tables defined in `supabase/migrations/20260404*`. New code that queries GPD tables casts with `.from('organizations' as any)` to work around this — match that pattern until types are regenerated, or regenerate them as part of your change.
- Project id (`.env` and `supabase/config.toml`): `fqwdahsogysxcmhywhes`. To switch projects, update both files.

### Multi-tenancy & permissions

- DB hierarchy: `organizations` → `campaigns` → all domain tables (`voters`, `leaders`, `demands`, `budget_categories`, `transactions`, `events`, `materials`, `content_items`, `surveys`, `territories`, `opponents`, `documents`, `notifications`, …).
- Every domain table has **Row Level Security enabled** with policies that traverse `campaigns → organizations` and check `owner_id = auth.uid()` or membership via `user_roles`.
- **Role enum** (DB type `user_role` + `USER_ROLES` in `src/lib/constants.ts`): `super_admin`, `admin`, `coordenador_geral`, `coordenador_regional`, `cabo_eleitoral`, `assessor_financeiro`, `assessor_comunicacao`, `assessor_demandas`, `visualizador`.
- **Frontend permission helper** (`src/lib/permissions.ts`): `hasPermission(role, 'voters:create')`, `canRead/Create/Update/Delete(role, module)`, with `*` and `module:*` wildcards. Routes aren't permission-gated globally — gate per-action in the UI.

### LGPD constraints (do not violate)

- `voters.consent_given` must be `true` before insert/update — the Voters form blocks save otherwise.
- `voters.cpf_encrypted` is `BYTEA` — CPF is stored encrypted, never plaintext.

## Conventions

- **Brazilian formatting helpers** live in `src/lib/formatters.ts` (`formatCurrency` BRL, `formatDate` pt-BR, `formatCPF`, `formatCEP`, `formatPhone`, `maskCPF`/`maskCEP`/`maskWhatsApp`). Re-use them; don't reimplement.
- General utilities in `src/lib/utils.ts`: `cn` (clsx+tailwind-merge), `slugify`, `isValidCPF`, `fetchCEP` (ViaCEP), `whatsAppLink`, `getAvatarColor`, `debounce`, `groupBy`.
- **Domain enums + their label/color metadata** are centralized in `src/lib/constants.ts` (e.g. `VOTER_STATUS`, `DEMAND_STATUS`, `EVENT_STATUS`, `CONTENT_STATUS`, `CAMPAIGN_OFFICE`, `BRAZIL_STATES`). When you see a badge/dot color tied to a status, the source of truth is here — add new statuses to both the constant and the DB enum.
- **Toasts**: prefer `sonner` (`import { toast } from "sonner"`). Both `<Toaster />` (shadcn `use-toast`) and `<Sonner />` are mounted in `App.tsx`; sonner is the active one for new code.
- **Forms**: React Hook Form + `zodResolver` + shadcn `Input`/`Select`/`Label`. See `src/pages/Onboarding.tsx` or `src/pages/Login.tsx` for the canonical shape.
- **Data fetching**: `QueryClient` is set up (`staleTime: 30_000, retry: 1`) but most pages still use `useEffect` + direct Supabase calls. Either is acceptable; if you reach for React Query, key queries by `campaign.id` / `organization.id`.
- **shadcn/ui** is configured in `components.json` (style `default`, base color `slate`, alias `@/components/ui`). Add components with the shadcn CLI; don't edit `src/components/ui/*` files unless adapting a primitive.

## Legacy template residue (do not extend)

This repo was bootstrapped from a generic-CRM Lovable template, and the original artifacts were never removed:

- **Pages NOT wired into `App.tsx`** and unused: `src/pages/Contacts.tsx`, `Deals.tsx`, `Tasks.tsx`, `Calendar.tsx`, `Index.tsx`, `Financial.tsx` and the `src/components/financial/*` folder. The active financial page is `src/pages/Finances.tsx`.
- **Old migrations** (`supabase/migrations/20250717182*.sql`) created the old `contacts`/`deals` tables that the generated `types.ts` still reflects. They're orthogonal to GPD.
- The **GPD schema** is the `20260404*` migrations. Use those tables.
- The **`README.md`** describes the Lovable template, not GPD.

When adding features, target the GPD pages and the `20260404*` schema. Leave the residue alone unless explicitly asked to clean it up.

## Deployment

- Built output is published to the `gh-pages` branch (Vite `dist/` contents copied to the branch root; `CNAME` and `.nojekyll` preserved). The custom domain is `campanha.grupomalory.com`.
- Service worker (`public/sw.js`): cache-first for static assets, network-first for navigation, **bypasses any URL containing `supabase.co`**. Bump `CACHE_NAME` ('gpd-v1') when the cached shell changes meaningfully.
- `public/404.html` + the inline script in `index.html` implement the GitHub Pages SPA-redirect trick — keep them in sync if you change routing/base.
