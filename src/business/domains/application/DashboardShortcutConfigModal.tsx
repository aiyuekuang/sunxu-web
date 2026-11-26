import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResizableProTable } from '../shared/ResizableTable';
import type {
  DashboardShortcutConfigModalProps,
  DashboardShortcutFormInstance,
  DashboardShortcutFormValues,
  DashboardShortcutPreferences,
  DashboardShortcutPreferencesPayload,
  DashboardShortcutRow,
} from './dashboard-shortcut-config-types';

const MAX_CUSTOM_SHORTCUTS = 20;
let nextDraftId = 0;

function buildDashboardShortcutRows(
  preferences: DashboardShortcutPreferences,
  systemShortcuts: DashboardShortcutConfigModalProps['capabilities']['systemShortcuts'],
): DashboardShortcutRow[] {
  const savedSystemPreferences = new Map(
    preferences.systemItems.map((item) => [item.key, item]),
  );
  const rows: DashboardShortcutRow[] = systemShortcuts.map(
    ({ key, label, accessible }, index) => {
      const saved = savedSystemPreferences.get(key);
      return {
        rowKey: `system:${key}`,
        kind: 'system',
        systemKey: key,
        name: label,
        url: '',
        businessModule: 'large_screen',
        supportedPlatforms: 'pc',
        visible: saved?.visible ?? true,
        sortOrder: saved?.sortOrder ?? index,
        accessible,
      };
    },
  );

  for (const item of preferences.customItems) {
    rows.push({
      rowKey: `custom:${item.id}`,
      kind: 'custom',
      customId: item.id,
      name: item.name,
      url: item.url,
      businessModule: item.businessModule ?? 'custom_business',
      supportedPlatforms: item.supportedPlatforms ?? 'both',
      visible: item.visible,
      sortOrder: item.sortOrder,
      accessible: true,
    });
  }

  return rows.sort((left, right) => left.sortOrder - right.sortOrder);
}

