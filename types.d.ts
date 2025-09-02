// Type declarations for Deno React project
/// <reference types="https://esm.sh/@types/react@18.2.45/index.d.ts" />
/// <reference types="https://esm.sh/@types/react-dom@18.2.18/index.d.ts" />

// React module declarations
declare module "react" {
  import * as React from "https://esm.sh/react@18.2.0";
  export = React;
  export as namespace React;
  
  // Explicitly export commonly used hooks and types
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useRef: typeof React.useRef;
  export const useContext: typeof React.useContext;
  export const StrictMode: typeof React.StrictMode;
}

declare module "react-dom" {
  export * from "https://esm.sh/react-dom@18.2.0";
}

declare module "react-dom/client" {
  export * from "https://esm.sh/react-dom@18.2.0/client";
}

declare module "react/jsx-runtime" {
  export * from "https://esm.sh/react@18.2.0/jsx-runtime";
}

// Deno std library modules
declare module "https://deno.land/std@0.208.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string; onListen?: (params: { hostname: string; port: number }) => void }
  ): Promise<void>;
}

declare module "https://deno.land/std@0.208.0/http/file_server.ts" {
  export function serveDir(
    request: Request,
    options: {
      fsRoot: string;
      urlRoot?: string;
      enableCors?: boolean;
    }
  ): Promise<Response>;
}

declare module "https://deno.land/x/esbuild@v0.19.5/mod.js" {
  export interface TransformOptions {
    loader?: 'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json' | 'text' | 'base64' | 'dataurl' | 'file' | 'binary';
    format?: 'iife' | 'cjs' | 'esm';
    target?: string | string[];
    jsx?: 'transform' | 'preserve' | 'automatic';
    jsxImportSource?: string;
    define?: Record<string, string>;
  }
  
  export interface TransformResult {
    code: string;
    map: string;
  }
  
  export function transform(input: string, options?: TransformOptions): Promise<TransformResult>;
  export function stop(): void;
}