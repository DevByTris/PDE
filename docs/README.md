# Personal Development Environment (PDE) Documentation

## Overview

The Personal Development Environment (PDE) is a custom monorepo with a Plesk-style control panel that automatically recognizes and organizes development projects.

## Features

### ✅ Completed Features
- **Project Scanner**: Automatically discovers domain and subdomain projects
- **Project Management**: View and organize personal/professional projects
- **Project Deletion**: Clean removal of projects from the dashboard
- **Responsive Dashboard**: Plesk-style control panel interface
- **Real-time Updates**: File system watching for automatic project detection

### 🚧 In Development
- **Project Creation Wizard**: Template-based project setup
- **Development Server Integration**: Auto-start/stop project servers
- **Advanced Project Templates**: React, Vue, Deno, etc.

## Technology Stack

- **Runtime**: Deno (no npm/node_modules)
- **Frontend**: React 19 with TypeScript
- **Styling**: Vanilla CSS with theme support
- **Build**: esbuild for on-the-fly TypeScript transpilation
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

### v0.1.0 (Current)
- Initial PDE implementation
- Project scanning and detection
- Basic project management
- Plesk-style dashboard
- Project deletion functionality

---

*Last updated: 2025-09-02*
*Next session: Implement Project Creation Wizard*