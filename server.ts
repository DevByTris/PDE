/**
 * PDE Development Server
 * Serves the React SPA with hot reload and API integration
 */

// Deno global type declaration
declare const Deno: {
  readTextFile(path: string): Promise<string>;
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
import type { ProjectInfo } from './core/types.ts';

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
        
        if (success) {
          console.log(`✅ Successfully deleted project: ${deletedProjectName}`);
          return new Response(JSON.stringify({ 
            success: true, 
            message: `Project '${deletedProjectName}' deleted successfully` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.log(`❌ Project not found: ${projectId}`);
          return new Response(JSON.stringify({ 
            success: false, 
            message: `Project '${projectId}' not found` 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
      const filePath = `./gui${pathname}`;
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