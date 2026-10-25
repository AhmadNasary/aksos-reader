import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '../navigation';
import { BookCover } from '../components/BookCover';
import { ProgressBar } from '../components/ProgressBar';
import { useImportBooks } from '../components/useImportBooks';
import { formatPercent, useT } from '../i18n';
import { sortByRecent, useLibrary } from '../store/library';
import { useSettings } from '../store/settings';
import { colors, fonts } from '../theme';
import type { Book } from '../types';

export function ReadingNow() {
  const { openBook: open } = useNav();
  const t = useT();
  const lang = useSettings((s) => s.uiLanguage);
  const insets = useSafeAreaInsets();
  const booksMap = useLibrary((s) => s.books);
  const books = useMemo(() => sortByRecent(booksMap), [booksMap]);
  const { importBooks, busy } = useImportBooks();

  const current = books.find((b) => b.lastOpenedAt && b.progress < 0.99) ?? books[0];
  const others = books.filter((b) => b.id !== current?.id).slice(0, 12);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Text style={styles.h1}>{t.readingNow}</Text>
        <Pressable onPress={importBooks} hitSlop={10} style={styles.addBtn}>
          {busy ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <Ionicons name="add" size={24} color={colors.brand} />
          )}
        </Pressable>
      </View>

      {!current ? (
        <EmptyState onAdd={importBooks} />
      ) : (
        <>
          <Hero book={current} onOpen={() => open(current.id)} />
          {others.length > 0 && (
            <>
              <Text style={styles.h2}>{t.recent}</Text>
              <FlatList
                horizontal
                data={others}
                keyExtractor={(b) => b.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => open(item.id)} style={{ width: 104 }}>
                    <BookCover book={item} width={104} />
                    <View style={{ marginTop: 10 }}>
                      <ProgressBar value={item.progress} />
                    </View>
                    <Text style={styles.smallMeta}>{formatPercent(item.progress, lang)}</Text>
                  </Pressable>
                )}
              />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Hero({ book, onOpen }: { book: Book; onOpen: () => void }) {
  const t = useT();
  const lang = useSettings((s) => s.uiLanguage);
  const started = book.progress > 0.001;

  return (
    <Pressable onPress={onOpen} style={styles.hero}>
      <View style={styles.heroCoverWrap}>
        <BookCover book={book} width={150} />
      </View>
      <Text style={styles.heroTitle} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.heroAuthor} numberOfLines={1}>
        {book.author || t.unknownAuthor}
      </Text>

      <View style={styles.heroProgressRow}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={book.progress} height={4} />
        </View>
        <Text style={styles.heroPct}>
          {formatPercent(book.progress, lang)} {t.read}
        </Text>
      </View>

      <View style={styles.cta}>
        <Ionicons name="book-outline" size={18} color="#fff" />
        <Text style={styles.ctaText}>{started ? t.continueReading : t.startReading}</Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="book-outline" size={40} color={colors.brand} />
      </View>
      <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
      <Text style={styles.emptyBody}>{t.emptyBody}</Text>
      <Pressable onPress={onAdd} style={[styles.cta, { alignSelf: 'center', paddingHorizontal: 28 }]}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.ctaText}>{t.addBook}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  h1: { fontFamily: fonts.black, fontSize: 32, color: colors.text },
  h2: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginHorizontal: 20, marginTop: 32, marginBottom: 14 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  hero: {
    marginHorizontal: 20, padding: 20, paddingTop: 28, borderRadius: 24,
    backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  heroCoverWrap: { alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, textAlign: 'center' },
  heroAuthor: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  heroProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  heroPct: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  cta: {
    marginTop: 18, height: 48, borderRadius: 24, backgroundColor: colors.brand,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  smallMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  empty: { paddingHorizontal: 32, paddingTop: 80, alignItems: 'center' },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, textAlign: 'center' },
  emptyBody: {
    fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center',
    marginTop: 8, lineHeight: 24,
  },
});
