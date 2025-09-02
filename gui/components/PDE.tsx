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

  // Direct delete function without additional confirmation (handled by components)
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (deleteProject) {
      try {
        await deleteProject(projectId);
        console.log(`Successfully deleted project and files: ${projectName}`);
      } catch (error) {
        console.error('Failed to delete project:', error);
        // Error is already handled in useProjects, just log it
      }
    }
  };

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
              onDeleteProject={(projectId) => {
                const project = projects.find(p => p.id === projectId);
                const projectName = project ? (project.displayName || project.name) : 'Unknown Project';
                handleDeleteProject(projectId, projectName);
              }}
              onCreateProject={createProject}
              lastScanTime={lastScanTime}
              isApiConnected={isApiConnected}
            />
          )}
          
          {currentView === 'projects' && (
            <div className="control-panel-view">
              <div className="control-panel-header">
                <div className="breadcrumb">
                  <span className="breadcrumb-item">PDE</span>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item active">Projects</span>
                </div>
                <div className="view-actions">
                  <button className="action-button">
                    <span>📊</span>
                    Statistics
                  </button>
                  <button className="action-button">
                    <span>📤</span>
                    Export
                  </button>
                  <button className="action-button primary">
                    <span>➕</span>
                    New Project
                  </button>
                </div>
              </div>
              <div className="control-panel-content">
                <div className="toolbar">
                  <div className="toolbar-section">
                    <div className="filter-group">
                      <select className="filter-select">
                        <option value="all">All Categories</option>
                        <option value="personal">Personal</option>
                        <option value="professional">Professional</option>
                      </select>
                      <select className="filter-select">
                        <option value="all">All Types</option>
                        <option value="react">React</option>
                        <option value="vue">Vue</option>
                        <option value="deno">Deno</option>
                        <option value="static">Static</option>
                      </select>
                      <select className="filter-select">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="development">Development</option>
                        <option value="production">Production</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="search-group">
                      <input 
                        type="search" 
                        placeholder="Search projects..." 
                        className="search-input"
                      />
                      <button className="search-button">🔍</button>
                    </div>
                  </div>
                  <div className="toolbar-section">
                    <div className="view-toggle">
                      <button className="view-button active" title="Grid View">
                        <span>⊞</span>
                      </button>
                      <button className="view-button" title="List View">
                        <span>☰</span>
                      </button>
                      <button className="view-button" title="Table View">
                        <span>▦</span>
                      </button>
                    </div>
                    <div className="results-info">
                      <span className="results-count">{projects.length} projects</span>
                    </div>
                  </div>
                </div>
                <div className="projects-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="sortable">
                          <button className="sort-header">
                            Name
                            <span className="sort-icon">↕</span>
                          </button>
                        </th>
                        <th className="sortable">
                          <button className="sort-header">
                            Type
                            <span className="sort-icon">↕</span>
                          </button>
                        </th>
                        <th className="sortable">
                          <button className="sort-header">
                            Category
                            <span className="sort-icon">↕</span>
                          </button>
                        </th>
                        <th className="sortable">
                          <button className="sort-header">
                            Status
                            <span className="sort-icon">↕</span>
                          </button>
                        </th>
                        <th className="sortable">
                          <button className="sort-header">
                            Last Modified
                            <span className="sort-icon">↕</span>
                          </button>
                        </th>
                        <th className="actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => (
                        <tr key={project.id} className={`table-row ${project.isRunning ? 'running' : ''}`}>
                          <td className="name-cell">
                            <div className="project-name-container">
                              {project.isRunning && <span className="running-indicator">🟢</span>}
                              <span className="project-name">{project.displayName || project.name}</span>
                              {project.subdomain && (
                                <span className="project-domain">.{project.subdomain}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="type-badge type-{project.type?.toLowerCase()}">
                              {project.type}
                            </span>
                          </td>
                          <td>
                            <span className={`category-badge category-${project.category}`}>
                              {project.category === 'personal' ? '👤' : '💼'}
                              {project.category}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${project.status}`}>
                              <span className={`status-dot status-${project.status}`}></span>
                              {project.status}
                            </span>
                          </td>
                          <td className="date-cell">
                            {new Date(project.lastModified).toLocaleDateString()}
                          </td>
                          <td className="actions-cell">
                            <div className="action-group">
                              {project.isRunning && (
                                <button className="action-icon" title="Open in browser">
                                  🔗
                                </button>
                              )}
                              <button className="action-icon" title="Edit project">
                                ✏️
                              </button>
                              <button className="action-icon" title="Project settings">
                                ⚙️
                              </button>
                              <button 
                                className="action-icon danger" 
                                title="Delete project"
                                onClick={() => {
                                  const confirmed = confirm(
                                    `WARNING: This will permanently delete the project "${project.displayName || project.name}"!\n\n` +
                                    `This action will:\n` +
                                    `• Delete all project files from: ${project.path}\n` +
                                    `• Remove the project from PDE interface\n` +
                                    `• This CANNOT be undone\n\n` +
                                    `Are you absolutely sure you want to proceed?`
                                  );
                                  
                                  if (confirmed) {
                                    handleDeleteProject(project.id, project.displayName || project.name);
                                  }
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {projects.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">📁</div>
                      <h3>No projects found</h3>
                      <p>Get started by creating your first project</p>
                      <button className="action-button primary">
                        <span>➕</span>
                        Create Project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {currentView === 'settings' && (
            <div className="control-panel-view">
              <div className="control-panel-header">
                <div className="breadcrumb">
                  <span className="breadcrumb-item">PDE</span>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item active">Settings</span>
                </div>
                <div className="view-actions">
                  <button className="action-button">
                    <span>⚙️</span>
                    Advanced
                  </button>
                  <button className="action-button">
                    <span>📤</span>
                    Export Config
                  </button>
                  <button className="action-button primary">
                    <span>💾</span>
                    Save Changes
                  </button>
                </div>
              </div>
              <div className="control-panel-content">
                <div className="settings-grid">
                  <div className="settings-section">
                    <div className="section-header">
                      <h3 className="section-title">
                        <span className="section-icon">🎨</span>
                        Appearance
                      </h3>
                      <p className="section-description">Customize the look and feel of your PDE</p>
                    </div>
                    <div className="settings-form">
                      <div className="form-group">
                        <label className="form-label">Theme</label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input type="radio" name="theme" value="light" />
                            <span className="radio-custom"></span>
                            <span className="radio-label">☀️ Light</span>
                          </label>
                          <label className="radio-option">
                            <input type="radio" name="theme" value="dark" />
                            <span className="radio-custom"></span>
                            <span className="radio-label">🌙 Dark</span>
                          </label>
                          <label className="radio-option">
                            <input type="radio" name="theme" value="system" defaultChecked />
                            <span className="radio-custom"></span>
                            <span className="radio-label">📱 System</span>
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Accent Color</label>
                        <div className="color-palette">
                          <button className="color-option active" style={{backgroundColor: '#0066cc'}} title="Blue"></button>
                          <button className="color-option" style={{backgroundColor: '#00aa44'}} title="Green"></button>
                          <button className="color-option" style={{backgroundColor: '#dd4400'}} title="Orange"></button>
                          <button className="color-option" style={{backgroundColor: '#8844aa'}} title="Purple"></button>
                          <button className="color-option" style={{backgroundColor: '#cc0066'}} title="Pink"></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-section">
                    <div className="section-header">
                      <h3 className="section-title">
                        <span className="section-icon">🔍</span>
                        Project Scanning
                      </h3>
                      <p className="section-description">Configure how PDE discovers and monitors projects</p>
                    </div>
                    <div className="settings-form">
                      <div className="form-group">
                        <label className="form-label">Scan Directories</label>
                        <div className="path-list">
                          <div className="path-item">
                            <span className="path-text">C:\\projects\\personal</span>
                            <button className="path-remove" title="Remove directory">✕</button>
                          </div>
                          <div className="path-item">
                            <span className="path-text">C:\\projects\\professional</span>
                            <button className="path-remove" title="Remove directory">✕</button>
                          </div>
                          <button className="add-path-button">
                            <span>➕</span>
                            Add Directory
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <div className="checkbox-group">
                          <label className="checkbox-option">
                            <input type="checkbox" defaultChecked />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">Auto-scan for new projects</span>
                          </label>
                          <label className="checkbox-option">
                            <input type="checkbox" defaultChecked />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">Watch for file changes</span>
                          </label>
                          <label className="checkbox-option">
                            <input type="checkbox" />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">Include hidden directories</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-section">
                    <div className="section-header">
                      <h3 className="section-title">
                        <span className="section-icon">⚡</span>
                        Performance
                      </h3>
                      <p className="section-description">Optimize PDE performance and resource usage</p>
                    </div>
                    <div className="settings-form">
                      <div className="form-group">
                        <label className="form-label">Refresh Interval</label>
                        <select className="form-select">
                          <option value="10">Every 10 seconds</option>
                          <option value="30" selected>Every 30 seconds</option>
                          <option value="60">Every minute</option>
                          <option value="300">Every 5 minutes</option>
                          <option value="0">Manual only</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Concurrent Scans</label>
                        <div className="slider-group">
                          <input type="range" min="1" max="10" defaultValue="3" className="form-slider" />
                          <span className="slider-value">3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-section">
                    <div className="section-header">
                      <h3 className="section-title">
                        <span className="section-icon">🔒</span>
                        Security
                      </h3>
                      <p className="section-description">Configure security and access controls</p>
                    </div>
                    <div className="settings-form">
                      <div className="form-group">
                        <div className="checkbox-group">
                          <label className="checkbox-option">
                            <input type="checkbox" defaultChecked />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">Require authentication</span>
                          </label>
                          <label className="checkbox-option">
                            <input type="checkbox" />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">Enable HTTPS</span>
                          </label>
                          <label className="checkbox-option">
                            <input type="checkbox" defaultChecked />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">Audit logging</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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