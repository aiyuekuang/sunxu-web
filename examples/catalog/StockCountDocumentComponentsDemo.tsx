import { ProFormDatePicker, ProFormSelect } from '@ant-design/pro-components';
import { Button, Form, Space, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { SectionCard } from '../../src/components/SectionCard';
import { MesUiProvider } from '../../src/mes/MesUiProvider';
import { CreateStockCountModal } from '../../src/mes/components/CreateStockCountModal';
import { StockCountDetailDrawer } from '../../src/mes/components/StockCountDetailDrawer';
import type { BatchMaterialRecord } from '../../src/mes/components/batch-material-add-types';
import type { DocumentLineCustomFieldSchema } from '../../src/mes/components/document-line-custom-field-types';
import type {
  MesMaterialTablePickerCapabilities,
} from '../../src/mes/components/material-table-picker-types';
import type {
  CreateStockCountModalProps,
  StockCountCreateCapabilities,
  StockCountCreateFormValues,
  StockCountDetailCapabilities,
  StockCountDetailModel,
  StockCountLineFormValue,
} from '../../src/mes/components/stock-count-document-components-types';
import type { StockCountLineFormCapabilities } from '../../src/mes/components/stock-count-line-form-list-types';

const customFieldSchema: DocumentLineCustomFieldSchema = {
  schemaVersion: 2,
  fields: [
    {
      fieldKey: 'qualityMark',
      label: '质量标记',
      fieldKind: 'input',
      dataType: 'text',
      requiredPolicy: 'none',
      isActive: true,
      sortOrder: 1,
      displayJson: { showInForm: true, showInDetail: true },
    },
  ],
};

const materials: BatchMaterialRecord[] = [
  {
    id: 'material-al-6061',
    code: 'RM-AL-0061',
    name: '6061 铝型材',
    spec: '20 × 30 × 2 mm',
    unit: '根',
    hasBatchTracking: true,
  },
  {
    id: 'material-box-01',
    code: 'PK-BOX-0001',
    name: '标准包装箱',
    spec: '中号',
    unit: '个',
  },
];

const demoLineCapabilities: StockCountLineFormCapabilities<StockCountLineFormValue> = {
  hasActiveMaterialOptions: async () => true,
  ownerTypes: {
    options: [
      { label: '公司', value: 'company' },
      { label: '客户', value: 'customer' },
      { label: '供应商', value: 'supplier' },
    ],
    customerValue: 'customer',
    supplierValue: 'supplier',
  },
  createRowFromMaterial: (material) => ({
    materialId: material.id,
    materialRecord: material,
    materialOption: {
      label: [material.code, material.name, material.spec]
        .filter(Boolean)
        .join(' · '),
      value: material.id,
    },
    ownerType: 'company',
    customFieldSchemaVersion: customFieldSchema.schemaVersion,
    customValues: {},
  }),
  requestCustomerOwnerOptions: async () => [
    { label: '演示客户', value: 'customer-demo' },
  ],
  requestSupplierOwnerOptions: async () => [
    { label: '演示供应商', value: 'supplier-demo' },
  ],
  requestStockLocationOptions: async () => [
    { label: '原材料仓 / A区 / A-01', value: 'location-a01' },
  ],
  renderConfigEntryLabel: ({ children, show, onOpen }) => (
    <span>
      {children}
      {show ? (
        <Button type="link" size="small" onClick={onOpen}>
          配置
        </Button>
      ) : null}
    </span>
  ),
  isEmptyRow: (line) => !line.materialId,
};

const materialPickerCapabilities: MesMaterialTablePickerCapabilities = {
  requestCategoryTree: async () => [],
  requestMaterials: async ({ page, pageSize }) => ({
    list: materials.slice((page - 1) * pageSize, page * pageSize),
    total: materials.length,
  }),
  requestCustomerStockSummary: async () => ({ items: [] }),
  pagination: { pageSize: 10, showSizeChanger: false },
};

const initialDetail: StockCountDetailModel = {
  id: 'stock-count-demo-001',
  countNo: 'PD-2026-0001',
  status: 'counting',
  countMode: 'blind',
  warehouseId: 'warehouse-raw',
  warehouse: { name: '原材料仓' },
  locationId: 'location-a01',
  location: { pathName: '原材料仓 / A区 / A-01' },
  countDate: '2026-11-21T09:30:00+08:00',
  availableActions: ['submit', 'update', 'approve', 'reverse', 'cancel'],
  lines: [
    {
      id: 'stock-count-line-001',
      materialId: 'material-al-6061',
      material: { name: '6061 铝型材', code: 'RM-AL-0061', spec: '20 × 30 × 2 mm' },
      ownerType: 'company',
      ownerRefId: 'company',
      location: { pathName: '原材料仓 / A区 / A-01' },
      storageLocationSnapshot: 'A-01',
      batchNo: 'LOT-261121-A',
      bookQty: 128,
      reservedQty: 12,
      frozenQty: 3,
      actualQty: null,
      varianceQty: null,
      inputActualQty: undefined,
      remarks: null,
      customFieldSchemaVersion: 2,
      customValues: { qualityMark: '待现场复核' },
    },
    {
      id: 'stock-count-line-002',
      materialId: 'material-box-01',
      material: { name: '标准包装箱', code: 'PK-BOX-0001', spec: '中号' },
      ownerType: 'customer',
      ownerRefId: 'customer-demo',
      location: { pathName: '原材料仓 / B区 / B-03' },
      storageLocationSnapshot: 'B-03',
      batchNo: 'BOX-1026',
      bookQty: 42,
      reservedQty: 0,
      frozenQty: 0,
      actualQty: null,
      varianceQty: null,
      inputActualQty: undefined,
      remarks: null,
      customFieldSchemaVersion: 2,
      customValues: { qualityMark: '包装完好' },
    },
  ],
};

const statusPresentations: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#999999' },
  counting: { label: '盘点中', color: '#1677FF' },
  submitted: { label: '待审核', color: '#FF8F1F' },
  approved: { label: '已过账', color: '#00B578' },
  reversed: { label: '已冲正', color: '#722ED1' },
  cancelled: { label: '已取消', color: '#FF3141' },
};

