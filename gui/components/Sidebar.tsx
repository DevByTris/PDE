/**
 * PDE Sidebar Component
 * Plesk-style navigation sidebar with project categories
 */

import React from 'react';

interface Project {
  id: string;
  name: string;
  type: string;
  category: 'personal' | 'professional';
  status: string;
  isRunning?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'dashboard' | 'projects' | 'settings';
  onViewChange: (view: 'dashboard' | 'projects' | 'settings') => void;
  projects: Project[];
}

export function Sidebar({ isOpen, onClose, currentView, onViewChange, projects }: SidebarProps) {
  const personalProjects = projects.filter(p => p.category === 'personal');
  const professionalProjects = projects.filter(p => p.category === 'professional');
  const runningProjects = projects.filter(p => p.isRunning);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`pde-sidebar ${isOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <h2 className="sidebar-title">Navigation</h2>
          <button 
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar (Ctrl+B)"
          >
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {/* Main Navigation */}
          <ul className="nav-section" role="list">
            <li>
              <button 
                className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onViewChange('dashboard')}
                aria-current={currentView === 'dashboard' ? 'page' : undefined}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentView === 'projects' ? 'active' : ''}`}
                onClick={() => onViewChange('projects')}
                aria-current={currentView === 'projects' ? 'page' : undefined}
              >
                <span className="nav-icon">📁</span>
                <span className="nav-text">All Projects</span>
                <span className="nav-badge">{projects.length}</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
                onClick={() => onViewChange('settings')}
                aria-current={currentView === 'settings' ? 'page' : undefined}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Settings</span>
              </button>
            </li>
          </ul>
          
          {/* Quick Stats */}
          <div className="sidebar-section">
            <h3 className="section-title">Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Running</span>
                <span className="stat-value">{runningProjects.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Personal</span>
                <span className="stat-value">{personalProjects.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Professional</span>
                <span className="stat-value">{professionalProjects.length}</span>
              </div>
            </div>
          </div>
          
          {/* Running Projects */}
          {runningProjects.length > 0 && (
            <div className="sidebar-section">
              <h3 className="section-title">
                <span className="running-indicator">🟢</span>
                Running Projects
              </h3>
              <ul className="project-list" role="list">
                {runningProjects.map(project => (
                  <li key={project.id} className="project-item">
                    <div className="project-info">
                      <span className="project-name">{project.name}</span>
                      <span className="project-type">{project.type}</span>
                    </div>
                    <button 
                      className="project-action"
                      aria-label={`Open ${project.name}`}
                      title={`Open ${project.name} in browser`}
                    >
                      🔗
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recent Projects */}
          <div className="sidebar-section">
            <h3 className="section-title">Recent Projects</h3>
            <ul className="project-list" role="list">
              {projects.slice(0, 5).map(project => (
                <li key={project.id} className="project-item">
                  <div className="project-info">
                    <span className="project-name">{project.name}</span>
                    <span className="project-type">{project.type}</span>
                  </div>
                  <div className="project-status">
                    <span className={`status-indicator status-${project.status}`}></span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Categories */}
          <div className="sidebar-section">
            <h3 className="section-title">Categories</h3>
            <ul className="category-list" role="list">
              <li>
                <button className="category-item">
                  <span className="category-icon">👤</span>
                  <span className="category-text">Personal</span>
                  <span className="category-count">{personalProjects.length}</span>
                </button>
              </li>
              <li>
                <button className="category-item">
                  <span className="category-icon">💼</span>
                  <span className="category-text">Professional</span>
                  <span className="category-count">{professionalProjects.length}</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="pde-version">
            <span className="version-label">PDE</span>
            <span className="version-number">v2.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}