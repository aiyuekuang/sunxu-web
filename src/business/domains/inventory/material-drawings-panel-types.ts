import type { ReactNode } from 'react';

export interface MaterialDrawingPolicy {
  maxCount: number;
  normalFileMaxSize: number;
  glbFileMaxSize: number;
  allowedExtensions: readonly string[];
}

export interface MaterialDrawingAddRequest {
  id: string;
  urls: readonly string[];
}

export interface MaterialDrawingRemoveRequest {
  id: string;
  url: string;
}

/** host services, permissions, URL handling, and feedback stay host-owned; configure BusinessUiProvider's drawing-file proxy and worker for the shared PDF drawer. */
export interface MaterialDrawingsPanelCapabilities {
  requestDrawingPolicy: () => Promise<MaterialDrawingPolicy>;
  /** Upload regular files as one batch and return URLs in input order. */
  uploadDocumentFiles: (
    files: readonly File[],
  ) => Promise<readonly (string | null | undefined)[]>;
  uploadModelFile: (file: File) => Promise<string | null | undefined>;
  addDrawings: (request: MaterialDrawingAddRequest) => Promise<unknown>;
  removeDrawing: (request: MaterialDrawingRemoveRequest) => Promise<unknown>;
  resolveFileDisplayNames: (
    urls: readonly string[],
  ) => Promise<Readonly<Record<string, string | null | undefined>>>;
  getFallbackFileName: (url: string) => string;
  resolvePreviewUrl: (url: string) => string;
  downloadFile: (url: string, fileName: string) => Promise<void>;
  formatFileSize: (size?: number) => string;
  formatErrorMessage: (error: unknown, fallback: string) => string;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  /** Host wires GlbModelViewer here and resolves an authorized browser-readable URL; optional three peer dependencies load only when that viewer mounts. */
  renderModelPreview: (url: string, name: string) => ReactNode;
}

export interface MaterialDrawingsPanelProps {
  materialId: string;
  drawings?: readonly string[] | null;
  canEdit: boolean;
  onReload: () => void;
  capabilities: MaterialDrawingsPanelCapabilities;
}
