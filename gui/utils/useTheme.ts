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

  // Apply theme to document with View Transition API
  const applyTheme = useCallback((newEffectiveTheme: 'light' | 'dark', toggleElement?: HTMLElement) => {
    const applyThemeChange = () => {
      document.documentElement.setAttribute('data-theme', newEffectiveTheme);
    };

    // Use View Transition API if supported
    if ('startViewTransition' in document && toggleElement) {
      // Calculate position from toggle element
      const rect = toggleElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // @ts-ignore - View Transition API is newer
      const transition = document.startViewTransition(() => {
        applyThemeChange();
      });

      transition.ready.then(() => {
        document.documentElement.style.setProperty('--x', `${x}px`);
        document.documentElement.style.setProperty('--y', `${y}px`);
      }).catch((error: any) => {
        console.warn('View Transition setup error:', error);
      });
    } else {
      // Fallback for browsers without View Transition API
      applyThemeChange();
    }
  }, []);

  // Set theme with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('pde-theme', newTheme);
    updateEffectiveTheme(newTheme);
  }, [updateEffectiveTheme]);

  // Toggle between light and dark with enhanced animations
  const toggleTheme = useCallback((event?: { target: { closest: (selector: string) => HTMLElement | null } }) => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('pde-theme', newTheme);
    setEffectiveTheme(newTheme);
    
    // Get toggle element for position-aware transition
    const toggleElement = event?.target.closest('.toggle') as HTMLElement;
    applyTheme(newTheme, toggleElement);
  }, [effectiveTheme, applyTheme]);

  // Initialize theme from localStorage or system
  useEffect(() => {
    const stored = localStorage.getItem('pde-theme') as Theme | null;
    const initialTheme = stored || 'system';
    setThemeState(initialTheme);
    updateEffectiveTheme(initialTheme);
  }, [updateEffectiveTheme]);

  // Apply theme changes to DOM (only for non-toggle changes)
  useEffect(() => {
    if (effectiveTheme) {
      applyTheme(effectiveTheme);
    }
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