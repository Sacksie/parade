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

## Design

The v2 design handoff (journey, roles, logic, data model, visual system, build order) is in [`docs/design/README.md`](docs/design/README.md), with screen markup in `docs/design/screens/`.
