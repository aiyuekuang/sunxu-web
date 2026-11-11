import { useMemo, useRef, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Tag,
  Tree,
  Typography,
} from 'antd';
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { TagOutlined } from '@ant-design/icons';
import type { Key } from 'react';
import {
  CrudListWorkbench,
  RowActions,
  SavedViewBar,
  SectionCard,
  type SavedViewItem,
} from '../../src';

type ProductBaseType = 'raw' | 'semi' | 'finished';
type ProductStatus = 'active' | 'inactive';
type ProductCategory = 'all' | ProductBaseType;
type StatusFilter = 'all' | ProductStatus;
type LayoutMode = 'light' | 'category' | 'complex' | 'pro-search';

type DemoProduct = {
  id: string;
  name: string;
  code: string;
  baseType: ProductBaseType;
  specification: string;
  unit: string;
  status: ProductStatus;
  price: number;
};

type ProductSnapshot = {
  baseType: ProductCategory;
  status: StatusFilter;
  unit?: string;
  keyword: string;
  code: string;
  missingSpecification: boolean;
};

type DemoSavedView = SavedViewItem & { snapshot: ProductSnapshot };

const baseTypeLabels: Record<ProductBaseType, string> = {
  raw: '原材料',
  semi: '半成品',
  finished: '成品',
};

const seedProducts: DemoProduct[] = [
  { id: 'p-001', name: '上肢关节康复器', code: 'CRM-P-000002', baseType: 'finished', specification: '单关节', unit: '个', status: 'active', price: 1280 },
  { id: 'p-002', name: '上肢综合训练器', code: 'CRM-P-000003', baseType: 'finished', specification: '标准型', unit: '台', status: 'active', price: 3680 },
  { id: 'p-003', name: '下肢关节康复运动器', code: 'CRM-P-000004', baseType: 'finished', specification: '双关节', unit: '台', status: 'active', price: 2860 },
  { id: 'p-004', name: '倾斜床', code: 'CRM-P-000005', baseType: 'finished', specification: '—', unit: '台', status: 'inactive', price: 5200 },
  { id: 'p-005', name: '康复训练器支架', code: 'CRM-S-000012', baseType: 'semi', specification: '钢制 1.2m', unit: '件', status: 'active', price: 320 },
  { id: 'p-006', name: '控制面板组件', code: 'CRM-S-000013', baseType: 'semi', specification: '触控版', unit: '件', status: 'active', price: 460 },
  { id: 'p-007', name: '不锈钢管材', code: 'CRM-R-000018', baseType: 'raw', specification: '304 / 30mm', unit: '米', status: 'active', price: 42 },
  { id: 'p-008', name: '包装纸箱', code: 'CRM-R-000021', baseType: 'raw', specification: '—', unit: '个', status: 'inactive', price: 8 },
  { id: 'p-009', name: '医用诊疗床', code: 'CRM-P-000008', baseType: 'finished', specification: '电动三段', unit: '台', status: 'active', price: 7800 },
];

const baseTypeTabs = [
  { key: 'all', label: '全部' },
  { key: 'raw', label: '原材料' },
  { key: 'semi', label: '半成品' },
  { key: 'finished', label: '成品' },
];

const initialSnapshot: ProductSnapshot = {
  baseType: 'all',
  status: 'active',
  unit: undefined,
  keyword: '',
  code: '',
  missingSpecification: false,
};

const initialViews: DemoSavedView[] = [
  {
    id: 'enabled-products',
    name: '启用产品',
    scope: 'system',
    isDefault: true,
    snapshot: initialSnapshot,
  },
  {
    id: 'all-products',
    name: '全部产品',
    scope: 'system',
    snapshot: { ...initialSnapshot, status: 'all' },
  },
  {
    id: 'needs-spec',
    name: '待补规格',
    scope: 'system',
    snapshot: { ...initialSnapshot, status: 'all', missingSpecification: true },
  },
  {
    id: 'finished-check',
    name: '成品核对',
    scope: 'personal',
    snapshot: { ...initialSnapshot, baseType: 'finished', status: 'all' },
  },
];

function isProductCategory(value: string): value is ProductCategory {
  return value === 'all' || value === 'raw' || value === 'semi' || value === 'finished';
}

function isStatusFilter(value: string): value is StatusFilter {
  return value === 'all' || value === 'active' || value === 'inactive';
}

