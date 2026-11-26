import { useMemo, useRef, useState } from 'react';
import { App, Button, Space, Typography } from 'antd';
import type { ProFormInstance } from '@ant-design/pro-components';
import { BUSINESS_DATE_RANGE_PRESETS } from '../../src/business/table/dateRangePresets';
import { PurchaseInquiryActionModals } from '../../src/business/domains/procurement/PurchaseInquiryActionModals';
import { PurchaseOrderFilterDrawer } from '../../src/business/domains/procurement/PurchaseOrderFilterDrawer';
import { PurchaseOrderDetailFilterDrawer } from '../../src/business/domains/procurement/PurchaseOrderDetailFilterDrawer';
import type {
  PurchaseInquiryAction,
  PurchaseInquiryActionCapabilities,
  PurchaseInquiryDetail,
} from '../../src/business/domains/procurement/purchase-inquiry-action-modals-types';
import type { PurchaseOrderFilterCapabilities } from '../../src/business/domains/procurement/purchase-order-filter-drawer-types';
import type { PurchaseOrderDetailFilterFormValues } from '../../src/business/domains/procurement/purchase-order-detail-filter-drawer-types';
import type { PurchaseOrderFilterFormValues } from '../../src/business/domains/procurement/purchase-order-filter-drawer-types';
import { SectionCard } from '../../src';

const sampleInquiry: PurchaseInquiryDetail = {
  id: 'inquiry-demo-2026-001',
  suppliers: [
    { supplierId: 'supplier-a', supplier: { name: '华东精密材料' } },
    { supplierId: 'supplier-b', supplier: { name: '新锐工业供应' } },
  ],
  items: [
    {
      id: 'inquiry-item-standard',
      materialId: 'material-aluminum',
      material: { name: '6061 铝型材' },
      inquiryQty: 120,
      purchaseQty: 120,
    },
    {
      id: 'inquiry-item-temporary',
      temporaryItemCode: 'TMP-CUSTOM-01',
      temporaryItemName: '定制连接件（临时询价品）',
      inquiryQty: 80,
    },
  ],
};

const demoMaterials = [
  { label: '6061 铝型材 · RM-AL-0081', value: 'material-aluminum', code: 'RM-AL-0081', name: '6061 铝型材' },
  { label: '不锈钢连接件 · RM-SS-0020', value: 'material-connector', code: 'RM-SS-0020', name: '不锈钢连接件' },
];

const statusOptions = {
  draft: { text: '草稿', status: 'Default', color: '#999999' },
  submitted: { text: '审批中', status: 'Processing', color: '#722ED1' },
  confirmed: { text: '已确认', status: 'Processing', color: '#1677FF' },
  partially_received: { text: '部分收货', status: 'Processing', color: '#13C2C2' },
  received: { text: '已收货', status: 'Processing', color: '#13C2C2' },
  completed: { text: '已完成', status: 'Success', color: '#00B578' },
  cancelled: { text: '已取消', status: 'Error', color: '#FF3141' },
};

function filteredOptions<T extends { label: string; value: string; code?: string; name?: string }>(
  options: T[],
  params?: { keyWords?: string },
) {
  const keyword = (params?.keyWords ?? '').trim().toLocaleLowerCase();
  if (!keyword) return options;
  return options.filter((option) =>
    `${option.label} ${option.code ?? ''} ${option.name ?? ''}`
      .toLocaleLowerCase()
      .includes(keyword),
  );
}

function countActiveFilters(values: object) {
  return Object.values(values).filter(
    (value) =>
      value != null &&
      value !== '' &&
      value !== false &&
      (!Array.isArray(value) || value.length > 0),
  ).length;
}

