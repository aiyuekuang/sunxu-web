import { DownloadOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, type ButtonProps, type MenuProps } from 'antd';
import { useCallback, useMemo, useState } from 'react';

export interface MesExportButtonProps
  extends Omit<ButtonProps, 'onClick' | 'loading'> {
  /** Resolved by the MES host's permission model. */
  canExport?: boolean;
  exportFn: () => Promise<unknown>;
  fileName: string;
  download: (value: unknown, fileName: string) => void;
  onPrepareExport?: () => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/** MES export button behavior; permission, request, download and feedback stay host supplied. */
export function MesExportButton({
  canExport = true,
  exportFn,
  fileName,
  download,
  onPrepareExport,
  onSuccess,
  onError,
  children = '导出',
  icon = <DownloadOutlined />,
  ...buttonProps
}: MesExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await exportFn();
      download(result, fileName);
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [download, exportFn, fileName, onError, onSuccess]);

  if (!canExport) return null;

  return (
    <Button
      {...buttonProps}
      icon={icon}
      loading={loading}
      onClickCapture={onPrepareExport}
      onClick={handleExport}
    >
      {children}
    </Button>
  );
}

export interface MesExportDropdownItem {
  key: string;
  label: string;
  exportFn: () => Promise<unknown>;
  fileName: string;
  disabled?: boolean;
  /** Allows a host to skip applying the current table's visible column layout. */
  applyTableLayout?: boolean;
}

export interface MesExportDropdownButtonProps
  extends Omit<ButtonProps, 'onClick' | 'loading'> {
  items: MesExportDropdownItem[];
  download: (value: unknown, fileName: string) => void;
  onPrepareExport?: (applyTableLayout: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/** MES export menu; the host provides requests, table layout and download behavior. */
export function MesExportDropdownButton({
  items,
  download,
  onPrepareExport,
  onSuccess,
  onError,
  children = '导出 Excel',
  icon = <DownloadOutlined />,
  ...buttonProps
}: MesExportDropdownButtonProps) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.key, item])),
    [items],
  );

  const runExport = useCallback(
    async (item: MesExportDropdownItem) => {
      setLoadingKey(item.key);
      try {
        onPrepareExport?.(item.applyTableLayout !== false);
        const result = await item.exportFn();
        download(result, item.fileName);
        onSuccess?.();
      } catch (error) {
        onError?.(error);
      } finally {
        setLoadingKey(null);
      }
    },
    [download, onError, onPrepareExport, onSuccess],
  );

  const menu = useMemo<MenuProps>(
    () => ({
      items: items.map((item) => ({
        key: item.key,
        label: item.label,
        disabled: item.disabled,
      })),
      onClick: ({ key }) => {
        const item = itemMap.get(String(key));
        if (!item || item.disabled) return;
        void runExport(item);
      },
    }),
    [itemMap, items, runExport],
  );

  return (
    <Dropdown menu={menu} trigger={['click']}>
      <Button
        {...buttonProps}
        icon={icon}
        loading={loadingKey !== null}
        onClickCapture={() => onPrepareExport?.(true)}
      >
        {children}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}
