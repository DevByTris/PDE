/**
 * Project Card Component
 * Individual project card with status indicators and actions
 */

import React, { useState } from 'react';

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

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, viewMode, onDelete }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString('en-GB');
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'react': '⚛️',
      'vue': '💚',
      'svelte': '🧡',
      'angular': '🔴',
      'next': '▲',
      'nuxt': '💚',
      'deno': '🦕',
      'node': '💚',
      'static': '📄',
      'wordpress': '📘'
    };
    return icons[type] || '📁';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'proposed': 'info',
      'active': 'success',
      'development': 'info',
      'production': 'success',
      'inactive': 'secondary',
      'archived': 'warning'
    };
    return colors[status] || 'secondary';
  };

  const handleCardClick = () => {
    if (project.isRunning && project.url) {
      window.open(project.url, '_blank');
    }
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Starting project: ${project.name}`);
    // TODO: Implement project start functionality
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Stopping project: ${project.name}`);
    // TODO: Implement project stop functionality
  };

  const handleOpenFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Opening folder: ${project.path}`);
    // TODO: Implement folder opening functionality
  };

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Opening in editor: ${project.path}`);
    // TODO: Implement editor opening functionality
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmed = confirm(
      `WARNING: This will permanently delete the project "${project.displayName || project.name}"!\n\n` +
      `This action will:\n` +
      `• Delete all project files from: ${project.path}\n` +
      `• Remove the project from PDE interface\n` +
      `• This CANNOT be undone\n\n` +
      `Are you absolutely sure you want to proceed?`
    );
    
    if (confirmed && onDelete) {
      onDelete(project.id);
    }
  };

  return (
    <article 
      className={`project-card ${viewMode} ${project.isRunning ? 'running' : ''} ${project.category}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${project.displayName || project.name} project card`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="project-icon">
          <span className="type-icon">{getTypeIcon(project.type)}</span>
          {project.isRunning && (
            <span className="running-indicator" title="Project is running">
              <span className="pulse-dot"></span>
            </span>
          )}
        </div>
        
        <div className="project-info">
          <h3 className="project-title">
            {project.displayName || project.name}
          </h3>
          <div className="project-meta">
            <span className={`project-type project-type-${project.type}`}>
              {project.type}
            </span>
            <span className="project-category">
              {project.category === 'personal' ? '👤' : '💼'} {project.category}
            </span>
          </div>
        </div>
        
        <div className="card-actions">
          <button
            className="action-menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-label="Project actions menu"
            aria-expanded={isMenuOpen}
          >
            ⋮
          </button>
          
          {isMenuOpen && (
            <div className="action-menu" role="menu">
              {project.isRunning ? (
                <button 
                  className="menu-item stop"
                  onClick={handleStop}
                  role="menuitem"
                >
                  <span className="menu-icon">⏹️</span>
                  Stop
                </button>
              ) : (
                <button 
                  className="menu-item start"
                  onClick={handleStart}
                  role="menuitem"
                >
                  <span className="menu-icon">▶️</span>
                  Start
                </button>
              )}
              
              <button 
                className="menu-item"
                onClick={handleOpenFolder}
                role="menuitem"
              >
                <span className="menu-icon">📁</span>
                Open Folder
              </button>
              
              <button 
                className="menu-item"
                onClick={handleOpenEditor}
                role="menuitem"
              >
                <span className="menu-icon">✏️</span>
                Open in Editor
              </button>
              
              {project.isRunning && project.url && (
                <button 
                  className="menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(project.url, '_blank');
                  }}
                  role="menuitem"
                >
                  <span className="menu-icon">🔗</span>
                  Open in Browser
                </button>
              )}
              
              <hr className="menu-separator" />
              
              <button 
                className="menu-item danger"
                onClick={handleDelete}
                role="menuitem"
              >
                <span className="menu-icon">🗑️</span>
                Delete Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        <div className="project-status">
          <span className={`status-indicator status-${getStatusColor(project.status)}`}>
            <span className="status-dot"></span>
            <span className="status-text">{project.status}</span>
          </span>
          
          {project.isRunning && project.port && (
            <span className="port-info">
              <span className="port-icon">🔌</span>
              <span className="port-number">:{project.port}</span>
            </span>
          )}
        </div>
        
        <div className="project-path">
          <span className="path-icon">📍</span>
          <span className="path-text" title={project.path}>
            {project.domain && project.subdomain 
              ? `${project.domain}/${project.subdomain}`
              : project.domain || project.name
            }
          </span>
        </div>
        
        <div className="project-modified">
          <span className="modified-icon">🕒</span>
          <span className="modified-text">
            {formatDate(project.lastModified)}
          </span>
        </div>
      </div>

      {/* Card Footer (Grid view only) */}
      {viewMode === 'grid' && (
        <div className="card-footer">
          <div className="quick-actions">
            {project.isRunning ? (
              <>
                <button 
                  className="quick-action stop"
                  onClick={handleStop}
                  title="Stop project"
                  aria-label="Stop project"
                >
                  ⏹️
                </button>
                {project.url && (
                  <button 
                    className="quick-action open"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(project.url, '_blank');
                    }}
                    title="Open in browser"
                    aria-label="Open in browser"
                  >
                    🔗
                  </button>
                )}
              </>
            ) : (
              <button 
                className="quick-action start"
                onClick={handleStart}
                title="Start project"
                aria-label="Start project"
              >
                ▶️
              </button>
            )}
            
            <button 
              className="quick-action folder"
              onClick={handleOpenFolder}
              title="Open folder"
              aria-label="Open project folder"
            >
              📁
            </button>
          </div>
        </div>
      )}

      {/* Click overlay for accessibility */}
      {isMenuOpen && (
        <div 
          className="menu-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </article>
  );
}