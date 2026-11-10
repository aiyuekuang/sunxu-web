import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  App,
  Button,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import type { Key, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BatchFieldSettingsButton,
  type EditableDetailBatchField,
} from './BatchFieldSettingsButton';

export type EditableDetailColumn<T> = {
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
};

export type EditableDetailBatchOperations<T> = {
  fields?: EditableDetailBatchField<T>[];
  allowCopy?: boolean;
  allowDelete?: boolean;
  autoSelectNewRows?: boolean;
  canRemoveRows?: (rowsToRemove: readonly T[], allRows: readonly T[]) => boolean;
  mapRowPatch?: (row: T, patch: Partial<T>) => Partial<T>;
  onBatchApplied?: (selectedRows: readonly T[], patch: Partial<T>) => void;
};

export interface EditableDetailTableProps<T> {
  className?: string;
  rows: T[];
  onRowsChange: (rows: T[]) => void;
  rowKey: (row: T) => Key;
  columns: EditableDetailColumn<T>[];
  createRow: () => T;
  cloneRow?: (row: T) => T;
  onRowPatch?: (row: T, patch: Partial<T>) => void;
  minRows?: number;
  addText?: string;
  disableAdd?: boolean;
  disableCopy?: boolean;
  emptyText?: ReactNode;
  toolbarActions?: ReactNode;
  batchOperations?: EditableDetailBatchOperations<T>;
}

type ProTableRow<T> = T & Record<string, unknown>;

const ROW_INDEX_WIDTH = 64;
const ROW_ACTIONS_WIDTH = 112;

