import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { FONT_SCALES, LINE_HEIGHTS, useSettings } from '../store/settings';
import { colors, fonts, readerThemes, type ReaderTheme } from '../theme';
import type { ReaderThemeId } from '../types';

const THEME_ORDER: ReaderThemeId[] = ['day', 'paper', 'dusk', 'night'];

export function AppearanceSheet({
  visible,
  onClose,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  theme: ReaderTheme;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const s = useSettings();

  const row = [styles.row, { borderBottomColor: theme.hairline }];
  const label = [styles.label, { color: theme.chromeText }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.chrome, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.grabber, { backgroundColor: theme.hairline }]} />
        <Text style={[styles.title, { color: theme.chromeText }]}>{t.appearance}</Text>

        {/* text size */}
        <View style={[styles.sizeRow, { borderColor: theme.hairline }]}>
          <Pressable
            style={styles.sizeBtn}
            disabled={s.fontScaleIndex === 0}
            onPress={() => s.set({ fontScaleIndex: Math.max(0, s.fontScaleIndex - 1) })}
          >
            <Text style={[styles.sizeA, { fontSize: 15, color: theme.chromeText }]}>A</Text>
          </Pressable>
          <View style={[styles.sizeDivider, { backgroundColor: theme.hairline }]} />
          <View style={styles.dots}>
            {FONT_SCALES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i <= s.fontScaleIndex ? theme.chromeText : theme.hairline },
                ]}
              />
            ))}
          </View>
          <View style={[styles.sizeDivider, { backgroundColor: theme.hairline }]} />
          <Pressable
            style={styles.sizeBtn}
            disabled={s.fontScaleIndex === FONT_SCALES.length - 1}
            onPress={() => s.set({ fontScaleIndex: Math.min(FONT_SCALES.length - 1, s.fontScaleIndex + 1) })}
          >
            <Text style={[styles.sizeA, { fontSize: 24, color: theme.chromeText }]}>A</Text>
          </Pressable>
        </View>

        {/* themes */}
        <View style={styles.themes}>
          {THEME_ORDER.map((id) => {
            const th = readerThemes[id];
            const on = s.readerTheme === id;
            return (
              <Pressable key={id} onPress={() => s.set({ readerTheme: id })} style={styles.themeItem}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: th.bg, borderColor: on ? colors.accent : theme.hairline, borderWidth: on ? 3 : 1 },
                  ]}
                >
                  <Text style={{ color: th.text, fontFamily: fonts.bold, fontSize: 18 }}>آ</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* line spacing */}
        <View style={row}>
          <Text style={label}>{t.lineSpacing}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {LINE_HEIGHTS.map((_, i) => {
              const on = s.lineHeightIndex === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => s.set({ lineHeightIndex: i, publisherStyles: false })}
                  style={[
                    styles.lhBtn,
                    { borderColor: on ? colors.accent : theme.hairline, borderWidth: on ? 2 : 1 },
                  ]}
                >
                  <Ionicons
                    name="reorder-three-outline"
                    size={14 + i * 4}
                    color={theme.chromeText}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={row}>
          <Text style={label}>{t.scroll}</Text>
          <Switch
            value={s.scroll}
            onValueChange={(v) => s.set({ scroll: v })}
            trackColor={{ true: colors.brand, false: theme.hairline }}
          />
        </View>

        <View style={[row, { borderBottomWidth: 0 }]}>
          <Text style={label}>{t.originalLayout}</Text>
          <Switch
            value={s.publisherStyles}
            onValueChange={(v) => s.set({ publisherStyles: v })}
            trackColor={{ true: colors.brand, false: theme.hairline }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 8,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: 12 },
  title: { fontFamily: fonts.bold, fontSize: 17, textAlign: 'center', marginBottom: 16 },
  sizeRow: {
    flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: 1, marginBottom: 18,
  },
  sizeBtn: { width: 64, height: '100%', alignItems: 'center', justifyContent: 'center' },
  sizeA: { fontFamily: 'System', fontWeight: '600' },
  sizeDivider: { width: 1, height: 24 },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  themes: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  themeItem: { alignItems: 'center' },
  swatch: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontFamily: fonts.medium, fontSize: 15 },
  lhBtn: { width: 44, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
