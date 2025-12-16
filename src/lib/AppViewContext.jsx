import React, { createContext, useEffect, useState } from 'react';

export const AppViewContext = createContext({ 
  view: 'dashboard', 
  setView: () => {},
  editMode: false,
  setEditMode: () => {}
});

const EDIT_MODE_KEY = 'cattalytics:ui:editMode'

export function AppViewProvider({ children }) {
  const [view, setView] = useState('dashboard');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EDIT_MODE_KEY)
      if (stored !== null) setEditMode(stored === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(EDIT_MODE_KEY, String(editMode)) } catch {}
  }, [editMode])

  return (
    <AppViewContext.Provider value={{ view, setView, editMode, setEditMode }}>
      {children}
    </AppViewContext.Provider>
  );
}
