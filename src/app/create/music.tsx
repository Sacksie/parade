import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { estimateDurationS, titleFromFilename } from '@/components/create/format';
import { WizardHeader, useWizard } from '@/components/create/wizard';
import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Banner, Button, Checkbox, Mono, Screen, Toggle, showToast } from '@/components/ui';
import { formatBytes, formatClock, formatDuration, uid } from '@/lib/format';
import { routeStats } from '@/lib/geo';
import { addTracks, removeTrack, setTracks } from '@/store/actions';
import { colors, font, radius, space, type } from '@/theme/tokens';
import type { Track } from '@/types';

/** Copy a picked file into the app's documents so it survives the picker's cache being cleared. */
async function keepFile(asset: DocumentPicker.DocumentPickerAsset, paradeId: string): Promise<string> {
  if (Platform.OS === 'web') return asset.uri;
  const dir = new Directory(Paths.document, `parade-${paradeId}`);
  if (!dir.exists) dir.create({ intermediates: true });
  const safe = asset.name.replace(/[^\w.\- ]+/g, '_');
  const dest = new File(dir, `${Date.now()}-${safe}`);
  await new File(asset.uri).copy(dest);
  return dest.uri;
}

/** C6 · Music. Upload MP3s, reorder, loop; the rights box is required. */
export default function CreateMusic() {
  const { draft, save, advance, back, primaryLabel } = useWizard();
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!draft) return <Screen>{null}</Screen>;

  const tracks = draft.tracks;
  const totalS = tracks.reduce((s, t) => s + t.durationS, 0);
  const totalBytes = tracks.reduce((s, t) => s + t.sizeBytes, 0);
  const paradeS = draft.route.length > 1 ? routeStats(draft.route, draft.stops).totalS : 0;
  const needsRights = tracks.length > 0 && !draft.rightsConfirmed;

  const pick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled || res.assets.length === 0) return;
      const added: Omit<Track, 'seq'>[] = [];
      for (const a of res.assets) {
        const uri = await keepFile(a, draft.id);
        const size = a.size ?? (Platform.OS === 'web' ? a.file?.size : new File(uri).size) ?? 0;
        added.push({
          id: uid('trk'),
          title: titleFromFilename(a.name),
          // No metadata reader yet: estimate from size at 128 kbps.
          durationS: estimateDurationS(size),
          sizeBytes: size,
          uri,
        });
      }
      addTracks(draft.id, added);
      showToast(added.length === 1 ? 'Track added' : `${added.length} tracks added`);
    } catch {
      showToast("Couldn't add those files. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 0 || to >= tracks.length) return;
    const next = tracks.slice();
    [next[index], next[to]] = [next[to], next[index]];
    setTracks(draft.id, next);
  };

  return (
    <Screen
      footer={
        <>
          {needsRights ? <Text style={styles.footHint}>Tick the rights box to continue.</Text> : null}
          <Button title={primaryLabel} disabled={needsRights} onPress={() => advance('/create/crew')} />
        </>
      }>
      <WizardHeader step={4} title="Music" onLeft={() => back('/create/check')} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <PressableScale pressedScale={0.98} onPress={pick} accessibilityRole="button" accessibilityLabel="Add MP3s" style={styles.add}>
          <View style={styles.addIcon}>{busy ? <ActivityIndicator color={colors.indigoBright} /> : <Icon name="upload" size={20} color={colors.indigoBright} />}</View>
          <View style={styles.flex}>
            <Text style={styles.addTitle}>Add MP3s</Text>
            <Text style={styles.addSub}>From your phone, Files or a laptop</Text>
          </View>
        </PressableScale>

        {tracks.length === 0 ? (
          <Banner tone="warn" icon="warning" title="No music yet" body="Cars will drive in silence. You can add tracks any time before the parade." />
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                <Mono size="small" style={styles.summaryNum}>{tracks.length}</Mono> {tracks.length === 1 ? 'track' : 'tracks'} ·{' '}
                <Mono size="small" style={styles.summaryNum}>{formatDuration(totalS)}</Mono>
              </Text>
              {paradeS > 0 ? (
                <Text style={styles.summaryRight}>
                  Parade ~<Mono size="small" style={styles.summaryRight}>{formatDuration(paradeS)}</Mono>
                </Text>
              ) : null}
            </View>

            <View style={styles.list}>
              {tracks.map((t, i) => {
                const open = openId === t.id;
                return (
                  <View key={t.id} style={i < tracks.length - 1 && styles.divided}>
                    <PressableScale
                      pressedScale={0.99}
                      onPress={() => setOpenId(open ? null : t.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.title}, ${formatClock(t.durationS)}. ${open ? 'Hide' : 'Show'} reorder and remove`}
                      accessibilityState={{ expanded: open }}
                      style={styles.row}>
                      <View style={styles.handle}>
                        <Icon name="drag" size={14} color={open ? colors.textMuted : '#5D5D78'} />
                      </View>
                      <Text style={styles.trackTitle} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Mono size="small" style={styles.trackMeta}>
                        {t.uri ? '~' : ''}
                        {formatClock(t.durationS)}
                      </Mono>
                    </PressableScale>
                    {open ? (
                      <View style={styles.tools}>
                        <Button title="Move up" size="sm" variant="secondary" disabled={i === 0} onPress={() => move(i, -1)} />
                        <Button title="Move down" size="sm" variant="secondary" disabled={i === tracks.length - 1} onPress={() => move(i, 1)} />
                        <View style={styles.flex} />
                        <Mono size="small" style={styles.toolSize}>
                          {formatBytes(t.sizeBytes)}
                        </Mono>
                        <PressableScale
                          pressedScale={0.9}
                          onPress={() => {
                            removeTrack(draft.id, t.id);
                            setOpenId(null);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${t.title}`}
                          style={styles.trash}>
                          <Icon name="trash" size={18} color={colors.danger} />
                        </PressableScale>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
            <Text style={styles.caption}>
              Size per car: <Mono size="small" style={styles.captionNum}>{formatBytes(totalBytes)}</Mono> · about{' '}
              <Mono size="small" style={styles.captionNum}>{formatDuration(totalS)}</Mono> of music. Tap a track to move or remove it.
            </Text>
          </>
        )}

        <Toggle
          label="Loop if the parade runs long"
          description="Music always pauses at stops you've set"
          value={draft.loopPlaylist}
          onChange={(loopPlaylist) => save({ loopPlaylist })}
        />

        <Checkbox
          value={draft.rightsConfirmed}
          onChange={(rightsConfirmed) => save({ rightsConfirmed })}
          label="I own these files or have permission to share them with everyone in this parade."
          detail="Only cars in this parade can play them. They're deleted 7 days after."
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, marginHorizontal: -space.xl },
  body: { paddingHorizontal: space.xl, paddingTop: 2, paddingBottom: space.lg, gap: 14 },
  add: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3A3A58',
  },
  addIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  addTitle: { fontFamily: font.sansSemi, fontSize: 16, color: colors.text },
  addSub: { ...type.caption },
  summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  summaryText: { ...type.label, color: colors.textMuted },
  summaryNum: { fontSize: 14, color: colors.text },
  summaryRight: { ...type.caption, color: colors.textFaint },
  list: { borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  divided: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingLeft: 2, paddingRight: 12 },
  handle: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  trackTitle: { flex: 1, fontFamily: font.sans, fontSize: 15, color: colors.text },
  trackMeta: { color: colors.textMuted },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 38, paddingRight: 6, paddingBottom: 10 },
  toolSize: { color: colors.textFaint },
  trash: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  caption: { ...type.caption, marginTop: -4 },
  captionNum: { color: colors.textFaint },
  footHint: { ...type.caption, textAlign: 'center' },
});
