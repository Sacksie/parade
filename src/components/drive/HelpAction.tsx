import { Button, Banner } from '@/components/ui';
import type { HelpRequest } from '@/types';

type Props = {
  help: HelpRequest | null;
  onHelp: () => void;
  onCancel: () => void;
  /** "I'm lost — get help" in L5. */
  label?: string;
  size?: 'lg' | 'md';
};

/** "Need help" danger button, or the "Help is on its way" banner while my request is open. */
export function HelpAction({ help, onHelp, onCancel, label = 'Need help', size = 'lg' }: Props) {
  if (help) {
    return (
      <Banner
        tone="danger"
        icon="warning"
        title="Help is on its way"
        body={help.status === 'tail_sent' ? 'Tail car is coming to you' : 'The organisers have your alert'}
        actionsInline
        actions={<Button title="Cancel" size="sm" variant="secondary" onPress={onCancel} accessibilityLabel="Cancel help request" />}
      />
    );
  }
  return <Button title={label} icon="warning" variant="danger" size={size} onPress={onHelp} />;
}
