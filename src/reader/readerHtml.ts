/**
 * The page that runs inside the WebView. It uses epub.js to lay out the book
 * and talks to React Native through postMessage.
 *
 * RN → web:  window.__chunk(base64Part)  (book bytes, in pieces)
 *            window.__open(options)
 *            window.__style(style)
 *            window.__next() / __prev() / __goTo(target) / __goToPercent(p)
 *            window.__setBookmarks(cfis)
 * web → RN:  htmlReady, ready, toc, relocated, locations, tap, error
 */
export const readerHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; -webkit-user-select: none; }
  #viewer { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
</style>
</head>
<body>
<div id="viewer"></div>
<script>
(function () {
  var RN = window.ReactNativeWebView;
  function send(type, payload) { RN.postMessage(JSON.stringify({ type: type, payload: payload })); }
  window.onerror = function (msg) { send('error', String(msg)); };

  var chunks = [];
  var book, rendition, style, rtl = false, scroll = false;
  var flatToc = [];
  var bookmarkCfis = [];
  var lastLocation = null;
  var themeCounter = 0;

  window.__chunk = function (part) { chunks.push(part); };

  function base64ToBuffer(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function flatten(items, out) {
    (items || []).forEach(function (it) {
      out.push(it);
      if (it.subitems && it.subitems.length) flatten(it.subitems, out);
    });
    return out;
  }

  function mapToc(items) {
    return (items || []).map(function (it) {
      return { href: it.href, title: (it.label || '').trim(), children: mapToc(it.subitems) };
    });
  }

  function chapterFor(href) {
    if (!href) return '';
    var bare = href.split('#')[0];
    var hit = null;
    for (var i = 0; i < flatToc.length; i++) {
      var h = (flatToc[i].href || '').split('#')[0];
      if (h === bare || bare.slice(-h.length) === h || h.slice(-bare.length) === bare) { hit = flatToc[i]; break; }
    }
    return hit ? (hit.label || '').trim() : '';
  }

  function bookmarkAt(loc) {
    if (!loc || !bookmarkCfis.length) return null;
    var cmp = new ePub.CFI();
    for (var i = 0; i < bookmarkCfis.length; i++) {
      try {
        var c = bookmarkCfis[i];
        if (cmp.compare(c, loc.start.cfi) >= 0 && cmp.compare(c, loc.end.cfi) <= 0) return c;
      } catch (e) {}
    }
    return null;
  }

  function emitLocation() {
    var loc = lastLocation;
    if (!loc || !loc.start) return;
    var pct = null;
    try {
      if (book.locations && book.locations.length()) pct = book.locations.percentageFromCfi(loc.start.cfi);
    } catch (e) {}
    send('relocated', {
      cfi: loc.start.cfi,
      href: loc.start.href,
      title: chapterFor(loc.start.href),
      totalProgression: pct,
      atEnd: !!loc.atEnd,
      bookmarkCfi: bookmarkAt(loc)
    });
  }

  function cssFor(s) {
    var rules = {
      'html, body': { 'background': s.bg + ' !important', 'color': s.text + ' !important' },
      'p, li, div, span, td, th, blockquote, h1, h2, h3, h4, h5, h6, dt, dd, figcaption': { 'color': 'inherit !important', 'background-color': 'transparent !important' },
      'a, a *': { 'color': s.link + ' !important' },
      'img, svg': { 'max-width': '100% !important' }
    };
    if (!s.publisherStyles) {
      rules['body, p, li, div, span, td, blockquote'] = {
        'font-family': '"Vazirmatn", "Noto Naskh Arabic", Georgia, serif !important',
        'line-height': s.lineHeight + ' !important'
      };
      rules['p'] = { 'text-align': 'justify !important', 'margin-top': '0 !important', 'margin-bottom': '0.6em !important' };
    }
    return rules;
  }

  window.__style = function (s) {
    style = s;
    document.body.style.background = s.bg;
    if (!rendition) return;
    var name = 'aksos' + (++themeCounter);
    rendition.themes.register(name, cssFor(s));
    rendition.themes.select(name);
    rendition.themes.fontSize(Math.round(s.fontScale * 100) + '%');
  };

  window.__setBookmarks = function (cfis) {
    bookmarkCfis = cfis || [];
    emitLocation();
  };

  window.__next = function () { if (rendition) rendition.next(); };
  window.__prev = function () { if (rendition) rendition.prev(); };
  window.__goTo = function (target) { if (rendition) rendition.display(target); };
  window.__goToPercent = function (p) {
    if (!rendition || !book.locations.length()) return;
    rendition.display(book.locations.cfiFromPercentage(Math.max(0, Math.min(1, p))));
  };

  function installTouch(contents) {
    var doc = contents.document;
    try {
      contents.addStylesheet('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
    } catch (e) {}
    var start = null;
    doc.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      start = { x: t.screenX, y: t.screenY, time: Date.now() };
    }, { passive: true });
    doc.addEventListener('touchend', function (e) {
      if (!start) return;
      var t = e.changedTouches[0];
      var dx = t.screenX - start.x, dy = t.screenY - start.y, dt = Date.now() - start.time;
      start = null;
      var sel = contents.window.getSelection && contents.window.getSelection();
      if (sel && String(sel).length) return; // user is selecting text
      if (!scroll && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) {
        // swipe left = next page in LTR books, previous page in RTL books
        var forward = dx < 0 ? !rtl : rtl;
        forward ? rendition.next() : rendition.prev();
        send('tap', { zone: 'swipe' });
        return;
      }
      if (dt < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        var frame = contents.window.frameElement;
        var left = frame ? frame.getBoundingClientRect().left : 0;
        var x = (left + t.clientX) / window.innerWidth;
        send('tap', { zone: x < 0.25 ? 'left' : x > 0.75 ? 'right' : 'center' });
      }
    }, { passive: true });
  }

  window.__open = function (opts) {
    try {
      var data = base64ToBuffer(chunks.join(''));
      chunks = [];
      rtl = !!opts.rtl;
      scroll = !!opts.scroll;
      style = opts.style;
      document.body.style.background = style.bg;

      book = ePub(data);
      rendition = book.renderTo('viewer', {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: scroll ? 'scrolled-doc' : 'paginated',
        manager: scroll ? 'continuous' : 'default',
        defaultDirection: rtl ? 'rtl' : 'ltr',
        allowScriptedContent: false
      });
      rendition.hooks.content.register(installTouch);
      window.__style(style);

      rendition.on('relocated', function (loc) { lastLocation = loc; emitLocation(); });

      book.loaded.navigation.then(function (nav) {
        flatToc = flatten(nav.toc, []);
        send('toc', mapToc(nav.toc));
        emitLocation();
      });

      book.ready.then(function () {
        var dir = book.package && book.package.metadata && book.package.metadata.direction;
        if (dir === 'rtl') rtl = true;
        send('ready', { rtl: rtl });
        return rendition.display(opts.initialCfi || undefined);
      }).then(function () {
        if (opts.locations) {
          book.locations.load(opts.locations);
          emitLocation();
          return;
        }
        // Splitting the book into ~1000-char locations gives us a global percentage.
        return book.locations.generate(1000).then(function () {
          send('locations', book.locations.save());
          emitLocation();
        });
      }).catch(function (e) { send('error', String(e && e.message || e)); });
    } catch (e) {
      send('error', String(e && e.message || e));
    }
  };

  send('htmlReady');
})();
</script>
</body>
</html>`;
