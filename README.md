# streamd

TV show tracker for managing shows across streaming services. Lightweight name-based login — no passwords, no accounts.

<p align="center">
  <img src="screens/streamd-dashboard-light.png" width="300" alt="Dashboard - light mode" />
  &nbsp;&nbsp;
  <img src="screens/streamd-shows-dark.png" width="300" alt="My Shows - dark mode" />
</p>

## What It Does

- **Search and add** TV shows from TMDB's catalog
- **Track your progress** — mark episodes watched and your bookmark auto-advances
- **Dashboard** shows your next unwatched episodes across all shows, sorted by air date
- **Episode sync** pulls new episode data from TMDB automatically (or on demand)
- **Multiple users** on the same instance with isolated watch progress — shows and episode metadata are shared, but what you're watching and where you're at is yours
- **Streaming providers** displayed per show so you know where to watch
- **Admin panel** for managing users and viewing database stats (gated by `is_admin` flag)

## Tech Stack

- React 19 & TypeScript & Vite+ (unified toolchain: Vite & Vitest & Oxlint)
- Cloudflare Pages (frontend + API)
- Cloudflare D1 (SQLite database)
- TMDB API (show metadata)
- MSW (API mocking for dev/tests)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (frontend + API + D1)
npm run dev

# Start with mock API (no wrangler needed)
npm run dev:mock

# Reset local database and start fresh
npm run db:reset
```

Dev server runs at http://localhost:5173 (API proxied to port 8788)

### Running migrations locally

```bash
npx wrangler d1 execute streamd-db --local --file=schema/<migration>.sql
```

If changes don't take effect, Wrangler may be targeting a different SQLite file than the dev server uses. Run the migration directly against the active file instead:

```bash
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite < schema/<migration>.sql
```

The active file is the larger, recently-modified `.sqlite` file in that directory.

## Scripts

| Command            | Description                               |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Vite + Wrangler concurrently (full stack) |
| `npm run dev:mock` | Vite only with MSW mock API               |
| `npm run build`    | Build for production                      |
| `npm start`        | Serve production build locally            |
| `npm run db:reset` | Wipe local DB and restart                 |
| `npm run lint`     | Lint with Oxlint (via Vite+)              |
| `npm test`         | Run tests in watch mode                   |
| `npm run test:run` | Run tests once                            |

## Environment Variables

Create `.env.local` for local development (gitignored):

```
TMDB_API_KEY=your_key_here
```

For production, set `TMDB_API_KEY` in Cloudflare Pages dashboard under Settings → Environment variables.

## Cloudflare Deployment

### First-time setup

1. Create a Cloudflare account
2. Create D1 database:
   ```bash
   npx wrangler login
   npx wrangler d1 create streamd-db
   ```
3. Update `wrangler.toml` with the database_id from step 2
4. Connect your GitHub repo to Cloudflare Pages:
   - Dashboard → Workers & Pages → Create → Pages → Connect to Git
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add D1 binding in Pages settings:
   - Settings → Functions → D1 database bindings
   - Variable name: `DB`
   - Database: `streamd-db`

### Running migrations on production

```bash
npx wrangler d1 execute streamd-db --remote --file=schema/<migration>.sql
```

Non-destructive migrations (ADD COLUMN) can be run ahead of code deployment.

### Deploying updates

Push to main — Cloudflare auto-deploys. CI runs lint, tests, and build on PRs.

## Release Notes

### v1.7.0

- Show detail action buttons are now icons instead of text — a yellow pause button to stop watching, a green play button to resume a paused show, and a red trash button to delete
- The "stop watching" confirmation now uses a matching yellow confirm button (red is reserved for delete)

### v1.6.1

- Swipe left/right on a show detail page to move to the previous/next show, instead of jumping back to the Dashboard
- Swipe order follows the list you came from — the Dashboard's "Next Up" order when opened from the Dashboard, otherwise the My Shows order
- The back button returns to wherever you opened the show from, rather than walking back through each show you swiped past

### v1.6.0

- Personal notes for tracked shows — add free-text notes from the show detail page
- "Add notes" link appears below the show description; notes display under a "My notes" header and are editable by tapping

### v1.5.0

- Deactivate a show to remove it from the Dashboard without deleting it — use "Stop Watching" on the show detail page
- Deactivated shows appear muted on My Shows and can be reactivated with "Resume Watching"
- Simplified show status model: status is now `watchlist` or `deactivated` (`migration-004-deactivate-show.sql`)
- Removed dead History page

### v1.4.0

- 5-star rating system for tracked shows, set from the show detail page
- Ratings are per-user and stored in the database (`migration-003-show-rating.sql`)

### v1.3.2

- Sort shows alphabetically ignoring leading articles (The, A, An)
- API key variable fix

### v1.3.1

- Blue favicon with iPhone home screen icon support
- UI tweaks and toolchain updates (Node 24)

### v1.3.0

- Admin panel at `/admin` with user management (delete users) and database stats
- Admin access controlled by `is_admin` column in the database

### v1.2.0

- Browse other users' show lists from the "What's everyone else watching?" link on My Shows
- Add shows directly from another user's list with full TMDB sync (current season, episodes, streaming providers)
- Toast confirmation when adding a show

### v1.1.0

- Swipe navigation between Dashboard and My Shows (including from show detail pages)
- Show deletion with confirmation dialog
- Optimized trending requests
- Reduced jank on swipe transitions

### v1.0.3

- Lock icon for shows unavailable on streaming services
- Dashboard animations

### v1.0.2

- Timezone fix for episode air dates
- Handle unknown streaming providers gracefully

### v1.0.1

- Initial versioned release
- Provider selection, multi-user support, episode tracking

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
