import React, { createContext, useState } from 'react';

export const AppViewContext = createContext({ view: 'landing', setView: () => {} });
const VIEW_KEY = 'cattalytics:ui:view'

export function AppViewProvider({ children }) {
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) || 'landing'
    } catch {
      return 'landing'
    }
  });

  const setViewAndPersist = (next) => {
    const value = typeof next === 'function' ? next(view) : next
    try { localStorage.setItem(VIEW_KEY, value) } catch {}
    setView(value)
  }

  return (
    <AppViewContext.Provider value={{ view, setView: setViewAndPersist }}>
      {children}
    </AppViewContext.Provider>
  );
}