export function EditableDetailTable<T>({
  className,
  rows,
  onRowsChange,
  rowKey,
  columns,
  createRow,
  cloneRow,
  onRowPatch,
  minRows = 0,
  addText = '新增明细行',
  disableAdd = false,
  disableCopy = false,
  emptyText = '暂无明细行',
  toolbarActions,
  batchOperations,
}: EditableDetailTableProps<T>) {
  const { modal } = App.useApp();
  const tableHostRef = useRef<HTMLDivElement>(null);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const previousRowKeys = useRef<Set<Key> | null>(null);
  const batchEnabled = batchOperations !== undefined;
  const selectedKeySet = useMemo(() => new Set(selectedRowKeys), [selectedRowKeys]);
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeySet.has(rowKey(row))),
    [rowKey, rows, selectedKeySet],
  );
  const rowsRef = useMemo(() => new Map(rows.map((row) => [rowKey(row), row])), [rowKey, rows]);

  useEffect(() => {
    const currentKeys = new Set(rows.map((row) => rowKey(row)));
    const previousKeys = previousRowKeys.current;
    previousRowKeys.current = currentKeys;
    const addedKeys =
      batchOperations?.autoSelectNewRows && previousKeys
        ? rows
            .filter((row) => !previousKeys.has(rowKey(row)))
            .map((row) => rowKey(row))
        : [];
    setSelectedRowKeys((current) => {
      const next =
        addedKeys.length > 0
          ? addedKeys
          : current.filter((key) => currentKeys.has(key));
      return next.length === current.length &&
        next.every((key, index) => key === current[index])
        ? current
        : next;
    });
  }, [batchOperations?.autoSelectNewRows, rowKey, rows]);

  const ensureMinRows = useCallback(
    (nextRows: T[]) => {
      const missingCount = Math.max(0, minRows - nextRows.length);
      return missingCount === 0
        ? nextRows
        : [...nextRows, ...Array.from({ length: missingCount }, createRow)];
    },
    [createRow, minRows],
  );

  const updateRow = useCallback(
    (key: Key, patch: Partial<T>) => {
      const current = rowsRef.get(key);
      onRowsChange(
        rows.map((row) =>
          rowKey(row) === key ? { ...row, ...patch } : row,
        ),
      );
      if (current) onRowPatch?.(current, patch);
    },
    [onRowPatch, onRowsChange, rowKey, rows, rowsRef],
  );

  const addRow = useCallback(() => {
    onRowsChange([...rows, createRow()]);
  }, [createRow, onRowsChange, rows]);

  const insertAfter = useCallback(
    (key: Key) => {
      const index = rows.findIndex((row) => rowKey(row) === key);
      const nextRow = createRow();
      onRowsChange(
        index < 0
          ? [...rows, nextRow]
          : [...rows.slice(0, index + 1), nextRow, ...rows.slice(index + 1)],
      );
    },
    [createRow, onRowsChange, rowKey, rows],
  );

  const copyAfter = useCallback(
    (row: T) => {
      const index = rows.findIndex((item) => rowKey(item) === rowKey(row));
      const nextRow = cloneRow ? cloneRow(row) : createRow();
      onRowsChange(
        index < 0
          ? [...rows, nextRow]
          : [...rows.slice(0, index + 1), nextRow, ...rows.slice(index + 1)],
      );
    },
    [cloneRow, createRow, onRowsChange, rowKey, rows],
  );

  const removeRows = useCallback(
    (rowsToRemove: readonly T[]) => {
      if (batchOperations?.canRemoveRows?.(rowsToRemove, rows) === false) return;
      const keysToRemove = new Set(rowsToRemove.map(rowKey));
      onRowsChange(ensureMinRows(rows.filter((row) => !keysToRemove.has(rowKey(row)))));
      setSelectedRowKeys((current) => current.filter((key) => !keysToRemove.has(key)));
    },
    [batchOperations, ensureMinRows, onRowsChange, rowKey, rows],
  );

  const removeSelectedRows = useCallback(() => {
    if (selectedRows.length === 0) return;
    if (batchOperations?.canRemoveRows?.(selectedRows, rows) === false) return;
    modal.confirm({
      title: `确认删除选中的 ${selectedRows.length} 行？`,
      content: '删除后无法恢复；未保存的明细会从当前编辑内容中移除。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => removeRows(selectedRows),
    });
  }, [batchOperations, modal, removeRows, rows, selectedRows]);

  const applyBatchPatches = useCallback(
    (patches: Array<Partial<T>>) => {
      const mergedPatch = Object.assign({}, ...patches) as Partial<T>;
      const currentSelectedRows = rows.filter((row) => selectedKeySet.has(rowKey(row)));
      if (currentSelectedRows.length === 0) return;
      onRowsChange(
        rows.map((row) =>
          selectedKeySet.has(rowKey(row))
            ? { ...row, ...(batchOperations?.mapRowPatch?.(row, mergedPatch) ?? mergedPatch) }
            : row,
        ),
      );
      batchOperations?.onBatchApplied?.(currentSelectedRows, mergedPatch);
    },
    [batchOperations, onRowsChange, rowKey, rows, selectedKeySet],
  );

  const rowSelection = useMemo<
    TableRowSelection<ProTableRow<T>> | undefined
  >(
    () =>
      batchEnabled
        ? {
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }
        : undefined,
    [batchEnabled, selectedRowKeys],
  );

  const tableColumns = useMemo<ProColumns<ProTableRow<T>>[]>(
    () => [
      {
        title: '行号',
        key: 'rowIndex',
        width: ROW_INDEX_WIDTH,
        fixed: 'left',
        align: 'center',
        hideInSetting: true,
        render: (_, _row, index) => (
          <Typography.Text type="secondary">{index + 1}</Typography.Text>
        ),
      },
      ...columns.map<ProColumns<ProTableRow<T>>>((column) => ({
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
          column.render(row, index, (patch) => updateRow(rowKey(row), patch)),
      })),
      {
        title: '操作',
        key: 'rowActions',
        valueType: 'option',
        width: ROW_ACTIONS_WIDTH,
        fixed: 'right',
        align: 'center',
        hideInSetting: true,
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="插入下一行">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                aria-label="插入下一行"
                disabled={disableAdd}
                onClick={() => insertAfter(rowKey(row))}
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
            <Tooltip title={rows.length <= minRows ? `至少保留 ${minRows} 行` : '删除行'}>
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                aria-label="删除行"
                disabled={rows.length <= minRows}
                onClick={() => removeRows([row])}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [
      columns,
      copyAfter,
      disableAdd,
      disableCopy,
      insertAfter,
      minRows,
      removeRows,
      rowKey,
      rows.length,
      updateRow,
    ],
  );

  const scrollX = useMemo(() => {
    const businessWidth = columns.reduce(
      (sum, column) => sum + (typeof column.width === 'number' ? column.width : 0),
      0,
    );
    return businessWidth + ROW_INDEX_WIDTH + ROW_ACTIONS_WIDTH + (batchEnabled ? 48 : 0);
  }, [batchEnabled, columns]);

  useEffect(() => {
    const tableHost = tableHostRef.current;
    const tableContent = tableHost?.querySelector<HTMLElement>('.ant-table-content');
    if (!tableContent) return;

    const updateOverflow = () => {
      const next = tableContent.scrollWidth > tableContent.clientWidth + 1;
      setHasHorizontalOverflow((current) => current === next ? current : next);
    };

    updateOverflow();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(updateOverflow);
    resizeObserver?.observe(tableContent);
    const table = tableContent.querySelector('table');
    if (table) resizeObserver?.observe(table);
    window.addEventListener('resize', updateOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateOverflow);
    };
  }, [columns, rows.length, scrollX]);

  const canDeleteSelected =
    selectedRows.length === 0 ||
    batchOperations?.canRemoveRows?.(selectedRows, rows) !== false;

  return (
    <div
      ref={tableHostRef}
      className={['sxw-editable-detail-table', className].filter(Boolean).join(' ')}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', minWidth: 0 }}
    >
      <ProTable<ProTableRow<T>>
        bordered
        size="small"
        rowKey={rowKey}
        columns={tableColumns}
        dataSource={rows as ProTableRow<T>[]}
        rowSelection={rowSelection}
        search={false}
        headerTitle={false}
        toolBarRender={() => [
          ...(toolbarActions ? [toolbarActions] : []),
          <Button
            key="add-row"
            icon={<PlusOutlined />}
            onClick={addRow}
            disabled={disableAdd}
          >
            {addText}
          </Button>,
        ]}
        options={false}
        pagination={false}
        scroll={{ x: scrollX || 'max-content' }}
        tableLayout="fixed"
        locale={{ emptyText }}
        tableAlertOptionRender={
          batchEnabled
            ? ({ onCleanSelected }) => (
                <Space wrap>
                  {batchOperations?.fields?.length ? (
                    <BatchFieldSettingsButton
                      selectedCount={selectedRows.length}
                      fields={batchOperations.fields}
                      onApply={applyBatchPatches}
                    />
                  ) : null}
                  {batchOperations?.allowCopy !== false && cloneRow ? (
                    <Button
                      type="link"
                      disabled={selectedRows.length === 0}
                      onClick={() => {
                        const copies = selectedRows.map((row) => cloneRow?.(row)).filter((row): row is T => row !== undefined);
                        onRowsChange([...rows, ...copies]);
                        setSelectedRowKeys([]);
                      }}
                    >
                      批量复制 ({selectedRows.length})
                    </Button>
                  ) : null}
                  {batchOperations?.allowDelete !== false ? (
                    <Button
                      type="link"
                      danger
                      disabled={selectedRows.length === 0 || !canDeleteSelected}
                      onClick={removeSelectedRows}
                    >
                      批量删除 ({selectedRows.length})
                    </Button>
                  ) : null}
                  <Button
                    type="link"
                    onClick={() => {
                      onCleanSelected();
                      setSelectedRowKeys([]);
                    }}
                  >
                    取消选择
                  </Button>
                </Space>
              )
            : undefined
        }
      />
      {hasHorizontalOverflow ? (
        <Typography.Text
          className="sxw-editable-detail-table__scroll-hint"
          role="note"
        >
          左右滚动查看其余列
        </Typography.Text>
      ) : null}
    </div>
  );
}
