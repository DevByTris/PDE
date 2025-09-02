/**
 * PDE Development Server
 * Serves the React SPA with hot reload and API integration
 */

// Deno global type declaration
declare const Deno: {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  exit(code?: number): never;
  watchFs(paths: string | string[]): AsyncIterableIterator<any>;
  readDir(path: string): AsyncIterableIterator<any>;
  stat(path: string): Promise<any>;
  cwd(): string;
  run(options: any): any;
};

// Deno server imports
const { serve } = await import("https://deno.land/std@0.208.0/http/server.ts");
const { serveDir } = await import("https://deno.land/std@0.208.0/http/file_server.ts");
import * as esbuild from "https://deno.land/x/esbuild@v0.19.5/mod.js";

// PDE Core imports
import { loadPDEConfig } from './config.ts';
import { createScanner } from './core/scanner.ts';
import { createDetector } from './core/detector.ts';
import { createMetadataManager } from './core/metadata.ts';
import { getTemplate, replaceTemplateVariables } from './core/templates.ts';
import type { ProjectInfo } from './core/types.ts';
import type { ProjectCreationConfig } from './core/templates.ts';

// Load configuration
const config = loadPDEConfig();
const PORT = config.server.basePort;

// Initialize PDE services
const scanner = createScanner(config.projects.rootPath);
const detector = createDetector();
const metadata = createMetadataManager(config.storage.metadataPath);

// Initialize metadata system
await metadata.initialize();

console.log(`🚀 Starting PDE Development Server on port ${PORT}`);
console.log(`📁 Projects path: ${config.projects.rootPath}`);
console.log(`💾 Metadata path: ${config.storage.metadataPath}`);

/**
 * API Routes for PDE functionality
 */
