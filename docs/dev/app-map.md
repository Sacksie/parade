# Parade — app map (v2 build)

How the 22 design screens (docs/design/) map onto Expo Router routes, what state each one reads and writes, and the UX decisions made while building. Read docs/design/README.md first.

## Principles

- **Everything in the app.** Guests join from a deep link (`parade://invite/HEND26`) or by typing the code. No web pages.
- **Mint once per screen.** The primary action, "you", or the route ahead.
- **Numbers in Geist Mono.** `type.mono*` presets.
- **No dead ends.** Every screen has a way back and a next step. Empty states say what to do.
- **Testable without a backend.** The store (src/store) is seeded with three parades and the simulator (src/lib/simulator.ts) drives a 71-car convoy along the mock town so every live screen can be exercised.

## Who you are in the demo

`me` = Gavriel (src/data/seed.ts).

| Parade | Code | Your role | Status | Use it to test |
| --- | --- | --- | --- | --- |
| Chanukah Car Parade (Hendon Shul) | HEND26 | Organiser, lead car | Published, today | I1 → A2 → A4 → L6 console, A3, F1 |
| Menorah Lights Drive | MENO26 | Organiser | Draft | C1–C8 wizard |
| Borehamwood Menorah Parade | BORE26 | Car 42 of 87 | Published | I3, A1, L1–L5, F1 as a guest |

Any code not in the seed → "No parade with that code".

## Routes

| Route | Design | Screen | Who |
| --- | --- | --- | --- |
| `/` | – | My parades (home) | all |
| `/join` | – | Enter a code | guest |
| `/invite/[code]` | I2 | Invite page: route preview, times, car name + phone, "We're coming" | guest |
| `/create/basics` | C1 | Basics | organiser |
| `/create/meet` | C2 | Meeting point | organiser |
| `/create/route` | C3 | Route editor | organiser |
| `/create/check` | C4 | Check the route (turn list) | organiser |
| `/create/stop?stopId=` | C5 | Stop editor (sheet over the map) | organiser |
| `/create/music` | C6 | Music | organiser |
| `/create/crew` | C7 | Crew & roles | organiser |
| `/create/publish` | C8 | Review & publish | organiser |
| `/parade/[id]` | I1 / I3 | Hub: organiser sees Invite (I1); a car sees You're going (I3) | both |
| `/parade/[id]/cars` | – (new) | Every car, searchable; organiser taps a row for A3 | organiser |
| `/parade/[id]/car/[carId]` | A3 | Car sheet: call, message, lead, tail, organiser access, remove | organiser |
| `/parade/[id]/arrive` | A1 | Arrival check (location, music, screen, sound test) | car |
| `/parade/[id]/ready` | A2 | Ready to start: readiness, lead/tail, needs attention, hold to start | organiser |
| `/parade/[id]/countdown` | A4 | Countdown, every phone together | all |
| `/parade/[id]/drive` | L1 L2 L3 L4 L5 | Drive mode. One screen, five states (see below) | car |
| `/parade/[id]/help` | – (new) | Need help: breakdown / lost / medical / other → organiser alert | car |
| `/parade/[id]/console` | L6 | Organiser console | organiser |
| `/parade/[id]/done` | F1 | Parade complete | all |

The Create wizard edits `store.draftId`. "Edit parade" on I1 sets `draftId` to that parade and opens `/create/basics`; the step bar still shows 6 steps and the footer says "Save" instead of "Continue" when editing a published parade.

## Drive mode states (`/parade/[id]/drive`)

Derived every second from the live state, in this priority:

1. **Stop (L4)** — `live.currentStop` set. Shows the stop name, time until moving (stop duration − time since entered), "music paused" if the stop pauses it. A chime + haptic 30 s before moving off.
2. **Off route (L5)** — my `offRouteM > 40` for > 10 s. Directions back to the nearest point ahead on the route. Music keeps playing.
3. **Lead (L2)** — my car has role `lead`. Shows cars behind, convoy length, time to next stop; the "Slow down" takeover when `live.split` exists.
4. **Drive (L1)** — default. Next turn banner, next stop chip, "On route · Car 42 of 87", now playing + sync, last announcement + replay, Need help.
5. **Announcement (L3)** — overlay on any state when a new `live.announcements` entry arrives: full-screen, read aloud with expo-speech, music ducked, auto-closes 6 s after speech ends, replay button.

Ended parade (`status === 'ended'`) → replace with `/parade/[id]/done`.

## Start sequence

A2 hold-to-start (organiser) → `startCountdown(id, 10)` → every phone on `/parade/[id]` or `/arrive`/`/ready` sees `live.countdownEndsAt` and navigates to `/countdown` → at zero the organiser's phone calls `startParade(id)` (first phone to see zero wins; action is idempotent) → organiser goes to `/console`, cars go to `/drive`. Playlist `startedAt` is the shared clock; each phone computes position = (now − startedAt) mod track length.

The lead car must be checked in before the hold button is enabled; no tail car is a warning only. Organiser "driving" → crew step nags to add a co-organiser.

## Music

Tracks are picked with expo-document-picker (C6) and copied into the app's document directory. Playback uses expo-audio against the shared clock: every 10 s compare the player position to the expected position and `seekTo` if the drift is > 300 ms. Mute is local. Announcements duck volume to 0.2 while speaking. For the seeded parades the tracks have no file, so the player shows the correct track/position but is silent — the UI still shows "In sync".

## Help

Guest taps Need help → `/parade/[id]/help` → picks a kind → `requestHelp`. The console shows a danger banner with "Send tail car" (`setHelpStatus(.., 'tail_sent')`) and "Call". The guest sees "Help is on its way · tail car" in drive mode until resolved.

## Dev affordances (visible in the app, faint, bottom of screens)

- Home: "Reset demo data".
- Guest hub (I3): "Simulate the organiser starting the parade" — runs the countdown + simulator so a guest can test L1–L5 alone.
- Console: time scale ×1 / ×4 / ×10 for the simulator; "Simulate a car going off route".
- Route editor: "Use the demo route".

## Missing from the design (built or noted)

Built: Join by code, Every-cars list, Help request flow, End-parade confirmation, Edit-published-parade path, Delete draft.
Noted, not built: sign-in / account (anonymous auth will give each phone a user id), organiser profile, push/WhatsApp reminders, "approve each car" moderation queue, crew invite links, satellite tiles, recording a route by driving, practice drive, add-to-calendar file, home-screen install tip (native app doesn't need it), QR scanning (the camera), accessibility review.

## External things needed before real use

| Need | Why | Where it plugs in |
| --- | --- | --- |
| Supabase project + schema (README §5) | persistence, realtime positions, anonymous auth | src/store/actions.ts (same action names) |
| Map tiles: react-native-maps (Apple Maps free on iOS; Google Maps key for Android) or Mapbox | real streets instead of the mock town | src/components/map/MapCanvas.tsx (projection seam) |
| Geocoding + directions / map-matching API (Mapbox or Google), called from a Supabase edge function | address search (C2), snap-to-roads + turn list (C3/C4) | src/lib/geo.ts `extendRoute`, `turnList`; src/data/mockTown.ts `MOCK_PLACES` |
| EAS dev build | background location + background audio are not available in Expo Go | app.json plugins are already set |
| Music storage bucket + 7-day deletion job | C6 uploads | `addTracks` |
| Twilio/WhatsApp (optional) | day-before reminders | I1 toggle |
