import type { ReaderThemeId } from './types';

/** Aksos brand — Oxus river teal with a warm sand accent. */
export const colors = {
  brand: '#0F5257',
  brandSoft: '#E3EFEE',
  accent: '#C98B2B',
  bg: '#FAF8F4',
  surface: '#FFFFFF',
  text: '#1D1B18',
  textMuted: '#7A746B',
  border: '#ECE7DF',
  danger: '#B3261E',
};

export const fonts = {
  regular: 'Vazirmatn_400Regular',
  medium: 'Vazirmatn_500Medium',
  bold: 'Vazirmatn_700Bold',
  black: 'Vazirmatn_800ExtraBold',
};

export type ReaderTheme = {
  id: ReaderThemeId;
  /** Readium base theme */
  base: 'light' | 'sepia' | 'dark';
  bg: string;
  text: string;
  /** Colors for the reader's own toolbars and sheets */
  chrome: string;
  chromeText: string;
  chromeMuted: string;
  hairline: string;
  dark: boolean;
};

export const readerThemes: Record<ReaderThemeId, ReaderTheme> = {
  day: {
    id: 'day', base: 'light', bg: '#FFFFFF', text: '#1D1B18',
    chrome: '#FFFFFF', chromeText: '#1D1B18', chromeMuted: '#8B857C', hairline: '#EEEAE3', dark: false,
  },
  paper: {
    id: 'paper', base: 'sepia', bg: '#F5EEDF', text: '#3A2E20',
    chrome: '#F5EEDF', chromeText: '#3A2E20', chromeMuted: '#8F7E66', hairline: '#E6DBC6', dark: false,
  },
  dusk: {
    id: 'dusk', base: 'dark', bg: '#2A2C30', text: '#D9D4CB',
    chrome: '#2A2C30', chromeText: '#E8E3DA', chromeMuted: '#9A958D', hairline: '#3A3D42', dark: true,
  },
  night: {
    id: 'night', base: 'dark', bg: '#000000', text: '#B8B2A7',
    chrome: '#0D0D0D', chromeText: '#D6D0C6', chromeMuted: '#7D776E', hairline: '#1F1F1F', dark: true,
  },
};

/** Pleasant, stable colors for books without a cover image. */
const coverPalette = ['#0F5257', '#7A3E2E', '#2E4A7A', '#5B4A7A', '#3D6B45', '#8A5A12', '#6B2D4A'];

export function coverColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return coverPalette[Math.abs(h) % coverPalette.length];
}
