import { useSettings } from './store/settings';
import type { UiLanguage } from './types';

const ps = {
  readingNow: 'اوس لولم',
  library: 'کتابتون',
  continueReading: 'لوستل ته دوام',
  startReading: 'لوستل پیل کړه',
  addBook: 'کتاب ورزیات کړه',
  emptyTitle: 'کتابتون مو تش دی',
  emptyBody: 'خپل لومړی EPUB کتاب ورزیات کړئ او لوستل پیل کړئ.',
  recent: 'وروستي کتابونه',
  all: 'ټول',
  inProgress: 'په لوستلو کې',
  finished: 'لوستل شوي',
  notStarted: 'نوی',
  contents: 'فهرست',
  bookmarks: 'نښې',
  noBookmarks: 'تر اوسه نښه نشته. د لوستلو پر مهال پورته د نښې تڼۍ ووهئ.',
  appearance: 'بڼه',
  scroll: 'ښکته اړول',
  originalLayout: 'د خپرندوی اصلي بڼه',
  lineSpacing: 'د کرښو واټن',
  textSize: 'د لیکنې کچه',
  delete: 'لرې کول',
  cancel: 'لغوه',
  deleteConfirm: 'دا کتاب له کتابتون څخه لرې شي؟',
  importFailed: 'کتاب ورزیاتول ونه شول. ډاډ ترلاسه کړئ چې فایل EPUB دی.',
  read: 'لوستل شوی',
  unknownAuthor: 'ناڅرګند لیکوال',
  done: 'بس',
  language: 'ژبه',
};

type Strings = typeof ps;

const fa: Strings = {
  readingNow: 'در حال خواندن',
  library: 'کتابخانه',
  continueReading: 'ادامهٔ خواندن',
  startReading: 'شروع خواندن',
  addBook: 'افزودن کتاب',
  emptyTitle: 'کتابخانهٔ شما خالی است',
  emptyBody: 'نخستین کتاب EPUB خود را بیفزایید و خواندن را آغاز کنید.',
  recent: 'کتاب‌های اخیر',
  all: 'همه',
  inProgress: 'در حال خواندن',
  finished: 'خوانده‌شده',
  notStarted: 'تازه',
  contents: 'فهرست',
  bookmarks: 'نشانک‌ها',
  noBookmarks: 'هنوز نشانکی نیست. هنگام خواندن، دکمهٔ نشانک را در بالا بزنید.',
  appearance: 'نما',
  scroll: 'پیمایش عمودی',
  originalLayout: 'نمای اصلی ناشر',
  lineSpacing: 'فاصلهٔ سطرها',
  textSize: 'اندازهٔ متن',
  delete: 'حذف',
  cancel: 'لغو',
  deleteConfirm: 'این کتاب از کتابخانه حذف شود؟',
  importFailed: 'افزودن کتاب ناموفق بود. مطمئن شوید فایل EPUB است.',
  read: 'خوانده شده',
  unknownAuthor: 'نویسندهٔ نامعلوم',
  done: 'تمام',
  language: 'زبان',
};

const en: Strings = {
  readingNow: 'Reading Now',
  library: 'Library',
  continueReading: 'Continue reading',
  startReading: 'Start reading',
  addBook: 'Add a book',
  emptyTitle: 'Your library is empty',
  emptyBody: 'Add your first EPUB book and start reading.',
  recent: 'Recent',
  all: 'All',
  inProgress: 'Reading',
  finished: 'Finished',
  notStarted: 'New',
  contents: 'Contents',
  bookmarks: 'Bookmarks',
  noBookmarks: 'No bookmarks yet. Tap the bookmark button while reading.',
  appearance: 'Appearance',
  scroll: 'Scrolling',
  originalLayout: 'Publisher layout',
  lineSpacing: 'Line spacing',
  textSize: 'Text size',
  delete: 'Remove',
  cancel: 'Cancel',
  deleteConfirm: 'Remove this book from your library?',
  importFailed: 'Could not add the book. Make sure the file is an EPUB.',
  read: 'read',
  unknownAuthor: 'Unknown author',
  done: 'Done',
  language: 'Language',
};

const strings: Record<UiLanguage, Strings> = { ps, fa, en };

export function useT() {
  const lang = useSettings((s) => s.uiLanguage);
  return strings[lang];
}

/** Percent with Eastern Arabic-Indic digits for ps/fa (۴۲٪), Latin for en. */
export function formatPercent(value: number, lang: UiLanguage) {
  const n = Math.round(Math.max(0, Math.min(1, value)) * 100);
  if (lang === 'en') return `${n}%`;
  return `${toLocalDigits(n)}٪`;
}

export function toLocalDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

const RTL_LANGS = ['ar', 'fa', 'ps', 'ur', 'he', 'prs', 'pbt', 'pus', 'per', 'fas'];
export function isRtlLanguage(code?: string) {
  if (!code) return false;
  return RTL_LANGS.includes(code.toLowerCase().split(/[-_]/)[0]);
}
