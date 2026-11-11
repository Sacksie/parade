import { View } from 'react-native';

import { Button, EmptyState, Header, Screen, goReplace } from '@/components/ui';

/** Shown instead of crashing when a parade id (or car id) no longer exists. */
export function NotFound({ title = 'Parade not found', body = 'It may have been deleted, or the link is out of date.' }: { title?: string; body?: string }) {
  return (
    <Screen footer={<Button title="Go to My parades" variant="secondary" onPress={() => goReplace('/')} />}>
      <Header left="back" onLeft={() => goReplace('/')} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState title={title} body={body} />
      </View>
    </Screen>
  );
}
