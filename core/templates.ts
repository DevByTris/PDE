/**
 * Project Templates for PDE Project Creation Wizard
 * Defines available project templates and their configurations
 */

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'frontend' | 'fullstack' | 'backend' | 'static';
  technologies: string[];
  files: TemplateFile[];
  folders: string[];
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
  isTemplate?: boolean; // If true, will replace variables like {{projectName}}
}

export interface ProjectCreationConfig {
  name: string;
  category: 'personal' | 'professional';
  template: string;
  domain?: string;
  subdomain?: string;
  description?: string;
}

/**
 * Available project templates
 */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-deno',
    name: 'React + Deno',
    description: 'Modern React application powered by Deno',
    icon: '⚛️',
    category: 'frontend',
    technologies: ['React', 'TypeScript', 'Deno', 'ESBuild'],
    folders: ['src', 'public', 'src/components', 'src/utils', 'src/styles'],
    files: [
      {
        path: 'deno.json',
        content: JSON.stringify({
          "compilerOptions": {
            "jsx": "react-jsx",
            "jsxImportSource": "react"
          },
          "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom": "https://esm.sh/react-dom@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client"
          }
        }, null, 2)
      },
      {
        path: 'src/main.tsx',
        content: `import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
`
      },
      {
        path: 'src/App.tsx',
        content: `import React from 'react';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>{{projectName}}</h1>
        <p>Welcome to your new React + Deno project!</p>
      </header>
      <main className="app-main">
        <p>Start building your amazing application.</p>
      </main>
    </div>
  );
}

export default App;
`,
        isTemplate: true
      },
      {
        path: 'src/styles/App.css',
        content: `/* {{projectName}} - Main Styles */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.app-main {
  flex: 1;
  padding: 2rem;
  text-align: center;
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-header, .app-main {
    padding: 1rem;
  }
}
`,
        isTemplate: true
      },
      {
        path: 'public/index.html',
        content: `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}}</title>
  <meta name="description" content="{{description}}">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`,
        isTemplate: true
      },
      {
        path: 'README.md',
        content: `# {{projectName}}

{{description}}

## Getting Started

This project uses Deno and React.

### Prerequisites
- Deno installed on your system

### Development

1. Start the development server:
   \`\`\`bash
   deno run --allow-net --allow-read --allow-write server.ts
   \`\`\`

2. Open your browser to the local development URL

## Technologies

- React 18
- TypeScript
- Deno
- ESBuild

## Project Structure

\`\`\`
{{projectName}}/
├── src/
│   ├── components/
│   ├── styles/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── index.html
├── deno.json
└── README.md
\`\`\`
`,
        isTemplate: true
      }
    ]
  },
  {
    id: 'static-html',
    name: 'Static HTML',
    description: 'Simple static website with HTML, CSS, and JavaScript',
    icon: '🌐',
    category: 'static',
    technologies: ['HTML5', 'CSS3', 'JavaScript'],
    folders: ['css', 'js', 'images'],
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}}</title>
  <meta name="description" content="{{description}}">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>
    <h1>{{projectName}}</h1>
    <p>{{description}}</p>
  </header>
  
  <main>
    <section>
      <h2>Welcome</h2>
      <p>Start building your static website!</p>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 {{projectName}}. All rights reserved.</p>
  </footer>
  
  <script src="js/main.js"></script>
</body>
</html>
`,
        isTemplate: true
      },
      {
        path: 'css/style.css',
        content: `/* {{projectName}} - Main Styles */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  header h1 {
    font-size: 2rem;
  }
  
  header, section {
    padding: 1rem;
  }
}
`,
        isTemplate: true
      },
      {
        path: 'js/main.js',
        content: `// {{projectName}} - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
  console.log('{{projectName}} loaded successfully!');
  
  // Add your JavaScript code here
  
});
`,
        isTemplate: true
      }
    ]
  },
  {
    id: 'deno-api',
    name: 'Deno API',
    description: 'RESTful API server built with Deno and TypeScript',
    icon: '🦕',
    category: 'backend',
    technologies: ['Deno', 'TypeScript', 'REST API'],
    folders: ['src', 'src/routes', 'src/middleware', 'src/utils'],
    files: [
      {
        path: 'deno.json',
        content: JSON.stringify({
          "tasks": {
            "dev": "deno run --allow-net --allow-read --allow-env server.ts",
            "start": "deno run --allow-net --allow-read --allow-env server.ts"
          }
        }, null, 2)
      },
      {
        path: 'server.ts',
        content: `/**
 * {{projectName}} - Deno API Server
 */

// Deno server imports
const { serve } = await import("https://deno.land/std@0.208.0/http/server.ts");

const PORT = 8000;

/**
 * Main request handler
 */
async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    return handleAPI(request, pathname, corsHeaders);
  }

  // Health check
  if (pathname === '/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: '{{projectName}}'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 404
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders 
  });
}

/**
 * API request handler
 */
async function handleAPI(request: Request, pathname: string, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Example API endpoint
    if (pathname === '/api/hello') {
      return new Response(JSON.stringify({ 
        message: 'Hello from {{projectName}}!',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // API not found
    return new Response(JSON.stringify({ error: 'API endpoint not found' }), { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Start the server
 */
console.log(\`🚀 {{projectName}} API server starting on port \${PORT}\`);

await serve(handler, { 
  port: PORT,
  onListen: ({ hostname, port }) => {
    console.log(\`✨ Server listening on http://\${hostname}:\${port}\`);
  }
});
`,
        isTemplate: true
      },
      {
        path: 'README.md',
        content: `# {{projectName}}

{{description}}

## Getting Started

This is a Deno-based REST API server.

### Prerequisites
- Deno installed on your system

### Development

1. Start the development server:
   \`\`\`bash
   deno task dev
   \`\`\`

2. The API will be available at: \`http://localhost:8000\`

### API Endpoints

- \`GET /health\` - Health check
- \`GET /api/hello\` - Example endpoint

## Technologies

- Deno
- TypeScript
- REST API

## Project Structure

\`\`\`
{{projectName}}/
├── src/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── server.ts
├── deno.json
└── README.md
\`\`\`
`,
        isTemplate: true
      }
    ]
  },
  {
    id: 'vue-deno',
    name: 'Vue + Deno',
    description: 'Vue.js application with Deno backend',
    icon: '💚',
    category: 'frontend',
    technologies: ['Vue 3', 'TypeScript', 'Deno'],
    folders: ['src', 'public', 'src/components'],
    files: [
      {
        path: 'deno.json',
        content: JSON.stringify({
          "compilerOptions": {
            "jsx": "preserve"
          },
          "imports": {
            "vue": "https://esm.sh/vue@3.3.0"
          }
        }, null, 2)
      },
      {
        path: 'src/main.ts',
        content: `import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`
      },
      {
        path: 'src/App.vue',
        content: `<template>
  <div id="app">
    <header class="app-header">
      <h1>{{projectName}}</h1>
      <p>Welcome to your new Vue + Deno project!</p>
    </header>
    <main class="app-main">
      <p>Start building your amazing Vue application.</p>
    </main>
  </div>
</template>

<script setup lang="ts">
// Add your Vue logic here
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #42b883 0%, #347474 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.app-main {
  padding: 2rem;
  text-align: center;
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-header, .app-main {
    padding: 1rem;
  }
}
</style>
`,
        isTemplate: true
      },
      {
        path: 'public/index.html',
        content: `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}}</title>
  <meta name="description" content="{{description}}">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`,
        isTemplate: true
      }
    ]
  }
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(template => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(template => template.category === category);
}

/**
 * Replace template variables in content
 */
export function replaceTemplateVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}