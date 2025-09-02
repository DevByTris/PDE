/**
 * Project Type Detector for Personal Development Environment (PDE)
 * Analyzes project directories to determine framework, type, and configuration
 */

import { ProjectType, DetectedFramework, ProjectIndicators, ProjectInfo, ProjectStatus } from './types.ts';

// Deno API declarations
declare const Deno: {
  readDir(path: string): AsyncIterable<{ name: string; isFile: boolean; isDirectory: boolean }>;
  readTextFile(path: string): Promise<string>;
  stat(path: string): Promise<{ isFile: boolean; isDirectory: boolean; size: number; mtime: Date | null }>;
  errors: {
    NotFound: new () => Error;
    PermissionDenied: new () => Error;
  };
};

/**
 * Detection patterns for different project types
 */
interface DetectionPattern {
  type: ProjectType;
  indicators: {
    files: string[];
    folders: string[];
    packageJsonDeps?: string[];
    packageJsonDevDeps?: string[];
    packageJsonScripts?: string[];
  };
  confidence: number; // base confidence multiplier
  priority: number; // higher priority wins in ties
}

/**
 * Project type detection patterns
 */
const DETECTION_PATTERNS: DetectionPattern[] = [
  {
    type: 'next',
    indicators: {
      files: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
      folders: ['pages', 'app'],
      packageJsonDeps: ['next'],
      packageJsonScripts: ['dev', 'build']
    },
    confidence: 0.95,
    priority: 10
  },
  {
    type: 'nuxt',
    indicators: {
      files: ['nuxt.config.js', 'nuxt.config.ts'],
      folders: ['pages', 'components'],
      packageJsonDeps: ['nuxt', '@nuxt/']
    },
    confidence: 0.95,
    priority: 9
  },
  {
    type: 'react',
    indicators: {
      files: [],
      folders: ['src'],
      packageJsonDeps: ['react', 'react-dom'],
      packageJsonDevDeps: ['@types/react', 'vite', 'create-react-app']
    },
    confidence: 0.85,
    priority: 8
  },
  {
    type: 'vue',
    indicators: {
      files: ['vue.config.js', 'vite.config.ts'],
      folders: ['src'],
      packageJsonDeps: ['vue'],
      packageJsonDevDeps: ['@vitejs/plugin-vue', '@vue/cli']
    },
    confidence: 0.85,
    priority: 7
  },
  {
    type: 'svelte',
    indicators: {
      files: ['svelte.config.js', 'vite.config.js'],
      folders: ['src'],
      packageJsonDeps: ['svelte'],
      packageJsonDevDeps: ['@sveltejs/', 'vite']
    },
    confidence: 0.85,
    priority: 6
  },
  {
    type: 'angular',
    indicators: {
      files: ['angular.json', 'ng-package.json'],
      folders: ['src/app'],
      packageJsonDeps: ['@angular/core'],
      packageJsonDevDeps: ['@angular/cli']
    },
    confidence: 0.90,
    priority: 5
  },
  {
    type: 'deno',
    indicators: {
      files: ['deno.json', 'deno.jsonc', 'deps.ts', 'mod.ts'],
      folders: [],
      packageJsonDeps: []
    },
    confidence: 0.90,
    priority: 4
  },
  {
    type: 'node',
    indicators: {
      files: ['package.json'],
      folders: ['node_modules'],
      packageJsonDeps: [],
      packageJsonScripts: ['start', 'dev']
    },
    confidence: 0.70,
    priority: 3
  },
  {
    type: 'static',
    indicators: {
      files: ['index.html'],
      folders: ['css', 'js', 'images', 'assets'],
      packageJsonDeps: []
    },
    confidence: 0.60,
    priority: 2
  },
  {
    type: 'wordpress',
    indicators: {
      files: ['wp-config.php', 'index.php'],
      folders: ['wp-content', 'wp-includes', 'wp-admin'],
      packageJsonDeps: []
    },
    confidence: 0.95,
    priority: 1
  }
];

/**
 * Main detector class for analyzing projects
 */
export class ProjectDetector {
  
