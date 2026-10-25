/** A position in a book (epub.js CFI) plus what we show for it. */
export type Locator = {
  cfi: string;
  href?: string;
  /** Chapter title */
  title?: string;
  /** 0..1 through the whole book (available once locations are generated) */
  totalProgression?: number;
};

export type Bookmark = {
  id: string;
  locator: Locator;
  /** Chapter title at the time the bookmark was made */
  label: string;
  createdAt: number;
};

export type Book = {
  /** Also the folder name under <documents>/books/ */
  id: string;
  title: string;
  author: string;
  language?: string;
  /** File extension of the extracted cover (jpg/png/...), if the EPUB has one */
  coverExt?: string;
  addedAt: number;
  lastOpenedAt?: number;
  /** 0..1 */
  progress: number;
  locator?: Locator;
  bookmarks: Bookmark[];
};

export type TocItem = {
  href: string;
  title?: string;
  children?: TocItem[];
};

export type ReaderThemeId = 'day' | 'paper' | 'dusk' | 'night';
export type UiLanguage = 'ps' | 'fa' | 'en';
