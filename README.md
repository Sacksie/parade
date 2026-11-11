# parade

Parade app for Chabad's Chanukah Parades. Built with Expo (SDK 58), React Native, Expo Router and TypeScript, for iOS and Android.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the Supabase URL and anon key
npm start              # scan the QR code with Expo Go, or press i / a for a simulator
```

## Scripts

- `npm start`: start the Metro dev server
- `npm run ios` / `npm run android`: start and open in a simulator/emulator
- `npm run typecheck`: TypeScript check
- `npm run lint`: ESLint via `expo lint`

## Layout

- `src/app/`: routes (Expo Router); every file is a screen, `_layout.tsx` defines navigators
- `src/lib/supabase.ts`: shared Supabase client (`getSupabase()`)

App IDs: `com.sacksie.parade` on both iOS and Android.

## Trying the prototype

Everything runs without a backend. `npm start` then press `w` (web) or scan with Expo Go. The home screen is seeded with three parades:

- **Chanukah Car Parade** (you're the organiser, it's today): Ready to start → hold → countdown → organiser console. The console has a demo row to speed up the simulated convoy and trigger a breakdown.
- **Menorah Lights Drive** (your draft): the full Create wizard. "Use the demo route" on the Route step fills in the mock town route.
- **Borehamwood Menorah Parade** (you're car 42): You're going → "Simulate the organiser starting the parade" → countdown → drive mode.

"Reset demo data" at the bottom of the home screen puts everything back. The route map, address search and turn list run against the mock town from the design until real map tiles and a directions API are wired in. See [`docs/dev/app-map.md`](docs/dev/app-map.md) for the route map, screen behaviour and the list of external services still needed.

## Design

The v2 design handoff (journey, roles, logic, data model, visual system, build order) is in [`docs/design/README.md`](docs/design/README.md), with screen markup in `docs/design/screens/`.
