# StreamD Implementation Plan

## Overview

Personal TV show tracker with Cloudflare Pages + D1 backend. Syncs across devices, uses TMDB for metadata.

**Stack:** Vite 8 + React 19 + TypeScript | Cloudflare Pages + Workers + D1 | TMDB API

---

## Cloudflare Setup (One-Time)

1. Create Cloudflare account at cloudflare.com
2. Create D1 database: `npx wrangler d1 create streamd-db`
3. Connect GitHub repo to Cloudflare Pages dashboard
4. Set environment variable `TMDB_API_KEY` in Pages settings
5. Run schema migration: `npx wrangler d1 execute streamd-db --file=schema/schema.sql`

---

## Project Structure

```
streamd/
├── functions/                    # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── shows/
│   │   │   ├── index.ts         # GET list, POST create
│   │   │   └── [id].ts          # GET/PUT/DELETE single show
│   │   ├── episodes/
│   │   │   ├── index.ts         # GET episodes
│   │   │   └── [id].ts          # PUT mark watched
│   │   ├── tmdb/
│   │   │   ├── search.ts        # Proxy TMDB search
│   │   │   └── show/[id].ts     # Proxy show details
│   │   └── export/
│   │       └── index.ts         # GET JSON export
│   └── _middleware.ts           # D1 binding, CORS
├── src/
│   ├── components/
│   │   ├── ui/                  # Button, Card, Modal, Badge, Spinner
│   │   ├── layout/              # Header, Navigation, Layout
│   │   └── shows/               # ShowCard, ShowGrid, ShowSearch, EpisodeRow
│   ├── pages/
│   │   ├── Dashboard.tsx        # Currently watching
│   │   ├── Watchlist.tsx        # Backlog queue
│   │   ├── History.tsx          # Completed/dropped
│   │   ├── NewEpisodes.tsx      # Unwatched aired episodes
│   │   ├── ShowDetail.tsx       # Full show view
│   │   ├── Search.tsx           # Add shows via TMDB
│   │   └── Settings.tsx         # Export, preferences
│   ├── hooks/
│   │   ├── useShows.ts          # Show CRUD
│   │   ├── useEpisodes.ts       # Episode state
│   │   └── useTMDB.ts           # TMDB API
│   ├── api/
│   │   └── client.ts            # Fetch wrapper
│   ├── types/
│   │   ├── show.ts
│   │   ├── episode.ts
│   │   └── tmdb.ts
│   ├── context/
│   │   └── ShowsContext.tsx     # Global state
│   └── utils/
│       └── images.ts            # TMDB image URLs
├── schema/
│   └── schema.sql               # D1 database schema
└── wrangler.toml                # Cloudflare config
```

---

## Database Schema (schema/schema.sql)

```sql
CREATE TABLE shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    poster_path TEXT,
    overview TEXT,
    first_air_date TEXT,
    status TEXT CHECK(status IN ('watching', 'watchlist', 'completed', 'dropped')) DEFAULT 'watchlist',
    streaming_service TEXT,
    total_seasons INTEGER DEFAULT 0,
    total_episodes INTEGER DEFAULT 0,
    current_season INTEGER DEFAULT 1,
    current_episode INTEGER DEFAULT 0,
    added_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    show_id INTEGER NOT NULL,
    tmdb_id INTEGER,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    name TEXT,
    air_date TEXT,
    runtime INTEGER,
    watched INTEGER DEFAULT 0,
    watched_at TEXT,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    UNIQUE(show_id, season_number, episode_number)
);

CREATE TABLE tmdb_cache (
    cache_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE INDEX idx_shows_status ON shows(status);
CREATE INDEX idx_episodes_show_id ON episodes(show_id);
CREATE INDEX idx_episodes_air_date ON episodes(air_date);
```

---

## Key Dependencies to Add

```bash
npm install react-router-dom idb
npm install -D wrangler @cloudflare/workers-types
```

- `react-router-dom` — client-side routing
- `idb` — IndexedDB wrapper for offline cache
- `wrangler` — Cloudflare CLI for local dev and deploy
- `@cloudflare/workers-types` — TypeScript types for D1

---

## Wrangler Config (wrangler.toml)