/** Host adapters below stand in for inquiry/order APIs, permissions, dictionaries, links and feedback. */
export function PurchaseInquiryAndOrderFilterComponentsDemo() {
  const { message } = App.useApp();
  const orderFilterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const detailFilterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const [action, setAction] = useState<PurchaseInquiryAction | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [orderFilterOpen, setOrderFilterOpen] = useState(false);
  const [detailFilterOpen, setDetailFilterOpen] = useState(false);
  const [orderAppliedCount, setOrderAppliedCount] = useState(0);
  const [detailAppliedCount, setDetailAppliedCount] = useState(0);
  const [lastAction, setLastAction] = useState('尚未执行采购操作');

  const notifications = useMemo(
    () => ({
      success: (text: string) => message.success(text),
      warning: (text: string) => message.warning(text),
    }),
    [message],
  );

  const inquiryCapabilities = useMemo<PurchaseInquiryActionCapabilities>(
    () => ({
      canPerformAction: () => true,
      loadDetail: async () => sampleInquiry,
      compareQuotes: async () => ({
        items: [
          {
            inquiryItem: sampleInquiry.items?.[0] ?? { id: 'missing' },
            quotes: [
              { id: 'quote-a', supplierId: 'supplier-a', supplier: { name: '华东精密材料' }, unitPrice: 51.2 },
              { id: 'quote-b', supplierId: 'supplier-b', supplier: { name: '新锐工业供应' }, unitPrice: 49.8 },
            ],
          },
        ],
      }),
      bindMaterials: async ({ items }) => {
        setLastAction(`已模拟绑定 ${items.length} 条临时询价品`);
      },
      award: async ({ items }) => {
        setLastAction(`已模拟定标 ${items.length} 条询价明细`);
      },
      convertToOrders: async ({ updateMaterialSupplierPrice }) => {
        setLastAction(updateMaterialSupplierPrice ? '已模拟转单并同步中标价' : '已模拟定标转采购订单');
      },
      registerQuotation: async ({ items, supplierId }) => {
        setLastAction(`已模拟供应商 ${supplierId} 报价，${items.length} 条明细`);
      },
      requestActiveMaterials: async (params) => filteredOptions(demoMaterials, params),
      renderMaterialConfigEntryLabel: ({ children, show, onOpen }) => (
        <Space size={8}>
          <span>{children}</span>
          {show ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setLastAction('已打开物料配置入口；切回窗口会刷新候选');
                onOpen();
              }}
            >
              配置物料
            </Button>
          ) : null}
        </Space>
      ),
      subscribeToWindowFocus: (listener) => {
        window.addEventListener('focus', listener);
        return () => window.removeEventListener('focus', listener);
      },
      notifications,
      messages: {
        saveSuccess: '保存成功',
        confirmSuccess: '确认成功',
        convertSuccess: '转换成功',
      },
    }),
    [notifications],
  );

  const filterCapabilities = useMemo<PurchaseOrderFilterCapabilities>(
    () => ({
      requestSuppliers: async (params) =>
        filteredOptions(
          [
            { label: '华东精密材料 · SUP-001', value: 'supplier-a', code: 'SUP-001', name: '华东精密材料' },
            { label: '新锐工业供应 · SUP-002', value: 'supplier-b', code: 'SUP-002', name: '新锐工业供应' },
          ],
          params,
        ),
      requestMaterials: async (params) => filteredOptions(demoMaterials, params),
      statusOptions,
      dateRangePresets: BUSINESS_DATE_RANGE_PRESETS,
    }),
    [],
  );

  const runFilter = async (
    values: object,
    setCount: (count: number) => void,
    close: (open: boolean) => void,
  ) => {
    const count = countActiveFilters(values);
    setCount(count);
    setLastAction(`已应用 ${count} 项筛选`);
    close(false);
    return true;
  };

  const startInquiryAction = (nextAction: PurchaseInquiryAction) => {
    setAction(nextAction);
    setInquiryOpen(true);
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <SectionCard title="采购询价操作">
        <Typography.Paragraph type="secondary">
          演示供应商报价登记、比价定标、正式物料绑定和定标转单；权限、服务、提示及物料配置链接均由宿主注入。
        </Typography.Paragraph>
        <Space wrap>
          <Button onClick={() => startInquiryAction('register-quote')}>登记供应商报价</Button>
          <Button onClick={() => startInquiryAction('award')}>比价定标</Button>
          <Button onClick={() => startInquiryAction('bind-materials')}>绑定正式物料</Button>
          <Button onClick={() => startInquiryAction('convert')}>定标转采购订单</Button>
        </Space>
        <PurchaseInquiryActionModals
          inquiry={sampleInquiry}
          action={action}
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
          onSuccess={async () => setLastAction('操作完成并刷新询价记录')}
          capabilities={inquiryCapabilities}
        />
      </SectionCard>

      <SectionCard title="采购订单筛选">
        <Typography.Paragraph type="secondary">
          保留订单号、状态、供应商、物料、创建时间、期望到货日期和采购员条件。已应用筛选数由宿主更新。
        </Typography.Paragraph>
        <Button onClick={() => setOrderFilterOpen(true)}>打开订单筛选</Button>
        <PurchaseOrderFilterDrawer
          open={orderFilterOpen}
          formRef={orderFilterFormRef}
          onOpenChange={setOrderFilterOpen}
          onFinish={(values: PurchaseOrderFilterFormValues) =>
            runFilter(values, setOrderAppliedCount, setOrderFilterOpen)
          }
          onReset={() => {
            orderFilterFormRef.current?.resetFields();
            setOrderAppliedCount(0);
            setLastAction('采购订单筛选已重置');
          }}
          appliedCount={orderAppliedCount}
          materialOption={{ label: demoMaterials[0].label, value: demoMaterials[0].value }}
          capabilities={filterCapabilities}
        />
      </SectionCard>

      <SectionCard title="采购订单明细台账筛选">
        <Typography.Paragraph type="secondary">
          保留订单/状态/供应商/物料/交货日期条件，以及默认开启的“隐藏无交货日期的已收完明细”开关。
        </Typography.Paragraph>
        <Button onClick={() => setDetailFilterOpen(true)}>打开明细筛选</Button>
        <PurchaseOrderDetailFilterDrawer
          open={detailFilterOpen}
          formRef={detailFilterFormRef}
          onOpenChange={setDetailFilterOpen}
          onFinish={(values: PurchaseOrderDetailFilterFormValues) =>
            runFilter(values, setDetailAppliedCount, setDetailFilterOpen)
          }
          onReset={() => {
            detailFilterFormRef.current?.resetFields();
            setDetailAppliedCount(0);
            setLastAction('采购订单明细筛选已重置');
          }}
          appliedCount={detailAppliedCount}
          capabilities={filterCapabilities}
        />
      </SectionCard>

      <Typography.Text type="secondary" aria-live="polite">
        {lastAction} · 订单筛选已应用 {orderAppliedCount} 项 · 明细筛选已应用 {detailAppliedCount} 项
      </Typography.Text>
    </Space>
  );
}
