/**
 * Error Boundary Component for PDE
 * Catches and displays React errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PDE Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Show error fallback in DOM
    const errorFallback = document.getElementById('error-fallback');
    const errorMessage = document.getElementById('error-message');
    
    if (errorFallback && errorMessage) {
      errorFallback.style.display = 'block';
      errorMessage.textContent = `${error.toString()}\n\nStack trace:\n${errorInfo.componentStack}`;
    }
  }

  render() {
    if (this.state.hasError) {
      // Return minimal fallback UI
      return (
        <div className="error-container" role="alert">
          <h1>⚠️ PDE Error</h1>
          <p>Something went wrong in the application.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            🔄 Reload PDE
          </button>
          {this.state.error && (
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>{this.state.error.toString()}</pre>
              {this.state.errorInfo && (
                <pre>{this.state.errorInfo.componentStack}</pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}