/**
 * Core TypeScript interfaces and types for the Personal Development Environment (PDE)
 * These types define the structure of projects, metadata, and system components
 */

/**
 * Project categorization types
 */
export type ProjectCategory = 'personal' | 'professional';
export type ProjectStatus = 'proposed' | 'active' | 'inactive' | 'archived' | 'development' | 'production';
export type ProjectType = 
  | 'react' 
  | 'vue' 
  | 'svelte' 
  | 'angular' 
  | 'next' 
  | 'nuxt' 
  | 'deno' 
  | 'node' 
  | 'static' 
  | 'wordpress' 
  | 'unknown';

/**
 * Detected project indicators
 */
export interface ProjectIndicators {
  packageJson: boolean;
  denoJson: boolean;
  indexHtml: boolean;
  readme: boolean;
  gitRepo: boolean;
  nodeModules: boolean;
  srcFolder: boolean;
  publicFolder: boolean;
  buildFolder: boolean;
}

/**
 * Project framework detection result
 */
export interface DetectedFramework {
  type: ProjectType;
  confidence: number; // 0-1 scale
  indicators: string[]; // files/folders that led to detection
  version?: string;
  dependencies?: string[];
}

/**
 * Core project information
 */
export interface ProjectInfo {
  // Basic identification
  id: string; // unique identifier
  name: string; // project folder name
  displayName?: string; // custom display name
  path: string; // absolute path to project
  relativePath: string; // path relative to projects root
  
  // Categorization
  category: ProjectCategory;
  domain?: string; // for organizing by domain/subdomain
  subdomain?: string;
  
  // Detection results
  type: ProjectType;
  framework: DetectedFramework;
  indicators: ProjectIndicators;
  
  // Status and metadata
  status: ProjectStatus;
  lastModified: Date;
  lastScanned: Date;
  fileCount?: number;
  size?: number; // in bytes
  
  // Development server info
  port?: number;
  url?: string;
  isRunning?: boolean;
  pid?: number; // process ID if running
  
  // Git information
  git?: {
    hasRepo: boolean;
    currentBranch?: string;
    hasChanges?: boolean;
    lastCommit?: {
      hash: string;
      message: string;
      date: Date;
    };
  };
  
  // Configuration
  config?: {
    autoStart?: boolean;
    preferredPort?: number;
    environment?: Record<string, string>;
    buildCommand?: string;
    devCommand?: string;
  };
  
  // Tags and notes
  tags?: string[];
  notes?: string;
  
  // Error tracking
  lastError?: {
    message: string;
    timestamp: Date;
    type: 'scan' | 'detection' | 'server' | 'build';
  };
}

/**
 * Project scan result
 */
export interface ScanResult {
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
  scanDuration: number; // milliseconds
  timestamp: Date;
}

/**
 * Metadata storage structure
 */
export interface PDEMetadata {
  version: string; // metadata format version
  lastUpdate: Date;
  totalProjects: number;
  
  projects: Record<string, ProjectInfo>; // keyed by project ID
  
  // Global statistics
  stats: {
    totalScans: number;
    lastScanDuration: number;
    averageScanDuration: number;
    projectsByType: Record<ProjectType, number>;
    projectsByCategory: Record<ProjectCategory, number>;
    projectsByStatus: Record<ProjectStatus, number>;
  };
  
  // System configuration snapshot
  config: {
    projectsPath: string;
    lastConfigUpdate: Date;
    version: string;
  };
  
  // Backup information
  backup?: {
    lastBackup: Date;
    backupCount: number;
    autoBackupEnabled: boolean;
  };
}

/**
 * File system watcher event
 */
export interface FileSystemEvent {
  type: 'create' | 'modify' | 'delete' | 'rename';
  path: string;
  timestamp: Date;
  isDirectory: boolean;
}

/**
 * Project server instance
 */
export interface ProjectServer {
  projectId: string;
  port: number;
  url: string;
  pid?: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime?: Date;
  lastAccess?: Date;
  error?: string;
}

/**
 * PDE system status
 */
export interface SystemStatus {
  isRunning: boolean;
  uptime: number; // milliseconds
  activeProjects: number;
  runningServers: number;
  lastScan: Date;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    averageScanTime: number;
    totalScans: number;
    errors: number;
  };
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedIssues: string[];
}

/**
 * Utility types for better type safety
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type ProjectUpdate = Partial<ProjectInfo> & { id: string };

/**
 * Event system types for real-time updates
 */
export interface PDEEvent {
  type: 'project_added' | 'project_updated' | 'project_removed' | 'scan_complete' | 'server_started' | 'server_stopped' | 'error';
  timestamp: Date;
  data: any;
  source: 'scanner' | 'detector' | 'metadata' | 'server' | 'gui';
}

export type EventCallback = (event: PDEEvent) => void;

/**
 * Search and filter types
 */
export interface ProjectFilter {
  category?: ProjectCategory;
  type?: ProjectType;
  status?: ProjectStatus;
  search?: string; // search in name, tags, notes
  tags?: string[];
  hasGit?: boolean;
  isRunning?: boolean;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
}

export interface SortOptions {
  field: keyof ProjectInfo;
  direction: 'asc' | 'desc';
}