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
2. په Safari کې **snack.expo.dev** خلاص کړئ. هلته له مینو څخه **Import git repository** وټاکئ او دا لینک ورکړئ:
   `https://github.com/AhmadNasary/aksos-reader`
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
