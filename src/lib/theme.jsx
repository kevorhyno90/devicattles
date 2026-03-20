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
      primary: '#f8faf7',
      secondary: '#f1f5f2',
      tertiary: '#e9efe9',
      elevated: '#ffffff'
    },
    // Text colors
    text: {
      primary: '#15231b',
      secondary: '#3e5648',
      tertiary: '#5f7568',
      inverse: '#ffffff'
    },
    // Border colors
    border: {
      primary: '#c9d8cd',
      secondary: '#a8beb0',
      focus: '#0e7a4f'
    },
    // Action colors
    action: {
      primary: '#0e7a4f',
      primaryHover: '#0b5f3d',
      success: '#198754',
      successHover: '#146c43',
      danger: '#ef4444',
      dangerHover: '#dc2626',
      warning: '#a46d17',
      warningHover: '#875812',
      purple: '#2f6f66',
      purpleHover: '#285d56'
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
      primary: '#0e7a4f',
      secondary: '#1f6a8a',
      tertiary: '#a46d17',
      quaternary: '#ef4444',
      quinary: '#2f6f66',
      senary: '#7f3f00'
    }
  },
  dark: {
    // Background colors
    bg: {
      primary: '#0f1412',
      secondary: '#18201c',
      tertiary: '#223029',
      elevated: '#1b241f'
    },
    // Text colors
    text: {
      primary: '#e8f0eb',
      secondary: '#c7d6ce',
      tertiary: '#9db2a6',
      inverse: '#0f1412'
    },
    // Border colors
    border: {
      primary: '#2e3d35',
      secondary: '#40564a',
      focus: '#52c488'
    },
    // Action colors
    action: {
      primary: '#3cb179',
      primaryHover: '#2f8d61',
      success: '#52c488',
      successHover: '#3ea26f',
      danger: '#f87171',
      dangerHover: '#ef4444',
      warning: '#d5a54a',
      warningHover: '#b98932',
      purple: '#4c9f93',
      purpleHover: '#3f8379'
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
      primary: '#52c488',
      secondary: '#64b8d6',
      tertiary: '#d5a54a',
      quaternary: '#f87171',
      quinary: '#4c9f93',
      senary: '#f3b65d'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load saved theme from localStorage, default to 'light'
    const saved = localStorage.getItem('farm-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') setTheme(mode);
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

// Removed default export. Use only named exports: import { ThemeProvider } from './theme';
