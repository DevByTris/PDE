/**
 * Project Grid Component
 * Displays projects in grid or list view with cards
 */

import React from 'react';
import { ProjectCard } from './ProjectCard.tsx';

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

interface ProjectGridProps {
  projects: Project[];
  viewMode: 'grid' | 'list';
  onDeleteProject?: (projectId: string) => void;
}

export function ProjectGrid({ projects, viewMode, onDeleteProject }: ProjectGridProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div 
      className={`project-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}
      role="region"
      aria-label={`Projects in ${viewMode} view`}
    >
      {projects.map(project => (
        <ProjectCard 
          key={project.id}
          project={project}
          viewMode={viewMode}
          onDelete={onDeleteProject}
        />
      ))}
    </div>
  );
}