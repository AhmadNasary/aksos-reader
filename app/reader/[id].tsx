import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ReadiumView, type ReadiumViewRef } from 'react-native-readium';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppearanceSheet } from '@/components/AppearanceSheet';
import { ContentsSheet } from '@/components/ContentsSheet';
import { formatPercent, isRtlLanguage } from '@/i18n';
import { epubPath } from '@/lib/epub';
import { useLibrary } from '@/store/library';
import { FONT_SCALES, LINE_HEIGHTS, useSettings } from '@/store/settings';
import { colors, fonts, readerThemes } from '@/theme';
import type { Locator, TocItem } from '@/types';

const TAP_MAX_MS = 250;
const TAP_MAX_MOVE = 10;
const EDGE = 0.25; // outer 25% on each side turns pages

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useLibrary((s) => s.books[id]);
  const saveLocation = useLibrary((s) => s.saveLocation);
  const markOpened = useLibrary((s) => s.markOpened);
  const addBookmark = useLibrary((s) => s.addBookmark);
  const removeBookmark = useLibrary((s) => s.removeBookmark);
  const settings = useSettings();
  const lang = settings.uiLanguage;
  const theme = readerThemes[settings.readerTheme];

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ref = useRef<ReadiumViewRef>(null);

  const [locator, setLocator] = useState<Locator | undefined>(book?.locator);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [positions, setPositions] = useState<Locator[]>([]);
  const [rtl, setRtl] = useState(isRtlLanguage(book?.language));
  const [sheet, setSheet] = useState<'none' | 'appearance' | 'contents'>('none');
  const [chromeOn, setChromeOn] = useState(true);
  const chromeAnim = useRef(new Animated.Value(1)).current;
  const [scrub, setScrub] = useState<number | null>(null);

  // Readium reads initialLocation only on mount — keep `file` stable.
  const file = useMemo(
    () => (book ? { url: epubPath(book.id), initialLocation: book.locator } : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book?.id]
  );

  useEffect(() => {
    if (id) markOpened(id);
  }, [id, markOpened]);

  // Show the toolbars briefly on open, then get out of the way.
  useEffect(() => {
    const timer = setTimeout(() => setChromeOn(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Animated.timing(chromeAnim, {
      toValue: chromeOn ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [chromeOn, chromeAnim]);

  // Debounced persistence of the reading position.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLocationChange = useCallback(
    (loc: Locator) => {
      setLocator(loc);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveLocation(id, loc), 600);
    },
    [id, saveLocation]
  );
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const onPublicationReady = useCallback((e: any) => {
    setToc((e?.tableOfContents ?? []) as TocItem[]);
    setPositions((e?.positions ?? []) as Locator[]);
    const md = e?.metadata ?? {};
    const lang0 = Array.isArray(md.languages) ? md.languages[0] : md.language;
    if (md.readingProgression === 'rtl' || isRtlLanguage(lang0)) setRtl(true);
  }, []);

  const preferences = useMemo(
    () => ({
      theme: theme.base,
      backgroundColor: theme.bg,
      textColor: theme.text,
      fontSize: FONT_SCALES[settings.fontScaleIndex],
      lineHeight: LINE_HEIGHTS[settings.lineHeightIndex],
      publisherStyles: settings.publisherStyles,
      scroll: settings.scroll,
      pageMargins: 1.2,
    }),
    [theme, settings.fontScaleIndex, settings.lineHeightIndex, settings.publisherStyles, settings.scroll]
  );

  /* ---------- tap zones: edges turn pages, middle toggles toolbars ---------- */
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    touch.current = { x: pageX, y: pageY, t: Date.now() };
  };
  const onTouchEnd = (e: GestureResponderEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const { pageX, pageY } = e.nativeEvent;
    const isTap =
      Date.now() - start.t < TAP_MAX_MS &&
      Math.abs(pageX - start.x) < TAP_MAX_MOVE &&
      Math.abs(pageY - start.y) < TAP_MAX_MOVE;
    if (!isTap) return;

    const x = pageX / width;
    if (chromeOn) return setChromeOn(false);
    if (settings.scroll || (x > EDGE && x < 1 - EDGE)) return setChromeOn(true);

    const leftSide = x <= EDGE;
    // In right-to-left books (Pashto, Dari, Arabic) the next page is on the left.
    const forward = rtl ? leftSide : !leftSide;
    forward ? ref.current?.goForward() : ref.current?.goBackward();
  };

  /* ---------- bookmarks ---------- */
  const currentMark = useMemo(() => {
    if (!book || !locator) return undefined;
    const p = locator.locations?.progression ?? 0;
    return book.bookmarks.find(
      (b) =>
        b.locator.href === locator.href &&
        Math.abs((b.locator.locations?.progression ?? 0) - p) < 0.01
    );
  }, [book, locator]);

  const toggleBookmark = () => {
    if (!book || !locator) return;
    if (currentMark) removeBookmark(book.id, currentMark.id);
    else
      addBookmark(book.id, {
        id: `${Date.now()}`,
        locator,
        label: locator.title ?? '',
        createdAt: Date.now(),
      });
  };

  /* ---------- progress scrubber ---------- */
  const progress = locator?.locations?.totalProgression ?? book?.progress ?? 0;
  const shownProgress = scrub ?? progress;
  const goToProgress = (value: number) => {
    setScrub(null);
    if (!positions.length) return;
    const idx = Math.min(positions.length - 1, Math.max(0, Math.round(value * (positions.length - 1))));
    ref.current?.goTo(positions[idx]);
  };

  if (!book || !file) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={theme.chromeText} />
        </Pressable>
      </View>
    );
  }

  const fade = {
    opacity: chromeAnim,
    pointerEvents: chromeOn ? ('auto' as const) : ('none' as const),
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <StatusBar hidden={!chromeOn} style={theme.dark ? 'light' : 'dark'} animated />

      <View
        style={[styles.fill, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ReadiumView
          ref={ref}
          file={file}
          preferences={preferences as any}
          onLocationChange={onLocationChange}
          onPublicationReady={onPublicationReady}
          style={styles.fill}
        />
      </View>

      {/* quiet footer while reading: chapter + percent */}
      {!chromeOn && (
        <View pointerEvents="none" style={[styles.quietFooter, { bottom: insets.bottom + 2 }]}>
          <Text style={[styles.quietText, { color: theme.chromeMuted }]} numberOfLines={1}>
            {formatPercent(progress, lang)}
          </Text>
        </View>
      )}

      {/* top bar */}
      <Animated.View
        style={[
          styles.topBar,
          fade,
          { paddingTop: insets.top + 6, backgroundColor: theme.chrome, borderBottomColor: theme.hairline },
        ]}
      >
        <IconBtn name="chevron-down" color={theme.chromeText} onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: theme.chromeText }]} numberOfLines={1}>
          {locator?.title || book.title}
        </Text>
        <IconBtn name="list" color={theme.chromeText} onPress={() => setSheet('contents')} />
        <Pressable onPress={() => setSheet('appearance')} hitSlop={8} style={styles.iconBtn}>
          <Text style={[styles.aa, { color: theme.chromeText }]}>Aa</Text>
        </Pressable>
        <IconBtn
          name={currentMark ? 'bookmark' : 'bookmark-outline'}
          color={currentMark ? colors.danger : theme.chromeText}
          onPress={toggleBookmark}
        />
      </Animated.View>

      {/* bottom bar */}
      <Animated.View
        style={[
          styles.bottomBar,
          fade,
          { paddingBottom: insets.bottom + 10, backgroundColor: theme.chrome, borderTopColor: theme.hairline },
        ]}
      >
        <Slider
          style={{ width: '100%', height: 36 }}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          inverted={rtl}
          disabled={!positions.length}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={theme.hairline}
          thumbTintColor={colors.accent}
          onValueChange={setScrub}
          onSlidingComplete={goToProgress}
        />
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomText, { color: theme.chromeMuted }]} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={[styles.bottomText, { color: theme.chromeText }]}>
            {formatPercent(shownProgress, lang)}
          </Text>
        </View>
      </Animated.View>

      <AppearanceSheet visible={sheet === 'appearance'} onClose={() => setSheet('none')} theme={theme} />
      <ContentsSheet
        visible={sheet === 'contents'}
        onClose={() => setSheet('none')}
        theme={theme}
        toc={toc}
        book={book}
        current={locator}
        onNavigate={(target) => {
          ref.current?.goTo(target);
          setChromeOn(false);
        }}
        onRemoveBookmark={(bid) => removeBookmark(book.id, bid)}
      />
    </View>
  );
}

function IconBtn({
  name,
  color,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconBtn}>
      <Ionicons name={name} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 15, textAlign: 'center', marginHorizontal: 6 },
  iconBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  aa: { fontSize: 18, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 18, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomInfo: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  bottomText: { fontFamily: fonts.medium, fontSize: 12 },
  quietFooter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  quietText: { fontFamily: fonts.regular, fontSize: 11 },
});
