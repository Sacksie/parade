import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { toggleMuteLocally } from '@/store/actions';
import { useLive, useParade } from '@/store/selectors';
import { getState } from '@/store/store';
import type { MusicState, Track } from '@/types';

/**
 * Shared-clock music (docs/design/README.md §4 "Music sync").
 * The organiser's console owns `live.music`; every phone works out where in the playlist it
 * should be from `startedAt` and jumps there, re-checking every 10 s.
 */

// ---------- Ducking (announcements lower the music) ----------

let ducked = false;
const duckListeners = new Set<() => void>();

/** Lower the music to 20 % while an announcement is read. Module-level so the announcer can call it. */
export function setDucked(next: boolean) {
  if (next === ducked) return;
  ducked = next;
  duckListeners.forEach((l) => l());
}

const subscribeDuck = (l: () => void) => {
  duckListeners.add(l);
  return () => {
    duckListeners.delete(l);
  };
};
const getDucked = () => ducked;

// ---------- Audio session ----------

let audioModeSet = false;
function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  try {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  } catch {
    // Not supported here (some browsers). Playback still works in the foreground.
  }
}

// ---------- Expected position ----------

export type Expected = { index: number; positionS: number; ended: boolean };

/**
 * Where the playlist should be right now. Past the end of a track, the organiser's skip just hasn't
 * happened yet, so carry on into the next one locally (wrapping when the playlist loops).
 */
export function expectedPlayback(music: MusicState, tracks: Track[], loop: boolean, now: number): Expected | null {
  if (tracks.length === 0) return null;
  let index = Math.max(0, Math.min(tracks.length - 1, music.trackIndex));
  let pos = Math.max(0, music.paused ? music.pausedAtS ?? 0 : (now - music.startedAt) / 1000);
  for (let guard = 0; guard < 10_000 && pos >= tracks[index].durationS; guard++) {
    if (tracks[index].durationS <= 0) break;
    pos -= tracks[index].durationS;
    if (index + 1 < tracks.length) index += 1;
    else if (loop) index = 0;
    else return { index, positionS: tracks[index].durationS, ended: true };
  }
  return { index, positionS: pos, ended: false };
}

function expectedNow(paradeId: string): Expected | null {
  const s = getState();
  const p = s.parades[paradeId];
  const l = s.live[paradeId];
  if (!p || !l) return null;
  return expectedPlayback(l.music, p.tracks, p.loopPlaylist, Date.now());
}

// ---------- Hook ----------

const EMPTY_TRACKS: Track[] = [];
const CHECK_MS = 10_000;
const MAX_DRIFT_S = 0.3;

export type ParadePlayer = {
  track: Track | null;
  /** 0-based. */
  index: number;
  total: number;
  positionS: number;
  paused: boolean;
  /** False while correcting drift. Always true for the silent (seeded, file-less) player. */
  synced: boolean;
  muted: boolean;
  toggleMute: () => void;
};

export function useParadePlayer(paradeId: string | undefined, opts: { enabled: boolean }): ParadePlayer {
  const { enabled } = opts;
  const parade = useParade(paradeId);
  const live = useLive(paradeId);
  const isDucked = useSyncExternalStore(subscribeDuck, getDucked, getDucked);
  const [now, setNow] = useState(() => Date.now());
  const [synced, setSynced] = useState(true);
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    if (!enabled) return;
    ensureAudioMode();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [enabled]);

  const tracks = parade?.tracks ?? EMPTY_TRACKS;
  const music = live?.music;
  const exp = music ? expectedPlayback(music, tracks, parade?.loopPlaylist ?? true, now) : null;
  const track = exp ? tracks[exp.index] : null;
  const paused = (music?.paused ?? true) || !!exp?.ended;
  const muted = live?.mutedLocally ?? false;
  const uri = enabled && paradeId ? track?.uri : undefined;
  const sourceKey = uri && track ? `${track.id}|${uri}` : '';

  // Real playback only when the track has a file. Seeded tracks have none: the "silent player".
  useEffect(() => {
    if (!sourceKey || !uri || !paradeId) return;
    let player: AudioPlayer;
    try {
      player = createAudioPlayer({ uri });
    } catch {
      return;
    }
    playerRef.current = player;

    const correct = () => {
      const e = expectedNow(paradeId);
      const st = getState().live[paradeId];
      if (!e || !st || st.music.paused || e.ended) return;
      if (Math.abs(player.currentTime - e.positionS) > MAX_DRIFT_S) {
        setSynced(false);
        player
          .seekTo(e.positionS)
          .then(() => setSynced(true))
          .catch(() => setSynced(true));
      } else setSynced(true);
    };
    // First correction once the file has had a moment to load, then every 10 s.
    const first = setTimeout(correct, 1000);
    const every = setInterval(correct, CHECK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(every);
      playerRef.current = null;
      try {
        player.remove();
      } catch {
        // Already released.
      }
    };
  }, [sourceKey, uri, paradeId]);

  // Play / pause with the shared state.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !paradeId) return;
    try {
      if (paused) player.pause();
      else {
        const e = expectedNow(paradeId);
        if (e) player.seekTo(e.positionS).catch(() => {});
        player.play();
      }
    } catch {
      // Player not ready yet; the drift check will catch up.
    }
  }, [paused, sourceKey, paradeId]);

  // Volume: muted on this phone → 0, an announcement is being read → 0.2.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.volume = muted ? 0 : isDucked ? 0.2 : 1;
    } catch {
      // Ignore.
    }
  }, [muted, isDucked, sourceKey]);

  return {
    track,
    index: exp?.index ?? 0,
    total: tracks.length,
    positionS: exp?.positionS ?? 0,
    paused,
    synced: sourceKey ? synced : true,
    muted,
    toggleMute: () => {
      if (paradeId) toggleMuteLocally(paradeId);
    },
  };
}
