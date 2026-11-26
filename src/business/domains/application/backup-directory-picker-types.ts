export interface BackupDirectoryEntry {
  path: string;
  name: string;
}

export interface BackupDirectoryListResponse {
  currentPath: string;
  parentPath?: string | null;
  resolvedFromParent?: boolean;
  directories: readonly BackupDirectoryEntry[];
}

export interface BackupDirectoryPickerProps {
  open: boolean;
  initialPath: string;
  onCancel: () => void;
  onSelect: (path: string) => void;
  listDirectories: (params: { path?: string }) => Promise<BackupDirectoryListResponse>;
}
