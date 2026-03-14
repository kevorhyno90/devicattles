import React, { createContext, useEffect, useState } from 'react';

export const AppViewContext = createContext({ 
  view: 'landing', 
  setView: () => {},
  editMode: false,
  setEditMode: () => {}
});

const EDIT_MODE_KEY = 'cattalytics:ui:editMode'
const VIEW_KEY = 'cattalytics:ui:view'

export function AppViewProvider({ children }) {
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) || 'landing'
    } catch {
      return 'landing'
    }
  });
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

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view) } catch {}
  }, [view])

  return (
    <AppViewContext.Provider value={{ view, setView, editMode, setEditMode }}>
      {children}
    </AppViewContext.Provider>
  );
}
