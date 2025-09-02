/**
 * Custom hook for managing PDE theme (dark/light)
 * Integrates with system preferences and local storage
 */

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Determine effective theme based on system preference
  const updateEffectiveTheme = useCallback((currentTheme: Theme) => {
    if (currentTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setEffectiveTheme(systemDark ? 'dark' : 'light');
    } else {
      setEffectiveTheme(currentTheme);
    }
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((newEffectiveTheme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', newEffectiveTheme);
  }, []);

  // Set theme with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('pde-theme', newTheme);
    updateEffectiveTheme(newTheme);
  }, [updateEffectiveTheme]);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [effectiveTheme, setTheme]);

  // Initialize theme from localStorage or system
  useEffect(() => {
    const stored = localStorage.getItem('pde-theme') as Theme | null;
    const initialTheme = stored || 'system';
    setThemeState(initialTheme);
    updateEffectiveTheme(initialTheme);
  }, [updateEffectiveTheme]);

  // Apply theme changes to DOM
  useEffect(() => {
    applyTheme(effectiveTheme);
  }, [effectiveTheme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        updateEffectiveTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, updateEffectiveTheme]);

  return {
    theme,
    effectiveTheme,
    toggleTheme,
    setTheme
  };
}