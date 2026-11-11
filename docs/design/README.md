# Parade — v2 design handoff

The design spec for building Parade. It covers the full journey, the decisions behind it, the visual system, and how each screen maps to a route in this repo.

- **Source of truth for the visuals:** the "Parade — v2" design canvas in Claude (private to Gavriel; ask for access).
- **Screen markup:** `screens/*.dc.html`. These are design-canvas files, not app code. Read them for exact copy, colours, spacing and layout, then rebuild each one in React Native. They won't render on their own: they need the canvas runtime (`support.js`), and their map images point at `/_blob/…`, which is the canvas's copy of `assets/basemap.svg`.
- **`assets/basemap.svg`:** a made-up town used only in the mockups. The real app uses live map tiles.

---

## 1. Product in one paragraph

Anyone can create a car parade (Chanukah parades first, but nothing is hard-coded). The organiser sets a meeting point, a fixed route with stops, and a playlist of MP3s they upload. Guests join from a link. On the night, every car follows the same line, hears the same announcements read aloud, and plays the same music in sync. The organiser (or a co-organiser riding as a passenger) runs it from a console.

## 2. Roles

| Role | What it is | How you get it |
| --- | --- | --- |
| **Organiser** | Admin. Edits the parade, announces, controls music, starts and ends it. **Not a car.** | Creates the parade |
| **Co-organiser** | Same powers as the organiser | Crew invite link, or "Give organiser access" on a car sheet |
| **Lead car** | Sets the pace. Its position defines the front of the convoy. Gets spoken "slow down" alerts | Defaults to the organiser's car. Changeable at any time |
| **Tail car** | Last car. Gets sent to breakdowns. Defines the back of the convoy | Crew invite or car sheet. Optional, but warned about if missing |
| **Car** | One phone = one car | Invite link |

Rules:
- The organiser says where they'll be on the night: **passenger in the lead car** (default), **driving a car**, or **at base**. If they're driving, push them to add a co-organiser, because nobody should run the console while driving.
- **The parade can't start until the lead car has checked in.** No tail car is a warning only.
- If the lead car sends no location for 60 seconds, the organiser is asked to make the next car the lead.

## 3. The journey (22 screens)

Screen IDs match the files in `screens/`.

### 1 · Create (organiser, days before)
| ID | Screen | Notes |
| --- | --- | --- |
| C1 | Basics | Name, host (optional), date, arrival time, set-off time, who can join (anyone with link / approve each car) |
| C2 | Meeting point | Search an address, **then drag the pin onto the exact entrance**. Map/Satellite toggle. Optional directions for drivers |
| C3 | Route | Tap to extend; every tap snaps to roads. Drag dots to adjust. Undo. Shows distance, time including stops, and number of stops. Toggle between drawing and **recording a drive** |
| C4 | Check the route | The turn list, exactly as drivers will hear it. Flags turns without lights and turns across main roads. Practice drive prompt |
| C5 | Stop | Name, stop or drive past, how long, and a circle where the stop begins (it triggers when the lead car enters). On arrival: pause music, read a message aloud |
| C6 | Music | Upload MP3s, reorder, loop. **Rights checkbox is required.** Shows size per car. Tracks are deleted 7 days after the parade |
| C7 | Crew & roles | Where the organiser will be on the night, plus lead, tail and co-organiser roles, with invites |
| C8 | Review & publish | Summary, checklist with edit links, publish |

### 2 · Invite
| ID | Screen | Notes |
| --- | --- | --- |
| I1 | Invite (organiser) | Published state, how many cars are coming, how many have music saved, WhatsApp link preview, share / copy / QR, day-before reminder, guest list |
| I2 | Invite page (guest) | **Must work in a browser with no install.** Route preview, times, car name, mobile number (only organisers see it) |
| I3 | You're going | **Music starts downloading here, on wifi.** Add-to-home-screen tip, add to calendar, what to bring |

### 3 · Arrive & start
| ID | Screen | Notes |
| --- | --- | --- |
| A1 | Arrival check | Arrival detected automatically near the meeting point. Checks: location, music saved, screen stays on, sound test through car speakers |
| A2 | Ready to start | How many cars are here, readiness bars, lead and tail status, cars needing attention, **hold-to-start** (2 seconds) |
| A3 | Car sheet | Call or message a car. Make it lead, make it tail, give it organiser access, remove it |
| A4 | Countdown | Every phone counts down together. Music starts on zero |

### 4 · On the road → finish
| ID | Screen | Notes |
| --- | --- | --- |
| L1 | Drive mode | Next-turn banner, next stop, "On route · Car 42 of 87", now playing with sync status, replay the last announcement, help button |
| L2 | Lead car | The "Slow down" alert takes over the top. Next turn, cars behind, convoy length, time to next stop |
| L3 | Announcement | Full-screen, read aloud, music lowered, closes itself after a few seconds, replay button |
| L4 | At a stop | Stop name, time until moving again, music paused, chime 30 seconds before moving off |
| L5 | Off route | Directions back to the nearest point on the route. Music keeps playing |
| L6 | Organiser console | Convoy map, help alerts (send tail car / call), split alerts, music controls, preset and typed or spoken announcements |
| F1 | Parade complete | Stats, closing message, location off, music deleted |

## 4. Core logic

