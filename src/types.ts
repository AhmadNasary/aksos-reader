import type { Locator } from 'react-native-readium';

export type { Locator };

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
  /** 0..1, taken from locator.locations.totalProgression */
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
