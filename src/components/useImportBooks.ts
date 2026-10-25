import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useT } from '../i18n';
import { importFromDevice } from '../lib/epub';
import { useLibrary } from '../store/library';

/** Opens the file picker and adds the chosen EPUBs to the library. */
export function useImportBooks() {
  const t = useT();
  const addBook = useLibrary((s) => s.addBook);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const books = await importFromDevice();
      books.forEach(addBook);
    } catch (e) {
      console.warn(e);
      Alert.alert(t.importFailed);
    } finally {
      setBusy(false);
    }
  }, [busy, addBook, t]);

  return { importBooks: run, busy };
}