  /**
   * Analyze a project directory and detect its type and characteristics
   */
  async detectProject(projectPath: string): Promise<Partial<ProjectInfo>> {
    console.log(`PDE Detector: Analyzing project at ${projectPath}`);
    
    try {
      // Gather project indicators
      const indicators = await this.gatherIndicators(projectPath);
      
      // Detect framework/type
      const framework = await this.detectFramework(projectPath, indicators);
      
      // Get basic project information
      const basicInfo = await this.getBasicProjectInfo(projectPath);
      
      // Parse package.json if it exists
      const packageInfo = await this.parsePackageJson(projectPath);
      
      // Detect git information
      const gitInfo = await this.detectGitInfo(projectPath);
      
      const result: Partial<ProjectInfo> = {
        ...basicInfo,
        type: framework.type,
        framework,
        indicators,
        git: gitInfo,
        lastScanned: new Date()
      };
      
      // Add package.json derived information
      if (packageInfo) {
        result.displayName = packageInfo.displayName;
        result.config = {
          ...result.config,
          buildCommand: packageInfo.buildCommand,
          devCommand: packageInfo.devCommand
        };
      }
      
      console.log(`PDE Detector: Detected ${framework.type} project with ${(framework.confidence * 100).toFixed(0)}% confidence`);
      
      return result;
      
    } catch (error) {
      console.error(`PDE Detector: Error analyzing project ${projectPath}:`, error);
      
      return {
        type: 'unknown',
        framework: {
          type: 'unknown',
          confidence: 0,
          indicators: []
        },
        indicators: this.getEmptyIndicators(),
        lastScanned: new Date(),
        lastError: {
          message: error.message,
          timestamp: new Date(),
          type: 'detection'
        }
      };
    }
  }
  
  /**
   * Gather all possible indicators for the project
   */
  private async gatherIndicators(projectPath: string): Promise<ProjectIndicators> {
    const indicators: ProjectIndicators = this.getEmptyIndicators();
    
    try {
      for await (const item of Deno.readDir(projectPath)) {
        const itemName = item.name.toLowerCase();
        
        // Check for specific files
        if (item.isFile) {
          switch (itemName) {
            case 'package.json':
              indicators.packageJson = true;
              break;
            case 'deno.json':
            case 'deno.jsonc':
              indicators.denoJson = true;
              break;
            case 'index.html':
              indicators.indexHtml = true;
              break;
            case 'readme.md':
            case 'readme.txt':
              indicators.readme = true;
              break;
          }
        }
        
        // Check for specific folders
        if (item.isDirectory) {
          switch (itemName) {
            case 'node_modules':
              indicators.nodeModules = true;
              break;
            case 'src':
              indicators.srcFolder = true;
              break;
            case 'public':
              indicators.publicFolder = true;
              break;
            case 'build':
            case 'dist':
            case 'out':
              indicators.buildFolder = true;
              break;
            case '.git':
              indicators.gitRepo = true;
              break;
          }
        }
      }
    } catch (error) {
      console.warn(`PDE Detector: Could not read directory ${projectPath}:`, error.message);
    }
    
    return indicators;
  }
  
  /**
   * Detect the project framework and type
   */
  private async detectFramework(projectPath: string, indicators: ProjectIndicators): Promise<DetectedFramework> {
    const results: Array<{ pattern: DetectionPattern; score: number; matchedIndicators: string[] }> = [];
    
    // Test each detection pattern
    for (const pattern of DETECTION_PATTERNS) {
      const result = await this.testPattern(projectPath, pattern, indicators);
      if (result.score > 0) {
        results.push({
          pattern,
          score: result.score,
          matchedIndicators: result.matchedIndicators
        });
      }
    }
    
    // Sort by score (confidence * priority)
    results.sort((a, b) => b.score - a.score);
    
    if (results.length === 0) {
      return {
        type: 'unknown',
        confidence: 0,
        indicators: []
      };
    }
    
    const best = results[0];
    return {
      type: best.pattern.type,
      confidence: Math.min(best.score / 100, 1), // normalize to 0-1
      indicators: best.matchedIndicators,
      version: await this.getFrameworkVersion(projectPath, best.pattern.type)
    };
  }
  
