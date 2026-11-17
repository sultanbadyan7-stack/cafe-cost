# CaféCost

Bilingual (Arabic / English) café cost, break-even, and cash-runway modelling
tool. All financial formulas live in `shared/engine`; the React app is a thin
presentation layer over those pure functions.

- **Local-only by default.** The app works without any backend and saves to
  `localStorage` (`cafecost.workspace.v2`).
- **Optional cloud sync.** Add Supabase credentials to enable email/password
  sign-in and "Save to Cloud".
- **No hardcoded credentials.** The Supabase URL and anon key are read from
  Vite environment variables.

---

## 1. Requirements

- Node.js 20 or newer
- npm 10 or newer
- (Optional, for cloud sync) a Supabase project

---

## 2. Install and run locally

```bash
# from the repository root
npm install

# install the frontend dependencies
cd frontend
npm install

# start the dev server
npm run dev -- --host 127.0.0.1 --port 5173
```

Open <http://127.0.0.1:5173>.

### Checks

```bash
# engine tests (repository root)
npm test

# typecheck the shared engine and tests
npm run typecheck

# typecheck and production-build the frontend
cd frontend
npm run typecheck
npm run build
```

---

## 3. Supabase setup

Cloud sync is optional. Without credentials, **Save to Cloud** saves the
workspace to this device and shows a clear warning that Supabase is not
configured (`الرجاء إعداد مفاتيح Supabase أولاً`).

### 3.1 Create a project

1. Create a project at <https://supabase.com/dashboard>.
2. Open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key, or the newer **publishable** key (`sb_publishable_…`)

> Use a public client key only. Never put a `service_role` or secret key in a
> frontend environment file — it bypasses Row Level Security.

### 3.2 Create the `projects` table

1. Open the **SQL Editor** in your Supabase project.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql)
   and run it.

The script creates:

- `public.projects` — one row per user (`user_id` is unique)
- Row Level Security policies so each user can only read/write their own row
- A trigger that keeps `updated_at` accurate

Re-running the script is safe: tables, indexes, policies, and triggers are
created with `if not exists` / `drop … if exists` guards.

### 3.3 Enable email/password authentication

1. In Supabase, open **Authentication → Providers → Email** and make sure the
   provider is enabled. It is enabled by default on new projects.
2. Choose whether new accounts must confirm their email:
   - **Confirm email on:** after sign-up the app asks the user to check their
     inbox, then log in.
   - **Confirm email off:** sign-up logs the user in immediately. This is
     convenient for local testing.
3. Under **Authentication → URL Configuration**, set the **Site URL** to your
   app URL (for example `http://127.0.0.1:5173`).

No OAuth provider is required. The app uses standard
`supabase.auth.signUp` / `signInWithPassword` calls.

### 3.4 Add the environment variables

Create `frontend/.env.local` (the Vite app root, next to
`frontend/vite.config.ts`):

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

A template is available at [`.env.example`](.env.example).

Rules:

- The variables **must** start with `VITE_` so Vite exposes them to the client.
- `VITE_SUPABASE_ANON_KEY` accepts either a legacy `anon` JWT or a newer
  `sb_publishable_…` key.
- Do not wrap values in quotes unless the value itself contains them.
- Restart the dev server after editing the file — Vite reads env files at
  startup.
- `.env` and `.env.local` are git-ignored and must never be committed.

### 3.5 How cloud sync behaves

| State | **Save to Cloud** | **On login** |
| --- | --- | --- |
| Supabase configured, signed in | Upserts the full workspace into `public.projects` and shows a success toast | Fetches the newest row and replaces the workspace |
| Supabase configured, signed out | Writes to `localStorage` and shows a local-save toast | No fetch |
| Supabase not configured | Writes to `localStorage` and shows a configuration warning | No fetch |

The upsert uses `user_id` as the conflict target, so each account has exactly
one project row. `project_data` contains the entire `AppState`: settings,
suppliers, menu, expenses, staffing, assets, financing, cash flow, active tab,
and language.

### 3.6 Verify

1. Restart `npm run dev`.
2. Click **Login** in the header.
3. Create an account with email/password (or log in if you already have one).
4. If email confirmation is enabled, confirm the email and log in.
5. Click **Save to Cloud**. A success toast appears and the header briefly shows
   “Saving to cloud…”.
6. Reload the page: the project is pulled from Supabase for the signed-in user.
7. In the Supabase Table Editor, confirm one row in `public.projects` for that
   user.
8. Sign out: the header shows **Login** again and cloud saving falls back to
   this device.

If the keys are missing or invalid, the header shows a warning strip with the
exact variables to add, and the workspace is still saved locally.

### Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Warning strip after clicking **Save to Cloud** | `frontend/.env.local` missing, empty, or the server was not restarted |
| **Login** button missing | The app is still loading auth, or the header is in a very narrow layout |
| `Invalid login credentials` | Wrong email/password, or the account has not been confirmed |
| Sign-up succeeds but no session | Email confirmation is enabled; confirm the email first |
| `Cloud save failed` | RLS blocks the write, the `projects` table is missing, or the user is signed out |
| Changes not picked up | Restart Vite; `VITE_*` values are inlined at startup |

---

## 4. Project structure

```text
shared/                 Pure TypeScript domain types and engines
  engine/               Break-even, cash flow, payroll, pricing, recipes, waste
  types/                Domain models shared by the app and tests
frontend/               Vite + React + Tailwind app
  src/components/       Layout, tabs, auth modal, shared UI
  src/context/          Workspace state, auth, toasts
  src/hooks/            Engine adapter and cloud sync (useProjectSync)
  src/lib/              Defaults, presets, Supabase client
i18n/                   Arabic and English dictionaries (key-for-key parity)
supabase/schema.sql     Database schema, RLS policies, triggers
tests/                  Node test runner suite for the engine
```

---

## 5. Waste and COGS model

Supplier waste is applied to ingredient costs, not charged as a separate fixed
cost:

```text
Effective Unit Cost = (Package Price ÷ Package Size) × (1 + waste% ÷ 100)
```

Every recipe line uses the effective unit cost, so menu COGS already includes
supplier waste. The fixed-cost waste bucket contains only explicit expenses
whose category is `waste`. This prevents the same loss from being counted twice.

Retail bean bags keep the raw bean cost because they are sealed resale stock,
and simple-percentage COGS assumes the user's estimate already includes waste.

---

## 6. License

Copyright © 2026 CaféCost. All rights reserved. See [LICENSE](LICENSE).
