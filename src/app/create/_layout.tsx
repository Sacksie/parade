import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { beginDraft, discardDraft } from '@/store/actions';
import { getState } from '@/store/store';
import { colors } from '@/theme/tokens';

/** Mounted wizard layouts; the exit cleanup only runs once the last one is gone (survives Strict Mode remounts). */
let mounted = 0;

/**
 * The Create wizard. Entering it always leaves a parade in `draftId`: a new draft, the draft you
 * left earlier, or the published parade I1 "Edit parade" handed over (editParade).
 */
export default function CreateLayout() {
  useEffect(() => {
    mounted += 1;
    const s = getState();
    if (!s.draftId || !s.parades[s.draftId]) beginDraft();
    return () => {
      mounted -= 1;
      // Leaving the wizard after editing a published parade: let go of it, so Home "Create"
      // starts a fresh draft instead of reopening that parade. Drafts stay put for "resume".
      setTimeout(() => {
        if (mounted > 0) return;
        const st = getState();
        const p = st.draftId ? st.parades[st.draftId] : undefined;
        if (st.draftId && p && p.status !== 'draft') discardDraft(st.draftId);
      }, 0);
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.onyx } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="basics" />
      <Stack.Screen name="meet" />
      <Stack.Screen name="route" />
      <Stack.Screen name="check" />
      <Stack.Screen name="stop" />
      <Stack.Screen name="music" />
      <Stack.Screen name="crew" />
      <Stack.Screen name="publish" />
    </Stack>
  );
}