  /**
   * Test a detection pattern against the project
   */
  private async testPattern(
    projectPath: string, 
    pattern: DetectionPattern, 
    indicators: ProjectIndicators
  ): Promise<{ score: number; matchedIndicators: string[] }> {
    let score = 0;
    const matchedIndicators: string[] = [];
    
    // Check file indicators
    for (const file of pattern.indicators.files) {
      if (await this.fileExists(projectPath, file)) {
        score += 20;
        matchedIndicators.push(file);
      }
    }
    
    // Check folder indicators
    for (const folder of pattern.indicators.folders) {
      if (await this.folderExists(projectPath, folder)) {
        score += 15;
        matchedIndicators.push(folder);
      }
    }
    
    // Check package.json dependencies
    if (indicators.packageJson && pattern.indicators.packageJsonDeps) {
      const packageData = await this.parsePackageJson(projectPath);
      if (packageData) {
        for (const dep of pattern.indicators.packageJsonDeps) {
          if (this.hasDependency(packageData.raw, dep)) {
            score += 25;
            matchedIndicators.push(`dependency: ${dep}`);
          }
        }
        
        // Check dev dependencies
        if (pattern.indicators.packageJsonDevDeps) {
          for (const devDep of pattern.indicators.packageJsonDevDeps) {
            if (this.hasDevDependency(packageData.raw, devDep)) {
              score += 15;
              matchedIndicators.push(`devDependency: ${devDep}`);
            }
          }
        }
        
        // Check scripts
        if (pattern.indicators.packageJsonScripts) {
          for (const script of pattern.indicators.packageJsonScripts) {
            if (packageData.raw.scripts && packageData.raw.scripts[script]) {
              score += 10;
              matchedIndicators.push(`script: ${script}`);
            }
          }
        }
      }
    }
    
    // Apply base confidence and priority
    score *= pattern.confidence;
    score += pattern.priority;
    
    return { score, matchedIndicators };
  }
  
  /**
   * Get basic project information
   */
  private async getBasicProjectInfo(projectPath: string): Promise<Partial<ProjectInfo>> {
    const pathParts = projectPath.replace(/\\/g, '/').split('/');
    const projectName = pathParts[pathParts.length - 1];
    
    // Determine category and domain structure
    let category: 'personal' | 'professional' = 'personal';
    let domain: string | undefined;
    let subdomain: string | undefined;
    
    // Look for category in path
    const categoryIndex = pathParts.findIndex(part => 
      part.toLowerCase() === 'personal' || part.toLowerCase() === 'professional'
    );
    
    if (categoryIndex !== -1) {
      category = pathParts[categoryIndex].toLowerCase() as 'personal' | 'professional';
      
      // Domain is the folder after category
      if (categoryIndex + 1 < pathParts.length) {
        domain = pathParts[categoryIndex + 1];
      }
      
      // Subdomain is the project name if there's a domain
      if (domain && categoryIndex + 2 < pathParts.length) {
        subdomain = pathParts[categoryIndex + 2];
      }
    }
    
    // Get file stats
    let fileCount = 0;
    let totalSize = 0;
    let lastModified = new Date(0);
    
    try {
      for await (const item of Deno.readDir(projectPath)) {
        if (item.isFile) {
          fileCount++;
          try {
            const stat = await Deno.stat(`${projectPath}/${item.name}`);
            totalSize += stat.size;
            if (stat.mtime && stat.mtime > lastModified) {
              lastModified = stat.mtime;
            }
          } catch {
            // Ignore stat errors for individual files
          }
        }
      }
    } catch (error) {
      console.warn(`PDE Detector: Could not count files in ${projectPath}:`, error.message);
    }
    
    return {
      name: projectName,
      path: projectPath,
      category,
      domain,
      subdomain,
      fileCount,
      size: totalSize,
      lastModified,
      status: await this.determineProjectStatus(projectPath)
    };
  }
  
  /**
   * Parse package.json file
   */
  private async parsePackageJson(projectPath: string): Promise<{
    raw: any;
    displayName?: string;
    buildCommand?: string;
    devCommand?: string;
  } | null> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const content = await Deno.readTextFile(packageJsonPath);
      const packageData = JSON.parse(content);
      
