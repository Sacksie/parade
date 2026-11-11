import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header, StepLabel, StepProgress, go, goBackOr } from '@/components/ui';
import { updateParade } from '@/store/actions';
import { useDraft } from '@/store/selectors';
import { type } from '@/theme/tokens';
import type { Parade } from '@/types';

/** Six bars: Basics, Meeting point, Route (check + stops live inside it), Music, Crew, Publish. */
export const WIZARD_STEPS = 6;

export type StepPath = '/create/basics' | '/create/meet' | '/create/route' | '/create/check' | '/create/music' | '/create/crew' | '/create/publish';

/**
 * Everything a wizard step needs: the draft, an autosaving `save(patch)`, whether we're editing a
 * published parade, and navigation that respects edit mode (Save returns to the review step).
 */
export function useWizard() {
  const draft = useDraft();
  const editing = !!draft && draft.status !== 'draft';
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const save = (patch: Partial<Parade>) => {
    if (!draft) return;
    updateParade(draft.id, patch);
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaving(false), 400);
  };

  /** Continue (new parade) or Save (editing: back to the review screen). */
  const advance = (next: StepPath) => {
    if (editing) router.dismissTo('/create/publish' as Href);
    else go(next);
  };

  /** Back one step. While editing, steps are opened from the review screen, so go back there. */
  const back = (prev: StepPath) => goBackOr(editing ? '/create/publish' : prev);

  return { draft, editing, save, saving, advance, back, primaryLabel: editing ? 'Save' : 'Continue' };
}

/** Leave the wizard: to the parade hub when editing a published parade, otherwise home. */
export function exitWizard(paradeId: string | undefined, editing: boolean) {
  if (editing && paradeId) router.dismissTo({ pathname: '/parade/[id]', params: { id: paradeId } } as unknown as Href);
  else router.dismissTo('/' as Href);
}

type HeaderProps = {
  step: number;
  title: string;
  left?: 'back' | 'close';
  onLeft: () => void;
  right?: React.ReactNode;
};

/** Back/close row, six step bars, "Step N of 6", title. */
export function WizardHeader({ step, title, left = 'back', onLeft, right }: HeaderProps) {
  return (
    <View style={styles.wrap}>
      <Header left={left} onLeft={onLeft} right={right} />
      <StepProgress step={step} total={WIZARD_STEPS} />
      <View style={styles.titles}>
        <StepLabel step={step} total={WIZARD_STEPS} />
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  titles: { gap: 4 },
  title: { ...type.h1, fontSize: 28, lineHeight: 33, letterSpacing: -0.7 },
});
