import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Space, Tooltip, Typography } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DocumentLineBatchSettingsButton,
  type DocumentLineBatchField,
} from './DocumentLineBatchSettingsButton';
import {
  ResizableProTable as ProTable,
  ResizableTable as Table,
  type ResizableTableConfig,
} from './ResizableTable';
import './DocumentLineEditableTable.css';

export interface DocumentLineRow {
  _key: string;
}

export interface DocumentLineBatchOperations<T extends DocumentLineRow> {
  enabled?: boolean;
  allowCopy?: boolean;
  fields?: DocumentLineBatchField<T>[];
  mapBatchPatch?: (row: T, patch: Partial<T>) => Partial<T>;
  onBatchPatchesApplied?: (
    selectedRows: readonly T[],
    patch: Partial<T>,
  ) => void;
  canRemoveRows?: (
    rowsToRemove: readonly T[],
    allRows: readonly T[],
  ) => boolean;
  autoSelectNewRows?: boolean;
}

export interface DocumentLineColumn<T extends DocumentLineRow> {
  key: string;
  title: ReactNode;
  required?: boolean;
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  render: (
    row: T,
    index: number,
    update: (patch: Partial<T>) => void,
  ) => ReactNode;
}

/** First, read-only material code column shared by MES document line editors. */
export function createMaterialCodeLineColumn<T extends DocumentLineRow>(
  getCode: (row: T) => string | null | undefined,
  options: { title?: ReactNode; width?: number; fixed?: 'left' | 'right' } = {},
): DocumentLineColumn<T> {
  return {
    key: 'materialCode',
    title: options.title ?? '物料编码',
    width: options.width ?? 150,
    fixed: options.fixed ?? 'left',
    render: (row) => {
      const code = getCode(row)?.trim();
      return (
        <Typography.Text ellipsis={{ tooltip: code || undefined }}>
          {code || '-'}
        </Typography.Text>
      );
    },
  };
}

export interface DocumentLineEditableTableProps<T extends DocumentLineRow> {
  className?: string;
  ariaLabel?: string;
  rows: T[];
  onRowsChange: (rows: T[]) => void;
  onRowsUpdate?: (updater: (rows: T[]) => T[]) => void;
  onRowPatch?: (row: T, patch: Partial<T>) => void;
  columns: DocumentLineColumn<T>[];
  createRow: () => T;
  cloneRow?: (row: T) => T;
  minRows?: number;
  addText?: string;
  disableAdd?: boolean;
  /** Hide the add-row action while keeping addRow available to owning flows. */
  hideAddButton?: boolean;
  disableCopy?: boolean;
  scrollX?: number;
  expandAllRows?: boolean;
  expandedRowRender?: (
    row: T,
    index: number,
    update: (patch: Partial<T>) => void,
  ) => ReactNode;
  summary?: (rows: readonly T[]) => ReactNode;
  emptyText?: ReactNode;
  addButtonClassName?: string;
  toolbarActions?: ReactNode;
  density?: 'default' | 'compact';
  batchOperations?: DocumentLineBatchOperations<T>;
  resizable?: boolean | ResizableTableConfig;
}

const INDEX_COLUMN_WIDTH = 64;
const ACTION_COLUMN_WIDTH = 112;
const DYNAMIC_COLUMN_PREFIXES = ['line-custom-', 'material-custom-'];
const renderEmptyToolbar = () => [];

function hashTableKey(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizePathname(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => {
      if (!segment) return segment;
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment,
        );
      const isLongHex = /^[0-9a-f]{16,}$/i.test(segment);
      const isNumericId = /^\d+$/.test(segment);
      return isUuid || isLongHex || isNumericId ? ':id' : segment;
    })
    .join('/');
}

