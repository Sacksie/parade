import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { setDucked } from '@/lib/audio';
import { useLive } from '@/store/selectors';
import type { Announcement } from '@/types';

/**
 * Text-to-speech for drive mode (expo-speech; the browser's speechSynthesis on web).
 * Every call is guarded: a phone or browser without TTS just stays quiet.
 */

/** False on a browser without speechSynthesis. Native always has a TTS engine. */
export function speechAvailable(): boolean {
  if (Platform.OS !== 'web') return true;
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

type SpeakOptions = {
  /** Called once when speech finishes, is stopped, or fails. */
  onDone?: () => void;
  /** Cut off anything already being read. */
  interrupt?: boolean;
};

/** Read `text` aloud in British English. Returns false if nothing will be spoken. */
export function speak(text: string, opts?: SpeakOptions): boolean {
  let called = false;
  const done = () => {
    if (called) return;
    called = true;
    opts?.onDone?.();
  };
  if (!text.trim() || !speechAvailable()) {
    done();
    return false;
  }
  try {
    if (opts?.interrupt) stopSpeaking();
    Speech.speak(text, { language: 'en-GB', rate: 0.95, onDone: done, onStopped: done, onError: done });
    return true;
  } catch {
    done();
    return false;
  }
}

export function stopSpeaking() {
  if (!speechAvailable()) return;
  try {
    Speech.stop().catch(() => {});
  } catch {
    // Nothing to stop.
  }
}

const EMPTY: Announcement[] = [];
/** How long the overlay stays after speech ends. */
const LINGER_MS = 6000;
/** Without TTS (some browsers) the overlay is the only channel, so give people time to read it. */
const NO_SPEECH_MS = 8000;

export type Announcer = {
  current: Announcement | null;
  /** True while the current announcement is being read. */
  speaking: boolean;
  /** When the overlay will close by itself (set once speech has ended). */
  closesAt: number | null;
  dismiss: () => void;
  replay: (a: Announcement) => void;
};

/**
 * Watches the parade's announcements. Each NEW one (not those already there on mount) is shown
 * and read aloud, with the music ducked while speaking. `current` clears 6 s after speech ends.
 */
export function useAnnouncer(paradeId: string | undefined): Announcer {
  const announcements = useLive(paradeId)?.announcements ?? EMPTY;
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [closesAt, setClosesAt] = useState<number | null>(null);
  /** undefined until the first effect run, so announcements present on mount are skipped. */
  const lastSeen = useRef<string | null | undefined>(undefined);
  /** Each play gets a token so a late onDone from an interrupted reading is ignored. */
  const token = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const close = () => {
    token.current += 1;
    clearTimers();
    stopSpeaking();
    setDucked(false);
    setSpeaking(false);
    setClosesAt(null);
    setCurrent(null);
  };

  const play = (a: Announcement) => {
    const my = ++token.current;
    clearTimers();
    setCurrent(a);
    setClosesAt(null);
    const linger = (ms: number) => {
      if (token.current !== my) return;
      setDucked(false);
      setSpeaking(false);
      setClosesAt(Date.now() + ms);
      timers.current.push(
        setTimeout(() => {
          if (token.current !== my) return;
          setCurrent(null);
          setClosesAt(null);
        }, ms),
      );
    };
    setDucked(true);
    setSpeaking(true);
    const ok = speak(a.text, { interrupt: true, onDone: () => linger(LINGER_MS) });
    if (!ok) {
      linger(NO_SPEECH_MS);
      return;
    }
    // Safety net: some engines never report the end. Assume ~14 chars a second plus slack.
    timers.current.push(setTimeout(() => linger(LINGER_MS), 4000 + a.text.length * 75));
  };

  useEffect(() => {
    const last = announcements[announcements.length - 1];
    if (lastSeen.current === undefined) {
      lastSeen.current = last?.id ?? null;
      return;
    }
    if (last && last.id !== lastSeen.current) {
      lastSeen.current = last.id;
      play(last);
    }
    // play is recreated each render; only a new announcement should trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements]);

  useEffect(
    () => () => {
      token.current += 1;
      timers.current.forEach(clearTimeout);
      stopSpeaking();
      setDucked(false);
    },
    [],
  );

  return { current, speaking, closesAt, dismiss: close, replay: play };
}
