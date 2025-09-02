/**
 * Custom hook for managing PDE projects data
 * Integrates with backend scanner and metadata systems via API
 */

import { useState, useEffect, useCallback } from 'react';
import { pdeApi, handleApiError, type PDEApiClient } from './apiClient.ts';

// Types from our core system
interface ProjectInfo {
  id: string;
  name: string;
  displayName?: string;
  type: string;
  category: 'personal' | 'professional';
  status: 'active' | 'inactive' | 'development' | 'production' | 'archived';
  path: string;
  domain?: string;
  subdomain?: string;
  lastModified: Date;
  isRunning?: boolean;
  port?: number;
  url?: string;
}

interface UseProjectsReturn {
  projects: ProjectInfo[];
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  scanProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  lastScanTime: Date | null;
  isApiConnected: boolean;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [isApiConnected, setIsApiConnected] = useState(false);

  /**
   * Check API connectivity
   */
  const checkApiConnection = useCallback(async () => {
    try {
      const connected = await pdeApi.ping();
      setIsApiConnected(connected);
      return connected;
    } catch {
      setIsApiConnected(false);
      return false;
    }
  }, []);

  /**
   * Load projects from the API
   */
  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('PDE Frontend: Loading projects from API...');
      
      // Check API connection first
      const connected = await checkApiConnection();
      if (!connected) {
        throw new Error('Cannot connect to PDE server. Please ensure the server is running.');
      }

      // Fetch projects from backend
      const fetchedProjects = await pdeApi.getProjects();
      
      console.log(`PDE Frontend: Loaded ${fetchedProjects.length} projects`);
      
      // Transform projects to ensure all required fields are present
      const transformedProjects: ProjectInfo[] = fetchedProjects.map(project => ({
        ...project,
        id: project.id || `${project.category}-${project.name}`,
        displayName: project.displayName || project.name,
        status: project.status || 'development',
        isRunning: project.isRunning || false,
        url: project.isRunning && project.port ? `http://localhost:${project.port}` : undefined
      }));
      
      setProjects(transformedProjects);
      
    } catch (err) {
      console.error('PDE Frontend: Failed to load projects:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      
      // If API is down, show empty projects list
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [checkApiConnection]);

  /**
   * Trigger a new project scan
   */
  const scanProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('PDE Frontend: Triggering project scan...');
      
      // Check API connection first
      const connected = await checkApiConnection();
      if (!connected) {
        throw new Error('Cannot connect to PDE server for scanning.');
      }

      // Trigger scan
      const scanResult = await pdeApi.scanProjects();
      setLastScanTime(scanResult.timestamp);
      
      console.log(`PDE Frontend: Scan completed - found ${scanResult.projectsFound} projects`);
      
      if (scanResult.errors.length > 0) {
        console.warn('PDE Frontend: Scan completed with errors:', scanResult.errors);
      }
      
      // Refresh projects after scan
      await refreshProjects();
      
    } catch (err) {
      console.error('PDE Frontend: Failed to scan projects:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [checkApiConnection, refreshProjects]);

  /**
   * Delete a project
   */
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('PDE Frontend: Deleting project...', projectId);
      
      // Check API connection first
      const connected = await checkApiConnection();
      if (!connected) {
        throw new Error('Cannot connect to PDE server for deletion.');
      }

      // Delete project
      const result = await pdeApi.deleteProject(projectId);
      
      if (result.success) {
        console.log(`PDE Frontend: Project deleted successfully: ${projectId}`);
        // Refresh projects after deletion
        await refreshProjects();
      } else {
        throw new Error(result.message || 'Failed to delete project');
      }
      
    } catch (err) {
      console.error('PDE Frontend: Failed to delete project:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [checkApiConnection, refreshProjects]);

  // Initial load
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return {
    projects,
    loading,
    error,
    refreshProjects,
    scanProjects,
    deleteProject,
    lastScanTime,
    isApiConnected
  };
}