export function CrudListWorkbenchPage() {
  const { message, modal } = AntdApp.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('category');
  const [products, setProducts] = useState(seedProducts);
  const [snapshot, setSnapshot] = useState<ProductSnapshot>(initialSnapshot);
  const [keywordDraft, setKeywordDraft] = useState(initialSnapshot.keyword);
  const [dirty, setDirty] = useState(false);
  const [views, setViews] = useState(initialViews);
  const [activeViewId, setActiveViewId] = useState('enabled-products');
  const [draftCode, setDraftCode] = useState('');
  const [draftMissingSpecification, setDraftMissingSpecification] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [form] = Form.useForm<Omit<DemoProduct, 'id'>>();

  const updateSnapshot = (patch: Partial<ProductSnapshot>) => {
    actionRef.current?.setPageInfo?.({ current: 1 });
    setSelectedKeys([]);
    setSnapshot((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const restoreDraft = (source: ProductSnapshot) => {
    setDraftCode(source.code);
    setDraftMissingSpecification(source.missingSpecification);
  };

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const normalizedKeyword = snapshot.keyword.trim().toLowerCase();
        return (
          (snapshot.baseType === 'all' || product.baseType === snapshot.baseType) &&
          (snapshot.status === 'all' || product.status === snapshot.status) &&
          (!snapshot.unit || product.unit === snapshot.unit) &&
          (!normalizedKeyword || product.name.toLowerCase().includes(normalizedKeyword)) &&
          (!snapshot.code || product.code.toLowerCase().includes(snapshot.code.toLowerCase())) &&
          (!snapshot.missingSpecification || product.specification === '—')
        );
      }),
    [products, snapshot],
  );

  const openEditor = (product?: DemoProduct) => {
    setEditingId(product?.id);
    form.setFieldsValue(
      product
        ? {
            name: product.name,
            code: product.code,
            baseType: product.baseType,
            specification: product.specification === '—' ? '' : product.specification,
            unit: product.unit,
            status: product.status,
            price: product.price,
          }
        : {
            name: '',
            code: '',
            baseType: 'finished',
            specification: '',
            unit: '个',
            status: 'active',
            price: 0,
          },
    );
    setEditorOpen(true);
  };

  const saveProduct = async (values: Omit<DemoProduct, 'id'>) => {
    if (editingId) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingId
            ? { ...values, id: editingId, specification: values.specification || '—' }
            : product,
        ),
      );
      message.success('产品已更新');
    } else {
      setProducts((current) => [
        { ...values, id: `p-${Date.now()}`, specification: values.specification || '—' },
        ...current,
      ]);
      message.success('产品已新增');
    }
    setEditorOpen(false);
    setEditingId(undefined);
    form.resetFields();
  };

  const columns = useMemo<ProColumns<DemoProduct>[]>(
    () => [
      { title: '序号', valueType: 'indexBorder', width: 58, fixed: 'left' },
      { title: '产品名称', dataIndex: 'name', width: 150, ellipsis: true, fixed: 'left' },
      { title: '产品编码', dataIndex: 'code', width: 145, copyable: true },
      { title: '规格型号', dataIndex: 'specification', width: 130, ellipsis: true, search: false },
      { title: '单位', dataIndex: 'unit', width: 64 },
      {
        title: '系统分类',
        dataIndex: 'baseType',
        width: 92,
        render: (_, product) => baseTypeLabels[product.baseType],
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 78,
        render: (_, product) => (
          <Tag color={product.status === 'active' ? 'success' : 'default'}>
            {product.status === 'active' ? '启用' : '停用'}
          </Tag>
        ),
      },
      {
        title: '参考售价',
        dataIndex: 'price',
        width: 105,
        align: 'right',
        search: false,
        render: (_, product) => `¥ ${product.price.toLocaleString('zh-CN')}`,
      },
      {
        title: '操作',
        valueType: 'option',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, product) => [
          <Button key="edit" type="link" size="small" onClick={() => openEditor(product)}>
            编辑
          </Button>,
          <RowActions
            key="more"
            actions={[
              {
                key: 'duplicate',
                label: `复制“${product.name}”编码`,
                onClick: () => message.success(`已复制 ${product.code}`),
              },
              {
                key: 'specification',
                label: '规格与单位',
                icon: <TagOutlined />,
                onClick: () => message.info(`规格：${product.specification || '—'} / ${product.unit}`),
              },
              {
                key: 'delete',
                label: '删除',
                danger: true,
                onClick: () => {
                  modal.confirm({
                    title: `删除“${product.name}”？`,
                    content: '删除后不能恢复。',
                    okText: '删除',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      setProducts((current) => current.filter((item) => item.id !== product.id));
                      setSelectedKeys((current) => current.filter((key) => key !== product.id));
                    },
                  });
                },
              },
            ]}
          />,
        ],
      },
    ],
    [message, modal],
  );

  const activeFilterCount = Number(Boolean(snapshot.code)) + Number(snapshot.missingSpecification);
  const appliedFilterTags = (
    <Space size={[4, 4]} wrap>
      {snapshot.code ? (
        <Tag
          closable
          onClose={(event) => {
            event.preventDefault();
            updateSnapshot({ code: '' });
            setDraftCode('');
          }}
        >
          编码含“{snapshot.code}”
        </Tag>
      ) : null}
      {snapshot.missingSpecification ? (
        <Tag
          closable
          onClose={(event) => {
            event.preventDefault();
            updateSnapshot({ missingSpecification: false });
            setDraftMissingSpecification(false);
          }}
        >
          规格待补
        </Tag>
      ) : null}
    </Space>
  );

  const captureSnapshot = (): ProductSnapshot => ({ ...snapshot });

  const applyView = (view: DemoSavedView) => {
    setSnapshot({ ...view.snapshot });
    setKeywordDraft(view.snapshot.keyword);
    restoreDraft(view.snapshot);
    setActiveViewId(view.id);
    setDirty(false);
    actionRef.current?.setPageInfo?.({ current: 1 });
  };

  const saveCurrentView = () => {
    const activeView = views.find((view) => view.id === activeViewId);
    if (!activeView || activeView.scope !== 'personal') return false;
    setViews((current) =>
      current.map((view) =>
        view.id === activeViewId ? { ...view, snapshot: captureSnapshot() } : view,
      ),
    );
    setDirty(false);
    return true;
  };

  const saveViewAs = (name: string) => {
    const id = `personal-${Date.now()}`;
    setViews((current) => [
      ...current,
      { id, name, scope: 'personal', snapshot: captureSnapshot() },
    ]);
    setActiveViewId(id);
    setDirty(false);
  };

  const tableToolbarActions = (
    <Space size={8} wrap>
      <Button onClick={() => message.info('分类与单位字典由宿主页面维护')}>分类与单位字典</Button>
      <Button type="primary" onClick={() => openEditor()}>
        新增产品
      </Button>
    </Space>
  );

  const isComplex = layoutMode === 'complex';
  const isCategory = layoutMode === 'category';
  const isProSearch = layoutMode === 'pro-search';
  const quickFilters = isCategory || isComplex ? (
    <Select
      allowClear
      aria-label="按单位筛选"
      placeholder="全部单位"
      value={snapshot.unit}
      options={['个', '台', '件', '米'].map((unit) => ({ value: unit, label: unit }))}
      style={{ width: 132 }}
      onChange={(unit) => updateSnapshot({ unit })}
    />
  ) : (
    <Select
      aria-label="按状态筛选"
      value={snapshot.status}
      options={[
        { value: 'all', label: '全部状态' },
        { value: 'active', label: '启用中' },
        { value: 'inactive', label: '已停用' },
      ]}
      style={{ width: 132 }}
      onChange={(value) => {
        if (isStatusFilter(value)) updateSnapshot({ status: value });
      }}
    />
  );

  return (
    <div className="sxw-docs-page-content sxw-crud-workbench-example">
      <SectionCard title="场景预览">
        <Space wrap align="center">
          <Typography.Text>列表场景</Typography.Text>
          <Segmented
            className="sxw-crud-workbench-example__scene-desktop"
            aria-label="切换列表场景示例"
            value={layoutMode}
            options={[
              { value: 'light', label: '轻量列表' },
              { value: 'category', label: '分类与状态' },
              { value: 'complex', label: '复杂视图' },
              { value: 'pro-search', label: 'ProTable 查询' },
            ]}
            onChange={(value) => setLayoutMode(value as LayoutMode)}
          />
          <Select
            className="sxw-crud-workbench-example__scene-mobile"
            aria-label="切换列表场景示例"
            value={layoutMode}
            options={[
              { value: 'light', label: '轻量列表' },
              { value: 'category', label: '分类与状态' },
              { value: 'complex', label: '复杂视图' },
              { value: 'pro-search', label: 'ProTable 查询' },
            ]}
            onChange={(value) => setLayoutMode(value as LayoutMode)}
          />
        </Space>
      </SectionCard>

      <CrudListWorkbench<DemoProduct>
        title="产品管理"
        headingLevel={2}
        proTableSearch={
          isProSearch
            ? {
                filterType: 'query',
                defaultCollapsed: true,
                defaultFormItemsNumber: 2,
                span: { xs: 24, sm: 12, md: 8, lg: 6 },
              }
            : undefined
        }
        primaryTabs={
          isCategory
            ? {
                ariaLabel: '按产品分类筛选',
                value: snapshot.baseType,
                items: baseTypeTabs,
                onChange: (value) => {
                  if (isProductCategory(value)) updateSnapshot({ baseType: value });
                },
              }
            : undefined
        }
        statusFilters={
          isCategory || isComplex
            ? {
                ariaLabel: '按启用状态筛选',
                value: snapshot.status,
                onChange: (value) => {
                  if (isStatusFilter(value)) updateSnapshot({ status: value });
                },
                items: [
                  { key: 'active', label: '启用中' },
                  { key: 'all', label: '全部' },
                  { key: 'inactive', label: '已停用' },
                ],
                size: 'small',
              }
            : undefined
        }
        search={
          isProSearch
            ? undefined
            : (
                <Input.Search
                  aria-label="搜索产品名称"
                  placeholder="产品名称"
                  allowClear
                  value={keywordDraft}
                  onChange={(event) => {
                    const keyword = event.target.value;
                    setKeywordDraft(keyword);
                    if (!keyword) updateSnapshot({ keyword: '' });
                  }}
                  onSearch={(keyword) => updateSnapshot({ keyword: keyword.trim() })}
                />
              )
        }
        quickFilters={isProSearch ? undefined : quickFilters}
        viewBar={
          isComplex ? (
            <SavedViewBar
              views={views}
              activeViewId={activeViewId}
              dirty={dirty}
              onChange={(viewId) => {
                const view = views.find((item) => item.id === viewId);
                if (!view) return false;
                applyView(view);
              }}
              onSave={saveCurrentView}
              onSaveAs={saveViewAs}
              onRename={(viewId, name) => {
                setViews((current) => current.map((view) => view.id === viewId ? { ...view, name } : view));
              }}
              onDelete={(viewId) => {
                setViews((current) => current.filter((view) => view.id !== viewId));
                if (viewId === activeViewId) {
                  const fallback = views.find((view) => view.id !== viewId);
                  if (fallback) applyView(fallback);
                }
              }}
              onSetDefault={(viewId) => {
                setViews((current) => current.map((view) => ({ ...view, isDefault: view.id === viewId })));
              }}
              onReorder={(orderedIds) => {
                setViews((current) => {
                  const byId = new Map(current.map((view) => [view.id, view]));
                  return orderedIds.flatMap((id) => {
                    const view = byId.get(id);
                    return view ? [view] : [];
                  });
                });
              }}
            />
          ) : undefined
        }
        toolbarActions={tableToolbarActions}
        advancedFilters={
          isCategory || isComplex
            ? {
                activeCount: activeFilterCount,
                onReset: () => {
                  setDraftCode('');
                  setDraftMissingSpecification(false);
                },
                onCancel: () => restoreDraft(snapshot),
                onApply: () => {
                  updateSnapshot({
                    code: draftCode.trim(),
                    missingSpecification: draftMissingSpecification,
                  });
                },
                children: (
                  <Form layout="vertical">
                    <Form.Item label="产品编码">
                      <Input
                        value={draftCode}
                        placeholder="输入编码片段"
                        onChange={(event) => setDraftCode(event.target.value)}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Checkbox
                        checked={draftMissingSpecification}
                        onChange={(event) => setDraftMissingSpecification(event.target.checked)}
                      >
                        仅看未维护规格
                      </Checkbox>
                    </Form.Item>
                  </Form>
                ),
              }
            : undefined
        }
        appliedFilters={!isProSearch && activeFilterCount ? appliedFilterTags : undefined}
        facetLabel="产品分类"
        facetSidebar={
          isComplex ? (
            <Tree
              aria-label="产品分类"
              selectedKeys={snapshot.baseType === 'all' ? ['all'] : [snapshot.baseType]}
              treeData={[
                { title: '全部产品', key: 'all' },
                { title: '原材料', key: 'raw' },
                { title: '半成品', key: 'semi' },
                { title: '成品', key: 'finished' },
              ]}
              onSelect={(keys) => {
                const selected = String(keys[0] ?? 'all');
                if (isProductCategory(selected)) updateSnapshot({ baseType: selected });
              }}
            />
          ) : undefined
        }
        renderTable={
          isComplex
            ? (tableProps) => (
                <ProTable<DemoProduct>
                  {...tableProps}
                  scroll={{ ...tableProps.scroll, x: tableProps.scroll?.x ?? 'max-content' }}
                />
              )
            : undefined
        }
        tableProps={{
          actionRef,
          rowKey: 'id',
          columns,
          dataSource: isProSearch ? undefined : visibleProducts,
          request: isProSearch
            ? async (params) => {
                const getText = (key: string) => String(params[key] ?? '').trim().toLowerCase();
                const name = getText('name');
                const code = getText('code');
                const unit = getText('unit');
                const baseType = getText('baseType');
                const status = getText('status');
                const data = products.filter((product) =>
                  (!name || product.name.toLowerCase().includes(name)) &&
                  (!code || product.code.toLowerCase().includes(code)) &&
                  (!unit || product.unit === unit) &&
                  (!baseType || product.baseType === baseType) &&
                  (!status || product.status === status),
                );
                return { data, success: true, total: data.length };
              }
            : undefined,
          pagination: { defaultPageSize: 5, showSizeChanger: true },
          scroll: { x: 1020 },
          options: isComplex ? { setting: true, density: false, reload: false } : false,
          rowSelection: {
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys),
          },
          tableAlertOptionRender: ({ selectedRows, onCleanSelected }) => (
            <Space size={8}>
              <Button
                size="small"
                onClick={() => {
                  const selectedIds = new Set(selectedRows.map((product) => product.id));
                  setProducts((current) =>
                    current.map((product) =>
                      selectedIds.has(product.id) ? { ...product, status: 'inactive' } : product,
                    ),
                  );
                  onCleanSelected();
                  message.success(`已批量停用 ${selectedRows.length} 个产品`);
                }}
              >
                批量停用
              </Button>
            </Space>
          ),
        }}
      />

      <SectionCard title="新增与编辑由宿主提供表单">
        <Typography.Text type="secondary">
          工作台统一列表结构；业务页面传入字段、校验、权限和保存回调。
        </Typography.Text>
      </SectionCard>

      <SectionCard title="fill 模式：单列表视口页">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            工作台拥有确定高度：工具栏和分页保持可见，表格体在内部滚动。仅用于整页只有一张列表的场景；
            长页面中的子列表使用 <Typography.Text code>layout=&quot;embedded&quot;</Typography.Text>。
          </Typography.Text>
          <div style={{ display: 'flex', height: 360, minHeight: 0 }}>
            <CrudListWorkbench<DemoProduct>
              layout="embedded"
              fill
              tableProps={{
                rowKey: 'id',
                columns: [
                  { title: '产品名称', dataIndex: 'name' },
                  { title: '编码', dataIndex: 'code' },
                  {
                    title: '分类',
                    dataIndex: 'baseType',
                    render: (_, record) => baseTypeLabels[record.baseType],
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (_, record) => (record.status === 'active' ? '启用' : '停用'),
                  },
                ],
                dataSource: products,
                pagination: { defaultPageSize: 5, showSizeChanger: true },
              }}
            />
          </div>
        </Space>
      </SectionCard>

      <Modal
        title={editingId ? '编辑产品' : '新增产品'}
        open={editorOpen}
        onCancel={() => {
          setEditorOpen(false);
          setEditingId(undefined);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={saveProduct}>
          <Form.Item name="name" label="产品名称" rules={[{ required: true, message: '请输入产品名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="产品编码" rules={[{ required: true, message: '请输入产品编码' }]}>
            <Input />
          </Form.Item>
          <Space size={12} align="start" className="sxw-crud-workbench-example__form-row">
            <Form.Item name="baseType" label="产品分类" rules={[{ required: true }]}>
              <Select
                options={Object.entries(baseTypeLabels).map(([value, label]) => ({ value, label }))}
                style={{ width: 180 }}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'active', label: '启用' },
                  { value: 'inactive', label: '停用' },
                ]}
                style={{ width: 120 }}
              />
            </Form.Item>
          </Space>
          <Space size={12} align="start" className="sxw-crud-workbench-example__form-row">
            <Form.Item name="specification" label="规格型号">
              <Input />
            </Form.Item>
            <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
              <Select options={['个', '台', '件', '米'].map((value) => ({ value }))} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="price" label="参考售价" rules={[{ required: true }]}>
              <InputNumber min={0} precision={2} style={{ width: 140 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
