/**
 * PDE API Client
 * Handles all communication with the PDE backend APIs
 */

// Types imported from our core system
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

interface ScanResult {
  success: boolean;
  projectsFound: number;
  projectsAdded: number;
  projectsUpdated: number;
  projectsRemoved: number;
  errors: Array<{
    path: string;
    error: string;
    timestamp: Date;
  }>;
  scanDuration: number;
  timestamp: Date;
}

interface PDEStats {
  total: number;
  running: number;
  personal: number;
  professional: number;
  development: number;
  production: number;
  inactive: number;
  archived: number;
}

interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    scanner: any;
    metadata: boolean;
    projects: number;
  };
}

/**
 * Main API client class
 */
export class PDEApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = 'http://localhost:3000', timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown API error');
    }
  }

  /**
   * Get all projects from metadata
   */
  async getProjects(): Promise<ProjectInfo[]> {
    const projects = await this.request<ProjectInfo[]>('/api/projects');
    
    // Convert date strings back to Date objects
    return projects.map(project => ({
      ...project,
      lastModified: new Date(project.lastModified)
    }));
  }

  /**
   * Trigger a new project scan
   */
  async scanProjects(): Promise<ScanResult> {
    const result = await this.request<ScanResult>('/api/scan', {
      method: 'POST'
    });
    
    // Convert date strings back to Date objects
    return {
      ...result,
      timestamp: new Date(result.timestamp),
      errors: result.errors.map(error => ({
        ...error,
        timestamp: new Date(error.timestamp)
      }))
    };
  }

  /**
   * Detect project type for a specific path
   */
  async detectProject(projectPath: string): Promise<Partial<ProjectInfo>> {
    const encodedPath = encodeURIComponent(projectPath);
    const result = await this.request<Partial<ProjectInfo>>(`/api/detect/${encodedPath}`, {
      method: 'POST'
    });
    
    // Convert date strings back to Date objects
    if (result.lastModified) {
      result.lastModified = new Date(result.lastModified);
    }
    
    return result;
  }

  /**
   * Get PDE statistics
   */
  async getStats(): Promise<PDEStats> {
    return await this.request<PDEStats>('/api/stats');
  }

  /**
   * Get system health status
   */
  async getHealth(): Promise<HealthStatus> {
    return await this.request<HealthStatus>('/api/health');
  }

  /**
   * Check if API is available
   */
  async ping(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE'
    });
  }
}

/**
 * Default API client instance
 */
export const pdeApi = new PDEApiClient();

/**
 * Utility function to handle API errors gracefully
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please check your connection.';
    }
    if (error.message.includes('Failed to fetch')) {
      return 'Cannot connect to PDE server. Is it running?';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

/**
 * Type guards for API responses
 */
export function isProjectInfo(obj: any): obj is ProjectInfo {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.path === 'string';
}

export function isScanResult(obj: any): obj is ScanResult {
  return obj &&
    typeof obj.success === 'boolean' &&
    typeof obj.projectsFound === 'number' &&
    Array.isArray(obj.errors);
}