function createPersistenceKey<T extends DocumentLineRow>(
  columns: readonly DocumentLineColumn<T>[],
): string {
  const pathname =
    typeof window === 'undefined'
      ? 'ssr'
      : normalizePathname(window.location.pathname);
  const stableKeys = columns
    .map((column) => column.key)
    .filter(
      (key) => !DYNAMIC_COLUMN_PREFIXES.some((prefix) => key.startsWith(prefix)),
    )
    .join('|');
  return `mes_table_width_document-line:${pathname}:${hashTableKey(stableKeys)}`;
}

function resolveResizableConfig<T extends DocumentLineRow>(
  value: boolean | ResizableTableConfig | undefined,
  columns: readonly DocumentLineColumn<T>[],
): boolean | ResizableTableConfig {
  if (value === false) return false;
  const persistenceKey = createPersistenceKey(columns);
  if (value === undefined || value === true) return { persistenceKey };
  return value.persistenceKey === undefined
    ? { ...value, persistenceKey }
    : value;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-lines
 * @sunxu-reason Retains MES line editing, row lifecycle, expansion, width settings, summary, density, and batch-operation contracts on the shared resizable table.
 */
export function DocumentLineEditableTable<T extends DocumentLineRow>({
  className,
  ariaLabel = '单据明细表',
  rows,
  onRowsChange,
  onRowsUpdate,
  onRowPatch,
  columns,
  createRow,
  cloneRow,
  minRows = 1,
  addText = '新增明细行',
  disableAdd = false,
  hideAddButton = false,
  disableCopy = disableAdd,
  scrollX = 1280,
  expandAllRows = false,
  expandedRowRender,
  summary,
  emptyText = '暂无明细行',
  addButtonClassName,
  toolbarActions,
  density = 'default',
  batchOperations,
  resizable,
}: DocumentLineEditableTableProps<T>) {
  const tableScrollRegionRef = useRef<HTMLElement>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const previousRowKeysRef = useRef<Set<string> | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const batchEnabled = batchOperations?.enabled === true;
  const batchFields = batchOperations?.fields ?? [];
  const selectedKeySet = useMemo(() => new Set(selectedRowKeys), [selectedRowKeys]);
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeySet.has(row._key)),
    [rows, selectedKeySet],
  );

  const commitRows = useCallback(
    (updater: (current: T[]) => T[]) => {
      const nextRows = updater(rowsRef.current);
      rowsRef.current = nextRows;
      if (onRowsUpdate) onRowsUpdate(updater);
      else onRowsChange(nextRows);
    },
    [onRowsChange, onRowsUpdate],
  );

  const ensureMinRows = useCallback(
    (nextRows: T[], fallbackRows: T[]) =>
      nextRows.length >= minRows
        ? nextRows
        : [...nextRows, ...fallbackRows.slice(0, minRows - nextRows.length)],
    [minRows],
  );

  useEffect(() => {
    if (rows.length >= minRows) return undefined;
    const fallbackRows = Array.from({ length: minRows }, createRow);
    const timer = window.setTimeout(() => {
      commitRows((currentRows) =>
        ensureMinRows(currentRows, fallbackRows),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [commitRows, createRow, ensureMinRows, minRows, rows.length]);

  useEffect(() => {
    const availableKeys = new Set(rows.map((row) => row._key));
    setSelectedRowKeys((current) => {
      const next = current.filter((key) => availableKeys.has(key));
      return next.length === current.length ? current : next;
    });
  }, [rows]);

  useEffect(() => {
    const currentKeys = new Set(rows.map((row) => row._key));
    const previousKeys = previousRowKeysRef.current;
    previousRowKeysRef.current = currentKeys;
    if (!batchEnabled || !batchOperations?.autoSelectNewRows || !previousKeys) {
      return;
    }
    const addedKeys = rows
      .filter((row) => !previousKeys.has(row._key))
      .map((row) => row._key);
    if (addedKeys.length) setSelectedRowKeys(addedKeys);
  }, [batchEnabled, batchOperations?.autoSelectNewRows, rows]);

  const updateRow = useCallback(
    (rowKey: string, patch: Partial<T>) => {
      const current = rowsRef.current.find((row) => row._key === rowKey);
      commitRows((currentRows) =>
        currentRows.map((row) =>
          row._key === rowKey ? { ...row, ...patch } : row,
        ),
      );
      if (current) onRowPatch?.(current, patch);
    },
    [commitRows, onRowPatch],
  );

  const addRow = useCallback(() => {
    const nextRow = createRow();
    commitRows((currentRows) => [...currentRows, nextRow]);
  }, [commitRows, createRow]);

  const insertAfter = useCallback(
    (rowKey: string) => {
      const nextRow = createRow();
      commitRows((currentRows) => {
        const index = currentRows.findIndex((row) => row._key === rowKey);
        return index < 0
          ? [...currentRows, nextRow]
          : [
              ...currentRows.slice(0, index + 1),
              nextRow,
              ...currentRows.slice(index + 1),
            ];
      });
    },
    [commitRows, createRow],
  );

  const copyAfter = useCallback(
    (row: T) => {
      const sourceRow = rowsRef.current.find((item) => item._key === row._key);
      if (!sourceRow) return;
      const nextRow = cloneRow ? cloneRow(sourceRow) : createRow();
      commitRows((currentRows) => {
        const index = currentRows.findIndex((item) => item._key === row._key);
        return index < 0
          ? [...currentRows, nextRow]
          : [
              ...currentRows.slice(0, index + 1),
              nextRow,
              ...currentRows.slice(index + 1),
            ];
      });
    },
    [cloneRow, commitRows, createRow],
  );

  const removeRow = useCallback(
    (rowKey: string) => {
      const currentRows = rowsRef.current;
      const row = currentRows.find((item) => item._key === rowKey);
      if (
        !row ||
        batchOperations?.canRemoveRows?.([row], currentRows) === false
      ) {
        return;
      }
      const fallbackRows = Array.from({ length: minRows }, createRow);
      commitRows((latestRows) =>
        ensureMinRows(
          latestRows.filter((item) => item._key !== rowKey),
          fallbackRows,
        ),
      );
    },
    [batchOperations, commitRows, createRow, ensureMinRows, minRows],
  );

  const clearSelection = useCallback(() => setSelectedRowKeys([]), []);

  const copySelectedRows = useCallback(() => {
    if (!cloneRow) return;
    const currentSelectedRows = rowsRef.current.filter((row) =>
      selectedKeySet.has(row._key),
    );
    if (currentSelectedRows.length === 0) return;
    const copies = currentSelectedRows.map((row) => cloneRow(row));
    commitRows((currentRows) => [...currentRows, ...copies]);
    clearSelection();
  }, [clearSelection, cloneRow, commitRows, selectedKeySet]);

  const removeSelectedRows = useCallback(() => {
    const currentRows = rowsRef.current;
    const currentSelectedRows = currentRows.filter((row) =>
      selectedKeySet.has(row._key),
    );
    if (currentSelectedRows.length === 0) return;
    if (
      batchOperations?.canRemoveRows?.(currentSelectedRows, currentRows) ===
      false
    ) {
      return;
    }
    Modal.confirm({
      title: `确认删除选中的 ${currentSelectedRows.length} 行？`,
      content: '删除后无法恢复；未保存的明细会直接从当前单据中移除。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const keys = new Set(currentSelectedRows.map((row) => row._key));
        const fallbackRows = Array.from({ length: minRows }, createRow);
        commitRows((latestRows) => {
          const latestSelectedRows = latestRows.filter((row) =>
            keys.has(row._key),
          );
          if (
            latestSelectedRows.length === 0 ||
            batchOperations?.canRemoveRows?.(latestSelectedRows, latestRows) ===
              false
          ) {
            return latestRows;
          }
          return ensureMinRows(
            latestRows.filter((row) => !keys.has(row._key)),
            fallbackRows,
          );
        });
        clearSelection();
      },
    });
  }, [
    batchOperations,
    clearSelection,
    commitRows,
    createRow,
    ensureMinRows,
    minRows,
    selectedKeySet,
  ]);

  const applyBatchPatches = useCallback(
    (patches: Array<Partial<T>>) => {
      const patch = Object.assign({}, ...patches) as Partial<T>;
      const currentSelectedRows = rowsRef.current.filter((row) =>
        selectedKeySet.has(row._key),
      );
      if (currentSelectedRows.length === 0) return;
      commitRows((currentRows) =>
        currentRows.map((row) =>
          selectedKeySet.has(row._key)
            ? {
                ...row,
                ...(batchOperations?.mapBatchPatch?.(row, patch) ?? patch),
              }
            : row,
        ),
      );
      batchOperations?.onBatchPatchesApplied?.(currentSelectedRows, patch);
    },
    [batchOperations, commitRows, selectedKeySet],
  );

  const rowSelection = useMemo<TableRowSelection<T> | undefined>(
    () =>
      batchEnabled
        ? {
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys.map(String)),
          }
        : undefined,
    [batchEnabled, selectedRowKeys],
  );

  const canRemoveSelectedRows =
    selectedRows.length === 0 ||
    batchOperations?.canRemoveRows?.(selectedRows, rows) !== false;
  const resolvedResizable = useMemo(
    () => resolveResizableConfig(resizable, columns),
    [columns, resizable],
  );

  const tableColumns = useMemo<ProColumns<T>[]>(
    () => [
      {
        title: '行号',
        key: 'rowIndex',
        width: INDEX_COLUMN_WIDTH,
        fixed: 'left',
        align: 'center',
        hideInSetting: true,
        resizable: false,
        render: (_, _row, index) => (
          <Typography.Text type="secondary">{index + 1}</Typography.Text>
        ),
      },
      ...columns.map<ProColumns<T>>((column) => ({
        key: column.key,
        dataIndex: column.key,
        title: (
          <Space size={4}>
            {column.required ? (
              <Typography.Text type="danger">*</Typography.Text>
            ) : null}
            <span>{column.title}</span>
          </Space>
        ),
        width: column.width,
        fixed: column.fixed,
        align: column.align,
        render: (_, row, index) =>
          column.render(row, index, (patch) => updateRow(row._key, patch)),
      })),
      {
        title: '操作',
        key: 'actions',
        dataIndex: '__actions',
        valueType: 'option',
        width: ACTION_COLUMN_WIDTH,
        fixed: 'right',
        align: 'center',
        hideInSetting: true,
        resizable: false,
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="插入下一行">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                aria-label="插入下一行"
                disabled={disableAdd}
                onClick={() => insertAfter(row._key)}
              />
            </Tooltip>
            <Tooltip title="复制行">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                aria-label="复制行"
                disabled={disableCopy || !cloneRow}
                onClick={() => copyAfter(row)}
              />
            </Tooltip>
            <Tooltip
              title={
                rows.length <= minRows
                  ? `至少保留 ${minRows} 行`
                  : batchOperations?.canRemoveRows?.([row], rows) === false
                    ? '当前来源明细至少保留一行'
                    : '删除行'
              }
            >
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                aria-label="删除行"
                disabled={
                  rows.length <= minRows ||
                  batchOperations?.canRemoveRows?.([row], rows) === false
                }
                onClick={() => removeRow(row._key)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [
      batchOperations?.canRemoveRows,
      cloneRow,
      columns,
      copyAfter,
      disableAdd,
      disableCopy,
      insertAfter,
      minRows,
      removeRow,
      rows,
      updateRow,
    ],
  );

  const effectiveScrollX = useMemo(() => {
    const businessWidth = columns.reduce(
      (sum, column) =>
        sum + (typeof column.width === 'number' ? column.width : 0),
      0,
    );
    return Math.max(
      scrollX,
      businessWidth + INDEX_COLUMN_WIDTH + ACTION_COLUMN_WIDTH + (batchEnabled ? 48 : 0),
    );
  }, [batchEnabled, columns, scrollX]);

  useEffect(() => {
    const scrollAreas = tableScrollRegionRef.current?.querySelectorAll<HTMLElement>(
      '.ant-table-content, .ant-table-body',
    );
    const target = scrollAreas?.[0];
    if (!target) return undefined;

    const previousTabIndex = target.getAttribute('tabindex');
    const previousRole = target.getAttribute('role');
    const previousLabel = target.getAttribute('aria-label');
    target.setAttribute('tabindex', '0');
    target.setAttribute('role', 'region');
    target.setAttribute('aria-label', `${ariaLabel}，可横向滚动`);

    return () => {
      if (previousTabIndex === null) target.removeAttribute('tabindex');
      else target.setAttribute('tabindex', previousTabIndex);
      if (previousRole === null) target.removeAttribute('role');
      else target.setAttribute('role', previousRole);
      if (previousLabel === null) target.removeAttribute('aria-label');
      else target.setAttribute('aria-label', previousLabel);
    };
  }, [ariaLabel, effectiveScrollX, rows.length, tableColumns]);

  const toolbarRender = useCallback(
    () =>
      toolbarActions
        ? [
            <div key="document-line-toolbar-actions" className="mes-document-line-editable-table-toolbar">
              {toolbarActions}
            </div>,
          ]
        : [],
    [toolbarActions],
  );

  return (
    <section
      ref={tableScrollRegionRef}
      className={[
        'mes-document-line-editable-table',
        density === 'compact' ? 'mes-document-line-editable-table-compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={ariaLabel}
    >
      <ProTable<T>
        bordered
        size="small"
        rowKey="_key"
        columns={tableColumns}
        dataSource={rows}
        rowSelection={rowSelection}
        search={false}
        fitContainerHeight={false}
        headerTitle={false}
        toolBarRender={toolbarActions ? toolbarRender : renderEmptyToolbar}
        options={{ reload: false, density: false, fullScreen: false, setting: true }}
        resizable={resolvedResizable}
        pagination={false}
        scroll={{ x: effectiveScrollX }}
        tableLayout="fixed"
        locale={{ emptyText }}
        tableAlertOptionRender={
          batchEnabled
            ? ({ onCleanSelected }) => (
                <Space wrap>
                  {batchFields.length > 0 ? (
                    <DocumentLineBatchSettingsButton<T>
                      selectedCount={selectedRows.length}
                      fields={batchFields}
                      onApply={applyBatchPatches}
                    />
                  ) : null}
                  {batchOperations?.allowCopy !== false && cloneRow ? (
                    <Button type="link" onClick={copySelectedRows}>
                      批量复制 ({selectedRows.length})
                    </Button>
                  ) : null}
                  <Button
                    type="link"
                    danger
                    disabled={!canRemoveSelectedRows}
                    onClick={removeSelectedRows}
                  >
                    批量删除 ({selectedRows.length})
                  </Button>
                  <Button
                    type="link"
                    onClick={() => {
                      onCleanSelected();
                      clearSelection();
                    }}
                  >
                    取消选择
                  </Button>
                </Space>
              )
            : undefined
        }
        expandable={
          expandedRowRender
            ? {
                expandedRowKeys: expandAllRows
                  ? rows.map((row) => row._key)
                  : undefined,
                expandedRowRender: (row, index, _indent, expanded) =>
                  expanded
                    ? expandedRowRender(row, index, (patch) =>
                        updateRow(row._key, patch),
                      )
                    : null,
              }
            : undefined
        }
        summary={summary ? () => summary(rows) : undefined}
      />
      {!hideAddButton ? (
        <Button
          className={addButtonClassName}
          icon={<PlusOutlined />}
          onClick={addRow}
          disabled={disableAdd}
        >
          {addText}
        </Button>
      ) : null}
    </section>
  );
}
