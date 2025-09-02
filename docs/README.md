# Personal Development Environment (PDE) Documentation

## Overview

The Personal Development Environment (PDE) is a custom monorepo with a Plesk-style control panel that automatically recognizes and organizes development projects.

## Features

### ✅ Completed Features
- **Project Scanner**: Automatically discovers domain and subdomain projects
- **Project Management**: View and organize personal/professional projects
- **Project Creation Wizard**: Template-based project setup with React+Deno, Static HTML, Deno API, Vue+Deno
- **Project Deletion**: Clean removal of projects from the dashboard with enhanced orphaned metadata cleanup
- **Responsive Dashboard**: Plesk-style control panel interface with mobile-first design
- **Advanced Theme Toggle**: Aaron Iker-style theme switching with View Transitions API and morphing animations
- **Real-time Updates**: File system watching for automatic project detection
- **Templates API**: Dynamic template loading and category filtering
- **Enhanced Mobile Support**: Touch-friendly interactions and responsive breakpoints

### 🚧 In Development
- **Project Development Server Integration**: Auto-start/stop project servers
- **Advanced Project Management**: Project settings and environment configuration
- **Custom Template Creation**: User-defined project templates

## Technology Stack

- **Runtime**: Deno (no npm/node_modules)
- **Frontend**: React 19 with TypeScript
- **Styling**: Vanilla CSS with theme support
- **Build**: esbuild for on-the-fly TypeScript transpilation
- **Templates**: React+Deno, Static HTML, Deno API, Vue+Deno project templates
- **Architecture**: Monorepo with organized project structure

## Project Structure

```
c:\quoder\
├── core/                   # Core PDE functionality
│   ├── detector.ts        # Project type detection
│   ├── metadata.ts        # Project metadata management
│   ├── scanner.ts         # File system scanning
│   └── types.ts           # TypeScript definitions
├── gui/                   # React frontend
│   ├── components/        # React components
│   ├── styles/           # CSS files
│   └── utils/            # Hooks and utilities
├── projects/             # User projects (gitignored)
├── metadata/             # Project metadata (gitignored)
├── tests/                # Test files
├── docs/                 # Documentation
├── server.ts             # Deno development server
└── config.ts             # PDE configuration
```

## Project Creation Wizard

### Available Templates

1. **React + Deno** - Modern React application powered by Deno
   - TypeScript, React 18, ESBuild
   - Responsive CSS with mobile-first design
   - Ready-to-run development setup

2. **Static HTML** - Simple static website
   - HTML5, CSS3, JavaScript
   - Responsive grid layouts
   - Image and asset organization

3. **Deno API** - RESTful API server
   - TypeScript, Deno runtime
   - Health checks and middleware
   - CORS and error handling

4. **Vue + Deno** - Vue.js application with Deno backend
   - Vue 3, TypeScript, Composition API
   - Deno-powered development server
   - Component-based architecture

### Template Features

- **Variable Replacement**: Dynamic project names, descriptions, and domains
- **Directory Structure**: Automated folder creation
- **Development Ready**: All templates include development configurations
- **Responsive Design**: Mobile-first CSS included
- **TypeScript Support**: Full type safety across all templates

## Getting Started

### Prerequisites
- Deno installed on your system
- Modern web browser

### Running the PDE

1. Start the development server:
   ```bash
   deno run --allow-net --allow-read --allow-write --allow-env --allow-run server.ts
   ```

2. Open your browser to: `http://localhost:3000`

### Project Organization

Projects are organized in the following structure:
```
projects/
├── personal/
│   ├── domain.com/          # Domain projects
│   └── domain.com/sub.domain.com/  # Subdomain projects
└── professional/
    ├── client-domain.com/
    └── client-domain.com/app.client-domain.com/
```

## Development Workflow

1. **Project Discovery**: The scanner automatically detects new projects
2. **Project Classification**: Projects are categorized by domain structure
3. **Status Detection**: Project status is determined by content (proposed/development)
4. **Real-time Updates**: File system changes trigger automatic rescans

## Version History

### v0.2.0 (Current) - 2025-09-02
- **Project Creation Wizard**: Complete template-based project setup
- **Advanced Theme Toggle**: Aaron Iker-style animations with View Transitions API
- **Enhanced Mobile Support**: Touch-friendly responsive design
- **Templates API**: Dynamic template loading and filtering
- **Metadata Cleanup**: Automatic orphaned entry removal
- **Improved Delete Operations**: Enhanced project removal with fallback logic

### v0.1.0
- Initial PDE implementation
- Project scanning and detection
- Basic project management
- Plesk-style control panel interface
- Project deletion functionality

---

*Last updated: 2025-09-02*  
*Next session: Project Development Server Integration*