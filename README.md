# Spotify UI Preview

A Spotify-style interface for working on app design and layout. All app pages open without login, a subscription, Spotify API credentials, or an environment file. Home, library, playlists, and search use local sample content from `lib/demoData.js`.

## Run locally

1. Run `npm install`.
2. Run `npm run dev`.
3. Open http://localhost:3000.

The old `/login` URL redirects to the home page. Library actions are preview interactions and do not change a Spotify account. Audio previews still use the existing external royalty-free audio source.
