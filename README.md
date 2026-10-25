# اکسوس – د EPUB لوستونکی (Aksos Reader)

د React Native (Expo + TypeScript) اپ چې EPUB کتابونه لولي. انجن یې **Readium** دی (native، نرم پاڼې اړول).

## څه پکې دي
- **اوس لولم**: هغه کتاب چې تاسو وروستی لوستی، د پرمختګ سره، او وروستي کتابونه
- **کتابتون**: د پوښونو شبکه، فلټرونه (ټول / په لوستلو کې / لوستل شوي)، د ژبې بدلون (پښتو، دري، انګلیسي). د کتاب لرې کولو لپاره پرې ګوته ونیسئ او ونیسئ یې (long-press).
- **لوستونکی**:
  - په څنډو ټک کول پاڼه اړوي. په RTL کتابونو کې کیڼ لوري ته مخکې ځي.
  - په منځ کې ټک کول مینو ښکاره کوي.
  - فهرست، نښې (bookmarks) او سلایډر لري.
  - څلور تیمونه لري: سپین، کاغذي، خړ، شپه.
  - د لیکنې کچه، د کرښو واټن، او ښکته اړول (scroll) پکې شته.
- د لوستلو ځای په اتومات ډول ساتل کېږي. کله چې کتاب بیا خلاص کړئ، له همغه ځایه پیلېږي.
- د EPUB نوم، لیکوال او پوښ په اتومات ډول را ایستل کېږي.

## نصبول

> ⚠️ دا اپ په **Expo Go** کې نه چلېږي، ځکه Readium native کوډ لري. باید dev build جوړ کړئ.
> د iOS لپاره Mac او Xcode 16.4+ ته اړتیا ده. د Android لپاره JDK 17 ته اړتیا ده.

```bash
cd aksos-reader

# 1) Expo
npm install expo@latest

# 2) Expo پکیجونه (expo install سم نسخې ټاکي)
npx expo install react react-native expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar expo-splash-screen expo-font expo-image \
  expo-document-picker expo-file-system expo-build-properties expo-dev-client \
  @expo/vector-icons @expo-google-fonts/vazirmatn \
  @react-native-async-storage/async-storage @react-native-community/slider

# 3) Readium
npm install react-native-readium react-native-nitro-modules

# 4) نور
npm install zustand jszip fast-xml-parser
npm install -D typescript @types/react

# 5) native فولډرونه جوړ کړئ او اپ وچلوئ
npx expo prebuild --clean
npx expo run:android      # یا: npx expo run:ios
```

`plugins/withReadium.js` د Readium ټول native تنظیمات په اتومات ډول کوي. په iOS کې Podfile سموي، او په Android کې desugaring فعالوي. نو `ios/` او `android/` فولډرونو ته لاس مه وروئ.

## که ستونزه پیدا شوه
- **Android: Kotlin version error**: Readium د Kotlin 2.3.20 یا نوي نسخې ته اړتیا لري. په `app.json` کې د `expo-build-properties` د `android` برخې ته `"kotlinVersion": "2.3.20"` ورزیات کړئ.
- **iOS: `readium_pods` undefined**: `ios/Podfile` خلاص کړئ او وګورئ چې د Readium کرښې پکې شته که نه. بیا د react-native-readium README سره یې پرتله کړئ.
- **فایل نه ټاکل کېږي (Android)**: ځینې فایل مدیران EPUB د بل ډول په توګه ښیي. په `src/lib/epub.ts` کې `type` په `'*/*'` بدل کړئ.

## جوړښت
```
app/
  _layout.tsx            فونټونه، RTL، Stack
  (tabs)/index.tsx       اوس لولم
  (tabs)/library.tsx     کتابتون
  reader/[id].tsx        لوستونکی (Readium)
src/
  lib/epub.ts            وارد کول، د EPUB metadata او پوښ
  store/library.ts       کتابونه، پرمختګ، نښې (zustand + AsyncStorage)
  store/settings.ts      د لوستلو تنظیمات او ژبه
  components/            پوښ، د بڼې پاڼه، فهرست، ...
  theme.ts  i18n.ts
plugins/withReadium.js   د Readium لپاره Expo plugin
```

## راتلونکي ګامونه
- د اکسوس پلورنځي سره نښلول: `importFromUrl(url)` له وړاندې جوړ دی.
- هایلایټ او یادښتونه: Readium `decorations` او `onSelectionAction` لري.
- په کتاب کې لټون: `ref.current.search(query)`.
- که UI انګلیسي ته واړول شي، باید LTR شي. دا کار د اپ بیا پیلولو ته اړتیا لري (`expo-updates` → `reloadAsync`).
