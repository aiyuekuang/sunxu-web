import { ArrowUpOutlined, FolderOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Spin,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BackupDirectoryListResponse,
  BackupDirectoryPickerProps,
} from './backup-directory-picker-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain system-operations
 * @sunxu-reason Preserves server-side backup-directory browsing and recoverable loading states while the host controls filesystem access.
 */
export function BackupDirectoryPicker({
  open,
  initialPath,
  onCancel,
  onSelect,
  listDirectories,
}: BackupDirectoryPickerProps) {
  const [directoryList, setDirectoryList] =
    useState<BackupDirectoryListResponse | null>(null);
  const [pathInput, setPathInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestIdRef = useRef(0);
  const listDirectoriesRef = useRef(listDirectories);
  listDirectoriesRef.current = listDirectories;

  const loadDirectory = useCallback(
    async (path?: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setLoading(true);
      setLoadFailed(false);
      setDirectoryList(null);
      try {
        const result = await listDirectoriesRef.current(
          path?.trim() ? { path: path.trim() } : {},
        );
        if (requestId === requestIdRef.current) {
          setDirectoryList(result);
          setPathInput(result.currentPath);
        }
      } catch {
        // The host service may report globally; retain this dialog's retry state.
        if (requestId === requestIdRef.current) setLoadFailed(true);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return undefined;
    void loadDirectory(initialPath);
    return () => {
      requestIdRef.current += 1;
    };
  }, [initialPath, loadDirectory, open]);

  return (
    <Modal
      title="选择服务器目录"
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      width="min(720px, calc(100vw - 32px))"
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            disabled={!directoryList || loading}
            onClick={() => {
              if (directoryList) onSelect(directoryList.currentPath);
            }}
          >
            选择当前目录
          </Button>
        </Space>
      }
    >
      <Space.Compact block>
        <Input
          aria-label="服务器绝对路径"
          value={pathInput}
          disabled={loading}
          onChange={(event) => setPathInput(event.target.value)}
          onPressEnter={() => void loadDirectory(pathInput)}
          placeholder="输入服务器上的绝对路径"
          maxLength={1024}
        />
        <Button loading={loading} onClick={() => void loadDirectory(pathInput)}>
          打开
        </Button>
      </Space.Compact>
      <Typography.Text
        type="secondary"
        style={{ display: 'block', marginTop: 8 }}
      >
        浏览的是 MES 服务所在机器的文件系统。Linux 从 / 开始；Windows
        从服务系统盘开始，其他盘可输入绝对路径（如 D:\mes-backups）。Docker
        部署只能看到容器内路径，请选择已挂载的持久化目录。
      </Typography.Text>

      <Space
        align="center"
        style={{ margin: '12px 0', width: '100%', minWidth: 0 }}
      >
        <Button
          icon={<ArrowUpOutlined />}
          disabled={!directoryList?.parentPath || loading}
          onClick={() => {
            if (directoryList?.parentPath) {
              void loadDirectory(directoryList.parentPath);
            }
          }}
        >
          上一级
        </Button>
        <Typography.Text
          code
          style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}
        >
          {directoryList?.currentPath || '正在读取目录'}
        </Typography.Text>
      </Space>

      {directoryList?.resolvedFromParent ? (
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginBottom: 12 }}
        >
          当前显示最近存在的上级目录；可继续进入子目录，或填写新目录（保存时自动创建）。
        </Typography.Text>
      ) : null}

      {loadFailed ? (
        <Alert
          showIcon
          type="error"
          message="无法读取该目录"
          description="请确认这是服务器上的绝对路径，并且 MES 服务运行账号有权访问，然后重试。"
          action={
            <Button size="small" onClick={() => void loadDirectory(pathInput)}>
              重试
            </Button>
          }
        />
      ) : (
        <Spin spinning={loading}>
          <div style={{ maxHeight: 360, minHeight: 180, overflowY: 'auto' }}>
            <List
              size="small"
              dataSource={[...(directoryList?.directories ?? [])]}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="没有可浏览的子目录"
                  />
                ),
              }}
              renderItem={(directory) => (
                <List.Item key={directory.path}>
                  <Button
                    type="link"
                    icon={<FolderOutlined />}
                    disabled={loading}
                    aria-label={`打开文件夹 ${directory.name}`}
                    onClick={() => void loadDirectory(directory.path)}
                  >
                    {directory.name}
                  </Button>
                </List.Item>
              )}
            />
          </div>
        </Spin>
      )}
    </Modal>
  );
}

export type { BackupDirectoryPickerProps };