const ownerPresentations: Record<string, { label: string; color: string }> = {
  company: { label: '公司', color: 'blue' },
  customer: { label: '客户货主', color: 'green' },
  supplier: { label: '供应商货主', color: 'purple' },
};

function getStockCountLineFormValues(
  detail: StockCountDetailModel,
): StockCountLineFormValue[] {
  return (detail.lines ?? []).map((line) => {
    const material = materials.find((item) => item.id === line.materialId);
    return {
      id: line.id,
      materialId: line.materialId,
      materialRecord: material,
      materialOption: material
        ? {
            label: [material.code, material.name, material.spec]
              .filter(Boolean)
              .join(' · '),
            value: material.id,
          }
        : undefined,
      ownerType: line.ownerType,
      ownerRefId: line.ownerRefId,
      locationId: line.locationId ?? undefined,
      storageLocation: line.storageLocationSnapshot ?? undefined,
      batchNo: line.batchNo ?? undefined,
      remarks: line.remarks ?? undefined,
      customFieldSchemaVersion: line.customFieldSchemaVersion,
      customValues: { ...line.customValues },
    };
  });
}

function dateToString(value: StockCountCreateFormValues['countDate']) {
  if (!value) return undefined;
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function DemoWarehouseLocationField({
  name,
  textName,
  label,
  warehouseId,
}: {
  name: 'locationId';
  textName: 'storageLocation';
  label: string;
  warehouseId?: string;
}) {
  const form = Form.useFormInstance();
  return (
    <ProFormSelect
      name={name}
      label={label}
      disabled={!warehouseId}
      options={[
        { label: '原材料仓 / A区 / A-01', value: 'location-a01' },
        { label: '原材料仓 / B区 / B-03', value: 'location-b03' },
      ]}
      fieldProps={{
        onChange: (value) => {
          const selected = [
            { label: '原材料仓 / A区 / A-01', value: 'location-a01' },
            { label: '原材料仓 / B区 / B-03', value: 'location-b03' },
          ].find((option) => option.value === value);
          form.setFieldValue(textName, selected?.label);
        },
      }}
    />
  );
}

const createLabels: StockCountCreateCapabilities['labels'] = {
  title: '新增库存盘点',
  infoMessage: '创建后系统会冻结盘点明细，可打印后交仓库实盘。',
  infoDescription:
    '通常由系统按仓库、仓位、库存货主生成明细；需要补行时请明确选择货主。盲盘提交前的打印件不显示账面数量。',
  warehouse: '盘点仓库',
  location: '仓位',
  warehouseRequired: '请选择盘点仓库',
  countMode: '盘点方式',
  countModeRequired: '请选择盘点方式',
  countDate: '盘点日期',
  remarks: '备注',
  manualLinesTitle: '手工盘点行',
  createdSuccess: '盘点单已创建',
};

const detailLabels: StockCountDetailCapabilities['labels'] = {
  emptyTitle: '库存盘点',
  countTitle: (countNo) => `库存盘点：${countNo}`,
  warehouse: '仓库',
  location: '仓位',
  warehouseLevel: '仓库级盘点',
  countDate: '盘点日期',
  countMode: '方式',
  preCountGuidanceTitle: '先打印盘点明细，再交仓库实盘',
  blindPreCountGuidance:
    '盲盘打印件在提交前不会显示账面数量和差异数量；现场填写实盘数量。提交后展示账实差异，审核过账前不改变库存。',
  openPreCountGuidance:
    '草稿盘点单已冻结账面明细。打印件的实盘数量、差异数量和签名栏供现场填写；提交和审核过账前不改变库存。',
  startCount: '开始盘点',
  submitCount: '提交盘点',
  maintainLines: '维护盘点行',
  approveAndPost: '审核过账',
  reverseCount: '冲正盘点',
  cancelCount: '取消盘点',
  lineTable: '盘点明细',
  materialName: '物料名称',
  materialCode: '物料编码',
  stockOwner: '库存货主',
  locationColumn: '仓位',
  batchNo: '批号',
  bookQty: '账面',
  reservedQty: '占用',
  frozenQty: '冻结',
  actualQty: '实盘',
  differenceQty: '差异',
  remarks: '备注',
  differenceReason: '差异原因',
  postingTransaction: '过账流水',
  batchActualQty: '实盘数量',
  batchRemarks: '差异原因',
  clearSelection: '取消选择',
  missingActualQty: '仍有盘点行未录入实盘数量',
  lineUpdateTitle: '维护盘点行',
  lineUpdateWarning: '维护范围会重新生成账面快照并清空已录入的实盘数量。',
  lineUpdateMessage: '请核对货主，并在提交盘点前完成维护。',
  minimumLineMessage: '请至少保留一条盘点行',
  approveTitle: '审核并过账盘点差异',
  approveWarning: '审核后将按差异生成盘盈入库或盘亏出库流水，并立即改变库存余额。',
  approveDescription:
    '提交人与审核人可以是同一账号；请核对盘点结果、差异原因和实际过账日期。',
  approveDateLabel: '差异过账业务日期',
  approveDateExtra: '按实际过账日期记账；可补录历史日期，不能选择未来日期。',
  reverseTitle: '冲正库存盘点',
  reverseWarning: '冲正不会删除原盘点流水。',
  reverseDescription: '系统会生成反向库存流水，并校验库存仍可回退。',
  reverseDateLabel: '冲正业务日期',
  reverseDateExtra: '按实际冲正日期记账；不能选择未来日期。',
  reverseReason: '冲正原因',
  reverseReasonRequired: '请输入冲正原因',
  reverseReasonWarning: '请输入冲正原因',
  cancelTitle: '取消库存盘点',
  cancelReason: '取消原因',
  cancelReasonRequired: '请输入取消原因',
  cancelReasonWarning: '请输入取消原因',
  started: '盘点已开始',
  submitted: '盘点单已提交',
  linesUpdated: '盘点行已更新',
  approved: '盘点差异已过账',
  reversed: '盘点已冲正，库存调整已生成反向流水',
  cancelled: '盘点单已取消',
};

export function StockCountDocumentComponentsDemo() {
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<StockCountDetailModel>(initialDetail);
  const detailRef = useRef(detail);
  detailRef.current = detail;

  const createCapabilities = useMemo<StockCountCreateCapabilities>(
    () => ({
      permissions: { canCreate: true },
      defaultCountMode: 'open',
      countModeOptions: [
        { label: '明盘（打印账面数量）', value: 'open' },
        { label: '盲盘（提交前隐藏账面数量）', value: 'blind' },
      ],
      getCurrentCountDate: () => dayjs(),
      lineCustomFieldSchema: customFieldSchema,
      lineFormCapabilities: demoLineCapabilities,
      renderWarehouseField: ({ name, label, requiredMessage }) => (
        <ProFormSelect
          name={name}
          label={label}
          options={[
            { label: '原材料仓', value: 'warehouse-raw' },
            { label: '成品仓', value: 'warehouse-finished' },
          ]}
          rules={[{ required: true, message: requiredMessage }]}
        />
      ),
      renderLocationField: (props) => <DemoWarehouseLocationField {...props} />,
      buildCreatePayload: (values) => ({
        warehouseId: values.warehouseId ?? '',
        locationId: values.locationId,
        storageLocation: values.storageLocation,
        countMode: values.countMode,
        countDate: dateToString(values.countDate),
        remarks: values.remarks,
        lines: (values.lines ?? [])
          .filter((line) => Boolean(line.materialId))
          .map((line) => ({
            id: line.id,
            materialId: line.materialId ?? '',
            ownerType: line.ownerType,
            ownerRefId: line.ownerRefId,
            locationId: line.locationId,
            storageLocation: line.storageLocation,
            batchNo: line.batchNo,
            remarks: line.remarks,
            customFieldSchemaVersion: customFieldSchema.schemaVersion,
            customValues: line.customValues,
          })),
      }),
      createStockCount: async (payload) => ({
        ...initialDetail,
        id: 'stock-count-created-demo',
        countNo: 'PD-2026-DEMO',
        countMode: payload.countMode ?? 'open',
        warehouseId: payload.warehouseId,
        locationId: payload.locationId,
        storageLocationSnapshot: payload.storageLocation,
        countDate: payload.countDate ?? dayjs().format(),
        status: 'draft',
        availableActions: ['start', 'update', 'cancel'],
        lines: (payload.lines ?? []).map((line, index) => {
          const material = materials.find((item) => item.id === line.materialId);
          return {
            id: line.id ?? `stock-count-created-line-${index + 1}`,
            materialId: line.materialId,
            material: material
              ? { name: material.name, code: material.code, spec: material.spec }
              : undefined,
            ownerType: line.ownerType ?? 'company',
            ownerRefId: line.ownerRefId ?? 'company',
            locationId: line.locationId,
            storageLocationSnapshot: line.storageLocation,
            batchNo: line.batchNo,
            bookQty: 0,
            reservedQty: 0,
            frozenQty: 0,
            actualQty: null,
            varianceQty: null,
            remarks: line.remarks,
            customFieldSchemaVersion: line.customFieldSchemaVersion,
            customValues: line.customValues,
          };
        }),
      }),
      labels: createLabels,
      notifySuccess: () => undefined,
    }),
    [],
  );

  const detailCapabilities = useMemo<StockCountDetailCapabilities>(
    () => ({
      permissions: {
        canPrintJob: true,
        canViewStockList: true,
        canAdjustStock: true,
        canReverseStock: true,
      },
      actionKeys: {
        start: 'start',
        submit: 'submit',
        update: 'update',
        approve: 'approve',
        reverse: 'reverse',
        cancel: 'cancel',
      },
      blindCountModeValue: 'blind',
      isPreCountStatus: (status) => status === 'draft' || status === 'counting',
      lineCustomFieldSchema: customFieldSchema,
      lineFormCapabilities: demoLineCapabilities,
      validation: {
        actualQtyMin: 0,
        actualQtyPrecision: 4,
        reasonMaxLength: 1000,
        remarksBatchMaxLength: 512,
        minimumLineCount: 1,
      },
      labels: detailLabels,
      formatDateTime: (value) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      formatQuantity: (value) =>
        Number(value ?? 0).toLocaleString('zh-CN', { maximumFractionDigits: 4 }),
      getStatusPresentation: (status) =>
        statusPresentations[status] ?? { label: status, color: 'default' },
      getOwnerPresentation: (ownerType) =>
        ownerPresentations[ownerType] ?? { label: ownerType, color: 'default' },
      getCountModeLabel: (mode) => (mode === 'blind' ? '盲盘' : '明盘'),
      getPrintActionLabel: (status) =>
        status === 'draft' || status === 'counting' ? '打印盘点明细' : '打印盘点结果',
      getBusinessDateInitialValue: () => dayjs(),
      isBusinessDateDisabled: (date: Dayjs) => date.isAfter(dayjs(), 'day'),
      getVarianceTextType: (value) =>
        Number(value ?? 0) > 0
          ? 'success'
          : Number(value ?? 0) < 0
            ? 'danger'
            : undefined,
      isActualQtyBlank: (value) =>
        value === undefined || value === null || Number.isNaN(Number(value)),
      normalizeBusinessDate: (value) => dayjs(value).format('YYYY-MM-DD'),
      toLineInputValues: (currentDetail) => getStockCountLineFormValues(currentDetail),
      buildLineInputPayload: (line) => ({
        id: line.id,
        materialId: line.materialId ?? '',
        ownerType: line.ownerType,
        ownerRefId: line.ownerRefId,
        locationId: line.locationId,
        storageLocation: line.storageLocation?.trim() || undefined,
        batchNo: line.batchNo?.trim() || undefined,
        remarks: line.remarks?.trim() || undefined,
        customFieldSchemaVersion: customFieldSchema.schemaVersion,
        customValues: line.customValues,
      }),
      buildSubmitLinePayload: (line) => ({
        id: line.id,
        actualQty: Number(line.inputActualQty),
        remarks: line.inputRemarks,
        customFieldSchemaVersion: customFieldSchema.schemaVersion,
        customValues: line.customValues,
      }),
      renderHeaderCustomFields: (_currentDetail, editable) => (
        <Space>
          <Typography.Text type="secondary">单据自定义字段</Typography.Text>
          <Tag color={editable ? 'processing' : 'default'}>
            {editable ? '可编辑' : '只读'}
          </Tag>
        </Space>
      ),
      renderLineCustomFieldColumns: () => [
        {
          title: '质量标记',
          dataIndex: ['customValues', 'qualityMark'],
          width: 130,
          render: (_, line) => String(line.customValues?.qualityMark ?? '-'),
        },
      ],
      renderBusinessDateField: ({
        name,
        label,
        extra,
        required,
        initialValue,
        disabledDate,
      }) => (
        <ProFormDatePicker
          name={name}
          label={label}
          extra={extra}
          initialValue={initialValue}
          rules={[{ required, message: `请选择${label}` }]}
          fieldProps={{
            picker: 'date',
            showTime: false,
            format: 'YYYY-MM-DD',
            allowClear: false,
            disabledDate,
          }}
        />
      ),
      startStockCount: async () => ({
        ...detailRef.current,
        status: 'counting',
        availableActions: ['submit', 'update', 'cancel'],
      }),
      submitStockCount: async (_id, lines) => ({
        ...detailRef.current,
        status: 'submitted',
        availableActions: ['approve', 'reverse'],
        lines: (detailRef.current.lines ?? []).map((line) => {
          const submitted = lines.find((item) => item.id === line.id);
          return submitted
            ? {
                ...line,
                actualQty: submitted.actualQty,
                varianceQty: submitted.actualQty - line.bookQty,
                remarks: submitted.remarks,
                customValues: submitted.customValues,
              }
            : line;
        }),
      }),
      updateStockCountLines: async (_id, lines) => ({
        ...detailRef.current,
        lines: lines.map((line, index) => {
          const source = detailRef.current.lines?.find((item) => item.id === line.id);
          return {
            ...source,
            id: line.id ?? `stock-count-updated-${index + 1}`,
            materialId: line.materialId,
            material: materials.find((item) => item.id === line.materialId),
            ownerType: line.ownerType ?? 'company',
            ownerRefId: line.ownerRefId ?? 'company',
            locationId: line.locationId,
            storageLocationSnapshot: line.storageLocation,
            batchNo: line.batchNo,
            bookQty: source?.bookQty ?? 0,
            reservedQty: source?.reservedQty ?? 0,
            frozenQty: source?.frozenQty ?? 0,
            actualQty: null,
            varianceQty: null,
            customValues: line.customValues,
          };
        }),
      }),
      approveStockCount: async () => ({
        ...detailRef.current,
        status: 'approved',
        availableActions: ['reverse'],
      }),
      reverseStockCount: async () => ({
        ...detailRef.current,
        status: 'reversed',
        availableActions: [],
      }),
      cancelStockCount: async () => ({
        ...detailRef.current,
        status: 'cancelled',
        availableActions: [],
      }),
      notifySuccess: () => undefined,
      notifyWarning: () => undefined,
    }),
    [],
  );

  const createdProps: Pick<
    CreateStockCountModalProps,
    'open' | 'onOpenChange' | 'capabilities'
  > = {
    open: createOpen,
    onOpenChange: setCreateOpen,
    capabilities: createCapabilities,
  };

  return (
    <SectionCard title="MES 库存盘点单组件">
      <Space orientation="vertical" style={{ width: '100%' }} size={12}>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          演示新建盲盘单、仓库与仓位字段注入、盘点行自定义字段、实盘录入、批量设置，以及审核/冲正/取消表单。所有数据和操作均由本地 mock 提供。
        </Typography.Paragraph>
        <Space>
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            新建盘点单
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>打开盘点详情</Button>
          <Tag color="processing">盲盘 · 盘点中</Tag>
        </Space>
        <MesUiProvider
          hasPermission={() => true}
          materialTablePickerCapabilities={materialPickerCapabilities}
        >
          <CreateStockCountModal
            {...createdProps}
            onCreated={(created) => {
              setDetail(created);
              detailRef.current = created;
              setDrawerOpen(true);
            }}
          />
          <StockCountDetailDrawer
            open={drawerOpen}
            detail={detail}
            showLocationControl
            onClose={() => setDrawerOpen(false)}
            onDetailChange={(next) => {
              detailRef.current = next;
              setDetail(next);
            }}
            onReloadList={() => undefined}
            onPrint={() => undefined}
            capabilities={detailCapabilities}
          />
        </MesUiProvider>
      </Space>
    </SectionCard>
  );
}
