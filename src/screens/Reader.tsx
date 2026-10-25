import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { AppearanceSheet } from '../components/AppearanceSheet';
import { ContentsSheet } from '../components/ContentsSheet';
import { formatPercent, isRtlLanguage } from '../i18n';
import { epubFile } from '../lib/epub';
import { useNav } from '../navigation';
import { readerHtml } from '../reader/readerHtml';
import { useLibrary } from '../store/library';
import { FONT_SCALES, LINE_HEIGHTS, useSettings } from '../store/settings';
import { colors, fonts, readerThemes } from '../theme';
import type { Locator, TocItem } from '../types';

const CHUNK = 256 * 1024;
const locationsKey = (id: string) => `aksos.locations.${id}`;

type WebMsg =
  | { type: 'htmlReady' }
  | { type: 'ready'; payload: { rtl: boolean } }
  | { type: 'toc'; payload: TocItem[] }
  | { type: 'relocated'; payload: Locator & { atEnd: boolean; bookmarkCfi: string | null } }
  | { type: 'locations'; payload: string }
  | { type: 'tap'; payload: { zone: 'left' | 'right' | 'center' | 'swipe' } }
  | { type: 'error'; payload: string };

export function ReaderScreen({ id }: { id: string }) {
  const { closeBook } = useNav();
  const book = useLibrary((s) => s.books[id]);
  const saveLocation = useLibrary((s) => s.saveLocation);
  const markOpened = useLibrary((s) => s.markOpened);
  const addBookmark = useLibrary((s) => s.addBookmark);
  const removeBookmark = useLibrary((s) => s.removeBookmark);
  const settings = useSettings();
  const lang = settings.uiLanguage;
  const theme = readerThemes[settings.readerTheme];
  const insets = useSafeAreaInsets();

  const web = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locator, setLocator] = useState<Locator | undefined>(book?.locator);
  const [bookmarkCfi, setBookmarkCfi] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [rtl, setRtl] = useState(isRtlLanguage(book?.language));
  const [hasLocations, setHasLocations] = useState(false);
  const [sheet, setSheet] = useState<'none' | 'appearance' | 'contents'>('none');
  const [chromeOn, setChromeOn] = useState(true);
  const [scrub, setScrub] = useState<number | null>(null);
  const chromeAnim = useRef(new Animated.Value(1)).current;

  const style = useMemo(
    () => ({
      bg: theme.bg,
      text: theme.text,
      link: colors.accent,
      fontScale: FONT_SCALES[settings.fontScaleIndex],
      lineHeight: LINE_HEIGHTS[settings.lineHeightIndex],
      publisherStyles: settings.publisherStyles,
    }),
    [theme, settings.fontScaleIndex, settings.lineHeightIndex, settings.publisherStyles]
  );

  const run = useCallback((js: string) => web.current?.injectJavaScript(`${js};true;`), []);

  useEffect(() => {
    markOpened(id);
  }, [id, markOpened]);

  // Toolbars: visible on open, then hide.
  useEffect(() => {
    const timer = setTimeout(() => setChromeOn(false), 2200);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    Animated.timing(chromeAnim, { toValue: chromeOn ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [chromeOn, chromeAnim]);

  // Live style changes (theme, size, spacing) without reloading the book.
  const firstStyle = useRef(true);
  useEffect(() => {
    if (firstStyle.current) {
      firstStyle.current = false;
      return;
    }
    run(`window.__style(${JSON.stringify(style)})`);
  }, [style, run]);

  // Tell the page which positions are bookmarked so it can light up the icon.
  const bookmarkCfis = useMemo(() => book?.bookmarks.map((b) => b.locator.cfi) ?? [], [book?.bookmarks]);
  useEffect(() => {
    if (!loading) run(`window.__setBookmarks(${JSON.stringify(bookmarkCfis)})`);
  }, [bookmarkCfis, loading, run]);

  /** Send the EPUB bytes into the page in pieces, then open it. */
  const sendBook = useCallback(async () => {
    try {
      const b64 = await epubFile(id).base64();
      for (let i = 0; i < b64.length; i += CHUNK) {
        run(`window.__chunk(${JSON.stringify(b64.slice(i, i + CHUNK))})`);
      }
      const locations = await AsyncStorage.getItem(locationsKey(id));
      const opts = {
        initialCfi: useLibrary.getState().books[id]?.locator?.cfi ?? null,
        rtl: isRtlLanguage(book?.language),
        scroll: settings.scroll,
        style,
        locations,
      };
      run(`window.__open(${JSON.stringify(opts)})`);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, run, settings.scroll]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: WebMsg;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'htmlReady':
        sendBook();
        break;
      case 'ready':
        setRtl(msg.payload.rtl);
        setLoading(false);
        break;
      case 'toc':
        setToc(msg.payload);
        break;
      case 'locations':
        setHasLocations(true);
        AsyncStorage.setItem(locationsKey(id), msg.payload).catch(() => {});
        break;
      case 'relocated': {
        const { atEnd, bookmarkCfi: bm, ...loc } = msg.payload;
        if (loc.totalProgression != null) setHasLocations(true);
        const fixed: Locator = {
          ...loc,
          totalProgression: atEnd ? 1 : loc.totalProgression ?? undefined,
        };
        setLocator(fixed);
        setBookmarkCfi(bm);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveLocation(id, fixed), 500);
        break;
      }
      case 'tap': {
        const { zone } = msg.payload;
        if (zone === 'swipe') return setChromeOn(false);
        if (chromeOn) return setChromeOn(false);
        if (zone === 'center' || settings.scroll) return setChromeOn(true);
        // In right-to-left books (Pashto, Dari, Arabic) the next page is on the left.
        const forward = rtl ? zone === 'left' : zone === 'right';
        run(forward ? 'window.__next()' : 'window.__prev()');
        break;
      }
      case 'error':
        console.warn('[reader]', msg.payload);
        if (loading) setError(msg.payload);
        break;
    }
  };

  const currentMark = book?.bookmarks.find((b) => b.locator.cfi === bookmarkCfi);
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

  if (!book) return null;

  const progress = locator?.totalProgression ?? book.progress ?? 0;
  const shown = scrub ?? progress;
  const fade = { opacity: chromeAnim };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}>
      <StatusBar hidden={!chromeOn} style={theme.dark ? 'light' : 'dark'} animated />

      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
        <WebView
          // remount when the flow changes (paged ↔ scrolling)
          key={settings.scroll ? 'scroll' : 'paged'}
          ref={web}
          source={{ html: readerHtml }}
          originWhitelist={['*']}
          onMessage={onMessage}
          javaScriptEnabled
          scrollEnabled={settings.scroll}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: theme.bg }}
          containerStyle={{ backgroundColor: theme.bg }}
          onLoadStart={() => setLoading(true)}
        />
      </View>

      {(loading || error) && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: theme.bg }]}>
          {error ? (
            <>
              <Ionicons name="alert-circle-outline" size={36} color={theme.chromeMuted} />
              <Text style={[styles.err, { color: theme.chromeMuted }]}>{error}</Text>
              <Pressable onPress={closeBook} style={styles.errBtn}>
                <Ionicons name="close" size={22} color={theme.chromeText} />
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={colors.accent} />
          )}
        </View>
      )}

      {!chromeOn && !loading && (
        <View pointerEvents="none" style={[styles.quietFooter, { bottom: insets.bottom }]}>
          <Text style={[styles.quietText, { color: theme.chromeMuted }]} numberOfLines={1}>
            {hasLocations ? formatPercent(progress, lang) : ' '}
          </Text>
        </View>
      )}

      {/* top bar */}
      <Animated.View
        pointerEvents={chromeOn ? 'auto' : 'none'}
        style={[
          styles.topBar,
          fade,
          { paddingTop: insets.top + 6, backgroundColor: theme.chrome, borderBottomColor: theme.hairline },
        ]}
      >
        <IconBtn name="chevron-down" color={theme.chromeText} onPress={closeBook} />
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
        pointerEvents={chromeOn ? 'auto' : 'none'}
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
          disabled={!hasLocations}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={theme.hairline}
          thumbTintColor={colors.accent}
          onValueChange={setScrub}
          onSlidingComplete={(v) => {
            setScrub(null);
            run(`window.__goToPercent(${v})`);
          }}
        />
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomText, { color: theme.chromeMuted }]} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={[styles.bottomText, { color: theme.chromeText }]}>
            {hasLocations ? formatPercent(shown, lang) : '…'}
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
          run(`window.__goTo(${JSON.stringify(target)})`);
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
  center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  err: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  errBtn: { padding: 10 },
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