- **One fixed route.** The route is stored as one line (a polyline) and every car navigates against it. Never hand navigation to Google or Apple Maps.
- **Car order** ("Car 42 of 87") = rank cars by how far along the route they are.
- **Off route** = more than about 40 m from the line for more than about 10 seconds. Guide them to the nearest point ahead on the route.
- **Split** = a gap of more than about 300 m along the route between neighbouring cars. When it happens: speak "slow down" to the lead car and alert the organiser with where the gap is.
- **Stops** trigger when the lead car enters the stop's circle (about 40 m). Then: read the arrival message, pause music if set, start the timer. The organiser can move the parade off early.
- **Music sync.** The organiser sets a start time on the shared clock. Each phone measures how far its clock is from the server's, works out where in the playlist it should be, and jumps there. It re-checks every ~10 seconds and corrects if it has drifted more than ~300 ms. Audio files are saved on the phone in advance, so playback works offline.
- **Announcements** are text read aloud on each phone (text-to-speech), with the music lowered while it plays. Organisers can type them or dictate them.
- **Privacy.** A car's location is shared only while the parade is live. Phone numbers are visible to organisers only.

## 5. Suggested data model (Supabase)

`parades` (id, organiser_id, name, host, date, arrive_at, sets_off_at, join_mode, meeting_point lat/lng, meeting_notes, route_polyline, status: draft / published / live / ended, live_started_at, playlist_started_at)
`stops` (id, parade_id, seq, name, kind: stop / drive_past, duration_min, lat, lng, radius_m, pause_music, arrival_message)
`tracks` (id, parade_id, seq, title, duration_s, storage_path, size_bytes)
`cars` (id, parade_id, user_id, name, phone, role: car / lead / tail, is_organiser, rsvp_at, checked_in_at, music_ready, sound_ok)
`announcements` (id, parade_id, text, created_at, created_by)
`help_requests` (id, parade_id, car_id, kind, lat, lng, status, created_at)

Live car positions go over Supabase Realtime broadcast or presence. Don't write every GPS fix to a table. Guests use anonymous auth. Row-level security: organisers can see phone numbers, cars can only update their own row, and track files are readable only by cars in that parade.

## 6. Visual system

Dark everywhere. Two quiet colours and one loud one: **onyx** (backgrounds), **indigo** (secondary), **mint** (the one thing that matters on each screen).

```ts
export const color = {
  bg: '#0B0B10',        // onyx ground
  surface: '#14141C',   // cards, inputs
  surface2: '#1C1C27',  // secondary buttons
  sheet: '#121219',     // bottom sheets
  line: '#23233A',
  line2: '#2F2F4A',
  text: '#F3F3F8',
  text2: '#A7A7BC',
  text3: '#8C8CA4',     // smallest text that still passes contrast
  mint: '#5EF2B5',      // primary action, "you", the route ahead
  mintInk: '#04150E',   // text on mint
  mintText: '#6FF5BE',
  indigo: '#7C6CFF',    // other cars, crew roles
  indigoText: '#B0A6FF',
  indigoTint: '#1A1736',
  indigoLine: '#3A3275',
  warn: '#FFCB6B', warnBg: '#261F0F', warnLine: '#574619',
  danger: '#FF8A94', dangerSolid: '#FF5C6C', dangerBg: '#2A1118', dangerLine: '#5C2532',
};
```

- **Type:** Geist for everything, and **Geist Mono for every number** (distances, times, counts). Body text 15–17, headings 26–34 at −0.025em letter-spacing.
- **Radius:** inputs 14, cards 16–20, bottom sheets 28, main buttons 18.
- **Touch targets:** at least 44 pt. Main buttons are 56–60 pt tall.
- **Colour use:** mint appears once per screen (the main action, "you", the route ahead). Amber is for warnings, red only for help and breakdowns. Never use emoji or gradients.
- **Motion** (Emil Kowalski's rules): buttons scale to 0.97 on press over 160 ms ease-out. Sheets and takeovers 200–250 ms with `cubic-bezier(0.23,1,0.32,1)`. Car dots glide between GPS updates with no bounce. The turn banner crossfades. With reduced motion, use opacity changes only.

## 7. Build order (parade is Sun 6 Dec 2026)

1. **Data and auth:** Supabase tables, anonymous auth, guest join from a link (I2 → I3).
2. **Drive loop:** route polyline, live positions, drive mode (L1), off-route (L5), order and split detection, lead view (L2).
3. **Announcements + music sync:** L3, the playlist download, the shared clock.
4. **Organiser flow:** C1–C8 (draw-only route), I1, A2 + A3, A4, L6.
5. **Stops + finish:** L4, F1.
6. **5-car test drive by Sun 29 Nov.**

**Cut for this year:** recording a route by driving it, "approve each car", crew invite links (assign roles from the car sheet instead), satellite view, "Tell me about the next one". If the route editor isn't working by 22 Nov, draw this year's route by hand and keep the editor for next year.

## 8. Decisions still open

- **Native app vs web for guests.** The invite needs to open with no install. Expo Router's web output can serve the guest screens (I2, I3, A1, L1–L5). Native is better for background location and audio. Test music playback on iPhone Safari early.
- **Map library.** It needs to work on native and web, and render a dark style with the route drawn on top. Check what Expo SDK 58 supports before choosing (see `AGENTS.md`: fetch the versioned docs, don't go from memory).
- **Road snapping and the turn list:** a directions or map-matching API (for example Mapbox) called from the server so the key stays private.
