/**
 * PDE Main Application Entry Point
 * React 18 SPA with Plesk-style dashboard
 */

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PDE } from './components/PDE.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Hide loading indicator
const loadingElement = document.getElementById('loading');
if (loadingElement) {
  loadingElement.style.display = 'none';
}

// Initialize React app
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <PDE />
    </ErrorBoundary>
  </StrictMode>
);

// Hot reload support for development
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept();
}