      return {
        raw: packageData,
        displayName: packageData.displayName || packageData.name,
        buildCommand: packageData.scripts?.build,
        devCommand: packageData.scripts?.dev || packageData.scripts?.start
      };
    } catch {
      return null;
    }
  }
  
  /**
   * Detect git repository information
   */
  private async detectGitInfo(projectPath: string): Promise<ProjectInfo['git']> {
    const gitPath = `${projectPath}/.git`;
    
    try {
      const gitStat = await Deno.stat(gitPath);
      if (!gitStat.isDirectory) {
        return { hasRepo: false };
      }
      
      // Try to read current branch
      let currentBranch: string | undefined;
      try {
        const headContent = await Deno.readTextFile(`${gitPath}/HEAD`);
        const match = headContent.match(/ref: refs\/heads\/(.+)/);
        if (match) {
          currentBranch = match[1].trim();
        }
      } catch {
        // Could not read branch info
      }
      
      return {
        hasRepo: true,
        currentBranch
      };
    } catch {
      return { hasRepo: false };
    }
  }
  
  /**
   * Determine project status based on content
   * - Empty folder = "proposed"
   * - Has index.html OR deno.json = "development" (or higher)
   * - User can manually set to active, production, archived, etc.
   */
  private async determineProjectStatus(projectPath: string): Promise<ProjectStatus> {
    try {
      // Check if directory is empty
      let hasAnyContent = false;
      let hasProjectFiles = false;
      
      for await (const item of Deno.readDir(projectPath)) {
        hasAnyContent = true;
        
        // Check for key project indicator files
        const fileName = item.name.toLowerCase();
        if (fileName === 'index.html' || fileName === 'deno.json' || fileName === 'package.json') {
          hasProjectFiles = true;
          break;
        }
      }
      
      if (!hasAnyContent) {
        // Empty folder = proposed project
        return 'proposed';
      }
      
      if (hasProjectFiles) {
        // Has project files = development status
        return 'development';
      }
      
      // Has some content but no key project files = still proposed
      return 'proposed';
      
    } catch (error) {
      console.warn(`PDE Detector: Could not determine status for ${projectPath}:`, error.message);
      return 'proposed';
    }
  }

  /**
   * Get framework version from package.json or config files
   */
  private async getFrameworkVersion(projectPath: string, type: ProjectType): Promise<string | undefined> {
    if (type === 'deno') {
      // Try to read Deno version from deno.json
      try {
        const denoJsonPath = `${projectPath}/deno.json`;
        const content = await Deno.readTextFile(denoJsonPath);
        const denoConfig = JSON.parse(content);
        return denoConfig.version;
      } catch {
        return undefined;
      }
    }
    
    // For other types, try to get version from package.json
    const packageDataResult = await this.parsePackageJson(projectPath);
    if (!packageDataResult) return undefined;
    
    const deps = { ...packageDataResult.raw.dependencies, ...packageDataResult.raw.devDependencies };
    
    // Look for framework-specific dependencies
    const frameworkDeps: Record<ProjectType, string[]> = {
      react: ['react'],
      vue: ['vue'],
      svelte: ['svelte'],
      angular: ['@angular/core'],
      next: ['next'],
      nuxt: ['nuxt'],
      node: ['node'],
      static: [],
      wordpress: [],
      deno: [],
      unknown: []
    };
    
    for (const dep of frameworkDeps[type] || []) {
      if (deps[dep]) {
        return deps[dep].replace(/[^0-9.]/g, '');
      }
    }
    
    return undefined;
  }
  
  // Utility methods
  
  private getEmptyIndicators(): ProjectIndicators {
    return {
      packageJson: false,
      denoJson: false,
      indexHtml: false,
      readme: false,
      gitRepo: false,
      nodeModules: false,
      srcFolder: false,
      publicFolder: false,
      buildFolder: false
    };
  }
  
  private async fileExists(projectPath: string, fileName: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(`${projectPath}/${fileName}`);
      return stat.isFile;
    } catch {
      return false;
    }
  }
  
  private async folderExists(projectPath: string, folderName: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(`${projectPath}/${folderName}`);
      return stat.isDirectory;
    } catch {
      return false;
    }
  }
  
  private hasDependency(packageData: any, depName: string): boolean {
    const deps = packageData.dependencies || {};
    return Object.keys(deps).some(key => 
      key === depName || key.startsWith(depName)
    );
  }
  
  private hasDevDependency(packageData: any, depName: string): boolean {
    const devDeps = packageData.devDependencies || {};
    return Object.keys(devDeps).some(key => 
      key === depName || key.startsWith(depName)
    );
  }
}

/**
 * Utility function to create a detector instance
 */
export function createDetector(): ProjectDetector {
  return new ProjectDetector();
}

/**
 * Quick detection function for immediate results
 */
export async function detectProjectType(projectPath: string): Promise<Partial<ProjectInfo>> {
  const detector = createDetector();
  return await detector.detectProject(projectPath);
}