function toDashboardShortcutPreferences(
  rows: DashboardShortcutRow[],
): DashboardShortcutPreferencesPayload {
  const orderedRows = rows.map((row, sortOrder) => ({ ...row, sortOrder }));
  return {
    systemItems: orderedRows.flatMap((row) =>
      row.kind === 'system' && row.systemKey
        ? [
            {
              key: row.systemKey,
              businessModule: 'large_screen',
              visible: row.visible,
              sortOrder: row.sortOrder,
            },
          ]
        : [],
    ),
    customItems: orderedRows.flatMap((row) =>
      row.kind === 'custom'
        ? [
            {
              ...(row.customId ? { id: row.customId } : {}),
              name: row.name,
              url: row.url,
              businessModule: row.businessModule,
              supportedPlatforms: row.supportedPlatforms,
              visible: row.visible,
              sortOrder: row.sortOrder,
            },
          ]
        : [],
    ),
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain application
 * @sunxu-reason Preserves system and custom dashboard shortcut visibility, per-module ordering, edit/delete and URL validation while preferences, permission outcomes, and notifications stay host supplied.
 */
export function DashboardShortcutConfigModal({
  open,
  onClose,
  onPreferencesChange,
  capabilities,
}: DashboardShortcutConfigModalProps) {
  const formRef = useRef<DashboardShortcutFormInstance | undefined>(undefined);
  const capabilitiesRef = useRef(capabilities);
  const onPreferencesChangeRef = useRef(onPreferencesChange);
  capabilitiesRef.current = capabilities;
  onPreferencesChangeRef.current = onPreferencesChange;
  const [preferences, setPreferences] = useState<DashboardShortcutPreferences>();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRow, setEditingRow] = useState<DashboardShortcutRow>();
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const rows = useMemo(
    () =>
      preferences
        ? buildDashboardShortcutRows(preferences, capabilities.systemShortcuts)
        : [],
    [capabilities.systemShortcuts, preferences],
  );
  const customCount = preferences?.customItems.length ?? 0;

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const result = await capabilitiesRef.current.loadPreferences();
      setPreferences(result);
      onPreferencesChangeRef.current(result);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setMode('list');
      setEditingRow(undefined);
      return;
    }
    void loadPreferences();
  }, [loadPreferences, open]);

  const persistRows = useCallback(
    async (
      nextRows: DashboardShortcutRow[],
      successMessage = '保存成功',
    ): Promise<boolean> => {
      setSaving(true);
      const currentCapabilities = capabilitiesRef.current;
      try {
        const result = await currentCapabilities.savePreferences(
          toDashboardShortcutPreferences(nextRows),
        );
        setPreferences(result);
        onPreferencesChangeRef.current(result);
        currentCapabilities.notify('success', successMessage);
        return true;
      } catch {
        currentCapabilities.notify('error', '操作失败，请稍后重试');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const handleMove = (rowKey: string, offset: -1 | 1) => {
    const currentIndex = rows.findIndex((row) => row.rowKey === rowKey);
    if (currentIndex < 0) return;
    const currentRow = rows[currentIndex];
    const sameModuleRows = rows.filter(
      (row) => row.businessModule === currentRow.businessModule,
    );
    const moduleIndex = sameModuleRows.findIndex((row) => row.rowKey === rowKey);
    const nextModuleRow = sameModuleRows[moduleIndex + offset];
    if (!nextModuleRow) return;
    const nextIndex = rows.findIndex((row) => row.rowKey === nextModuleRow.rowKey);
    const nextRows = [...rows];
    [nextRows[currentIndex], nextRows[nextIndex]] = [
      nextRows[nextIndex],
      nextRows[currentIndex],
    ];
    void persistRows(nextRows, '排序已调整');
  };

  const handleVisibilityChange = (rowKey: string, visible: boolean) => {
    const nextRows = rows.map((row) =>
      row.rowKey === rowKey ? { ...row, visible } : row,
    );
    void persistRows(nextRows);
  };

  const handleCreate = () => {
    if (customCount >= MAX_CUSTOM_SHORTCUTS) return;
    setEditingRow(undefined);
    setMode('form');
  };

  const handleEdit = (row: DashboardShortcutRow) => {
    setEditingRow(row);
    setMode('form');
  };

  const handleDelete = async (row: DashboardShortcutRow) => {
    const nextRows = rows.filter((item) => item.rowKey !== row.rowKey);
    await persistRows(nextRows, '删除成功');
  };

  const handleCancel = () => {
    if (mode === 'form') {
      setMode('list');
      setEditingRow(undefined);
      return;
    }
    onClose();
  };

  const handleFormFinish = async (values: DashboardShortcutFormValues) => {
    const nextRows = editingRow
      ? rows.map((row) =>
          row.rowKey === editingRow.rowKey
            ? {
                ...row,
                name: values.name.trim(),
                url: values.url.trim(),
                businessModule: values.businessModule,
                supportedPlatforms: values.supportedPlatforms,
              }
            : row,
        )
      : [
          ...rows,
          {
            rowKey: `draft:${++nextDraftId}`,
            kind: 'custom' as const,
            name: values.name.trim(),
            url: values.url.trim(),
            businessModule: values.businessModule,
            supportedPlatforms: values.supportedPlatforms,
            visible: true,
            sortOrder: rows.length,
            accessible: true,
          },
        ];
    const saved = await persistRows(
      nextRows,
      editingRow ? '更新成功' : '创建成功',
    );
    if (!saved) return false;
    setMode('list');
    setEditingRow(undefined);
    return true;
  };

  const columns: ProColumns<DashboardShortcutRow>[] = [
    {
      title: '顺序',
      dataIndex: 'sortOrder',
      width: 72,
      search: false,
      render: (_, row) => {
        const sameModuleRows = rows.filter(
          (item) => item.businessModule === row.businessModule,
        );
        const moduleIndex = sameModuleRows.findIndex(
          (item) => item.rowKey === row.rowKey,
        );
        return moduleIndex + 1;
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      search: false,
      render: (_, row) => (
        <Space size={8}>
          <span>{row.name}</span>
          {row.kind === 'system' && !row.accessible ? (
            <Tag>当前账号无访问权限</Tag>
          ) : null}
        </Space>
      ),
    },
    {
      title: '业务模块',
      dataIndex: 'businessModule',
      width: 130,
      search: false,
      render: (_, row) =>
        row.businessModule === 'large_screen' ? (
          <Tag color="geekblue">大屏</Tag>
        ) : (
          <Tag color="blue">自定义业务</Tag>
        ),
    },
    {
      title: '支持端',
      dataIndex: 'supportedPlatforms',
      width: 125,
      search: false,
      render: (_, row) => {
        const labels = {
          pc: 'PC',
          app: 'App',
          both: 'PC + App',
        } as const;
        return <Tag>{labels[row.supportedPlatforms]}</Tag>;
      },
    },
    {
      title: '显示',
      dataIndex: 'visible',
      width: 82,
      search: false,
      render: (_, row) => {
        const toggle = (
          <Switch
            checked={row.visible}
            disabled={saving}
            aria-label={`${row.visible ? '隐藏' : '显示'}${row.name}`}
            onChange={(visible) =>
              handleVisibilityChange(row.rowKey, visible)
            }
          />
        );
        return row.kind === 'system' && !row.accessible ? (
          <Tooltip title="此入口仍按现有权限控制；显示偏好不会授予访问权限。">
            {toggle}
          </Tooltip>
        ) : (
          toggle
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      width: 200,
      render: (_, row) => {
        const sameModuleRows = rows.filter(
          (item) => item.businessModule === row.businessModule,
        );
        const moduleIndex = sameModuleRows.findIndex(
          (item) => item.rowKey === row.rowKey,
        );
        return (
          <Space size={2}>
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              aria-label={`上移${row.name}`}
              title={`上移${row.name}`}
              disabled={saving || moduleIndex === 0}
              onClick={() => handleMove(row.rowKey, -1)}
            />
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              aria-label={`下移${row.name}`}
              title={`下移${row.name}`}
              disabled={saving || moduleIndex === sameModuleRows.length - 1}
              onClick={() => handleMove(row.rowKey, 1)}
            />
            {row.kind === 'custom' ? (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  disabled={saving}
                  onClick={() => handleEdit(row)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除"
                  description={`确定要删除「${row.name}」吗？此操作不可撤销。`}
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => handleDelete(row)}
                >
                  <Button type="link" danger size="small" disabled={saving}>
                    删除
                  </Button>
                </Popconfirm>
              </>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        mode === 'list'
          ? '入口配置'
          : editingRow
            ? '编辑自定义入口'
            : '新增自定义入口'
      }
      open={open}
      centered
      width="min(1040px, calc(100vw - 32px))"
      destroyOnHidden
      closable={mode === 'list'}
      keyboard={mode === 'list'}
      mask={{ closable: mode === 'list' }}
      onCancel={handleCancel}
      styles={{
        body: {
          maxHeight: 'calc(100dvh - 180px)',
          overflowY: 'auto',
        },
      }}
      footer={
        mode === 'list' ? (
          <Button onClick={onClose}>完成</Button>
        ) : (
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => formRef.current?.submit()}
            >
              保存
            </Button>
          </Space>
        )
      }
    >
      {mode === 'list' &&
        (loadError ? (
          <Alert
            type="error"
            showIcon
            message="快捷入口配置加载失败"
            action={
              <Button size="small" onClick={() => void loadPreferences()}>
                重试
              </Button>
            }
          />
        ) : (
          <ResizableProTable<DashboardShortcutRow>
            rowKey="rowKey"
            columns={columns}
            dataSource={rows}
            loading={loading}
            search={false}
            options={false}
            pagination={false}
            scroll={{ x: 900 }}
            toolBarRender={() => [
              <Space key="actions" size={12}>
                <Typography.Text type="secondary">
                  {customCount}/{MAX_CUSTOM_SHORTCUTS}
                </Typography.Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={saving || customCount >= MAX_CUSTOM_SHORTCUTS}
                  onClick={handleCreate}
                >
                  新增自定义入口
                </Button>
              </Space>,
            ]}
          />
        ))}

      {mode === 'form' ? (
        <ProForm<DashboardShortcutFormValues>
          key={editingRow?.rowKey ?? 'new-entry'}
          formRef={formRef}
          layout="vertical"
          submitter={false}
          initialValues={
            editingRow
              ? {
                  name: editingRow.name,
                  url: editingRow.url,
                  businessModule: editingRow.businessModule,
                  supportedPlatforms: editingRow.supportedPlatforms,
                }
              : {
                  businessModule: 'custom_business',
                  supportedPlatforms: 'both',
                }
          }
          onFinish={handleFormFinish}
        >
          <ProFormSelect
            name="businessModule"
            label="业务模块"
            options={[
              { label: '大屏', value: 'large_screen' },
              { label: '自定义业务', value: 'custom_business' },
            ]}
            rules={[{ required: true, message: '请选择业务模块' }]}
          />
          <ProFormText
            name="name"
            label="名称"
            fieldProps={{ maxLength: 60, showCount: true }}
            rules={[{ required: true, whitespace: true, message: '请输入名称' }]}
          />
          <ProFormSelect
            name="supportedPlatforms"
            label="支持端"
            options={[
              { label: '仅 PC', value: 'pc' },
              { label: '仅 App', value: 'app' },
              { label: 'PC 和 App', value: 'both' },
            ]}
            rules={[{ required: true, message: '请选择支持端' }]}
          />
          <ProFormText
            name="url"
            label="链接"
            fieldProps={{ maxLength: 2048, showCount: true }}
            extra="PC 通过 iframe 打开，App 通过 WebView 打开。"
            rules={[
              { required: true, whitespace: true, message: '请输入链接' },
              {
                validator: async (_, value?: string) => {
                  if (!value?.trim()) return;
                  try {
                    const url = new URL(value.trim());
                    if (
                      !['http:', 'https:'].includes(url.protocol) ||
                      url.username ||
                      url.password
                    ) {
                      throw new Error('invalid URL');
                    }
                  } catch {
                    throw new Error('请输入有效的 http 或 https 地址');
                  }
                },
              },
            ]}
          />
        </ProForm>
      ) : null}
    </Modal>
  );
}

export default DashboardShortcutConfigModal;
