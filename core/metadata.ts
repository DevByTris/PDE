/**
 * Metadata Management System for Personal Development Environment (PDE)
 * Handles storage, retrieval, and backup of project metadata in JSON format
 */

import { PDEMetadata, ProjectInfo, ScanResult, ProjectType, ProjectCategory, ProjectStatus } from './types.ts';

// Deno API declarations
declare const Deno: {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, data: string): Promise<void>;
  stat(path: string): Promise<{ isFile: boolean; mtime: Date | null; size: number }>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  copyFile(source: string, dest: string): Promise<void>;
  remove(path: string): Promise<void>;
  errors: {
    NotFound: new () => Error;
    PermissionDenied: new () => Error;
  };
};

/**
 * Metadata manager class for handling project data persistence
 */
export class MetadataManager {
  private metadataPath: string;
  private backupPath: string;
  private maxBackups: number;
  private autoBackupEnabled: boolean;
  private metadata: PDEMetadata | null = null;

  constructor(
    metadataPath: string = './pde-metadata.json',
    maxBackups: number = 5,
    autoBackupEnabled: boolean = true
  ) {
    this.metadataPath = metadataPath;
    this.backupPath = `${metadataPath}.backup`;
    this.maxBackups = maxBackups;
    this.autoBackupEnabled = autoBackupEnabled;
  }

  /**
   * Initialize metadata system - load or create metadata file
   */
  async initialize(): Promise<void> {
    console.log('PDE Metadata: Initializing metadata system');
    
    try {
      await this.loadMetadata();
      console.log('PDE Metadata: Loaded existing metadata');
    } catch (error) {
      console.log('PDE Metadata: Creating new metadata file');
      await this.createNewMetadata();
      await this.saveMetadata();
    }
  }

