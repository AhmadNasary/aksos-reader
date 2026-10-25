import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatPercent, useT } from '../i18n';
import { useSettings } from '../store/settings';
import { colors, fonts, type ReaderTheme } from '../theme';
import type { Book, Locator, TocItem } from '../types';

type Row = { item: TocItem; depth: number };

function flatten(items: TocItem[], depth = 0, out: Row[] = []) {
  for (const item of items) {
    out.push({ item, depth });
    if (item.children?.length) flatten(item.children, depth + 1, out);
  }
  return out;
}

const bareHref = (href?: string) => (href ?? '').split('#')[0];

export function ContentsSheet({
  visible,
  onClose,
  theme,
  toc,
  book,
  current,
  onNavigate,
  onRemoveBookmark,
}: {
  visible: boolean;
  onClose: () => void;
  theme: ReaderTheme;
  toc: TocItem[];
  book: Book;
  current?: Locator;
  onNavigate: (target: Locator) => void;
  onRemoveBookmark: (id: string) => void;
}) {
  const t = useT();
  const lang = useSettings((s) => s.uiLanguage);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'toc' | 'marks'>('toc');
  const rows = useMemo(() => flatten(toc), [toc]);
  const currentHref = bareHref(current?.href);

  const go = (target: Locator) => {
    onClose();
    // let the modal start closing before the reader jumps
    setTimeout(() => onNavigate(target), 50);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: theme.chrome, paddingBottom: insets.bottom }]}>
        <View style={styles.top}>
          <Text style={[styles.bookTitle, { color: theme.chromeText }]} numberOfLines={1}>
            {book.title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.done, { color: colors.accent }]}>{t.done}</Text>
          </Pressable>
        </View>

        <View style={[styles.segment, { backgroundColor: theme.hairline }]}>
          {(
            [
              ['toc', t.contents],
              ['marks', t.bookmarks],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.segBtn, tab === key && { backgroundColor: theme.chrome }]}
            >
              <Text style={[styles.segText, { color: theme.chromeText }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'toc' ? (
          <FlatList
            data={rows}
            keyExtractor={(r, i) => `${r.item.href}-${i}`}
            renderItem={({ item: { item, depth } }) => {
              const active = bareHref(item.href) === currentHref;
              return (
                <Pressable
                  onPress={() =>
                    go({ href: item.href, type: 'application/xhtml+xml', title: item.title } as Locator)
                  }
                  style={[styles.tocRow, { borderBottomColor: theme.hairline, paddingStart: 20 + depth * 18 }]}
                >
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.tocText,
                      { color: active ? colors.accent : theme.chromeText },
                      depth === 0 && { fontFamily: fonts.medium },
                    ]}
                  >
                    {item.title || '—'}
                  </Text>
                  {active && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
                </Pressable>
              );
            }}
          />
        ) : (
          <FlatList
            data={book.bookmarks}
            keyExtractor={(b) => b.id}
            ListEmptyComponent={
              <View style={styles.emptyMarks}>
                <Ionicons name="bookmark-outline" size={36} color={theme.chromeMuted} />
                <Text style={[styles.emptyText, { color: theme.chromeMuted }]}>{t.noBookmarks}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => go(item.locator)}
                style={[styles.markRow, { borderBottomColor: theme.hairline }]}
              >
                <Ionicons name="bookmark" size={18} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.tocText, { color: theme.chromeText }]}>
                    {item.label || book.title}
                  </Text>
                  <Text style={[styles.markMeta, { color: theme.chromeMuted }]}>
                    {formatPercent(item.locator.locations?.totalProgression ?? 0, lang)} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString(lang === 'en' ? 'en' : 'fa-AF')}
                  </Text>
                </View>
                <Pressable hitSlop={10} onPress={() => onRemoveBookmark(item.id)}>
                  <Ionicons name="close" size={18} color={theme.chromeMuted} />
                </Pressable>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, gap: 16,
  },
  bookTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17 },
  done: { fontFamily: fonts.bold, fontSize: 16 },
  segment: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, borderRadius: 10, padding: 3 },
  segBtn: { flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: fonts.medium, fontSize: 13 },
  tocRow: {
    flexDirection: 'row', alignItems: 'center', paddingEnd: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tocText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
  activeDot: { width: 7, height: 7, borderRadius: 4, marginStart: 10 },
  markRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  markMeta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  emptyMarks: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', lineHeight: 24 },
});
