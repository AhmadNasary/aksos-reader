# اکسوس – د EPUB لوستونکی (Aksos Reader)

د React Native (Expo + TypeScript) اپ چې EPUB کتابونه لولي. دا نسخه په **Expo Go** او **Expo Snack** کې چلېږي، نو کمپیوټر ته اړتیا نشته.

## څه پکې دي
- **اوس لولم**: هغه کتاب چې تاسو وروستی لوستی، د پرمختګ سره، او وروستي کتابونه
- **کتابتون**: د پوښونو شبکه، فلټرونه، او د ژبې بدلون (پښتو، دري، English). د کتاب لرې کولو لپاره پرې ګوته ونیسئ.
- **لوستونکی**:
  - په څنډو ټک کول یا swipe کول پاڼه اړوي. په RTL کتابونو کې کیڼ لوری مخکې ځي.
  - په منځ کې ټک کول مینو ښکاره کوي.
  - فهرست، نښې او سلایډر لري.
  - څلور تیمونه لري: سپین، کاغذي، خړ، شپه.
  - د لیکنې کچه، د کرښو واټن، Vazirmatn فونټ، او ښکته اړول (scroll) پکې شته.
- د لوستلو ځای ساتل کېږي. د EPUB نوم، لیکوال او پوښ په اتومات ډول را ایستل کېږي.

## په ایفون کې ازمویل (بې کمپیوټره)
1. له App Store څخه **Expo Go** نصب کړئ.
2. په ایفون کې دا لینک خلاص کړئ: **[اکسوس په Snack کې خلاص کړئ](https://snack.expo.dev/?name=Aksos%20Reader&platform=mydevice&files=%7B%22App.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2FApp.tsx%22%7D%2C%22src%2Fcomponents%2FAppearanceSheet.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fcomponents%2FAppearanceSheet.tsx%22%7D%2C%22src%2Fcomponents%2FBookCover.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fcomponents%2FBookCover.tsx%22%7D%2C%22src%2Fcomponents%2FContentsSheet.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fcomponents%2FContentsSheet.tsx%22%7D%2C%22src%2Fcomponents%2FProgressBar.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fcomponents%2FProgressBar.tsx%22%7D%2C%22src%2Fcomponents%2FuseImportBooks.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fcomponents%2FuseImportBooks.ts%22%7D%2C%22src%2Fi18n.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fi18n.ts%22%7D%2C%22src%2Flib%2Fepub.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Flib%2Fepub.ts%22%7D%2C%22src%2Fnavigation.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fnavigation.tsx%22%7D%2C%22src%2Freader%2FreaderHtml.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Freader%2FreaderHtml.ts%22%7D%2C%22src%2Fscreens%2FLibrary.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fscreens%2FLibrary.tsx%22%7D%2C%22src%2Fscreens%2FReader.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fscreens%2FReader.tsx%22%7D%2C%22src%2Fscreens%2FReadingNow.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fscreens%2FReadingNow.tsx%22%7D%2C%22src%2Fstore%2FcreateStore.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fstore%2FcreateStore.ts%22%7D%2C%22src%2Fstore%2Flibrary.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fstore%2Flibrary.ts%22%7D%2C%22src%2Fstore%2Fsettings.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Fstore%2Fsettings.ts%22%7D%2C%22src%2Ftheme.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Ftheme.ts%22%7D%2C%22src%2Ftypes.ts%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FAhmadNasary%2Faksos-reader%2Fmain%2Fsrc%2Ftypes.ts%22%7D%7D&dependencies=%40expo-google-fonts%2Fvazirmatn%2C%40expo%2Fvector-icons%2C%40react-native-async-storage%2Fasync-storage%2C%40react-native-community%2Fslider%2Cexpo-document-picker%2Cexpo-file-system%2Cexpo-font%2Cexpo-image%2Cexpo-status-bar%2Creact-native-safe-area-context%2Creact-native-webview%2Cjszip%2Cfast-xml-parser)**
   (Snack ټول فایلونه په اتومات ډول له همدې repo څخه راوړي.)
3. په Snack کې **My Device** وټاکئ او QR کوډ په Expo Go کې سکن کړئ.
4. په اپ کې **+** ووهئ او له Files اپ څخه یو `.epub` کتاب وټاکئ.

> د لوستلو انجن (epub.js) د لومړي ځل لپاره له انټرنېټ څخه راځي، نو انټرنېټ ته اړتیا ده.

## په کمپیوټر کې
```bash
npm install
npx expo install --fix
npx expo start
```

## جوړښت
```
App.tsx                  فونټونه، ټبونه، RTL
src/screens/             اوس لولم، کتابتون، لوستونکی
src/reader/readerHtml.ts د epub.js پاڼه چې په WebView کې چلېږي
src/lib/epub.ts          وارد کول، د EPUB metadata او پوښ
src/store/               کتابونه، پرمختګ، نښې، تنظیمات (zustand + AsyncStorage)
src/components/          پوښ، د بڼې پاڼه، فهرست
```

## Native نسخه (Readium)
د App Store لپاره ډېره ګړندۍ native نسخه په `native-readium` څانګه (branch) کې ده. هغه dev build ته اړتیا لري.
