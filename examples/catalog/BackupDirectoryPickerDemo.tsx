import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BackupDirectoryPicker,
  type BackupDirectoryListResponse,
} from '../../src/business';

const directories: Record<string, BackupDirectoryListResponse> = {
  '/': {
    currentPath: '/',
    directories: [
      { path: '/data', name: 'data' },
      { path: '/var', name: 'var' },
    ],
  },
  '/data': {
    currentPath: '/data',
    parentPath: '/',
    directories: [
      { path: '/data/backups', name: 'backups' },
      { path: '/data/exports', name: 'exports' },
    ],
  },
  '/data/backups': {
    currentPath: '/data/backups',
    parentPath: '/data',
    directories: [],
  },
  '/var': {
    currentPath: '/var',
    parentPath: '/',
    directories: [{ path: '/var/lib', name: 'lib' }],
  },
  '/var/lib': {
    currentPath: '/var/lib',
    parentPath: '/var',
    directories: [],
  },
};

export function BackupDirectoryPickerDemo() {
  const [open, setOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState('尚未选择');

  return (
    <SectionCard title="服务器备份目录选择">
      <Typography.Paragraph type="secondary">
        浏览服务器实际目录；文件系统访问和新目录创建由宿主服务控制。
      </Typography.Paragraph>
      <Space>
        <Button type="primary" onClick={() => setOpen(true)}>
          选择目录
        </Button>
        <Typography.Text>{selectedPath}</Typography.Text>
      </Space>
      <BackupDirectoryPicker
        open={open}
        initialPath="/data"
        onCancel={() => setOpen(false)}
        onSelect={(path) => {
          setSelectedPath(path);
          setOpen(false);
        }}
        listDirectories={async ({ path }) => {
          await new Promise((resolve) => window.setTimeout(resolve, 120));
          if (path === '/unavailable') throw new Error('目录不可读');
          const normalized = path?.trim() || '/';
          return (
            directories[normalized] ?? {
              currentPath: normalized,
              parentPath: normalized === '/' ? undefined : '/',
              resolvedFromParent: true,
              directories: [],
            }
          );
        }}
      />
    </SectionCard>
  );
}
