/**
 * File System Scanner for Personal Development Environment (PDE)
 * Handles scanning project directories, detecting changes, and maintaining file system watches
 */

import { ProjectInfo, ScanResult, FileSystemEvent, ProjectCategory } from './types.ts';

// Deno API declarations
declare const Deno: {
  readDir(path: string): AsyncIterable<{ name: string; isFile: boolean; isDirectory: boolean }>;
  stat(path: string): Promise<{ isFile: boolean; isDirectory: boolean; mtime: Date | null; size: number }>;
  watchFs(paths: string | string[]): AsyncIterable<{ kind: string; paths: string[] }>;
  cwd(): string;
  readTextFile(path: string): Promise<string>;
  errors: {
    NotFound: new () => Error;
    PermissionDenied: new () => Error;
  };
};

/**
 * Main scanner class for discovering and monitoring projects
 */
export class ProjectScanner {
  private projectsPath: string;
  private watcherActive: boolean = false;
  private scanInProgress: boolean = false;
  private lastScanTime: Date | null = null;
  private eventCallbacks: Array<(event: FileSystemEvent) => void> = [];
  private lastDiscoveredProjects: Array<{ path: string; category: ProjectCategory; domain?: string; subdomain?: string }> = [];

  constructor(projectsPath: string = './projects') {
    this.projectsPath = this.normalizePath(projectsPath);
  }

