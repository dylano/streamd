# StreamD - Agent Guide

## Quick Start

- `npm run dev` — full stack (Vite + Wrangler + D1). Needs `TMDB_API_KEY` in `.env.local`.
- `npm run dev:mock` — frontend only with MSW mocks. No Wrangler or API key needed.
- `npm run test:run` — run all tests once.

## Architecture

- **Frontend:** React 19 SPA in `src/`, served by Vite on :5173
- **API:** Cloudflare Pages Functions in `functions/api/`, proxied on :8788
- **Database:** Cloudflare D1 (SQLite). Schema in `schema/schema.sql`
- **External data:** TMDB API provides show/episode metadata. `air_date` from TMDB is date-only (`YYYY-MM-DD`, no time/timezone). The `/episodes/unwatched` endpoint accepts a `?tz=` param from the client to compute "today" in the user's local timezone.

## Conventions

- Custom hooks go in `src/hooks/` — never inline hook logic in context files.
- Use the `Intl` module for date/time formatting and locale-aware utilities. No locale hacks (e.g. `sv-SE` for date formatting) or third-party date libraries.
- Imports from test utilities use `vite-plus/test`, not `vitest` directly.

## Testing

- MSW handles all API mocking. Handlers in `src/test/mocks/handlers.ts`, server setup in `src/test/mocks/server.ts`.
- Page components need `<MemoryRouter>`, `<SettingsProvider>`, and usually `<ShowsProvider>` as wrappers.
- There is a pre-existing unhandled rejection in `Navigation.test.tsx` ("Sync failed") — this is a known issue, not caused by your changes.
