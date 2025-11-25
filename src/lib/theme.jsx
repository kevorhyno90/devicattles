/**
 * Dark Mode Theme Manager
 * 
 * Provides a complete dark mode theme system for the farm management app
 * - Theme toggle with persistence in localStorage
 * - CSS custom properties for easy theming
 * - Automatic system preference detection
 * - Smooth transitions between themes
 * - Individual component theming support
 * 
 * Usage:
 * import { useTheme, ThemeProvider } from './theme'
 * 
 * const { theme, toggleTheme } = useTheme()
 * <button onClick={toggleTheme}>Toggle Dark Mode</button>
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const themes = {
  light: {
    // Background colors
    bg: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      elevated: '#ffffff'
    },
    // Text colors
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff'
    },
    // Border colors
    border: {
      primary: '#e5e7eb',
      secondary: '#d1d5db',
      focus: '#3b82f6'
    },
    // Action colors
    action: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      success: '#10b981',
      successHover: '#059669',
      danger: '#ef4444',
      dangerHover: '#dc2626',
      warning: '#f59e0b',
      warningHover: '#d97706',
      purple: '#8b5cf6',
      purpleHover: '#7c3aed'
    },
    // Shadows
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    // Chart colors
    chart: {
      primary: '#3b82f6',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      quaternary: '#ef4444',
      quinary: '#8b5cf6',
      senary: '#06b6d4'
    }
  },
  dark: {
    // Background colors
    bg: {
      primary: '#111827',
      secondary: '#1f2937',
      tertiary: '#374151',
      elevated: '#1f2937'
    },
    // Text colors
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      inverse: '#1f2937'
    },
    // Border colors
    border: {
      primary: '#374151',
      secondary: '#4b5563',
      focus: '#60a5fa'
    },
    // Action colors
    action: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      success: '#34d399',
      successHover: '#10b981',
      danger: '#f87171',
      dangerHover: '#ef4444',
      warning: '#fbbf24',
      warningHover: '#f59e0b',
      purple: '#a78bfa',
      purpleHover: '#8b5cf6'
    },
    // Shadows
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)'
    },
    // Chart colors (brighter for dark mode)
    chart: {
      primary: '#60a5fa',
      secondary: '#34d399',
      tertiary: '#fbbf24',
      quaternary: '#f87171',
      quinary: '#a78bfa',
      senary: '#22d3ee'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem('farm-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('farm-theme', theme);
    
    // Apply to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply CSS custom properties
    const colors = themes[theme];
    const root = document.documentElement;
    
    // Background colors
    root.style.setProperty('--bg-primary', colors.bg.primary);
    root.style.setProperty('--bg-secondary', colors.bg.secondary);
    root.style.setProperty('--bg-tertiary', colors.bg.tertiary);
    root.style.setProperty('--bg-elevated', colors.bg.elevated);
    
    // Text colors
    root.style.setProperty('--text-primary', colors.text.primary);
    root.style.setProperty('--text-secondary', colors.text.secondary);
    root.style.setProperty('--text-tertiary', colors.text.tertiary);
    root.style.setProperty('--text-inverse', colors.text.inverse);
    
    // Border colors
    root.style.setProperty('--border-primary', colors.border.primary);
    root.style.setProperty('--border-secondary', colors.border.secondary);
    root.style.setProperty('--border-focus', colors.border.focus);
    
    // Action colors
    root.style.setProperty('--action-primary', colors.action.primary);
    root.style.setProperty('--action-primary-hover', colors.action.primaryHover);
    root.style.setProperty('--action-success', colors.action.success);
    root.style.setProperty('--action-success-hover', colors.action.successHover);
    root.style.setProperty('--action-danger', colors.action.danger);
    root.style.setProperty('--action-danger-hover', colors.action.dangerHover);
    root.style.setProperty('--action-warning', colors.action.warning);
    root.style.setProperty('--action-warning-hover', colors.action.warningHover);
    root.style.setProperty('--action-purple', colors.action.purple);
    root.style.setProperty('--action-purple-hover', colors.action.purpleHover);
    
    // Shadows
    root.style.setProperty('--shadow-sm', colors.shadow.sm);
    root.style.setProperty('--shadow-md', colors.shadow.md);
    root.style.setProperty('--shadow-lg', colors.shadow.lg);
    root.style.setProperty('--shadow-xl', colors.shadow.xl);
    
    // Chart colors
    root.style.setProperty('--chart-primary', colors.chart.primary);
    root.style.setProperty('--chart-secondary', colors.chart.secondary);
    root.style.setProperty('--chart-tertiary', colors.chart.tertiary);
    root.style.setProperty('--chart-quaternary', colors.chart.quaternary);
    root.style.setProperty('--chart-quinary', colors.chart.quinary);
    root.style.setProperty('--chart-senary', colors.chart.senary);
    
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem('farm-theme-manual')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('farm-theme-manual', 'true'); // Mark as manually set
  };

  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
      localStorage.setItem('farm-theme-manual', 'true');
    }
  };

  const getThemeColors = () => themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, getThemeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility function to get themed styles
export const getThemedStyle = (lightStyle, darkStyle, theme) => {
  return theme === 'dark' ? { ...lightStyle, ...darkStyle } : lightStyle;
};

// Pre-built themed button styles
export const themedButton = (theme, variant = 'primary') => {
  const colors = themes[theme];
  
  const variants = {
    primary: {
      background: colors.action.primary,
      color: colors.text.inverse,
      border: 'none',
      '&:hover': {
        background: colors.action.primaryHover
      }
    },
    success: {
      background: colors.action.success,
      color: colors.text.inverse,
      border: 'none',
      '&:hover': {
        background: colors.action.successHover
      }
    },
    danger: {
      background: colors.action.danger,
      color: colors.text.inverse,
      border: 'none',
      '&:hover': {
        background: colors.action.dangerHover
      }
    },
    secondary: {
      background: colors.bg.tertiary,
      color: colors.text.primary,
      border: `1px solid ${colors.border.primary}`,
      '&:hover': {
        background: colors.border.secondary
      }
    },
    ghost: {
      background: 'transparent',
      color: colors.text.primary,
      border: `1px solid ${colors.border.primary}`,
      '&:hover': {
        background: colors.bg.secondary
      }
    }
  };
  
  return {
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    ...variants[variant]
  };
};

// Theme toggle button component
export const ThemeToggleButton = ({ style }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '8px 16px',
        background: theme === 'dark' ? '#374151' : '#f3f4f6',
        color: theme === 'dark' ? '#f9fafb' : '#1f2937',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        ...style
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
};

// Removed default export. Use only named exports: import { ThemeProvider } from './theme';
