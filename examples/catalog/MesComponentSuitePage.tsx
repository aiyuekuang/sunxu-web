import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Form, Input, Segmented, Switch } from 'antd';
import { SectionCard, Space, Table, Typography } from '../../src';
import type { TableProps } from 'antd';
import {
  DocumentLineBatchSettingsButton,
  DocumentLineQuantityInput,
  DocumentModalForm,
  AmountPolicySnapshotTag,
  AmountText,
  CustomerMaterialCell,
  DateText,
  DefaultRouteHint,
  DocumentActionIntent,
  DocumentActionsDropdown,
  DocumentCustomFieldPanel,
  DocumentLedgerViewSwitch,
  DocumentKeywordSearch,
  DocumentTableTitle,
  EntityThumbnail,
  MesUiProvider,
  PermissionButton,
  StatusDisplay,
  TableLongText,
  UserText,
  type MesStatusEnum,
  type DocumentLineBatchField,
  type DocumentActionDefinition,
  type DocumentActionState,
  type DocumentViewMode,
  type MesCustomFieldPanelRenderProps,
  type MesUiRoute,
} from '../../src/mes';
import { MaterialSelectorDemo } from './MaterialSelectorDemo';
import { DrawingFilesDemo } from './DrawingFilesDemo';
import { MasterDataQuickCreateSelectDemo } from './MasterDataQuickCreateSelectDemo';

type MesLine = {
  id: string;
  materialCode: string;
  description: string;
  quantity: number;
  dueDate?: string;
  warehouse?: string;
  note?: string;
};

const initialLines: MesLine[] = [
  {
    id: 'line-1',
    materialCode: 'RM-AL-0081',
    description:
      '6061 铝型材，阳极氧化银白色；到货后按图纸核对截面、长度、壁厚和表面处理要求，并检查端面与包装状态，发现磕碰或色差时单独记录并隔离。来料检验需要记录外观、关键尺寸、批次标签、包装状态和随货资料，遇到色差、变形或数量不符时先隔离该批物料并通知采购与质量负责人，确认处理结论后再更新入库记录。',
    quantity: 24,
  },
  {
    id: 'line-2',
    materialCode: 'PK-BOX-0003',
    description: '标准包装箱',
    quantity: 6,
  },
];

const warehouseOptions = [
  { label: '原材料仓', value: 'raw-materials' },
  { label: '线边仓', value: 'line-side' },
  { label: '成品仓', value: 'finished-goods' },
];

const statusOptions: MesStatusEnum = {
  in_progress: { text: '进行中', status: 'Processing' },
  completed: { text: '已完成', status: 'Success' },
  pending: { text: '待处理', status: 'Warning', color: '#FF8F1F' },
};

type DemoDocument = DocumentActionState & { documentNo: string };

const demoDocumentActions: readonly DocumentActionDefinition<DemoDocument>[] = [
  { key: 'detail', label: '查看详情' },
  {
    key: 'edit',
    label: '编辑',
    permission: 'mes:catalog:edit',
    requiredAvailableAction: 'update',
  },
  {
    key: 'submit',
    label: (document) => `提交 ${document.documentNo}`,
    permission: 'mes:catalog:submit',
    requiredPermissions: ['mes:catalog:read'],
    requiredAvailableAction: 'submit',
  },
  {
    key: 'reschedule',
    label: '插单重排',
    permission: 'mes:catalog:schedule',
    requiredPermissions: ['mes:catalog:schedule:update'],
    requiredAvailableAction: 'reschedule',
  },
  {
    key: 'warehouse-review',
    label: '仓库审核',
    requiredAvailableAction: 'warehouse-review',
    visible: (document) => document.documentNo === 'CG-2026-001',
  },
  {
    key: 'cancel',
    label: '撤销',
    permission: 'mes:catalog:hidden',
    requiredAvailableAction: 'cancel',
    danger: true,
  },
];

const demoThumbnailUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="#e6f4ff"/><path d="M22 65 40 43l12 14 9-11 15 19H22Z" fill="#1677ff"/><circle cx="35" cy="31" r="7" fill="#69b1ff"/></svg>',
)}`;

const demoCustomerMaterial = {
  customerMaterialCode: 'CUST-AL-08',
  customerMaterialName: '客户铝件',
  customerMaterialSpec: '客户规格 A',
  material: {
    code: 'RM-AL-0081',
    name: '6061 铝型材',
    spec: '20 × 30 × 2 mm',
  },
};

type DocumentModalDemoMode = 'workspace' | 'viewport' | 'fixed';
type CustomFieldDemoMode = 'fields' | 'empty' | 'error';

function DemoCustomFieldPanelContent({
  objectId,
  editable,
  onDisplayStateChange,
  mode,
}: MesCustomFieldPanelRenderProps & { mode: CustomFieldDemoMode }) {
  useEffect(() => {
    onDisplayStateChange({ loading: true, hasFields: false, hasError: false });
    const timer = window.setTimeout(() => {
      onDisplayStateChange({
        loading: false,
        hasFields: mode === 'fields',
        hasError: mode === 'error',
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [mode, objectId, onDisplayStateChange]);

  if (mode === 'fields') {
    return (
      <Space orientation="vertical" size={4}>
        <Typography.Text strong>客户参考号</Typography.Text>
        <Typography.Text>PO-CUSTOM-2026-018</Typography.Text>
        <Typography.Text type="secondary">
          宿主编辑能力：{editable ? '已开启' : '只读'}
        </Typography.Text>
      </Space>
    );
  }
  if (mode === 'error') {
    return <Typography.Text type="danger">自定义字段加载失败</Typography.Text>;
  }
  return null;
}

export function MesComponentSuitePage() {
  const [lines] = useState(initialLines);
  const [lastPatches, setLastPatches] = useState<Array<Partial<MesLine>>>();
  const [lineQuantity, setLineQuantity] = useState(24);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentModalMode, setDocumentModalMode] =
    useState<DocumentModalDemoMode>('workspace');
  const [lastSubmittedNote, setLastSubmittedNote] = useState('尚未提交');
  const [permissionAction, setPermissionAction] = useState('尚未触发操作');
  const [showAmounts, setShowAmounts] = useState(false);
  const [documentKeyword, setDocumentKeyword] = useState('');
  const [documentKeywordLoading, setDocumentKeywordLoading] = useState(false);
  const [documentActionResult, setDocumentActionResult] = useState('尚未触发单据动作');
  const [actionIntentCount, setActionIntentCount] = useState(0);
  const [customFieldDemoMode, setCustomFieldDemoMode] =
    useState<CustomFieldDemoMode | 'no-object'>('fields');
  const [customFieldEditable, setCustomFieldEditable] = useState(false);
  const [documentLedgerView, setDocumentLedgerView] =
    useState<DocumentViewMode>('detail');
  const [actionLoadShouldFail, setActionLoadShouldFail] = useState(false);
  const [actionIntentLocation, setActionIntentLocation] = useState({
    pathname: '/catalog/documents/demo',
    search: '',
  });
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const tableHostRef = useRef<HTMLDivElement>(null);

  const fields = useMemo<DocumentLineBatchField<MesLine>[]>(
    () => [
      {
        key: 'quantity',
        label: '数量',
        type: 'number',
        min: 0,
        precision: 2,
        required: true,
        patch: (value) => ({ quantity: value ?? 0 }),
      },
      {
        key: 'dueDate',
        label: '交期',
        type: 'date',
        patch: (value) => ({ dueDate: value }),
      },
      {
        key: 'warehouse',
        label: '仓库',
        type: 'select',
        request: async ({ keyWords }) => {
          const query = keyWords?.trim().toLocaleLowerCase();
          await new Promise((resolve) => window.setTimeout(resolve, 350));
          if (query === '错误') throw new Error('仓库候选加载失败，请重试');
          return query
            ? warehouseOptions.filter((option) =>
                option.label.toLocaleLowerCase().includes(query),
              )
            : warehouseOptions;
        },
        patch: (value) => ({ warehouse: value }),
      },
      {
        key: 'note',
        label: '备注',
        type: 'text',
        maxLength: 120,
        patch: (value) => ({ note: value }),
      },
    ],
    [],
  );

  const requestRouteCandidates = useCallback(async () => ({
    candidates: [
      {
        recommended: true,
        code: 'RT-001',
        name: '标准加工路线',
        versionLabel: 'V3',
        reason: '按物料和客户条件匹配',
      },
    ],
  }), []);

  const loadDemoDocument = useCallback(
    async (id: string): Promise<DemoDocument> => {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      if (actionLoadShouldFail) {
        setActionLoadShouldFail(false);
        throw new Error('目录示例模拟详情加载失败');
      }
      return {
        id,
        documentNo: id === 'fallback-order' ? 'CG-2026-002' : 'CG-2026-001',
        availableActions: [
          'update',
          'submit',
          'cancel',
          'reschedule',
          'warehouse-review',
        ],
      };
    },
    [actionLoadShouldFail],
  );

  const replaceActionIntentRoute = useCallback((pathname: string) => {
    setActionIntentLocation({ pathname, search: '' });
  }, []);
  const actionIntentRoute = useMemo<MesUiRoute>(
    () => ({ ...actionIntentLocation, replace: replaceActionIntentRoute }),
    [actionIntentLocation, replaceActionIntentRoute],
  );

  const columns: TableProps<MesLine>['columns'] = [
    { title: '物料编码', dataIndex: 'materialCode', width: 150 },
    {
      title: '说明',
      dataIndex: 'description',
      width: 320,
      render: (_, row) => <TableLongText value={row.description} />,
    },
    { title: '数量', dataIndex: 'quantity', width: 96, align: 'right' },
  ];

  useEffect(() => {
    const viewport = tableHostRef.current?.querySelector<HTMLElement>(
      '.sxw-mes-component-suite__table-content',
    );
    if (!viewport) return;

    const updateOverflow = () => {
      const next = viewport.scrollWidth > viewport.clientWidth + 1;
      setHasHorizontalOverflow((current) => (current === next ? current : next));
    };

    updateOverflow();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(updateOverflow);
    resizeObserver?.observe(viewport);
    const table = viewport.querySelector('table');
    if (table) resizeObserver?.observe(table);
    window.addEventListener('resize', updateOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateOverflow);
    };
  }, [lines.length]);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <MaterialSelectorDemo />
      <DrawingFilesDemo />
      <MasterDataQuickCreateSelectDemo />

      <SectionCard title="MES 表格长文本">
        <Typography.Paragraph type="secondary">
          默认两行预览，悬停或点击查看全文；显式截断模式仍保留 64 字截断和“更多”弹层。
        </Typography.Paragraph>
        <div
          ref={tableHostRef}
          role="region"
          aria-label="物料明细表，可用左右方向键查看全部列"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            const viewport = event.currentTarget.querySelector<HTMLElement>(
              '.sxw-mes-component-suite__table-content',
            );
            if (!viewport || viewport.scrollWidth <= viewport.clientWidth + 1) {
              return;
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              viewport.scrollLeft -= 120;
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              viewport.scrollLeft += 120;
            } else if (event.key === 'Home') {
              event.preventDefault();
              viewport.scrollLeft = 0;
            } else if (event.key === 'End') {
              event.preventDefault();
              viewport.scrollLeft = viewport.scrollWidth;
            }
          }}
        >
          <Table<MesLine>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={lines}
            pagination={false}
            tableLayout="fixed"
            classNames={{ content: 'sxw-mes-component-suite__table-content' }}
            scroll={{ x: 566 }}
          />
        </div>
        {hasHorizontalOverflow ? (
          <Typography.Text
            className="sxw-table-scroll-hint"
            type="secondary"
            role="note"
          >
            左右滚动查看其余列
          </Typography.Text>
        ) : null}
      </SectionCard>

      <SectionCard title="MES 单据表格标题与关键词搜索">
        <Typography.Paragraph type="secondary">
          关键词是当前查询的临时条件，不写入个人视图；清空立即通知宿主，提交时去除首尾空格。
        </Typography.Paragraph>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <DocumentTableTitle
            title="采购订单"
            keyword={documentKeyword}
            keywordLoading={documentKeywordLoading}
            onKeywordSearch={setDocumentKeyword}
          />
          <Space wrap size={8}>
            <Button
              size="small"
              onClick={() => setDocumentKeywordLoading((value) => !value)}
            >
              {documentKeywordLoading ? '结束加载态' : '演示加载态'}
            </Button>
            <Typography.Text type="secondary">当前宿主查询词：</Typography.Text>
            <Typography.Text code>{documentKeyword || '（空）'}</Typography.Text>
          </Space>
          <Space wrap size={12}>
            <Typography.Text type="secondary">独立关键词入口：</Typography.Text>
            <DocumentKeywordSearch
              value={documentKeyword}
              onSearch={setDocumentKeyword}
            />
          </Space>
        </Space>
      </SectionCard>

      <SectionCard title="MES 明细批量字段设置">
        <Typography.Paragraph type="secondary">
          每个字段单独勾选；日期 patch 使用 YYYY-MM-DD，远程候选和提交回调由宿主提供。
        </Typography.Paragraph>
        <Space wrap size={8} style={{ marginBottom: 12 }}>
          <Typography.Text>明细数量</Typography.Text>
          <DocumentLineQuantityInput
            aria-label="明细数量"
            min={0}
            precision={2}
            value={lineQuantity}
            onChange={setLineQuantity}
          />
          <Typography.Text type="secondary">
            清空后离开输入框会恢复当前有效值；当前为 {lineQuantity}。
          </Typography.Text>
        </Space>
        <DocumentLineBatchSettingsButton
          selectedCount={3}
          fields={fields}
          onApply={setLastPatches}
        />
        {lastPatches !== undefined ? (
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Typography.Text role="status">
              已生成 {lastPatches.length} 项字段 patch
            </Typography.Text>
            <Typography.Text
              code
              style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
            >
              {JSON.stringify(lastPatches)}
            </Typography.Text>
          </Space>
        ) : null}
      </SectionCard>

      <SectionCard title="MES 状态与权限组件">
        <Typography.Paragraph type="secondary">
          状态字典、标签和权限判断由 MES 宿主提供；权限不通过时操作不渲染。
        </Typography.Paragraph>
        <Space wrap size={12} style={{ marginBottom: 12 }}>
          <StatusDisplay value="in_progress" enumMap={statusOptions} />
          <StatusDisplay value="completed" enumMap={statusOptions} mode="badge" />
          <StatusDisplay value="pending" enumMap={statusOptions} mode="text" />
          <StatusDisplay value={null} enumMap={statusOptions} />
        </Space>
        <MesUiProvider
          hasPermission={(permission) => permission !== 'mes:catalog:hidden'}
        >
          <Space wrap size={8}>
            <PermissionButton
              type="primary"
              permission="mes:catalog:create"
              onClick={() => setPermissionAction('已触发新增操作回调')}
            >
              新建操作
            </PermissionButton>
            <PermissionButton
              danger
              permission="mes:catalog:cancel"
              confirm={{
                title: '确认撤销当前单据？',
                content: '此示例只展示宿主注入的确认前后交互。',
                danger: true,
              }}
              onConfirm={async () => {
                setPermissionAction('确认回调已完成');
              }}
              successMessage="操作已完成"
            >
              撤销操作
            </PermissionButton>
            <PermissionButton permission="mes:catalog:hidden">
              无权限时隐藏
            </PermissionButton>
          </Space>
          <Space wrap size={8} style={{ marginTop: 8 }}>
            <Typography.Text type="secondary">权限操作回执：</Typography.Text>
            <Typography.Text role="status">{permissionAction}</Typography.Text>
          </Space>
        </MesUiProvider>
      </SectionCard>

      <SectionCard title="MES 单据动作与深链">
        <Typography.Paragraph type="secondary">
          动作集合同时受宿主权限和单据 availableActions 控制；深链只触发详情页已有流程。
        </Typography.Paragraph>
        <MesUiProvider
          hasPermission={(permission) =>
            ![
              'mes:catalog:hidden',
              'mes:catalog:schedule:update',
            ].includes(permission)
          }
          actionIntentRoute={actionIntentRoute}
        >
          <Space
            orientation="vertical"
            size={8}
            style={{ width: '100%', marginTop: 12 }}
          >
            <Space wrap size={12}>
              <Space align="center" size={4}>
                <Typography.Text type="secondary">权威详情</Typography.Text>
                <DocumentActionsDropdown<DemoDocument>
                  documentId="purchase-order-demo"
                  documentNo="CG-2026-001"
                  loadDocument={loadDemoDocument}
                  actions={demoDocumentActions}
                  onAction={(key, document) =>
                    setDocumentActionResult(`已执行 ${key}：${document.documentNo}`)
                  }
                />
              </Space>
              <Space align="center" size={4}>
                <Typography.Text type="secondary">安全列表投影</Typography.Text>
                <DocumentActionsDropdown<DemoDocument>
                  documentId="fallback-order"
                  documentNo="CG-2026-002"
                  fallbackDocument={{
                    id: 'fallback-order',
                    documentNo: 'CG-2026-002',
                  availableActions: ['update', 'warehouse-review'],
                  }}
                  actions={demoDocumentActions}
                  onAction={(key, document) =>
                    setDocumentActionResult(`列表投影执行 ${key}：${document.documentNo}`)
                  }
                />
              </Space>
              <Button
                size="small"
                onClick={() => setActionLoadShouldFail(true)}
              >
                演示详情加载失败
              </Button>
              <Button
                size="small"
                onClick={() =>
                  setActionIntentLocation((current) => ({
                    ...current,
                    search: '?action=approve',
                  }))
                }
              >
                模拟提交操作深链
              </Button>
            </Space>
            <Space wrap size={12}>
              <Typography.Text role="status">{documentActionResult}</Typography.Text>
              <Typography.Text type="secondary">
                深链触发次数：{actionIntentCount}
              </Typography.Text>
              <Typography.Text type="secondary">
                当前 action 参数：{actionIntentLocation.search || '（空）'}
              </Typography.Text>
            </Space>
            <DocumentActionIntent
              action="approve"
              enabled
              onTrigger={() => {
                setActionIntentCount((count) => count + 1);
                setDocumentActionResult('深链已触发详情页既有提交流程');
              }}
            />
          </Space>
        </MesUiProvider>
      </SectionCard>

      <SectionCard title="MES 单据自定义字段容器">
        <Typography.Paragraph type="secondary">
          字段 schema、请求和编辑器由宿主提供；空字段隐藏，加载错误保留提示，切换单据时先清除旧内容。
        </Typography.Paragraph>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Segmented
            aria-label="自定义字段状态"
            value={customFieldDemoMode}
            options={[
              { label: '有字段', value: 'fields' },
              { label: '空字段', value: 'empty' },
              { label: '加载错误', value: 'error' },
              { label: '无单据', value: 'no-object' },
            ]}
            onChange={(value) =>
              setCustomFieldDemoMode(
                value as CustomFieldDemoMode | 'no-object',
              )
            }
          />
          <Space align="center" size={8}>
            <Switch
              checked={customFieldEditable}
              aria-label="开启自定义字段编辑能力"
              onChange={setCustomFieldEditable}
            />
            <Typography.Text>宿主可编辑</Typography.Text>
          </Space>
          <MesUiProvider
            hasPermission={() => true}
            renderCustomFieldPanel={(props) =>
              props.objectId ? (
                <DemoCustomFieldPanelContent
                  {...props}
                  editable={customFieldEditable}
                  mode={customFieldDemoMode === 'no-object' ? 'fields' : customFieldDemoMode}
                />
              ) : null
            }
          >
            <DocumentCustomFieldPanel
              objectType="purchase_order"
              editable={customFieldEditable}
              objectId={
                customFieldDemoMode === 'no-object'
                  ? undefined
                  : customFieldDemoMode === 'empty'
                    ? 'empty-document'
                    : customFieldDemoMode === 'error'
                      ? 'error-document'
                      : 'configured-document'
              }
              title="单据扩展信息"
            />
          </MesUiProvider>
        </Space>
      </SectionCard>

      <SectionCard title="MES 文本、金额与主数据展示">
        <Typography.Paragraph type="secondary">
          保留 MES 金额脱敏、日期格式、用户名称回退、默认工艺路线提示、客户物料双标识和图片行事件隔离；金额策略和路线请求由宿主注入。
        </Typography.Paragraph>
        <MesUiProvider
          hasPermission={() => true}
          maskAmount={(amount) =>
            amount == null ? '-' : showAmounts ? String(amount) : '****'
          }
        >
          <Space wrap size={[20, 12]}>
            <Space orientation="vertical" size={4}>
              <Typography.Text strong>金额</Typography.Text>
              <Space wrap size={8}>
                <AmountText value="12500.5" />
                <AmountText value={null} placeholder="未录入" />
                <Button size="small" onClick={() => setShowAmounts((value) => !value)}>
                  {showAmounts ? '隐藏金额' : '显示金额'}
                </Button>
              </Space>
              <AmountPolicySnapshotTag
                mask={(amount) =>
                  amount == null ? '-' : showAmounts ? String(amount) : '****'
                }
                priceSnapshot={{
                  amountPolicySnapshot: {
                    policyCode: 'default',
                    version: 3,
                    amountFormulaReadable: '数量 × 单价',
                    result: {
                      pricingQuantity: 5,
                      baseAmount: 12500.5,
                      formulaDifferenceAmount: 0,
                      amount: 12500.5,
                    },
                  },
                }}
              />
            </Space>
            <Space orientation="vertical" size={4}>
              <Typography.Text strong>日期与用户</Typography.Text>
              <DateText value="2026-11-20T09:30:00+08:00" />
              <DateText value="invalid" format="date" placeholder="日期待补" />
              <UserText user={{ realName: '张工', username: 'zhang.gong' }} />
              <UserText user={{ username: 'operator01' }} />
            </Space>
            <Space orientation="vertical" size={4}>
              <Typography.Text strong>默认工艺路线</Typography.Text>
              <DefaultRouteHint
                materialId="material-demo-001"
                customerId="customer-demo-001"
                routeSelectionDate="2026-11-20"
                requestCandidates={requestRouteCandidates}
              />
            </Space>
            <Space orientation="vertical" size={4}>
              <Typography.Text strong>客户物料与图片</Typography.Text>
              <CustomerMaterialCell
                item={demoCustomerMaterial}
                field="name"
                showSpec
              />
              <Space wrap size={12}>
                <Space orientation="vertical" size={2}>
                  <Typography.Text type="secondary">内部物料列</Typography.Text>
                  <CustomerMaterialCell
                    item={demoCustomerMaterial}
                    field="name"
                    displayMode="internal"
                    showSpec
                  />
                </Space>
                <Space orientation="vertical" size={2}>
                  <Typography.Text type="secondary">客户物料列</Typography.Text>
                  <CustomerMaterialCell
                    item={demoCustomerMaterial}
                    field="name"
                    displayMode="customer"
                    showSpec
                  />
                </Space>
              </Space>
              <Space align="center" size={8}>
                <EntityThumbnail thumbnailUrl={demoThumbnailUrl} alt="铝型材缩略图" />
                <EntityThumbnail />
              </Space>
            </Space>
          </Space>
        </MesUiProvider>
      </SectionCard>

      <SectionCard title="MES 单据与明细视图切换">
        <Typography.Paragraph type="secondary">
          当前视图由页面控制；切换只更新本页状态，不改变路由，数据请求和刷新时机由宿主决定。
        </Typography.Paragraph>
        <Space wrap size={12}>
          <DocumentLedgerViewSwitch
            value={documentLedgerView}
            onChange={setDocumentLedgerView}
          />
          <Typography.Text role="status">
            当前视图：{documentLedgerView === 'detail' ? '明细' : '单据'}
          </Typography.Text>
        </Space>
      </SectionCard>

      <div className="sxw-mes-document-modal-demo">
        <SectionCard title="MES 单据编辑弹窗">
          <Typography.Paragraph type="secondary">
            对比工作区全屏、视口全屏和固定宽度；最小化会保留表单草稿。
          </Typography.Paragraph>
          <Space wrap size={8}>
            <Button
              type="primary"
              onClick={() => {
                setDocumentModalMode('workspace');
                setDocumentModalOpen(true);
              }}
            >
              工作区全屏
            </Button>
            <Button
              onClick={() => {
                setDocumentModalMode('viewport');
                setDocumentModalOpen(true);
              }}
            >
              视口全屏
            </Button>
            <Button
              onClick={() => {
                setDocumentModalMode('fixed');
                setDocumentModalOpen(true);
              }}
            >
              固定宽度
            </Button>
            <Typography.Text role="status">
              最近提交备注：{lastSubmittedNote}
            </Typography.Text>
          </Space>
        </SectionCard>
        <DocumentModalForm<{ note: string }>
          title="编辑入库单"
          width={documentModalMode === 'fixed' ? 520 : undefined}
          viewportFullscreen={documentModalMode === 'viewport'}
          open={documentModalOpen}
          onOpenChange={setDocumentModalOpen}
          initialValues={{ note: '最小化后检查此草稿仍然保留。' }}
          onFinish={async (values) => {
            setLastSubmittedNote(values.note);
            return true;
          }}
        >
          <Form.Item name="note" label="单据备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </DocumentModalForm>
      </div>

    </Space>
  );
}