```toml
name = "streamd"
compatibility_date = "2025-04-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "streamd-db"
database_id = "<from cloudflare dashboard>"

[vars]
TMDB_API_KEY = "<set in dashboard, not here>"
```

---

## Implementation Phases

### Phase 1: Infrastructure
1. Add wrangler.toml and schema/schema.sql
2. Create `functions/_middleware.ts` (D1 binding, CORS)
3. Install dependencies (react-router-dom, idb, wrangler)
4. Set up basic route structure in App.tsx
5. Create Layout, Header, Navigation components

### Phase 2: Core API + Shows
6. Create `functions/api/shows/index.ts` and `[id].ts`
7. Create `functions/api/tmdb/search.ts` and `show/[id].ts`
8. Build ShowsContext for global state
9. Build Search page (TMDB search, add shows)
10. Build Dashboard (currently watching grid)

### Phase 3: Episode Tracking
11. Create `functions/api/episodes/` routes
12. Build ShowDetail page with season/episode lists
13. Implement mark watched functionality
14. Build Watchlist and History pages

### Phase 4: Polish
15. Build NewEpisodes page (unwatched aired episodes)
16. Add export functionality
17. Add offline support with IndexedDB
18. Responsive design refinements
19. Loading/error/empty states

---

## Files to Modify

| File | Action |
|------|--------|
| `src/App.tsx` | Replace with Router + Layout shell |
| `src/index.css` | Add app-specific CSS variables |
| `package.json` | Add dependencies |
| `.gitignore` | Add wrangler local files |

---

## Files to Create

| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare config |
| `schema/schema.sql` | Database schema |
| `functions/_middleware.ts` | D1 binding, CORS |
| `functions/api/shows/index.ts` | List/create shows |
| `functions/api/shows/[id].ts` | Single show CRUD |
| `functions/api/episodes/index.ts` | List episodes |
| `functions/api/episodes/[id].ts` | Mark watched |
| `functions/api/tmdb/search.ts` | Proxy TMDB search |
| `functions/api/tmdb/show/[id].ts` | Proxy show details |
| `functions/api/export/index.ts` | JSON export |
| `src/components/layout/Layout.tsx` | App shell |
| `src/components/layout/Header.tsx` | Top bar |
| `src/components/layout/Navigation.tsx` | Nav links |
| `src/components/ui/Button.tsx` | Button component |
| `src/components/ui/Card.tsx` | Card component |
| `src/components/shows/ShowCard.tsx` | Show display |
| `src/components/shows/ShowGrid.tsx` | Grid layout |
| `src/components/shows/ShowSearch.tsx` | Search UI |
| `src/components/shows/EpisodeRow.tsx` | Episode list item |
| `src/pages/Dashboard.tsx` | Currently watching |
| `src/pages/Watchlist.tsx` | Backlog |
| `src/pages/History.tsx` | Completed/dropped |
| `src/pages/NewEpisodes.tsx` | Unwatched |
| `src/pages/ShowDetail.tsx` | Full show view |
| `src/pages/Search.tsx` | Add shows |
| `src/pages/Settings.tsx` | Export |
| `src/context/ShowsContext.tsx` | Global state |
| `src/hooks/useShows.ts` | Show operations |
| `src/hooks/useEpisodes.ts` | Episode operations |
| `src/hooks/useTMDB.ts` | TMDB API |
| `src/api/client.ts` | Fetch wrapper |
| `src/types/show.ts` | Show types |
| `src/types/episode.ts` | Episode types |
| `src/types/tmdb.ts` | TMDB types |
| `src/utils/images.ts` | Image URL helpers |

---

## Local Development

```bash
# Run frontend + API together
npx wrangler pages dev --d1=DB -- npm run dev

# Apply schema to local D1
npx wrangler d1 execute streamd-db --local --file=schema/schema.sql
```

---

## Deployment

Push to main branch — Cloudflare Pages auto-deploys both frontend and API functions.

---

## Verification

1. Run `npm run dev` — app loads without errors
2. Run `npx wrangler pages dev` — API endpoints respond
3. Search for "Your Friends & Neighbors" (TMDB ID 241609) — results appear
4. Add show to watchlist — persists in D1
5. Mark episode watched — state updates
6. Refresh page — data persists
7. Export data — JSON file downloads
8. Test on mobile — responsive layout works
