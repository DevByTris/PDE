/**
 * Main PDE Application Component
 * Plesk-style dashboard with project management
 */

import React, { useState, useEffect } from 'react';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';
import { Dashboard } from './Dashboard.tsx';
import { useProjects } from '../utils/useProjects.ts';
import { useTheme } from '../utils/useTheme.ts';

export function PDE() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'settings'>('dashboard');
  const { projects, loading, error, refreshProjects, scanProjects, deleteProject, createProject, lastScanTime, isApiConnected } = useProjects();
  const { theme, toggleTheme } = useTheme();

  // Auto-refresh projects every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshProjects, 30000);
    return () => clearInterval(interval);
  }, [refreshProjects]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      // Ctrl/Cmd + R to refresh projects
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshProjects();
      }
      
      // Ctrl/Cmd + T to toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [refreshProjects, toggleTheme]);

  return (
    <div className="pde-app">
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onRefresh={scanProjects}
        onThemeToggle={toggleTheme}
        theme={theme}
        loading={loading}
        isApiConnected={isApiConnected}
      />
      
      <div className="pde-layout">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onViewChange={setCurrentView}
          projects={projects}
        />
        
        <main 
          className={`pde-main ${sidebarOpen ? 'sidebar-open' : ''}`}
          id="main-content"
          role="main"
          aria-label="PDE Dashboard"
        >
          {error && (
            <div className="error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <span>Error loading projects: {error}</span>
              <button onClick={refreshProjects} className="error-retry">
                🔄 Retry
              </button>
            </div>
          )}
          
          {currentView === 'dashboard' && (
            <Dashboard 
              projects={projects}
              loading={loading}
              onRefresh={scanProjects}
              onDeleteProject={deleteProject}
              onCreateProject={createProject}
              lastScanTime={lastScanTime}
              isApiConnected={isApiConnected}
            />
          )}
          
          {currentView === 'projects' && (
            <div className="projects-view">
              <h1>All Projects</h1>
              {/* Project management view will be expanded here */}
            </div>
          )}
          
          {currentView === 'settings' && (
            <div className="settings-view">
              <h1>PDE Settings</h1>
              {/* Settings view will be expanded here */}
            </div>
          )}
        </main>
      </div>
      
      {/* Loading overlay for full-page operations */}
      {loading && (
        <div className="loading-overlay" aria-hidden="true">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading projects...</p>
          </div>
        </div>
      )}
    </div>
  );
}