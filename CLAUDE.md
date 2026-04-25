# StreamD - Agent Guide

## Quick Start

- `npm run dev` — full stack (Vite + Wrangler + D1). Needs `TMDB_API_KEY` in `.env.local`.
- `npm run dev:mock` — frontend only with MSW mocks. No Wrangler or API key needed.
- `npm run test:run` — run all tests once.

## Architecture

- **Frontend:** React 19 SPA in `src/`, served by Vite on :5173
- **API:** Cloudflare Pages Functions in `functions/api/`, proxied on :8788
- **Database:** Cloudflare D1 (SQLite). Schema in `schema/schema.sql`
- **Auth:** Lightweight name-based identification (no passwords). Users enter a name, stored in localStorage. The `X-User-Id` header is sent on all API requests via `src/api/client.ts`.
- **External data:** TMDB API provides show/episode metadata. `air_date` from TMDB is date-only (`YYYY-MM-DD`, no time/timezone). The `/episodes/unwatched` endpoint accepts a `?tz=` param from the client to compute "today" in the user's local timezone.

## Data Model

- **Shared metadata:** `shows` and `episodes` contain TMDB data shared across all users.
- **Per-user state:** `user_shows` (status, bookmark) and `user_episodes` (watched, watched_at) are join tables scoped by `user_id`.
- **Users:** `users` table with `name` (unique, case-insensitive via `COLLATE NOCASE`) and `is_admin` flag (INTEGER, default 0).
- The `UserGate` component in `src/components/UserGate.tsx` blocks the app until a user is identified. All data-fetching contexts (`ShowsProvider`, `SyncProvider`) mount only after user identity is established.

## Conventions

- Custom hooks go in `src/hooks/` — never inline hook logic in context files.
- Use the `Intl` module for date/time formatting and locale-aware utilities. No locale hacks (e.g. `sv-SE` for date formatting) or third-party date libraries.
- Imports from test utilities use `vite-plus/test`, not `vitest` directly.
- Shared UI components (e.g. `ConfirmDialog`) go in `src/components/ui/`.
- **Client-side caching:** Module-level variables cache API responses (episodes, trending) across component remounts to avoid loading flashes on tab/swipe navigation. Caches are updated inline on user actions (e.g. marking watched) and refreshed on sync.
- **Swipe navigation:** `useSwipeNavigation` hook enables horizontal swipe between Dashboard and My Shows tabs (including from ShowDetail pages). Swipes trigger a slide-in CSS animation on the `<main>` element.
- **Social browse:** Users can view other users' show lists via a dialog opened from the "What's everyone else watching?" link at the bottom of the My Shows page. The `UserShowsDialog` component (`src/components/ui/UserShowsDialog.tsx`) fetches users from `GET /api/users/all` and their shows from `GET /api/users/:id/shows`. Shows can be added directly from the dialog — the add flow mirrors the search dialog (fetches TMDB details, sets current season/episode, syncs episodes). `ShowCard` accepts an optional `onAdd` prop that renders a green "+" button and switches the card from a `<Link>` to a `<div>`.
- **Admin:** The `/admin` page provides user management (delete users) and database stats. Access is controlled by the `is_admin` column in the `users` table — the server returns `isAdmin` in all user API responses (`GET /api/users`, `GET /api/users/:id`, `POST /api/users`). Admin API endpoints in `functions/api/admin/` are protected by `_guard.ts` which checks the DB flag. The client uses `user.isAdmin` to show/hide the admin link in Settings and to guard the `/admin` route (non-admins are redirected to `/`).

## Migrations

- Schema migrations live in `schema/` as numbered SQL files (e.g. `migration-002-admin-flag.sql`).
- **Local:** `wrangler d1 execute` may target a different sqlite file than `wrangler pages dev` uses. If a migration doesn't take effect locally, run it directly against the active sqlite file under `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` (the larger, recently-modified one), or use `npm run db:reset` to start fresh.
- **Remote:** `npx wrangler d1 execute streamd-db --remote --file=schema/<migration>.sql`. Non-destructive migrations (ADD COLUMN) can be run ahead of code deployment.

## Testing

- MSW handles all API mocking. Handlers in `src/test/mocks/handlers.ts`, server setup in `src/test/mocks/server.ts`.
- Test setup seeds localStorage with a mock user and calls `setApiUserId()` so providers work without a real backend.
- Page components need `<MemoryRouter>`, `<UserProvider>`, `<SettingsProvider>`, and usually `<ShowsProvider>` as wrappers.