  /**
   * Load metadata from file
   */
  async loadMetadata(): Promise<PDEMetadata> {
    try {
      const content = await Deno.readTextFile(this.metadataPath);
      this.metadata = JSON.parse(content, this.dateReviver);
      
      // Validate and migrate if necessary
      this.metadata = this.validateAndMigrate(this.metadata);
      
      return this.metadata;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error('Metadata file not found');
      }
      throw new Error(`Failed to load metadata: ${error.message}`);
    }
  }

  /**
   * Save metadata to file with automatic backup
   */
  async saveMetadata(): Promise<void> {
    if (!this.metadata) {
      throw new Error('No metadata to save');
    }

    try {
      // Create backup if auto-backup is enabled AND file already exists
      if (this.autoBackupEnabled && await this.fileExists(this.metadataPath)) {
        await this.createBackup();
      }

      // Update metadata timestamp
      this.metadata.lastUpdate = new Date();

      // Save to file
      const jsonContent = JSON.stringify(this.metadata, this.dateReplacer, 2);
      await Deno.writeTextFile(this.metadataPath, jsonContent);
      
      console.log('PDE Metadata: Saved metadata successfully');
    } catch (error) {
      console.error('PDE Metadata: Failed to save metadata:', error);
      throw error;
    }
  }

  /**
   * Add or update a project in metadata
   */
  async addOrUpdateProject(projectInfo: ProjectInfo): Promise<void> {
    if (!this.metadata) {
      await this.initialize();
    }

    const existingProject = this.metadata!.projects[projectInfo.id];
    const isNew = !existingProject;

    // Update project
    this.metadata!.projects[projectInfo.id] = {
      ...existingProject,
      ...projectInfo,
      lastScanned: new Date()
    };

    // Update statistics
    if (isNew) {
      this.metadata!.totalProjects++;
      this.updateStats(projectInfo, 'add');
    } else {
      this.updateStats(projectInfo, 'update');
    }

    await this.saveMetadata();
    console.log(`PDE Metadata: ${isNew ? 'Added' : 'Updated'} project: ${projectInfo.name}`);
  }

  /**
   * Remove a project from metadata
   */
  async removeProject(projectId: string): Promise<boolean> {
    if (!this.metadata) {
      await this.initialize();
    }

    const project = this.metadata!.projects[projectId];
    if (!project) {
      return false;
    }

    delete this.metadata!.projects[projectId];
    this.metadata!.totalProjects--;
    this.updateStats(project, 'remove');

    await this.saveMetadata();
    console.log(`PDE Metadata: Removed project: ${project.name}`);
    return true;
  }

  /**
   * Get all projects
   */
  getAllProjects(): ProjectInfo[] {
    if (!this.metadata) {
      return [];
    }
    return Object.values(this.metadata.projects);
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): ProjectInfo | null {
    if (!this.metadata) {
      return null;
    }
    return this.metadata.projects[projectId] || null;
  }

  /**
   * Get project by path
   */
  getProjectByPath(projectPath: string): ProjectInfo | null {
    if (!this.metadata) {
      return null;
    }
    
    // Normalize the path for comparison
    const normalizedPath = projectPath.replace(/\\/g, '/');
    
    for (const project of Object.values(this.metadata.projects)) {
      const projectNormalizedPath = project.path.replace(/\\/g, '/');
      if (projectNormalizedPath === normalizedPath) {
        return project;
      }
    }
    
    return null;
  }

  /**
   * Find projects by criteria
   */
  findProjects(criteria: {
    category?: ProjectCategory;
    type?: ProjectType;
    status?: ProjectStatus;
    search?: string;
    domain?: string;
    isRunning?: boolean;
  }): ProjectInfo[] {
    const projects = this.getAllProjects();
    
    return projects.filter(project => {
      // Category filter
      if (criteria.category && project.category !== criteria.category) {
        return false;
      }
      
      // Type filter
      if (criteria.type && project.type !== criteria.type) {
        return false;
      }
      
      // Status filter
      if (criteria.status && project.status !== criteria.status) {
        return false;
      }
      
      // Domain filter
      if (criteria.domain && project.domain !== criteria.domain) {
        return false;
      }
      
      // Running status filter
      if (criteria.isRunning !== undefined && project.isRunning !== criteria.isRunning) {
        return false;
      }
      
      // Search filter (name, display name, tags, notes)
      if (criteria.search) {
        const searchLower = criteria.search.toLowerCase();
        const searchableText = [
          project.name,
          project.displayName,
          project.domain,
          project.subdomain,
          project.notes,
          ...(project.tags || [])
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Update scan results in metadata
   */
  async updateScanResults(scanResult: ScanResult): Promise<void> {
    if (!this.metadata) {
      await this.initialize();
    }

    // Update scan statistics
    this.metadata!.stats.totalScans++;
    this.metadata!.stats.lastScanDuration = scanResult.scanDuration;
    
    // Calculate average scan duration
    const totalDuration = this.metadata!.stats.averageScanDuration * (this.metadata!.stats.totalScans - 1) + scanResult.scanDuration;
    this.metadata!.stats.averageScanDuration = Math.round(totalDuration / this.metadata!.stats.totalScans);

    await this.saveMetadata();
  }

  /**
   * Get metadata statistics
   */
  getStats() {
    if (!this.metadata) {
      return null;
    }
    return {
      ...this.metadata.stats,
      totalProjects: this.metadata.totalProjects,
      lastUpdate: this.metadata.lastUpdate
    };
  }

  /**
   * Export metadata for backup or migration
   */
  async exportMetadata(): Promise<string> {
    if (!this.metadata) {
      await this.initialize();
    }
    return JSON.stringify(this.metadata, this.dateReplacer, 2);
  }

  /**
   * Import metadata from JSON string
   */
  async importMetadata(jsonData: string, merge: boolean = false): Promise<void> {
    try {
      const importedData: PDEMetadata = JSON.parse(jsonData, this.dateReviver);
      const validatedData = this.validateAndMigrate(importedData);

      if (merge && this.metadata) {
        // Merge with existing data
        this.metadata.projects = { ...this.metadata.projects, ...validatedData.projects };
        this.metadata.totalProjects = Object.keys(this.metadata.projects).length;
        this.recalculateStats();
      } else {
        // Replace existing data
        this.metadata = validatedData;
      }

      await this.saveMetadata();
      console.log('PDE Metadata: Imported metadata successfully');
    } catch (error) {
      throw new Error(`Failed to import metadata: ${error.message}`);
    }
  }

  /**
   * Create backup of current metadata
   */
  async createBackup(): Promise<string> {
    if (!this.metadata) {
      throw new Error('No metadata to backup');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${this.metadataPath}.backup.${timestamp}`;
      
      await Deno.copyFile(this.metadataPath, backupFileName);
      
      // Update backup info in metadata
      this.metadata.backup = {
        lastBackup: new Date(),
        backupCount: (this.metadata.backup?.backupCount || 0) + 1,
        autoBackupEnabled: this.autoBackupEnabled
      };

      // Clean up old backups
      await this.cleanupOldBackups();
      
      console.log(`PDE Metadata: Created backup: ${backupFileName}`);
      return backupFileName;
    } catch (error) {
      console.error('PDE Metadata: Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      await Deno.copyFile(backupPath, this.metadataPath);
      await this.loadMetadata();
      console.log(`PDE Metadata: Restored from backup: ${backupPath}`);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }

  // Private helper methods

  /**
   * Create new empty metadata structure
   */
  private createNewMetadata(): PDEMetadata {
    this.metadata = {
      version: '1.0.0',
      lastUpdate: new Date(),
      totalProjects: 0,
      projects: {},
      stats: {
        totalScans: 0,
        lastScanDuration: 0,
        averageScanDuration: 0,
        projectsByType: {} as Record<ProjectType, number>,
        projectsByCategory: {} as Record<ProjectCategory, number>,
        projectsByStatus: {} as Record<ProjectStatus, number>
      },
      config: {
        projectsPath: './projects',
        lastConfigUpdate: new Date(),
        version: '1.0.0'
      }
    };
    return this.metadata;
  }

  /**
   * Validate and migrate metadata structure
   */
  private validateAndMigrate(data: any): PDEMetadata {
    // Basic structure validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid metadata format');
    }

    // Set defaults for missing fields
    const metadata: PDEMetadata = {
      version: data.version || '1.0.0',
      lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : new Date(),
      totalProjects: data.totalProjects || 0,
      projects: data.projects || {},
      stats: {
        totalScans: data.stats?.totalScans || 0,
        lastScanDuration: data.stats?.lastScanDuration || 0,
        averageScanDuration: data.stats?.averageScanDuration || 0,
        projectsByType: data.stats?.projectsByType || {},
        projectsByCategory: data.stats?.projectsByCategory || {},
        projectsByStatus: data.stats?.projectsByStatus || {}
      },
      config: {
        projectsPath: data.config?.projectsPath || './projects',
        lastConfigUpdate: data.config?.lastConfigUpdate ? new Date(data.config.lastConfigUpdate) : new Date(),
        version: data.config?.version || '1.0.0'
      },
      backup: data.backup ? {
        lastBackup: new Date(data.backup.lastBackup),
        backupCount: data.backup.backupCount || 0,
        autoBackupEnabled: data.backup.autoBackupEnabled !== false
      } : undefined
    };

    return metadata;
  }

  /**
   * Update statistics when projects are added/updated/removed
   */
  private updateStats(project: ProjectInfo, action: 'add' | 'update' | 'remove'): void {
    if (!this.metadata) return;

    const stats = this.metadata.stats;
    const multiplier = action === 'remove' ? -1 : 1;

    // Update by type
    stats.projectsByType[project.type] = (stats.projectsByType[project.type] || 0) + 
      (action === 'add' ? 1 : action === 'remove' ? -1 : 0);

    // Update by category
    stats.projectsByCategory[project.category] = (stats.projectsByCategory[project.category] || 0) + 
      (action === 'add' ? 1 : action === 'remove' ? -1 : 0);

    // Update by status
    stats.projectsByStatus[project.status] = (stats.projectsByStatus[project.status] || 0) + 
      (action === 'add' ? 1 : action === 'remove' ? -1 : 0);

    // Clean up zero counts
    Object.keys(stats.projectsByType).forEach(key => {
      if (stats.projectsByType[key as ProjectType] <= 0) {
        delete stats.projectsByType[key as ProjectType];
      }
    });
  }

  /**
   * Recalculate all statistics from scratch
   */
  private recalculateStats(): void {
    if (!this.metadata) return;

    const stats = this.metadata.stats;
    stats.projectsByType = {} as Record<ProjectType, number>;
    stats.projectsByCategory = {} as Record<ProjectCategory, number>;
    stats.projectsByStatus = {} as Record<ProjectStatus, number>;

    Object.values(this.metadata.projects).forEach(project => {
      this.updateStats(project, 'add');
    });
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(): Promise<void> {
    // This would require additional Deno APIs to list files
    // For now, we'll just log that cleanup should happen
    console.log('PDE Metadata: Backup cleanup would happen here (implement with file listing)');
  }

  /**
   * JSON date serializer
   */
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __date: value.toISOString() };
    }
    return value;
  }

  /**
   * JSON date deserializer
   */
  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__date) {
      return new Date(value.__date);
    }
    return value;
  }

  /**
   * Check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isFile;
    } catch {
      return false;
    }
  }
}

/**
 * Utility function to create a metadata manager instance
 */
export function createMetadataManager(
  metadataPath?: string,
  maxBackups?: number,
  autoBackup?: boolean
): MetadataManager {
  return new MetadataManager(metadataPath, maxBackups, autoBackup);
}

/**
 * Generate unique project ID
 */
export function generateProjectId(projectPath: string, projectName: string): string {
  const timestamp = Date.now();
  const pathHash = btoa(projectPath).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return `${projectName}-${pathHash}-${timestamp}`.toLowerCase();
}