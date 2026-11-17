# Shared brief for screen agents

Project: "Parade" at /Users/gavrielsacks/parade. Expo SDK 58, React Native 0.88, React 19.3 (React Compiler ON), expo-router 58 with typed routes, Reanimated 4 (use `sv.get()`/`sv.set()`; `scheduleOnRN` from 'react-native-worklets'), react-native-gesture-handler 3, react-native-svg 15. Everything needed is installed. Do NOT run npm/expo install. Do not start the dev server.

Read FIRST, fully, before writing code:
1. docs/design/README.md — product, roles, core logic, visual system.
2. docs/dev/app-map.md — routes, who sees what, drive-mode states, start sequence, dev affordances. This is the contract between agents.
3. src/theme/tokens.ts, src/types.ts, src/lib/format.ts, src/lib/dates.ts
4. src/store/store.ts, src/store/selectors.ts, src/store/actions.ts, src/data/seed.ts, src/data/mockTown.ts
5. src/components/ui/index.ts and every component it exports (props are the API; match the design with these, don't restyle them), src/components/icons.tsx (the `IconName` union), src/components/Sheet.tsx, src/components/PressableScale.tsx
6. src/components/map/MapCanvas.tsx (props type at the top), src/lib/geo.ts (exports), src/lib/simulator.ts (exports), src/lib/location.ts
7. src/app/_layout.tsx, src/app/index.tsx, src/app/join.tsx (examples of the house style)
8. The design HTML for YOUR screens in docs/design/screens/*.dc.html — plain HTML with inline styles: copy, sizes, colours, spacing and layout are exact. Rebuild them in React Native with the UI kit. Where the kit lacks something, build it locally in your own files.

Rules:
- Only create/edit the files you own (listed in your task). Never touch tokens, types, store, data, lib/geo, lib/simulator, components/ui, components/map, or another agent's routes. If you need a change there, finish your work, work around it locally, and list the exact change in your report.
- Navigation: typed routes are on. Routes other agents are creating in parallel may not exist yet when you typecheck, so navigate with `go('/parade/[id]/drive', { id })` / `goReplace(...)` / `goBackOr('/')` from '@/components/ui' (they cast the href). `router.back()` is fine.
- Every screen: `Screen` from the UI kit (safe areas), `Header` for back/close, mint used once (the primary action or "you"), numbers in `type.mono*` / `Mono`, 44 pt touch targets, accessibilityLabel on icon-only buttons, no emoji, no gradients, no placeholder "lorem". Dark only.
- State: read with the selector hooks (`useParade`, `useCars`, `useMyCar`, `useLive`, `useIsOrganiser`, `useMe`, `useDraft`), write ONLY through src/store/actions.ts. Never mutate state objects.
- Time: derive countdowns from timestamps with a 1 s `setInterval` tick (`const [now, setNow] = useState(Date.now())`), not from accumulating.
- Works on web (Chrome) and native. Use `Platform.OS === 'web'` guards for anything web can't do (haptics already no-op). `Linking.openURL('tel:…')`/`sms:` for call/message.
- When you finish: `npx tsc --noEmit` and `npx expo lint` must pass for the whole repo (other agents' files may be mid-edit; if an error is clearly in a file you don't own, note it and move on). Do not run `git` commands.
- Report under 500 words: files created, how each screen deviates from the design and why (UX improvements are welcome and expected: say what you improved), anything unverified, changes you need from the shared layers.
