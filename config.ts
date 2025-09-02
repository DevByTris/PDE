/**
 * Personal Development Environment (PDE) Configuration
 * This file manages all settings for the PDE system including:
 * - Project scanning and detection
 * - Development server configuration
 * - Multi-project management
 * - GUI preferences
 */

// Deno environment variable declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
};

interface PDEConfig {
  // Project scanning configuration
  projects: {
    rootPath: string;
    scanInterval: number; // milliseconds
    autoDetect: boolean;
    watchForChanges: boolean;
  };
  
  // Development server configuration
  server: {
    basePort: number;
    maxConcurrentProjects: number;
    enableSubdomains: boolean;
    domain: string;
  };
  
  // Metadata and storage
  storage: {
    metadataPath: string;
    backupInterval: number; // milliseconds
    maxBackups: number;
  };
  
  // GUI configuration
  gui: {
    theme: 'light' | 'dark' | 'system';
    pleskStyle: boolean;
    defaultView: 'grid' | 'list';
    autoRefresh: boolean;
  };
  
  // Security and validation
  security: {
    validateProjects: boolean;
    sanitizeNames: boolean;
    allowedFileTypes: string[];
  };
}

/**
 * Load PDE configuration with environment variable overrides and sensible defaults
 */
export function loadPDEConfig(): PDEConfig {
  const config: PDEConfig = {
    projects: {
      rootPath: Deno.env.get('PDE_PROJECTS_PATH') || './projects',
      scanInterval: parseInt(Deno.env.get('PDE_SCAN_INTERVAL') || '5000'),
      autoDetect: Deno.env.get('PDE_AUTO_DETECT') !== 'false',
      watchForChanges: Deno.env.get('PDE_WATCH_CHANGES') !== 'false'
    },
    
    server: {
      basePort: parseInt(Deno.env.get('PDE_BASE_PORT') || '3000'),
      maxConcurrentProjects: parseInt(Deno.env.get('PDE_MAX_PROJECTS') || '10'),
      enableSubdomains: Deno.env.get('PDE_ENABLE_SUBDOMAINS') !== 'false',
      domain: Deno.env.get('PDE_DOMAIN') || 'localhost'
    },
    
    storage: {
      metadataPath: Deno.env.get('PDE_METADATA_PATH') || './metadata/pde-metadata.json',
      backupInterval: parseInt(Deno.env.get('PDE_BACKUP_INTERVAL') || '300000'), // 5 minutes
      maxBackups: parseInt(Deno.env.get('PDE_MAX_BACKUPS') || '5')
    },
    
    gui: {
      theme: (Deno.env.get('PDE_THEME') as PDEConfig['gui']['theme']) || 'system',
      pleskStyle: Deno.env.get('PDE_PLESK_STYLE') !== 'false',
      defaultView: (Deno.env.get('PDE_DEFAULT_VIEW') as PDEConfig['gui']['defaultView']) || 'grid',
      autoRefresh: Deno.env.get('PDE_AUTO_REFRESH') !== 'false'
    },
    
    security: {
      validateProjects: Deno.env.get('PDE_VALIDATE_PROJECTS') !== 'false',
      sanitizeNames: Deno.env.get('PDE_SANITIZE_NAMES') !== 'false',
      allowedFileTypes: (Deno.env.get('PDE_ALLOWED_TYPES') || '.ts,.js,.jsx,.tsx,.json,.md,.html,.css,.scss,.less,.vue,.svelte').split(',')
    }
  };
  
  return validatePDEConfig(config);
}

/**
 * Validate PDE configuration and provide warnings for invalid settings
 */
function validatePDEConfig(config: PDEConfig): PDEConfig {
  // Validate port ranges
  if (config.server.basePort < 1000 || config.server.basePort > 65535) {
    console.warn('PDE Config Warning: basePort should be between 1000-65535, using default 3000');
    config.server.basePort = 3000;
  }
  
  // Validate scan interval
  if (config.projects.scanInterval < 1000) {
    console.warn('PDE Config Warning: scanInterval too low, minimum 1000ms, using default 5000ms');
    config.projects.scanInterval = 5000;
  }
  
  // Validate max concurrent projects
  if (config.server.maxConcurrentProjects < 1 || config.server.maxConcurrentProjects > 50) {
    console.warn('PDE Config Warning: maxConcurrentProjects should be 1-50, using default 10');
    config.server.maxConcurrentProjects = 10;
  }
  
  return config;
}

/**
 * Get port for a specific project (incremental allocation)
 */
export function getProjectPort(projectIndex: number, basePort: number = 3000): number {
  return basePort + projectIndex + 1;
}

/**
 * Generate subdomain URL for project
 */
export function getProjectURL(projectName: string, config: PDEConfig): string {
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  if (config.server.enableSubdomains) {
    return `http://${sanitizedName}.${config.server.domain}`;
  }
  
  return `http://${config.server.domain}:${config.server.basePort}/${sanitizedName}`;
}