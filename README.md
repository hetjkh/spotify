# Groovy audiobooks

Next.js frontend and Express/MongoDB API for browsing, uploading, and listening to audiobooks.

## Local setup

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env` and configure `MONGODB_URI`.
3. Set a randomly generated `JWT_SECRET` of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
4. Run `npm run dev:all`, then open **http://localhost:3000**. The API runs on port 4000. Use the same hostname for frontend and API so authenticated audio cookies work.
5. For a new checkout, run `npm run demo:media` to prepare the real demo assets, then `npm run seed`. Preparing excerpts requires FFmpeg and FFprobe on PATH. Demo seeding runs automatically only when `SEED_DEMO=true`, outside production.

## Demo catalog

The current demo contains six classic titles, twelve 90-second excerpts of real LibriVox recordings downloaded from Internet Archive, six recording covers, and five fictional curator profiles with portraits downloaded from Random User. Assets are served locally, so playing a demo does not depend on an Archive streaming URL. Original recording links and credits appear on each book page. These are demo excerpts, not complete audiobook editions.

Sign in as **mira@groovy.demo** with password **listening123** to explore the populated dashboard, library statuses, bookmarks, listening list, stacks, follows, and notifications. The other fictional curator emails are listed in `data/demoCatalog.json` and use the same demo password. Sample reviews, listening activity, and counters are explicitly demo data. Do not use these accounts in production.

`npm run demo:reset` intentionally deletes all records in this app's eight model collections and its upload directory, then seeds prepared demo content. It is restricted to the reviewed `groovy-audiobooks` database and disabled in production. It requires the verified media manifest prepared by `npm run demo:media`. A catalog-version check clears obsolete app browser content when the new catalog first loads online.

## Features

- Listening dashboard: resume cards, chapter progress, daily/weekly listening minutes, library counts, bookmarks, history, weekly/monthly goals, recommendations, followed-creator releases, downloads, and playback preferences.
- Separate My uploads tab with creator statistics and book management.
- Public/private uploads, multilingual metadata, and chapter renaming, reordering, removal, replacement, and appending.
- Private-media authorization, HTTP range streaming, hashed recovery/verification tokens, expiring links, authentication rate limiting, and session invalidation after reset or sign-out.
- Per-account saved chapters, history, and chapter lists synchronized to MongoDB, with browser storage for offline use. Guest data stays separate. Local file imports last for the session.
- Library statuses and editable book stacks with add/remove/reorder controls.
- Ratings, comments, following, notifications, and listener counts refreshed every 15 seconds.
- All-time play/rating/new-release charts and genre stations that queue books continuously.
- Offline downloads with progress, storage usage, removal, and byte-range playback. Private offline downloads are removed on sign-out.

## Email and Google sign-in

Email delivery uses the [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email). Configure `RESEND_API_KEY` and `MAIL_FROM` with a verified sender. Set `CLIENT_ORIGIN` to the frontend origin used in emailed links. Reset links are never returned by the API or displayed in the application. Recovery always returns a generic response. Without an email provider, accounts can still sign up and sign in, but delivery cannot occur; verification requests report that email is unavailable.

For Google OAuth, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `API_ORIGIN`. Register the API origin followed by `/auth/google/callback` as the authorized redirect URI. The Google button appears when credentials are configured. Live email delivery and Google OAuth still require provider credentials and have not been verified with real providers.

Production requires HTTPS and a strong JWT secret; the API refuses to start with a short/missing/placeholder secret. Production cookies use Secure, HttpOnly, and SameSite=Lax. Host frontend and API on the same site, configure `CLIENT_ORIGIN` and `NEXT_PUBLIC_API_URL`, and provide persistent storage for `server/uploads`. A missing/placeholder development secret is replaced with an ephemeral random secret, so restarting the API requires signing in again. Old verification/reset links issued before this security update must be requested again.

## Offline and statistics

Download a book online, then open Downloads. Audio and the application shell are stored on that browser. A service worker serves cached audio, including byte ranges for seeking. Downloaded books can play after refreshing Downloads offline. Use HTTPS or localhost with Service Worker and Cache Storage support. Storage can be cleared/evicted by the browser. External hosts must permit cross-origin downloads; unsupported sources report failure. Downloads are device-local; saved chapter IDs and lists sync between signed-in devices.

Listening minutes count sampled playback time, excluding skips, using the browser timezone. Weekly goals start Monday. Tracking begins with this update; old progress records cannot reconstruct past listening minutes. Creator play rankings use all-time data.

## Validation

- `npm test -- --runInBand`: unit tests including private access, timezone boundaries, and offline ranges.
- `npm run lint`: static checks.
- `npm run build`: production build.
- `npm run test:e2e`: catalog navigation/playback checks using the real seeded demo audio, without intercepting audio requests.
- `npm run test:site`: browser checks for every page family, real playback of all twelve excerpts, images, desktop/mobile layout, demo sign-in, and playback controls. Run this after disposable feature checks finish, so fixture cleanup cannot race with catalog image checks. A detailed result is written to `artifacts/demo-site-check.json`.
- `npm run test:features`: live API/browser checks with disposable accounts and cleanup. Start frontend on port 3000 and a temporary API on port 4001, or override `CHECK_WEB_URL` / `CHECK_API_URL`. Checks cover privacy, Hindi uploads, dashboard/settings, stacks, playback, bookmarks, saved-content reloads, offline reload/playback, editing, file cleanup, and password-reset session invalidation.

Set `NEXT_BUILD_DIR` to an alternate directory to check production compilation without overwriting a running development server's `.next` output.

The inner pages use a separate workspace design in `styles/workspace.css`; the home page retains its original appearance. Catalogs, library, creators, listening lists, history, bookmarks, downloads, and local audio include contextual search. Book collections include genre and order controls. Listening lists support renaming, deletion, chapter removal, and reordering; bookmark notes can be edited through the authenticated bookmark API. Run `npm run test:redesign` for the disposable-account UI and mobile checks.

Navigation is organized into Home, Browse, My Library, and Dashboard. `/browse` groups catalog, categories, popular books, new releases, authors/narrators, and optional stations. `/collections` manages whole-book collections; `?type=chapters` manages chapter collections. Library navigation contains Want to listen, Liked chapters, Bookmarks, Downloads, and Import audio. `/creator` is the My uploads workspace, available in the account menu. Existing `saved` and `wishlist` records are displayed together as Want to listen without deleting or migrating their stored data. Legacy catalog, collection, and profile links remain supported.
