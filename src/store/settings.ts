import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ReaderThemeId, UiLanguage } from '../types';

export const FONT_SCALES = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2.0];
export const LINE_HEIGHTS = [1.3, 1.6, 1.9];

type SettingsState = {
  uiLanguage: UiLanguage;
  readerTheme: ReaderThemeId;
  fontScaleIndex: number;
  lineHeightIndex: number;
  scroll: boolean;
  publisherStyles: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      uiLanguage: 'ps',
      readerTheme: 'paper',
      fontScaleIndex: 2,
      lineHeightIndex: 1,
      scroll: false,
      publisherStyles: true,
      set: (patch) => set(patch),
    }),
    {
      name: 'aksos.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set, ...rest }) => rest,
    }
  )
);