  /**
   * Perform a complete scan of the projects directory
   */
  async scanProjects(): Promise<ScanResult> {
    if (this.scanInProgress) {
      throw new Error('Scan already in progress');
    }

    this.scanInProgress = true;
    const startTime = Date.now();
    const result: ScanResult = {
      success: false,
      projectsFound: 0,
      projectsAdded: 0,
      projectsUpdated: 0,
      projectsRemoved: 0,
      errors: [],
      scanDuration: 0,
      timestamp: new Date()
    };

    try {
      console.log(`PDE Scanner: Starting scan of ${this.projectsPath}`);
      
      // Check if projects directory exists
      const projectsExist = await this.directoryExists(this.projectsPath);
      if (!projectsExist) {
        throw new Error(`Projects directory not found: ${this.projectsPath}`);
      }

      // Scan for projects
      const foundProjects = await this.discoverProjects();
      result.projectsFound = foundProjects.length;
      
      // Store discovered projects for retrieval
      this.lastDiscoveredProjects = foundProjects;
      
      console.log(`PDE Scanner: Found ${foundProjects.length} potential projects`);
      
      result.success = true;
      this.lastScanTime = new Date();
      
    } catch (error) {
      console.error('PDE Scanner: Scan failed:', error);
      result.errors.push({
        path: this.projectsPath,
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      this.scanInProgress = false;
      result.scanDuration = Date.now() - startTime;
      console.log(`PDE Scanner: Scan completed in ${result.scanDuration}ms`);
    }

    return result;
  }

  /**
   * Discover all potential projects in the directory structure
   */
  private async discoverProjects(): Promise<Array<{ path: string; category: ProjectCategory; domain?: string; subdomain?: string }>> {
    const projects: Array<{ path: string; category: ProjectCategory; domain?: string; subdomain?: string }> = [];
    
    try {
      // First level: personal/professional categories
      for await (const category of Deno.readDir(this.projectsPath)) {
        if (!category.isDirectory) continue;
        
        const categoryName = category.name.toLowerCase();
        if (categoryName !== 'personal' && categoryName !== 'professional') {
          console.warn(`PDE Scanner: Skipping unknown category: ${categoryName}`);
          continue;
        }

        const categoryPath = `${this.projectsPath}/${category.name}`;
        console.log(`PDE Scanner: Scanning category: ${categoryName}`);
        
        // Second level: domains or direct projects
        for await (const item of Deno.readDir(categoryPath)) {
          if (!item.isDirectory) continue;
          
          const itemPath = `${categoryPath}/${item.name}`;
          
          // Check if this looks like a domain
          if (this.isDomainLike(item.name)) {
            // This is a domain - it's ALWAYS a project (even if empty)
            console.log(`PDE Scanner: Found domain project: ${item.name}`);
            
            // Check if domain itself has project indicators
            const isDomainProject = await this.isProjectDirectory(itemPath);
            
            if (isDomainProject) {
              // Domain folder itself is a project
              projects.push({
                path: itemPath,
                category: categoryName as ProjectCategory,
                domain: item.name
              });
            } else {
              // Domain folder is empty/proposed - still a project
              projects.push({
                path: itemPath,
                category: categoryName as ProjectCategory,
                domain: item.name
              });
            }
            
            // Also scan for subdomain projects within this domain
            try {
              for await (const subItem of Deno.readDir(itemPath)) {
                if (!subItem.isDirectory) continue;
                
                const subItemPath = `${itemPath}/${subItem.name}`;
                
                // Only treat this as a subdomain project if it looks like a domain structure
                // For example: "api.example.com" or "blog.example.com" are valid
                // But "src", "build", "components" inside a project are NOT subdomains
                if (this.isSubdomainLike(subItem.name)) {
                  console.log(`PDE Scanner: Found subdomain project: ${item.name}/${subItem.name}`);
                  
                  projects.push({
                    path: subItemPath,
                    category: categoryName as ProjectCategory,
                    domain: item.name,
                    subdomain: subItem.name
                  });
                } else {
                  // This is just a regular folder within the domain project, not a separate project
                  console.log(`PDE Scanner: Skipping non-subdomain folder: ${item.name}/${subItem.name}`);
                }
              }
            } catch (domainError) {
              console.warn(`PDE Scanner: Could not scan domain directory ${itemPath}:`, domainError.message);
            }
          } else {
            // For non-domain folders, we'll be more restrictive
            // Only scan if this folder name suggests it might contain domain projects
            // Skip folders that look like direct project names (no dots, common project patterns)
            if (this.looksLikeProjectFolder(item.name)) {
              console.log(`PDE Scanner: Skipping project-like folder: ${item.name} (not a domain)`);
              continue;
            }
            
            console.log(`PDE Scanner: Scanning non-domain folder: ${item.name}`);
            
            try {
              for await (const subItem of Deno.readDir(itemPath)) {
                if (!subItem.isDirectory) continue;
                
                const subItemPath = `${itemPath}/${subItem.name}`;
                const isSubProject = await this.isProjectDirectory(subItemPath);
                
                if (isSubProject) {
                  projects.push({
                    path: subItemPath,
                    category: categoryName as ProjectCategory,
                    domain: item.name,
                    subdomain: subItem.name
                  });
                }
              }
            } catch (folderError) {
              console.warn(`PDE Scanner: Could not scan folder ${itemPath}:`, folderError.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('PDE Scanner: Error discovering projects:', error);
      throw error;
    }

    return projects;
  }

  /**
   * Determine if a directory contains a project
   */
  private async isProjectDirectory(path: string): Promise<boolean> {
    try {
      const indicators = [
        'package.json',
        'deno.json',
        'index.html',
        'src',
        'public',
        '.git',
        'README.md',
        'readme.md'
      ];

      let foundIndicators = 0;
      
      for await (const item of Deno.readDir(path)) {
        if (indicators.includes(item.name.toLowerCase())) {
          foundIndicators++;
        }
        
        // If we find at least one strong indicator, consider it a project
        if (foundIndicators >= 1) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn(`PDE Scanner: Could not scan directory ${path}:`, error.message);
      return false;
    }
  }

  /**
   * Determine if a directory name looks like a subdomain rather than a project folder
   * This distinguishes between legitimate subdomains (api.example.com, blog.example.com)
   * and regular project folders (src, build, components, etc.)
   */
  private isSubdomainLike(name: string): boolean {
    const lowerName = name.toLowerCase();
    
    // Common subdomain patterns that suggest it's actually a subdomain project
    const subdomainPatterns = [
      // Service subdomains
      'api', 'www', 'app', 'admin', 'dashboard', 'portal', 'client',
      'blog', 'news', 'docs', 'help', 'support', 'forum',
      'shop', 'store', 'cart', 'checkout', 'payment',
      'cdn', 'static', 'assets', 'media', 'files',
      'dev', 'staging', 'test', 'beta', 'alpha', 'demo',
      'mail', 'email', 'webmail', 'ftp', 'ssh',
      'mobile', 'm', 'wap',
      
      // Geographic or language subdomains
      'us', 'uk', 'eu', 'asia', 'au',
      'en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja',
      
      // Branded/project subdomains that look like actual services
      'gaming', 'vanlife', 'democracy', 'merch', 'learning', 'community'
    ];
    
    // Common project folder patterns that should NOT be treated as subdomains
    const projectFolderPatterns = [
      'src', 'source', 'lib', 'libs', 'components', 'comp', 'ui',
      'build', 'dist', 'output', 'target', 'bin',
      'public', 'static', 'assets', 'images', 'img', 'css', 'js', 'fonts',
      'node_modules', '.git', '.vscode', '.idea',
      'test', 'tests', '__tests__', 'spec', 'specs',
      'docs', 'documentation', 'readme',
      'config', 'configs', 'settings',
      'utils', 'utilities', 'helpers', 'common',
      'types', 'interfaces', 'models', 'schemas',
      'pages', 'views', 'templates', 'layouts',
      'styles', 'scss', 'sass', 'less',
      'scripts', 'tools', 'deploy', 'deployment',
      'article', 'articles' // Specific to your case
    ];
    
    // If it matches a project folder pattern, it's NOT a subdomain
    if (projectFolderPatterns.includes(lowerName)) {
      return false;
    }
    
    // If it contains dots (like subdomain.domain.tld structure), it's likely a subdomain
    if (name.includes('.')) {
      return this.isDomainLike(name);
    }
    
    // If it matches a known subdomain pattern, it's probably a subdomain
    if (subdomainPatterns.includes(lowerName)) {
      return true;
    }
    
    // For anything else, be conservative and treat as a project folder
    // This prevents false positives
    return false;
  }

  /**
   * Determine if a directory name looks like a domain
   * Supports complex TLDs like .uk, .am, .center, etc.
   */
  private isDomainLike(name: string): boolean {
    // List of common TLDs including obscure ones
    const tlds = [
      // Generic TLDs
      'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
      // Country code TLDs
      'uk', 'us', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'in', 'br', 'mx', 'ru',
      // New generic TLDs
      'app', 'dev', 'io', 'ai', 'tech', 'digital', 'online', 'website', 'site',
      'blog', 'news', 'info', 'biz', 'name', 'pro', 'coop', 'museum',
      // Geographic and special TLDs
      'am', 'tv', 'me', 'co', 'ly', 'be', 'cc', 'ws', 'tk', 'ml', 'ga', 'cf',
      // New domain extensions
      'center', 'club', 'space', 'store', 'gallery', 'studio', 'design',
      'agency', 'company', 'solutions', 'services', 'consulting', 'group'
    ];

    // Check if the name contains a dot and ends with a known TLD
    if (name.includes('.')) {
      const parts = name.toLowerCase().split('.');
      const lastPart = parts[parts.length - 1];
      return tlds.includes(lastPart);
    }

    return false;
  }

  /**
   * Determine if a directory name looks like a project folder rather than a domain container
   * This helps distinguish between domain containers and actual project directories
   */
  private looksLikeProjectFolder(name: string): boolean {
    const lowerName = name.toLowerCase();
    
    // Common project folder patterns that suggest it's a project, not a domain container
    const projectPatterns = [
      // Development/framework patterns
      'portfolio', 'website', 'app', 'api', 'frontend', 'backend', 'client', 'server',
      'dashboard', 'admin', 'cms', 'blog', 'shop', 'store', 'ecommerce',
      
      // Technology patterns
      'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'gatsby', 'astro',
      'node', 'deno', 'express', 'fastify', 'nest', 
      
      // Project type patterns
      'landing', 'docs', 'documentation', 'guide', 'tutorial', 'demo', 'example',
      'prototype', 'poc', 'mvp', 'beta', 'alpha', 'test', 'dev', 'staging',
      
      // Personal project patterns
      'my-', 'personal-', 'own-', 'self-',
      
      // Work patterns
      'client-', 'work-', 'project-', 'freelance-'
    ];
    
    // Check if name matches common project patterns
    return projectPatterns.some(pattern => {
      if (pattern.endsWith('-')) {
        return lowerName.startsWith(pattern);
      }
      return lowerName.includes(pattern);
    });
  }

  /**
   * Start watching the file system for changes
   */
  async startWatching(): Promise<void> {
    if (this.watcherActive) {
      console.warn('PDE Scanner: File watcher already active');
      return;
    }

    try {
      this.watcherActive = true;
      console.log(`PDE Scanner: Starting file system watcher for ${this.projectsPath}`);

      const watcher = Deno.watchFs(this.projectsPath);
      
      for await (const event of watcher) {
        if (!this.watcherActive) break;
        
        const fsEvent: FileSystemEvent = {
          type: this.mapEventType(event.kind),
          path: event.paths[0] || '',
          timestamp: new Date(),
          isDirectory: await this.isDirectory(event.paths[0] || '')
        };

        console.log(`PDE Scanner: File system event: ${fsEvent.type} - ${fsEvent.path}`);
        this.notifyEventCallbacks(fsEvent);
      }
    } catch (error) {
      console.error('PDE Scanner: File watcher error:', error);
      this.watcherActive = false;
    }
  }

  /**
   * Stop watching the file system
   */
  stopWatching(): void {
    if (this.watcherActive) {
      console.log('PDE Scanner: Stopping file system watcher');
      this.watcherActive = false;
    }
  }

  /**
   * Add callback for file system events
   */
  onFileSystemEvent(callback: (event: FileSystemEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove file system event callback
   */
  removeFileSystemEventCallback(callback: (event: FileSystemEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Get scan statistics
   */
  getStats() {
    return {
      isScanning: this.scanInProgress,
      isWatching: this.watcherActive,
      lastScanTime: this.lastScanTime,
      projectsPath: this.projectsPath
    };
  }

  /**
   * Get the last discovered projects from the most recent scan
   */
  getDiscoveredProjects(): Array<{ path: string; category: ProjectCategory; domain?: string; subdomain?: string }> {
    return this.lastDiscoveredProjects;
  }

  // Utility methods

  private normalizePath(path: string): string {
    if (path.startsWith('./')) {
      return `${Deno.cwd()}/${path.slice(2)}`.replace(/\\/g, '/');
    }
    return path.replace(/\\/g, '/');
  }

  private async directoryExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch {
      return false;
    }
  }

  private async isDirectory(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch {
      return false;
    }
  }

  private mapEventType(denoEventKind: string): FileSystemEvent['type'] {
    switch (denoEventKind) {
      case 'create':
        return 'create';
      case 'modify':
        return 'modify';
      case 'remove':
        return 'delete';
      default:
        return 'modify';
    }
  }

  private notifyEventCallbacks(event: FileSystemEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('PDE Scanner: Error in event callback:', error);
      }
    });
  }
}

/**
 * Utility function to create and configure a scanner instance
 */
export function createScanner(projectsPath?: string): ProjectScanner {
  return new ProjectScanner(projectsPath);
}

/**
 * Quick scan function for immediate results
 */
export async function quickScan(projectsPath: string = './projects'): Promise<ScanResult> {
  const scanner = createScanner(projectsPath);
  return await scanner.scanProjects();
}