async function handleAPI(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers for development
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Projects API
    if (path === '/api/projects') {
      if (request.method === 'GET') {
        const projects = metadata.getAllProjects();
        return new Response(JSON.stringify(projects), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (request.method === 'POST') {
        // Create new project
        try {
          const projectConfig: ProjectCreationConfig = await request.json();
          console.log(`🚀 Creating new project: ${projectConfig.name}`);
          
          // Get template
          const template = getTemplate(projectConfig.template);
          if (!template) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: `Template '${projectConfig.template}' not found` 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Construct project path
          let projectPath: string;
          if (projectConfig.domain) {
            if (projectConfig.subdomain) {
              // Subdomain project: projects/category/domain/subdomain.domain
              projectPath = `${projectConfig.category}/${projectConfig.domain}/${projectConfig.subdomain}.${projectConfig.domain}`;
            } else {
              // Domain project: projects/category/domain
              projectPath = `${projectConfig.category}/${projectConfig.domain}`;
            }
          } else {
            // Generic project: projects/category/projectName
            projectPath = `${projectConfig.category}/${projectConfig.name}`;
          }
          
          const fullProjectPath = `${config.projects.rootPath}/${projectPath}`;
          
          // Create project directory structure
          try {
            // Create directories
            await Deno.mkdir(fullProjectPath, { recursive: true });
            
            for (const folder of template.folders) {
              await Deno.mkdir(`${fullProjectPath}/${folder}`, { recursive: true });
            }
            
            // Template variables
            const templateVars = {
              projectName: projectConfig.name,
              description: projectConfig.description || `A ${template.name} project`,
              domain: projectConfig.domain || '',
              subdomain: projectConfig.subdomain || ''
            };
            
            // Create files
            for (const file of template.files) {
              const filePath = `${fullProjectPath}/${file.path}`;
              let content = file.content;
              
              // Replace template variables if this is a template file
              if (file.isTemplate) {
                content = replaceTemplateVariables(content, templateVars);
              }
              
              // Ensure directory exists for the file
              const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
              if (fileDir !== fullProjectPath) {
                await Deno.mkdir(fileDir, { recursive: true });
              }
              
              await Deno.writeTextFile(filePath, content);
            }
            
            console.log(`✅ Project files created at: ${fullProjectPath}`);
            
            // Detect project info and add to metadata
            const projectInfo = await detector.detectProject(fullProjectPath);
            
            // Set additional project information
            projectInfo.id = projectConfig.domain && projectConfig.subdomain 
              ? `${projectConfig.subdomain}.${projectConfig.domain}`
              : projectConfig.domain || `${projectConfig.category}-${projectConfig.name}`;
            projectInfo.name = projectConfig.name;
            projectInfo.category = projectConfig.category;
            projectInfo.domain = projectConfig.domain;
            projectInfo.subdomain = projectConfig.subdomain;
            projectInfo.path = fullProjectPath;
            
            // Add to metadata
            await metadata.addOrUpdateProject(projectInfo as ProjectInfo);
            
            console.log(`🎉 Project '${projectConfig.name}' created successfully!`);
            
            return new Response(JSON.stringify({ 
              success: true, 
              message: `Project '${projectConfig.name}' created successfully`,
              projectInfo: projectInfo,
              path: fullProjectPath
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error(`❌ Failed to create project files:`, error);
            return new Response(JSON.stringify({ 
              success: false, 
              error: `Failed to create project files: ${error.message}` 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
        } catch (error) {
          console.error('❌ Project creation error:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Scan API
    if (path === '/api/scan') {
      if (request.method === 'POST') {
        console.log('🔍 Starting project scan...');
        const scanResult = await scanner.scanProjects();
        
        // Process discovered projects through detector and add to metadata
        if (scanResult.success && scanResult.projectsFound > 0) {
          console.log(`🕵️ Processing ${scanResult.projectsFound} discovered projects...`);
          
          // Get the discovered projects from scanner
          const discoveredProjects = await scanner.getDiscoveredProjects();
          
          let projectsAdded = 0;
          let projectsUpdated = 0;
          
          for (const discoveredProject of discoveredProjects) {
            try {
              // Use detector to get full project information
              const projectInfo = await detector.detectProject(discoveredProject.path);
              
              // Ensure required fields are set
              if (!projectInfo.path) {
                projectInfo.path = discoveredProject.path;
              }
              
              // Generate consistent project ID based on domain structure
              if (!projectInfo.id) {
                let projectId: string;
                
                if (projectInfo.subdomain) {
                  // For subdomain projects, use the subdomain as ID
                  projectId = projectInfo.subdomain;
                } else if (projectInfo.domain) {
                  // For domain projects, use the domain as ID
                  projectId = projectInfo.domain;
                } else {
                  // For other projects, combine category and name
                  const projectName = projectInfo.name || discoveredProject.path.split('/').pop() || 'unknown';
                  projectId = `${projectInfo.category || 'unknown'}-${projectName}`;
                }
                
                projectInfo.id = projectId;
              }
              
              if (!projectInfo.name) {
                projectInfo.name = discoveredProject.path.split('/').pop() || 'Unknown Project';
              }
              
              // Check if project already exists in metadata
              const existingProject = metadata.getProjectByPath(projectInfo.path!);
              
              if (existingProject) {
                // Update existing project
                await metadata.addOrUpdateProject(projectInfo as ProjectInfo);
                projectsUpdated++;
                console.log(`✏️ Updated project: ${projectInfo.name}`);
              } else {
                // Add new project
                await metadata.addOrUpdateProject(projectInfo as ProjectInfo);
                projectsAdded++;
                console.log(`➕ Added project: ${projectInfo.name}`);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to process project ${discoveredProject.path}:`, error.message);
              scanResult.errors.push({
                path: discoveredProject.path,
                error: error.message,
                timestamp: new Date()
              });
            }
          }
          
          // Update scan result with actual numbers
          scanResult.projectsAdded = projectsAdded;
          scanResult.projectsUpdated = projectsUpdated;
          
          console.log(`✅ Scan completed: ${projectsAdded} added, ${projectsUpdated} updated`);
        }
        
        // Update metadata with scan results
        await metadata.updateScanResults(scanResult);
        
        return new Response(JSON.stringify(scanResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Project detection API
    if (path.startsWith('/api/detect/')) {
      if (request.method === 'POST') {
        const projectPath = decodeURIComponent(path.split('/api/detect/')[1]);
        console.log(`🕵️ Detecting project: ${projectPath}`);
        
        const projectInfo = await detector.detectProject(projectPath);
        return new Response(JSON.stringify(projectInfo), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Delete project API
    if (path.startsWith('/api/projects/')) {
      const pathParts = path.split('/api/projects/');
      if (pathParts.length === 2 && request.method === 'DELETE') {
        const projectId = decodeURIComponent(pathParts[1]);
        console.log(`🗑️ Deleting project: ${projectId}`);
        
        // Try direct deletion first
        let success = await metadata.removeProject(projectId);
        let deletedProjectName = projectId;
        
        // If not found, try fallback search for projects with broken IDs
        if (!success) {
          const allProjects = metadata.getAllProjects();
          const projectToDelete = allProjects.find(p => 
            p.name === projectId || 
            p.id === 'undefined' || 
            p.path.includes(projectId) ||
            `${p.category}-${p.name}` === projectId
          );
          
          if (projectToDelete) {
            console.log(`🔍 Found project by fallback search: ${projectToDelete.name} (ID: ${projectToDelete.id})`);
            success = await metadata.removeProject(projectToDelete.id);
            deletedProjectName = projectToDelete.name;
          }
        }
        
        // Always return success for metadata deletion, even if files don't exist
        if (success) {
          console.log(`✅ Successfully deleted project from metadata: ${deletedProjectName}`);
        } else {
          console.log(`⚠️ Project not found in metadata, but returning success: ${projectId}`);
        }
        
        // Return success regardless - if it's not in metadata, it's effectively "deleted"
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Project '${deletedProjectName}' removed from dashboard` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Statistics API
    if (path === '/api/stats') {
      if (request.method === 'GET') {
        const stats = metadata.getStats();
        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Templates API
    if (path === '/api/templates') {
      if (request.method === 'GET') {
        const { PROJECT_TEMPLATES, getTemplatesByCategory } = await import('./core/templates.ts');
        
        // Get category filter from query params
        const url = new URL(request.url);
        const category = url.searchParams.get('category');
        
        let templates = PROJECT_TEMPLATES;
        if (category && ['frontend', 'fullstack', 'backend', 'static'].includes(category)) {
          templates = getTemplatesByCategory(category as any);
        }
        
        console.log(`📋 Templates API: returning ${templates.length} templates${category ? ` for category '${category}'` : ''}`);
        
        return new Response(JSON.stringify({
          success: true,
          templates: templates,
          totalCount: PROJECT_TEMPLATES.length,
          filteredCount: templates.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Cleanup API - Remove orphaned metadata entries
    if (path === '/api/cleanup') {
      if (request.method === 'POST') {
        console.log('🧽 Starting metadata cleanup...');
        
        const allProjects = metadata.getAllProjects();
        let removedCount = 0;
        const removedProjects: Array<{name: string; id: string; path: string}> = [];
        
        for (const project of allProjects) {
          try {
            // Check if project directory still exists
            await Deno.stat(project.path);
          } catch (error) {
            // Project directory doesn't exist, remove from metadata
            console.log(`🗑️ Removing orphaned project: ${project.name} (${project.path})`);
            const success = await metadata.removeProject(project.id);
            if (success) {
              removedCount++;
              removedProjects.push({
                name: project.name,
                id: project.id,
                path: project.path
              });
            }
          }
        }
        
        console.log(`✅ Cleanup completed: removed ${removedCount} orphaned entries`);
        
        return new Response(JSON.stringify({
          success: true,
          message: `Cleanup completed: removed ${removedCount} orphaned metadata entries`,
          removedCount,
          removedProjects
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Health check
    if (path === '/api/health') {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          scanner: scanner.getStats(),
          metadata: !!metadata.getStats(),
          projects: metadata.getAllProjects().length
        }
      };
      return new Response(JSON.stringify(health), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // API not found
    return new Response('API endpoint not found', { 
      status: 404,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Main request handler
 */
async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    return handleAPI(request);
  }

  // Handle TypeScript files - transpile to JavaScript
  if (pathname.endsWith('.tsx') || pathname.endsWith('.ts')) {
    try {
      let filePath: string;
      
      // Check if it's a core file request (from gui components)
      if (pathname.startsWith('/core/')) {
        filePath = `.${pathname}`; // ./core/templates.ts
      } else {
        filePath = `./gui${pathname}`; // ./gui/app.tsx
      }
      
      const tsCode = await Deno.readTextFile(filePath);
      
      // Use esbuild to transpile TypeScript
      const result = await esbuild.transform(tsCode, {
        loader: pathname.endsWith('.tsx') ? 'tsx' : 'ts',
        format: 'esm',
        target: 'es2022',
        jsx: 'automatic',
        jsxImportSource: 'https://esm.sh/react@18.2.0',
      });
      
      // Transform import statements to use our import map
      let jsCode = result.code;
      jsCode = jsCode.replace(/from ['"]react['"]/g, "from 'https://esm.sh/react@18.2.0'");
      jsCode = jsCode.replace(/from ['"]react-dom\/client['"]/g, "from 'https://esm.sh/react-dom@18.2.0/client'");
      jsCode = jsCode.replace(/from ['"]react\/jsx-runtime['"]/g, "from 'https://esm.sh/react@18.2.0/jsx-runtime'");
      
      return new Response(jsCode, {
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error(`Error transpiling ${pathname}:`, error);
      return new Response(`// Error transpiling: ${error.message}\nconsole.error('Transpilation error in ${pathname}:', ${JSON.stringify(error.message)});`, {
        status: 500,
        headers: { 'Content-Type': 'application/javascript' },
      });
    }
  }

  // Serve static files from gui directory
  try {
    const response = await serveDir(request, {
      fsRoot: './gui',
      urlRoot: '',
      enableCors: true,
    });

    // If file not found, serve index.html for SPA routing
    if (response.status === 404) {
      const indexResponse = await serveDir(new Request(new URL('/index.html', request.url)), {
        fsRoot: './gui',
        urlRoot: '',
        enableCors: true,
      });
      
      return indexResponse;
    }

    return response;
  } catch (error) {
    console.error('Server Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Start the server
 */
try {
  console.log(`\n🌐 PDE Server starting...`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${config.gui.theme || 'system'} theme`);
  console.log(`\n🔍 Performing initial project scan...`);
  
  // Perform initial scan
  const initialScan = await scanner.scanProjects();
  console.log(`✅ Found ${initialScan.projectsFound} projects in ${initialScan.scanDuration}ms`);
  
  if (config.projects.watchForChanges) {
    console.log(`👀 File system watching enabled`);
    scanner.startWatching();
  }

  console.log(`\n🚀 PDE is ready! Open http://localhost:${PORT} in your browser\n`);

  await serve(handler, { 
    port: PORT,
    onListen: ({ hostname, port }) => {
      console.log(`✨ Server listening on http://${hostname}:${port}`);
    }
  });

} catch (error) {
  console.error('Failed to start PDE server:', error);
  esbuild.stop();
  Deno.exit(1);
}