/**
 * PDE Dashboard Component
 * Main Plesk-style dashboard with project overview and management
 */

import React, { useState, useEffect } from 'react';
import { ProjectGrid } from './ProjectGrid.tsx';
import { useStats } from '../utils/useStats.ts';

interface Project {
  id: string;
  name: string;
  displayName?: string;
  type: string;
  category: 'personal' | 'professional';
  status: string;
  path: string;
  domain?: string;
  subdomain?: string;
  lastModified: Date;
  isRunning?: boolean;
  port?: number;
  url?: string;
}

interface DashboardProps {
  projects: Project[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteProject?: (projectId: string) => void;
  lastScanTime?: Date | null;
  isApiConnected?: boolean;
}

export function Dashboard({ projects, loading, onRefresh, onDeleteProject, lastScanTime, isApiConnected = true }: DashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'status' | 'type'>('modified');
  const [filterCategory, setFilterCategory] = useState<'all' | 'personal' | 'professional'>('all');
  
  // Use real statistics from API
  const { stats: apiStats, loading: statsLoading, refreshStats } = useStats();
  
  // Calculate fallback statistics from projects array
  const fallbackStats = {
    total: projects.length,
    running: projects.filter(p => p.isRunning).length,
    personal: projects.filter(p => p.category === 'personal').length,
    professional: projects.filter(p => p.category === 'professional').length,
    development: projects.filter(p => p.status === 'development').length,
    production: projects.filter(p => p.status === 'production').length,
    inactive: projects.filter(p => p.status === 'inactive').length,
    archived: projects.filter(p => p.status === 'archived').length
  };
  
  // Use API stats if available, otherwise fallback to calculated stats
  const stats = isApiConnected && apiStats.total > 0 ? apiStats : fallbackStats;
  
  // Refresh stats when projects change
  useEffect(() => {
    if (isApiConnected) {
      refreshStats();
    }
  }, [projects.length, isApiConnected, refreshStats]);

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      if (filterCategory === 'all') return true;
      return project.category === filterCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modified':
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            Project Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Manage and monitor your development projects
            {lastScanTime && (
              <span className="last-scan-info">
                 • Last scan: {lastScanTime.toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
            {!isApiConnected && (
              <span className="api-status error">
                 • API Disconnected
              </span>
            )}
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className={`action-button primary ${!isApiConnected ? 'disabled' : ''}`}
            onClick={onRefresh}
            disabled={loading || !isApiConnected}
            aria-label={isApiConnected ? "Scan projects" : "API disconnected"}
          >
            <span className={`action-icon ${loading ? 'spinning' : ''}`}>
              {!isApiConnected ? '⚠️' : '🔄'}
            </span>
            {isApiConnected ? 'Scan Projects' : 'API Disconnected'}
          </button>
          
          <button 
            className="action-button"
            aria-label="Create new project"
          >
            <span className="action-icon">➕</span>
            New Project
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>
          
          <div className="stat-card running">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <div className="stat-value">{stats.running}</div>
              <div className="stat-label">Running</div>
            </div>
          </div>
          
          <div className="stat-card personal">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <div className="stat-value">{stats.personal}</div>
              <div className="stat-label">Personal</div>
            </div>
          </div>
          
          <div className="stat-card professional">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <div className="stat-value">{stats.professional}</div>
              <div className="stat-label">Professional</div>
            </div>
          </div>
          
          <div className="stat-card development">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <div className="stat-value">{stats.development}</div>
              <div className="stat-label">Development</div>
            </div>
          </div>
          
          <div className="stat-card production">
            <div className="stat-icon">🚀</div>
            <div className="stat-content">
              <div className="stat-value">{stats.production}</div>
              <div className="stat-label">Production</div>
            </div>
          </div>
          
          <div className="stat-card inactive">
            <div className="stat-icon">⏸️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.inactive}</div>
              <div className="stat-label">Inactive</div>
            </div>
          </div>
          
          <div className="stat-card archived">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{stats.archived}</div>
              <div className="stat-label">Archived</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Controls */}
      <div className="project-controls">
        <div className="controls-left">
          <div className="filter-group">
            <label htmlFor="category-filter" className="filter-label">Category:</label>
            <select 
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Projects</option>
              <option value="personal">Personal</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="sort-select" className="filter-label">Sort by:</label>
            <select 
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="filter-select"
            >
              <option value="modified">Last Modified</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>
        
        <div className="controls-right">
          <div className="view-toggle">
            <button 
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <span className="view-icon">⚏</span>
            </button>
            <button 
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
            >
              <span className="view-icon">☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      <div className="dashboard-content">
        {loading && projects.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No projects found</h3>
            <p>
              {filterCategory === 'all' 
                ? "No projects have been detected yet. Create your first project to get started!"
                : `No ${filterCategory} projects found. Try a different filter or create a new project.`
              }
            </p>
            <button className="empty-action">
              <span className="action-icon">➕</span>
              Create New Project
            </button>
          </div>
        ) : (
          <ProjectGrid 
            projects={filteredProjects}
            viewMode={viewMode}
            onDeleteProject={onDeleteProject}
          />
        )}
      </div>
    </div>
  );
}