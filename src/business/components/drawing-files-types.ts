export interface DrawingFileUploadResponse {
  urls?: readonly string[] | null;
}

export interface DrawingFileUploadRequest {
  data: FormData;
  headers?: Record<string, string>;
}

export type DrawingFileUploadFn = (
  request: DrawingFileUploadRequest,
) => Promise<DrawingFileUploadResponse | null | undefined>;

/** Host-owned file proxy, upload, and original-name lookups for MES attachments. */
export interface MesDrawingFilesCapabilities {
  /** Worker URL emitted from the same pdfjs-dist version as the React-PDF peer. */
  pdfWorkerSrc?: string;
  /** Uploads through the host's authenticated file service. */
  uploadFiles?: DrawingFileUploadFn;
  /** Fetches a URL through the host's authorized download proxy. */
  fetchFileBlob?: (url: string) => Promise<Blob>;
  /** Downloads a URL through the host's authorized download proxy. */
  downloadUrl?: (url: string, fileName: string) => Promise<void>;
  /** Resolves original file names keyed by the same URL strings supplied. */
  resolveFileDisplayNames?: (
    urls: readonly string[],
  ) => Promise<Readonly<Record<string, string | null | undefined>>>;
  /** Downloads an already fetched blob with the host's filename policy. */
  downloadBlob?: (blob: Blob, fileName: string) => void;
}
