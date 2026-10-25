import { createContext, useContext } from 'react';

/** Tiny navigation layer (no router) so the app also runs in Expo Snack. */
export type Nav = {
  openBook: (id: string) => void;
  closeBook: () => void;
};

export const NavContext = createContext<Nav>({ openBook: () => {}, closeBook: () => {} });
export const useNav = () => useContext(NavContext);
