# Neon Syndicate

A cyberpunk text-based web RPG (MVP). Inspired by [The Crims](https://www.thecrims.com/) but set in a dystopian hacker universe — burn bandwidth, run hacks, climb street rep, stay out of system lockout.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL**.

---

## Features (MVP)

- **Auth** — username/password, JWT in an `httpOnly` cookie, bcrypt-hashed passwords (`/login`, `/register`, `/api/auth/*`).
- **Dashboard** — live stat cards, quick actions, recent op log.
- **The Grid** (`/grid`) — list of available hacks. `POST /api/hack/execute` deducts bandwidth, rolls success/fail with a software-level bonus, awards creds + rep on success, sends the player to system lockout on failure.
- **Black Market** (`/black-market`) — spend creds on Cyber-Stims (refill bandwidth) or upgrade Hardware/Software. `POST /api/shop/buy`.
- **Cyberpunk UI** — sticky neon Sidebar, sticky stat Topbar with live bandwidth meter and lockout countdown, glitch hover effect on hack cards.

## Tech stack

| Layer            | Choice                                                |
| ---------------- | ----------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Server Components)            |
| Language         | TypeScript (strict)                                   |
| Styling          | Tailwind CSS v4 (CSS-config, custom `@utility`s)      |
| Auth             | `jose` JWT in `httpOnly` cookie + `bcryptjs`          |
| ORM              | Prisma 6                                              |
| Database         | PostgreSQL                                            |
| Validation       | Zod 4                                                 |
| Icons            | lucide-react                                          |

## Getting started

### 1. Prerequisites

- Node.js ≥ 20
- A reachable PostgreSQL instance (local Docker is fine).

### 2. Install

```bash
git clone https://github.com/BarBaToT/neon-syndicate.git
cd neon-syndicate
npm install
```

### 3. Configure env

```bash
cp .env.example .env
# Edit .env:
#   DATABASE_URL  - your Postgres URL
#   AUTH_SECRET   - 32+ char random string  (openssl rand -base64 48)
```

### 4. Migrate + seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

This creates the schema and seeds 7 hacks (Skim ATM → Loot Orbital Data Vault) and 7 shop items (stims, hardware/software upgrades).

### 5. Run

```bash
npm run dev
# http://localhost:3000
```

## Project layout

```
prisma/
  schema.prisma          # User, Action, HackLog, ShopItem
  seed.ts                # idempotent seeds
src/
  lib/
    prisma.ts            # singleton PrismaClient
    auth.ts              # JWT cookie session + bcrypt helpers
  components/
    Sidebar.tsx          # neon nav (Dashboard / Grid / Black Market / Leaderboard)
    Topbar.tsx           # creds / rep / bandwidth meter + lockout countdown
  app/
    globals.css          # Tailwind v4 theme + @utility neon-text / glitch
    layout.tsx           # root html
    page.tsx             # /  →  redirect to /dashboard or /login
    login/               # /login  + LoginForm
    register/            # /register  + RegisterForm
    (game)/              # protected segment (auth gate in layout)
      layout.tsx
      dashboard/page.tsx # /dashboard
      grid/              # /grid  + GridList (client)
      black-market/      # /black-market  + ShopList (client)
    api/
      auth/{login,register,logout}/route.ts
      hack/execute/route.ts
      shop/buy/route.ts
```

## Hack mechanics

- A hack costs `Action.energyCost` bandwidth.
- The success rate is `clamp(Action.successRateBase + min(40, max(0, user.softwareLevel - Action.requiredSoftwareReq) * 5), 5, 95)`.
- A `1..100` roll determines outcome. Success → random creds in `[rewardCredsMin, rewardCredsMax]` + `rewardRep` street rep. Failure → `lockedUntil = now + lockoutMinutes` and no rewards.
- The whole thing runs in a single Prisma transaction so partial failures can't desync the user record.

## Scripts

| Command              | What it does                       |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start the dev server               |
| `npm run build`      | Production build                   |
| `npm run start`      | Start production server            |
| `npm run lint`       | Run ESLint                         |
| `npm run typecheck`  | Run `tsc --noEmit`                 |
| `npm run db:migrate` | Apply Prisma migrations            |
| `npm run db:push`    | Push the schema without migrating  |
| `npm run db:seed`    | Seed actions + shop items          |

## Roadmap (post-MVP)

- Bandwidth regeneration on a timer (currently only restored via stims).
- Leaderboard page.
- PvP / "Crew" features.
- Inventory + consumable tracking.
- Realtime lockout countdown via server-sent events.
