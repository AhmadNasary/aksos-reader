/**
 * A tiny persisted store (replaces zustand + persist, which Snack can't bundle).
 * Same usage as zustand: `useStore(selector)`, `useStore.getState()`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

type SetState<T> = (patch: Partial<T> | ((s: T) => Partial<T>)) => void;

export function createPersistedStore<T extends object>(
  key: string,
  init: (set: SetState<T>, get: () => T) => T,
  persistKeys: (keyof T)[]
) {
  let state: T;
  const listeners = new Set<() => void>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const save = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const data: Partial<T> = {};
      for (const k of persistKeys) data[k] = state[k];
      AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
    }, 300);
  };

  const set: SetState<T> = (patch) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    if (next === state) return;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
    save();
  };
  const get = () => state;

  state = init(set, get);

  // Load the saved state once at startup.
  AsyncStorage.getItem(key)
    .then((raw) => {
      if (!raw) return;
      state = { ...state, ...JSON.parse(raw) };
      listeners.forEach((l) => l());
    })
    .catch(() => {});

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  function useStore(): T;
  function useStore<U>(selector: (s: T) => U): U;
  function useStore<U>(selector?: (s: T) => U) {
    const pick = () => (selector ? selector(state) : state);
    return useSyncExternalStore(subscribe, pick, pick);
  }
  useStore.getState = get;
  useStore.setState = set;
  return useStore;
}
