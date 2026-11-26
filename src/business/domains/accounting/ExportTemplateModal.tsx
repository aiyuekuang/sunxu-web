/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves statement export-column ordering, visibility, custom Excel template upload/download/reset, and placeholder guidance while injecting permission, data, downloads, messages, and dictionaries. */
import {
  DownloadOutlined,
  HolderOutlined,
  SaveOutlined,
  UndoOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ContextualHelp } from '../../../components/ContextualHelp';
import { ResizableTable as Table } from '../shared/ResizableTable';
import type {
  ExportTemplateModalProps,
  StatementTemplateColumnOption,
  StatementTemplateInfo,
} from './finance-statement-template-types';

interface ColumnItem extends StatementTemplateColumnOption {
  visible: boolean;
}

/** Applies saved ordering first, then appends uncategorized columns unchecked. */
function buildColumnItems(
  catalog: StatementTemplateColumnOption[],
  configured?: string[],
): ColumnItem[] {
  if (!configured?.length) {
    return catalog.map((option) => ({ ...option, visible: option.defaultVisible }));
  }
  const byField = new Map(catalog.map((option) => [option.field, option]));
  const items: ColumnItem[] = [];
  const seen = new Set<string>();
  for (const field of configured) {
    const option = byField.get(field);
    if (option && !seen.has(field)) {
      items.push({ ...option, visible: true });
      seen.add(field);
    }
  }
  for (const option of catalog) {
    if (!seen.has(option.field)) {
      items.push({ ...option, visible: false });
    }
  }
  return items;
}

function SortableColumnItem({
  item,
  onToggle,
}: {
  item: ColumnItem;
  onToggle: (field: string, visible: boolean) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.field });

  const style: CSSProperties = {
    alignItems: 'center',
    background: isDragging
      ? 'var(--ant-color-bg-layout)'
      : 'var(--ant-color-bg-container)',
    border: '1px solid var(--ant-color-border-secondary)',
    borderRadius: 6,
    display: 'flex',
    gap: 8,
    marginBottom: 6,
    opacity: isDragging ? 0.6 : 1,
    padding: '6px 10px',
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button
        {...listeners}
        aria-label="拖拽排序"
        type="button"
        style={{
          background: 'transparent',
          border: 0,
          color: 'var(--ant-color-text-tertiary)',
          cursor: 'grab',
          display: 'inline-flex',
          padding: 0,
        }}
      >
        <HolderOutlined />
      </button>
      <Checkbox
        checked={item.visible}
        onChange={(event) => onToggle(item.field, event.target.checked)}
      />
      <Typography.Text strong={item.visible} type={item.visible ? undefined : 'secondary'}>
        {item.header}
      </Typography.Text>
      {item.label !== item.header ? (
        <Typography.Text
          ellipsis
          type="secondary"
          style={{ flex: 1, fontSize: 12, minWidth: 0 }}
        >
          {item.label}
        </Typography.Text>
      ) : null}
    </div>
  );
}

