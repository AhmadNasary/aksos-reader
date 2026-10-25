import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_700Bold,
  Vazirmatn_800ExtraBold,
} from '@expo-google-fonts/vazirmatn';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from './src/i18n';
import { NavContext } from './src/navigation';
import { Library } from './src/screens/Library';
import { ReaderScreen } from './src/screens/Reader';
import { ReadingNow } from './src/screens/ReadingNow';
import { useSettings } from './src/store/settings';
import { colors, fonts } from './src/theme';

type Tab = 'now' | 'library';

export default function App() {
  const [loaded] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_700Bold,
    Vazirmatn_800ExtraBold,
  });

  if (!loaded) {
    return (
      <View style={[styles.fill, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

function Shell() {
  const lang = useSettings((s) => s.uiLanguage);
  const [tab, setTab] = useState<Tab>('now');
  const [openId, setOpenId] = useState<string | null>(null);

  const nav = useMemo(
    () => ({ openBook: (id: string) => setOpenId(id), closeBook: () => setOpenId(null) }),
    []
  );

  return (
    <NavContext.Provider value={nav}>
      {/* Pashto & Dari are right-to-left; switching language flips the layout instantly. */}
      <View style={[styles.fill, { direction: lang === 'en' ? 'ltr' : 'rtl', backgroundColor: colors.bg }]}>
        <StatusBar style="dark" />
        <View style={styles.fill}>{tab === 'now' ? <ReadingNow /> : <Library />}</View>
        <TabBar tab={tab} onChange={setTab} />
        {openId && <ReaderScreen key={openId} id={openId} />}
      </View>
    </NavContext.Provider>
  );
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const items: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'now', label: t.readingNow, icon: 'book-outline', iconOn: 'book' },
    { key: 'library', label: t.library, icon: 'library-outline', iconOn: 'library' },
  ];
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((it) => {
        const on = tab === it.key;
        const color = on ? colors.brand : colors.textMuted;
        return (
          <Pressable key={it.key} style={styles.tab} onPress={() => onChange(it.key)}>
            <Ionicons name={on ? it.iconOn : it.icon} size={24} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontFamily: fonts.medium, fontSize: 11 },
});
