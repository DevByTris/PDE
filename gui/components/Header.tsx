/**
 * PDE Header Component
 * Plesk-style navigation header with theme toggle and controls
 */

import React from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
  onRefresh: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark' | 'system';
  loading: boolean;
  isApiConnected?: boolean;
}

export function Header({ onMenuToggle, onRefresh, onThemeToggle, theme, loading, isApiConnected = true }: HeaderProps) {
  return (
    <header className="pde-header" role="banner">
      <div className="header-left">
        <button 
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
          title="Toggle sidebar (Ctrl+B)"
        >
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>
        
        <div className="pde-logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">PDE</span>
          <span className="logo-subtitle">Personal Development Environment</span>
        </div>
      </div>
      
      <div className="header-center">
        <div className="search-container">
          <input 
            type="search"
            placeholder="Search projects..."
            className="header-search"
            aria-label="Search projects"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>
      
      <div className="header-right">
        <div className="header-actions">
          <button 
            className={`action-button ${!isApiConnected ? 'error' : ''}`}
            onClick={onRefresh}
            disabled={loading}
            aria-label={isApiConnected ? "Scan projects" : "API disconnected - retry connection"}
            title={isApiConnected ? "Scan projects (Ctrl+R)" : "API disconnected - click to retry"}
          >
            <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>
              {isApiConnected ? '🔄' : '⚠️'}
            </span>
            {!isApiConnected && <span className="sr-only">API Disconnected</span>}
          </button>
          
          <button 
            className="action-button"
            aria-label="Add new project"
            title="Add new project"
          >
            <span className="add-icon">➕</span>
          </button>
          
          <div className="theme-toggle-container">
            <label className="toggle" htmlFor="theme-toggle">
              <input 
                id="theme-toggle"
                type="checkbox"
                checked={theme === 'dark'}
                onChange={onThemeToggle}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              />
              <div></div>
            </label>
          </div>
          
          <div className="user-menu">
            <button 
              className="user-avatar"
              aria-label="User menu"
              title="User settings"
            >
              <span className="avatar-icon">👤</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}