function ColumnConfigList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: ColumnItem[];
  onChange: (items: ColumnItem[]) => void;
}) {
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((item) => item.field === active.id);
      const newIndex = items.findIndex((item) => item.field === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onChange(arrayMove(items, oldIndex, newIndex));
    },
    [items, onChange],
  );

  const visibleCount = items.filter((item) => item.visible).length;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Space size={8}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          已选 {visibleCount} 列
        </Typography.Text>
      </Space>
      <div
        style={{
          marginTop: 8,
          maxHeight: 320,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((item) => item.field)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableColumnItem
                key={item.field}
                item={item}
                onToggle={(field, visible) =>
                  onChange(
                    items.map((current) =>
                      current.field === field
                        ? { ...current, visible }
                        : current,
                    ),
                  )
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

/** Configures default export columns and the optional custom Excel layout. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable export template modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ExportTemplateModal({
  open,
  type,
  onOpenChange,
  capabilities,
}: ExportTemplateModalProps) {
  const [info, setInfo] = useState<StatementTemplateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [ledgerItems, setLedgerItems] = useState<ColumnItem[]>([]);
  const [itemItems, setItemItems] = useState<ColumnItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [resettingColumns, setResettingColumns] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const typeLabel = type === 'payable' ? '应付' : '应收';

  const loadInfo = useCallback(async () => {
    setLoading(true);
    try {
      const result = await capabilities.requestTemplateInfo(type);
      setInfo(result);
      setLedgerItems(
        buildColumnItems(result.columnCatalog.docLine, result.columnConfig?.docLine),
      );
      setItemItems(
        buildColumnItems(result.columnCatalog.itemLine, result.columnConfig?.itemLine),
      );
    } finally {
      setLoading(false);
    }
  }, [capabilities.requestTemplateInfo, type]);

  useEffect(() => {
    if (open) void loadInfo();
  }, [open, loadInfo]);

  const handleSaveColumns = useCallback(async () => {
    const docLine = ledgerItems
      .filter((item) => item.visible)
      .map((item) => item.field);
    const itemLine = itemItems
      .filter((item) => item.visible)
      .map((item) => item.field);
    if (docLine.length === 0 || itemLine.length === 0) {
      capabilities.notifyWarning('台账区和商品明细区都至少保留 1 列');
      return;
    }
    setSaving(true);
    try {
      await capabilities.saveColumnConfig({ type, docLine, itemLine });
      capabilities.notifySuccess('列配置已保存，导出将按新列生成');
      await loadInfo();
    } finally {
      setSaving(false);
    }
  }, [capabilities, itemItems, ledgerItems, loadInfo, type]);

  const handleResetColumns = useCallback(async () => {
    setResettingColumns(true);
    try {
      await capabilities.saveColumnConfig({ type });
      capabilities.notifySuccess('已恢复默认列');
      await loadInfo();
    } finally {
      setResettingColumns(false);
    }
  }, [capabilities, loadInfo, type]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await capabilities.downloadTemplate({
        type,
        fileName:
          info?.isCustom && info.fileName
            ? info.fileName
            : `对账单导出模板_${typeLabel}_默认.xlsx`,
      });
    } finally {
      setDownloading(false);
    }
  }, [capabilities, info, type, typeLabel]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await capabilities.uploadTemplate(type, file);
        if (result.unknownTokens.length > 0) {
          capabilities.notifyWarning(
            `模板已保存，但存在未识别的占位符（导出时将原样输出）：${result.unknownTokens.join('、')}`,
            8,
          );
        } else {
          capabilities.notifySuccess('自定义模板已上传，导出将按新模板生成');
        }
        await loadInfo();
      } finally {
        setUploading(false);
      }
      return false;
    },
    [capabilities, loadInfo, type],
  );

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      await capabilities.resetTemplate(type);
      capabilities.notifySuccess('已删除自定义 Excel 模板，导出恢复为默认模板');
      await loadInfo();
    } finally {
      setResetting(false);
    }
  }, [capabilities, loadInfo, type]);

  const hasColumnConfig = Boolean(
    info?.columnConfig?.docLine?.length || info?.columnConfig?.itemLine?.length,
  );

  return (
    <Modal
      open={open}
      title={`${typeLabel}对账单导出模板设置`}
      width={920}
      footer={null}
      onCancel={() => onOpenChange(false)}
    >
      <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
        <Space wrap>
          <Typography.Text>
            当前生效：
            {info?.isCustom ? (
              <>
                <Tag color="green">公司自定义 Excel 模板</Tag>
                <Typography.Text type="secondary">
                  {info.fileName}
                  {info.updatedAt
                    ? `（${new Date(info.updatedAt).toLocaleString()} 上传）`
                    : ''}
                </Typography.Text>
              </>
            ) : hasColumnConfig ? (
              <Tag color="blue">默认模板（已自定义列）</Tag>
            ) : (
              <Tag>内置默认模板</Tag>
            )}
          </Typography.Text>
        </Space>

        {info?.isCustom ? (
          <Alert
            type="warning"
            showIcon
            message="当前生效的是已上传的自定义 Excel 模板，下方列配置暂不生效"
            description="列配置只作用于默认模板。如需改用列配置，请在下方「高级」区删除自定义 Excel 模板。"
          />
        ) : (
          <ContextualHelp
            label="列配置"
            title="列配置只调整导出内容和顺序"
            content="勾选要导出的列、拖动调整顺序，保存后导出即按新列生成；表头文字、抬头落款等版式需求请到下方“高级”区设置。"
          />
        )}

        <div style={{ display: 'flex', gap: 24 }}>
          <ColumnConfigList
            title="一、对账台账区"
            items={ledgerItems}
            onChange={setLedgerItems}
          />
          <ColumnConfigList
            title="二、商品明细区"
            items={itemItems}
            onChange={setItemItems}
          />
        </div>

        <Space wrap>
          {capabilities.canManageTemplate ? (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={loading}
              onClick={() => void handleSaveColumns()}
            >
              保存列配置
            </Button>
          ) : null}
          {capabilities.canManageTemplate && hasColumnConfig ? (
            <Popconfirm
              title="恢复默认列"
              description="将清除已保存的列配置，导出恢复为内置默认列。"
              onConfirm={() => void handleResetColumns()}
            >
              <Button icon={<UndoOutlined />} loading={resettingColumns}>
                恢复默认列
              </Button>
            </Popconfirm>
          ) : null}
        </Space>

        <Collapse
          items={[
            {
              key: 'advanced',
              label: '高级：自定义 Excel 版式模板（抬头/落款/Logo/自由排版）',
              children: (
                <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
                  <ContextualHelp
                    label="模板用法"
                    title="上传后按自定义版式导出"
                    content="下载当前模板，在 Excel/WPS 中调整版式后上传；单元格占位符会在导出时替换为真实数据，带明细占位符的行会按明细行数复制。上传自定义模板后，列配置不再生效。"
                  />

                  <Space wrap>
                    <Button
                      icon={<DownloadOutlined />}
                      loading={downloading}
                      onClick={() => void handleDownload()}
                    >
                      下载当前模板
                    </Button>
                    {capabilities.canManageTemplate ? (
                      <Upload
                        accept=".xlsx"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          void handleUpload(file);
                          return false;
                        }}
                      >
                        <Button
                          type="primary"
                          icon={<UploadOutlined />}
                          loading={uploading}
                        >
                          上传自定义模板
                        </Button>
                      </Upload>
                    ) : null}
                    {capabilities.canManageTemplate && info?.isCustom ? (
                      <Popconfirm
                        title="删除自定义 Excel 模板"
                        description="将删除已上传的公司自定义模板，导出恢复为默认模板（列配置若存在则继续生效）。"
                        onConfirm={() => void handleReset()}
                      >
                        <Button
                          danger
                          icon={<UndoOutlined />}
                          loading={resetting}
                        >
                          删除自定义模板
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Space>

                  <Table
                    rowKey="token"
                    size="small"
                    loading={loading}
                    dataSource={info?.placeholders ?? []}
                    pagination={false}
                    scroll={{ y: 320 }}
                    columns={[
                      {
                        title: '占位符',
                        dataIndex: 'token',
                        width: 260,
                        render: (value: string) => (
                          <Typography.Text code copyable={{ text: value }}>
                            {value}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: '说明',
                        dataIndex: 'label',
                      },
                      {
                        title: '分组',
                        dataIndex: 'group',
                        width: 160,
                        filters: Object.entries(capabilities.groupLabels).map(
                          ([value, text]) => ({ value, text }),
                        ),
                        onFilter: (value, record) => record.group === value,
                        render: (value: string) => (
                          <Tag color={capabilities.groupColors[value]}>
                            {capabilities.groupLabels[value] ?? value}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Space>
    </Modal>
  );
}
