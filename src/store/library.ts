import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { deleteBookFiles } from '../lib/epub';
import type { Book, Bookmark, Locator } from '../types';

type LibraryState = {
  books: Record<string, Book>;
  addBook: (book: Book) => void;
  removeBook: (id: string) => void;
  markOpened: (id: string) => void;
  saveLocation: (id: string, locator: Locator) => void;
  addBookmark: (id: string, bookmark: Bookmark) => void;
  removeBookmark: (id: string, bookmarkId: string) => void;
};

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      books: {},

      addBook: (book) => set((s) => ({ books: { ...s.books, [book.id]: book } })),

      removeBook: (id) => {
        deleteBookFiles(id);
        AsyncStorage.removeItem(`aksos.locations.${id}`).catch(() => {});
        set((s) => {
          const { [id]: _removed, ...rest } = s.books;
          return { books: rest };
        });
      },

      markOpened: (id) =>
        set((s) =>
          s.books[id] ? { books: { ...s.books, [id]: { ...s.books[id], lastOpenedAt: Date.now() } } } : s
        ),

      saveLocation: (id, locator) =>
        set((s) => {
          const book = s.books[id];
          if (!book) return s;
          const progress = locator.totalProgression ?? book.progress;
          return { books: { ...s.books, [id]: { ...book, locator, progress } } };
        }),

      addBookmark: (id, bookmark) =>
        set((s) => {
          const book = s.books[id];
          if (!book) return s;
          return { books: { ...s.books, [id]: { ...book, bookmarks: [bookmark, ...book.bookmarks] } } };
        }),

      removeBookmark: (id, bookmarkId) =>
        set((s) => {
          const book = s.books[id];
          if (!book) return s;
          return {
            books: {
              ...s.books,
              [id]: { ...book, bookmarks: book.bookmarks.filter((b) => b.id !== bookmarkId) },
            },
          };
        }),
    }),
    {
      name: 'aksos.library',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ books: s.books }),
    }
  )
);

/** Books sorted: most recently opened first, then most recently added. */
export function sortByRecent(books: Record<string, Book>) {
  return Object.values(books).sort(
    (a, b) => (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt)
  );
}
