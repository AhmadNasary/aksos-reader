import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '../navigation';
import { BookCover } from '../components/BookCover';
import { useImportBooks } from '../components/useImportBooks';
import { formatPercent, useT } from '../i18n';
import { sortByRecent, useLibrary } from '../store/library';
import { useSettings } from '../store/settings';
import { colors, fonts } from '../theme';
import type { Book, UiLanguage } from '../types';

type Filter = 'all' | 'reading' | 'finished';
const COLS = 3;
const GAP = 18;
const PAD = 20;

export function Library() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const booksMap = useLibrary((s) => s.books);
  const removeBook = useLibrary((s) => s.removeBook);
  const { importBooks, busy } = useImportBooks();
  const [filter, setFilter] = useState<Filter>('all');

  const books = useMemo(() => {
    const all = sortByRecent(booksMap);
    if (filter === 'reading') return all.filter((b) => b.progress > 0.001 && b.progress < 0.99);
    if (filter === 'finished') return all.filter((b) => b.progress >= 0.99);
    return all;
  }, [booksMap, filter]);

  const itemW = Math.floor((width - PAD * 2 - GAP * (COLS - 1)) / COLS);

  const confirmRemove = (book: Book) =>
    Alert.alert(book.title, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: () => removeBook(book.id) },
    ]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.h1}>{t.library}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <LanguageButton />
          <Pressable onPress={importBooks} hitSlop={10} style={styles.roundBtn}>
            {busy ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="add" size={24} color={colors.brand} />}
          </Pressable>
        </View>
      </View>

      <View style={styles.chips}>
        {(
          [
            ['all', t.all],
            ['reading', t.inProgress],
            ['finished', t.finished],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.chip, filter === key && styles.chipOn]}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={books}
        key={COLS}
        numColumns={COLS}
        keyExtractor={(b) => b.id}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 40, gap: 26 }}
        renderItem={({ item }) => (
          <GridItem book={item} width={itemW} onLongPress={() => confirmRemove(item)} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{filter === 'all' ? t.emptyBody : '—'}</Text>
        }
      />
    </View>
  );
}

function GridItem({ book, width, onLongPress }: { book: Book; width: number; onLongPress: () => void }) {
  const t = useT();
  const { openBook } = useNav();
  const lang = useSettings((s) => s.uiLanguage);
  const status =
    book.progress >= 0.99 ? t.finished : book.progress > 0.001 ? formatPercent(book.progress, lang) : t.notStarted;

  return (
    <Pressable
      onPress={() => openBook(book.id)}
      onLongPress={onLongPress}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.85 : 1 }]}
    >
      <BookCover book={book} width={width} />
      <Text numberOfLines={2} style={styles.title}>
        {book.title}
      </Text>
      <Text style={[styles.status, book.progress <= 0.001 && { color: colors.brand }]}>{status}</Text>
    </Pressable>
  );
}

const LANGS: { code: UiLanguage; label: string }[] = [
  { code: 'ps', label: 'پښتو' },
  { code: 'fa', label: 'دری' },
  { code: 'en', label: 'English' },
];

function LanguageButton() {
  const t = useT();
  const lang = useSettings((s) => s.uiLanguage);
  const set = useSettings((s) => s.set);
  return (
    <Pressable
      hitSlop={10}
      style={styles.roundBtn}
      onPress={() =>
        Alert.alert(t.language, undefined, [
          ...LANGS.map((l) => ({
            text: (l.code === lang ? '✓ ' : '') + l.label,
            onPress: () => set({ uiLanguage: l.code }),
          })),
          { text: t.cancel, style: 'cancel' as const },
        ])
      }
    >
      <Ionicons name="language-outline" size={20} color={colors.brand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, marginBottom: 14,
  },
  h1: { fontFamily: fonts.black, fontSize: 32, color: colors.text },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: PAD, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  chipTextOn: { color: '#fff' },
  title: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, marginTop: 10, lineHeight: 20 },
  status: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyText: {
    fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 60,
  },
});
