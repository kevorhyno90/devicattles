import React, { createContext, useState } from 'react';

export const AppViewContext = createContext({ view: 'dashboard', setView: () => {} });

export function AppViewProvider({ children }) {
  const [view, setView] = useState('dashboard');
  return (
    <AppViewContext.Provider value={{ view, setView }}>
      {children}
    </AppViewContext.Provider>
  );
}