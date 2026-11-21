export interface ServerSystemStats {
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
    loadAvg: readonly number[];
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercent: number;
  };
  disk: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercent: number;
  };
  os: {
    hostname: string;
    platform: string;
    arch: string;
    release: string;
    uptime: number;
  };
  node: {
    version: string;
    processUptime: number;
    pid: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
    rssBytes: number;
  };
  timestamp: string;
}

export interface ServerFileStats {
  totalCount: number;
  totalSize: number;
  byStatus: readonly {
    status: string;
    count: number;
    size: number;
  }[];
  byEntityType: readonly {
    entityType: string | null;
    count: number;
    size: number;
  }[];
  byMimeType: readonly {
    mimeCategory: string;
    count: number;
    size: number;
  }[];
}

/** Host-owned server telemetry, socket subscription, and formatting functions. */
export interface ServerInfoCardCapabilities {
  requestSystemStats: () => Promise<ServerSystemStats>;
  /** Subscribe to the host's live event stream; reconnect handling and re-subscription stay in the host. */
  subscribeSystemStats: (
    onStats: (stats: ServerSystemStats) => void,
  ) => () => void;
  formatBytes: (bytes: number) => string;
  formatCompactNumber: (value: number) => string;
  formatUptime: (seconds: number) => string;
  formatPlatformLabel: (platform: string) => string;
  formatErrorMessage: (error: unknown, fallback: string) => string;
}

export interface ServerInfoCardProps {
  fileStats: ServerFileStats | null;
  capabilities: ServerInfoCardCapabilities;
}
