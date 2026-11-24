import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ProFormDigit,
  type ProFormRef,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Card, Input, InputNumber, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QuickProFormDateRangePicker } from '../../components/QuickDateRangePicker';
import { MaterialSelectField } from './MaterialFilteredSelect';
import { DocumentModalForm } from './DocumentModalForm';
import type {
  PackageAvailableSourceRecord,
  PackageCreatePayload,
  PackageSourceFilters,
  PackageUnitCreateCapabilities,
  PackageUnitCreateDrawerProps,
  PackageUnitCreateFormValues,
} from './package-management-types';

const { Text } = Typography;
const SOURCE_MODE_TEXT: Record<PackageAvailableSourceRecord['sourceMode'], string> = {
  batch: '批号来源',
  production_tx: '完工流水',
  stock_balance: '库存余额',
};

interface PackagePlanRow {
  key: string;
  qty: number;
  remarks?: string;
}

function roundQty(value: number) {
  return Number(value.toFixed(4));
}

let nextPlanSeq = 0;
function createPlan(qty = 0, remarks?: string): PackagePlanRow {
  nextPlanSeq += 1;
  return { key: `package-plan-${Date.now()}-${nextPlanSeq}`, qty, remarks };
}

function getSourceBatchText(source: PackageAvailableSourceRecord) {
  if (source.batchTracking) return source.batchNo || '-';
  return '未启用批号追溯';
}

function getSourceOptionLabel(
  source: PackageAvailableSourceRecord,
  modeLabels: Readonly<Record<string, string>>,
) {
  const sourceModeText = modeLabels[source.sourceMode] ?? SOURCE_MODE_TEXT[source.sourceMode] ?? '来源';
  const workOrderText = source.sourceWorkOrderNo ? ` / 工单 ${source.sourceWorkOrderNo}` : '';
  const referenceText = source.sourceReferenceNo
    ? ` / 流水 ${source.sourceReferenceNo}`
    : source.sourceMode === 'stock_balance' ? ' / 库存余额' : '';
  return `${source.materialCode} / ${source.materialName} / ${getSourceBatchText(source)}${workOrderText}${referenceText} / ${sourceModeText} / 最多可包装 ${source.availableQty}`;
}

function toUniqueOptions(
  rows: PackageAvailableSourceRecord[],
  pick: (row: PackageAvailableSourceRecord) => string | null | undefined,
) {
  const options = new Map<string, { label: string; value: string }>();
  for (const row of rows) {
    const value = pick(row)?.trim();
    if (value && !options.has(value)) options.set(value, { label: value, value });
  }
  return [...options.values()];
}

function toSourceWorkOrderOptions(
  rows: PackageAvailableSourceRecord[],
  keyword?: string,
) {
  const normalizedKeyword = keyword?.trim().toLowerCase();
  const options = new Map<string, { label: string; value: string }>();
  for (const row of rows) {
    if (!row.sourceWorkOrderId) continue;
    const label = `${row.sourceWorkOrderNo || row.sourceWorkOrderId} / ${row.materialCode} ${row.materialName}`;
    if (normalizedKeyword && !label.toLowerCase().includes(normalizedKeyword)) continue;
    if (!options.has(row.sourceWorkOrderId)) {
      options.set(row.sourceWorkOrderId, { label, value: row.sourceWorkOrderId });
    }
  }
  return [...options.values()];
}

/** @sunxu-component mes-specific @sunxu-domain warehouse-packaging @sunxu-reason Preserves MES source filtering, safe quantity planning, packaging validation and creation flow while the host injects services, dictionaries, navigation and notifications. */
export function PackageUnitCreateDrawer({
  open,
  onOpenChange,
  onCreated,
  capabilities,
}: PackageUnitCreateDrawerProps) {
  const formRef = useRef<ProFormRef<PackageUnitCreateFormValues> | undefined>(undefined);
  const sourceMapRef = useRef<Record<string, PackageAvailableSourceRecord>>({});
  const [sourceMap, setSourceMap] = useState<Record<string, PackageAvailableSourceRecord>>({});
  const [selectedSource, setSelectedSource] = useState<PackageAvailableSourceRecord | null>(null);
  const [plans, setPlans] = useState<PackagePlanRow[]>([]);
  const [sourceFilters, setSourceFilters] = useState<PackageSourceFilters>({ refreshKey: 0 });
  const [sourceOptionsEmpty, setSourceOptionsEmpty] = useState(false);
  const [packageSpecRefreshKey, setPackageSpecRefreshKey] = useState(0);
  const sourceOptionsRequestIdRef = useRef(0);
  const sourceOptionsProbeIdRef = useRef(0);
  const refreshAfterHostRouteRef = useRef(false);

  const totalPlanQty = useMemo(
    () => roundQty(plans.reduce((sum, item) => sum + Number(item.qty || 0), 0)),
    [plans],
  );
  const selectedSourceUnitLabel = selectedSource
    ? capabilities.unitLabelMap[selectedSource.unit] ?? selectedSource.unit
    : '';

  const clearSourceSelection = useCallback(() => {
    setSelectedSource(null);
    setPlans([]);
    formRef.current?.setFieldsValue({
      sourceBatchId: undefined,
      totalQty: undefined,
      packageSpecId: undefined,
      packageType: undefined,
    });
  }, []);

  const resetState = useCallback(() => {
    sourceMapRef.current = {};
    setSourceMap({});
    setSelectedSource(null);
    setPlans([]);
    setSourceOptionsEmpty(false);
    setSourceFilters({ refreshKey: 0 });
    formRef.current?.resetFields();
  }, []);

  const updateSourceFilters = useCallback((patch: Partial<Omit<PackageSourceFilters, 'refreshKey'>>) => {
    setSourceOptionsEmpty(false);
    setSourceFilters((previous) => ({
      ...previous,
      ...patch,
      refreshKey: previous.refreshKey + 1,
    }));
    clearSourceSelection();
  }, [clearSourceSelection]);

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterHostRouteRef.current) return;
      refreshAfterHostRouteRef.current = false;
      setSourceFilters((current) => ({ ...current, refreshKey: current.refreshKey + 1 }));
      setPackageSpecRefreshKey((current) => current + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  useEffect(() => {
    const requestId = ++sourceOptionsProbeIdRef.current;
    if (!open) {
      setSourceOptionsEmpty(false);
      return;
    }
    const { refreshKey: _refreshKey, ...filters } = sourceFilters;
    capabilities.listAvailableSources({ page: 1, pageSize: 50, ...filters })
      .then((result) => {
        if (requestId === sourceOptionsProbeIdRef.current) {
          setSourceOptionsEmpty((result.list ?? []).length === 0);
        }
      })
      .catch(() => {
        if (requestId === sourceOptionsProbeIdRef.current) setSourceOptionsEmpty(false);
      });
    return () => {
      if (requestId === sourceOptionsProbeIdRef.current) sourceOptionsProbeIdRef.current += 1;
    };
  }, [capabilities, open, sourceFilters]);

  const buildSinglePlan = (qty: number) => {
    const normalizedQty = roundQty(qty);
    setPlans(normalizedQty > 0 ? [createPlan(normalizedQty)] : []);
  };

  const applySuggestedPlansForSource = async (
    source: PackageAvailableSourceRecord,
    values?: { totalQty?: number; packageSpecId?: string; packageType?: string },
  ) => {
    const validated = values ?? await formRef.current?.validateFields(['totalQty', 'packageSpecId', 'packageType']);
    const totalQty = Number(validated?.totalQty ?? 0);
    if (!(totalQty > 0)) {
      capabilities.notify.warning('请输入本次待包装数量');
      return;
    }
    if (totalQty > Number(source.availableQty)) {
      capabilities.notify.warning(`本次待包装数量不能超过当前最多可包装数量 ${source.availableQty}`);
      return;
    }
    const packageSpecId = validated?.packageSpecId || source.packageSpecId || undefined;
    const capacityQty = source.capacityQty ? Number(source.capacityQty) : undefined;
    if (!packageSpecId && !(capacityQty && capacityQty > 0)) {
      buildSinglePlan(totalQty);
      capabilities.notify.info('当前物料未配置箱规，已按单箱创建 1 条计划');
      return;
    }
    const preview = await capabilities.previewSplit({
      totalQty,
      packageSpecId,
      capacityQty,
      packageType: (validated?.packageType as PackageCreatePayload['packageType']) || source.packageType || undefined,
    });
    setPlans((preview.items ?? []).map((item) => createPlan(Number(item.qty ?? 0))));
  };

  const applySuggestedPlans = async () => {
    if (!selectedSource) {
      capabilities.notify.warning('请先选择可包装来源');
      return;
    }
    await applySuggestedPlansForSource(selectedSource);
  };

  const requestSources = async (params: Record<string, unknown>, pageSize: number) => {
    const { refreshKey: _refreshKey, ...filterDefaults } = sourceFilters;
    const valueFor = (key: keyof Omit<PackageSourceFilters, 'refreshKey'>) => {
      const raw = Object.prototype.hasOwnProperty.call(params, key)
        ? params[key]
        : filterDefaults[key];
      return typeof raw === 'string' ? raw : undefined;
    };
    return capabilities.listAvailableSources({
      page: 1,
      pageSize,
      keyword: typeof (params.keyWords ?? params.keyword) === 'string'
        ? String(params.keyWords ?? params.keyword)
        : undefined,
      warehouseId: valueFor('warehouseId'),
      materialId: valueFor('materialId'),
      sourceWorkOrderId: valueFor('sourceWorkOrderId'),
      batchNo: valueFor('batchNo'),
      sourceReferenceNo: valueFor('sourceReferenceNo'),
      startDate: valueFor('startDate'),
      endDate: valueFor('endDate'),
    });
  };

  return (
    <DocumentModalForm<PackageUnitCreateFormValues>
      title="新增"
      formRef={formRef}
      open={open}
      width="100vw"
      layout="vertical"
      modalProps={{ destroyOnHidden: true, centered: false, mask: { closable: false }, className: 'document-form-modal' }}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetState();
        else requestAnimationFrame(() => formRef.current?.setFieldsValue({ printNow: true }));
      }}
      onFinish={async (values) => {
        if (!selectedSource) {
          capabilities.notify.warning('请先选择可包装来源');
          return false;
        }
        if (plans.length === 0) {
          capabilities.notify.warning('请至少添加一个包装计划');
          return false;
        }
        const normalizedPlans = plans
          .map((item) => ({ qty: roundQty(Number(item.qty || 0)), remarks: item.remarks?.trim() || undefined }))
          .filter((item) => item.qty > 0);
        if (normalizedPlans.length === 0) {
          capabilities.notify.warning('包装计划数量必须大于 0');
          return false;
        }
        const totalQty = roundQty(Number(values.totalQty || 0));
        if (totalQty <= 0) {
          capabilities.notify.warning('请输入本次待包装数量');
          return false;
        }
        if (roundQty(totalQty) !== roundQty(totalPlanQty)) {
          capabilities.notify.warning('包装计划数量合计必须与本次待包装数量一致');
          return false;
        }
        if (totalQty > Number(selectedSource.availableQty)) {
          capabilities.notify.warning(`本次待包装数量不能超过当前最多可包装数量 ${selectedSource.availableQty}`);
          return false;
        }
        const units = await capabilities.createUnits({
          sourceMode: selectedSource.sourceMode,
          batchId: selectedSource.batchId || undefined,
          materialId: selectedSource.materialId,
          warehouseId: selectedSource.warehouseId,
          packageSpecId: values.packageSpecId || selectedSource.packageSpecId || undefined,
          packageType: values.packageType || selectedSource.packageType || undefined,
          sourceWorkOrderId: selectedSource.sourceWorkOrderId || undefined,
          sourceTransactionId: selectedSource.sourceTransactionId || undefined,
          printNow: Boolean(values.printNow),
          remarks: values.remarks || undefined,
          packages: normalizedPlans,
        });
        capabilities.notify.success(`已生成 ${units.length} 个包装单元`);
        onCreated(units, Boolean(values.printNow));
        resetState();
        return true;
      }}
    >
      <div className="document-form-layout">
        <Card size="small" title="来源筛选" style={{ marginBottom: 16 }}>
          <div className="document-form-grid">
            <MaterialSelectField
              name="filterSourceMaterialId"
              {...capabilities.getAutoFieldHelpProps('物料档案')}
              request={capabilities.requestPackableMaterialOptions}
              onChange={(nextValue) => {
                formRef.current?.setFieldsValue({
                  filterSourceWorkOrderId: undefined,
                  filterSourceBatchNo: undefined,
                  filterSourceReferenceNo: undefined,
                });
                updateSourceFilters({
                  materialId: nextValue ? String(nextValue) : undefined,
                  sourceWorkOrderId: undefined,
                  batchNo: undefined,
                  sourceReferenceNo: undefined,
                });
              }}
            />
            <ProFormSelect
              name="filterSourceWorkOrderId"
              {...capabilities.getAutoFieldHelpProps('来源工单')}
              params={sourceFilters}
              request={async ({ keyWords }) => {
                const result = await requestSources({ sourceWorkOrderId: undefined }, 100);
                return toSourceWorkOrderOptions(result.list ?? [], keyWords);
              }}
              showSearch
              fieldProps={{
                optionFilterProp: 'label',
                onChange: (value) => {
                  formRef.current?.setFieldsValue({ filterSourceReferenceNo: undefined });
                  updateSourceFilters({
                    sourceWorkOrderId: value ? String(value) : undefined,
                    sourceReferenceNo: undefined,
                  });
                },
              }}
            />
            <ProFormSelect
              name="filterSourceWarehouseId"
              {...capabilities.getAutoFieldHelpProps('仓库')}
              request={capabilities.requestWarehouseOptions}
              showSearch
              fieldProps={{
                showSearch: true,
                placeholder: '按仓库搜索',
                optionFilterProp: 'label',
                onChange: (value: unknown) => {
                  formRef.current?.setFieldsValue({ filterSourceBatchNo: undefined, filterSourceReferenceNo: undefined });
                  updateSourceFilters({
                    warehouseId: value ? String(value) : undefined,
                    batchNo: undefined,
                    sourceReferenceNo: undefined,
                  });
                },
              }}
            />
            <ProFormSelect
              name="filterSourceBatchNo"
              {...capabilities.getAutoFieldHelpProps('批号')}
              showSearch
              params={sourceFilters}
              request={async ({ keyWords }) => {
                const result = await requestSources({ batchNo: keyWords || sourceFilters.batchNo }, 100);
                return toUniqueOptions(result.list ?? [], (row) => row.batchNo);
              }}
              fieldProps={{ optionFilterProp: 'label', onChange: (value) => updateSourceFilters({ batchNo: value ? String(value) : undefined }) }}
            />
            <ProFormSelect
              name="filterSourceReferenceNo"
              {...capabilities.getAutoFieldHelpProps('来源流水号')}
              showSearch
              params={sourceFilters}
              request={async ({ keyWords }) => {
                const result = await requestSources({ sourceReferenceNo: keyWords || sourceFilters.sourceReferenceNo }, 100);
                return toUniqueOptions(result.list ?? [], (row) => row.sourceReferenceNo);
              }}
              fieldProps={{ optionFilterProp: 'label', onChange: (value) => updateSourceFilters({ sourceReferenceNo: value ? String(value) : undefined }) }}
            />
            <QuickProFormDateRangePicker
              name="filterSourceDateRange"
              {...capabilities.getFieldHelpProps('完工时间', 'sourceCompletionDate')}
              fieldProps={{
                presets: capabilities.dateRangePresets?.map(({ label, value }) => {
                  const [start, end] = typeof value === 'function' ? value() : value;
                  const range: [Dayjs | null, Dayjs | null] = [
                    start ?? null,
                    end ?? null,
                  ];
                  return { label, value: range };
                }),
                onChange: (dates) => {
                  const range = dates as [Dayjs, Dayjs] | null;
                  updateSourceFilters({
                    startDate: range?.[0] ? dayjs(range[0]).startOf('day').toISOString() : undefined,
                    endDate: range?.[1] ? dayjs(range[1]).endOf('day').toISOString() : undefined,
                  });
                },
              }}
            />
          </div>
        </Card>

        <section className="document-form-section">
          <div className="document-form-section-title">包装来源</div>
          <ProFormSelect
            name="sourceBatchId"
            {...capabilities.getFieldHelpProps('可包装来源', 'sourceBatchId')}
            label={capabilities.renderConfigEntryLabel({
              target: 'productionReceipts',
              children: '可包装来源',
              show: sourceOptionsEmpty && !selectedSource,
              onOpen: () => { refreshAfterHostRouteRef.current = true; },
            })}
            rules={[{ required: true, message: '请选择可包装来源' }]}
            showSearch
            params={sourceFilters}
            request={async (params) => {
              const requestId = ++sourceOptionsRequestIdRef.current;
              const hasKeyword = Boolean(String(params.keyWords ?? '').trim());
              if (!hasKeyword) setSourceOptionsEmpty(false);
              const result = await requestSources(params, 50);
              const rows = result.list ?? [];
              if (requestId === sourceOptionsRequestIdRef.current && !hasKeyword) setSourceOptionsEmpty(rows.length === 0);
              const nextMap = rows.reduce<Record<string, PackageAvailableSourceRecord>>((map, row) => {
                map[row.id] = row;
                return map;
              }, {});
              sourceMapRef.current = { ...sourceMapRef.current, ...nextMap };
              setSourceMap(sourceMapRef.current);
              return rows.map((row) => ({ label: getSourceOptionLabel(row, capabilities.packageTypeLabels), value: row.id }));
            }}
            fieldProps={{
              optionFilterProp: 'label',
              notFoundContent: (
                <Space orientation="vertical" size={4} style={{ padding: 8 }}>
                  <Typography.Text type="secondary">
                    没有找到符合当前筛选条件且可包装的库存或完工来源。请检查仓库、物料、批号和日期；刚完工的产品需先完成生产入库。
                  </Typography.Text>
                  {capabilities.renderConfigEntryLink({
                    target: 'productionReceipts',
                    label: '生产入库单',
                    actionText: '查看生产入库单',
                    onOpen: () => { refreshAfterHostRouteRef.current = true; },
                  })}
                </Space>
              ),
              onChange: (value) => {
                const nextSource = value
                  ? sourceMapRef.current[String(value)] ?? sourceMap[String(value)] ?? null
                  : null;
                setSelectedSource(nextSource);
                if (!nextSource) {
                  setPlans([]);
                  return;
                }
                const nextTotalQty = Number(nextSource.availableQty);
                formRef.current?.setFieldsValue({
                  totalQty: nextTotalQty,
                  packageSpecId: nextSource.packageSpecId ?? undefined,
                  packageType: nextSource.packageType ?? undefined,
                });
                if (nextSource.packageSpecId || nextSource.capacityQty) {
                  void applySuggestedPlansForSource(nextSource, {
                    totalQty: nextTotalQty,
                    packageSpecId: nextSource.packageSpecId ?? undefined,
                    packageType: nextSource.packageType,
                  });
                } else buildSinglePlan(nextTotalQty);
              },
            }}
          />

          {selectedSource ? (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" size={4}>
                <Text>来源：{SOURCE_MODE_TEXT[selectedSource.sourceMode]} / {selectedSource.warehouseName}</Text>
                <Text>批号：{getSourceBatchText(selectedSource)}</Text>
                {selectedSource.sourceWorkOrderNo ? <Text>来源工单：{selectedSource.sourceWorkOrderNo}</Text> : null}
                <Text>
                  物料：{selectedSource.materialCode} {selectedSource.materialName}
                  {selectedSource.materialSpec ? ` / ${selectedSource.materialSpec}` : ''}
                </Text>
                <Text>
                  {selectedSource.sourceQty != null ? `来源数量 ${selectedSource.sourceQty}，` : ''}
                  已包装 {selectedSource.packagedQty}，
                  {selectedSource.batchAvailableQty != null ? `批号可用量 ${selectedSource.batchAvailableQty}，` : ''}
                  库存可用 {selectedSource.stockAvailableQty}，当前最多可包装 {selectedSource.availableQty} {selectedSourceUnitLabel}
                </Text>
                {selectedSource.sourceReferenceNo ? <Text>来源单号：{selectedSource.sourceReferenceNo}</Text> : null}
              </Space>
            </Card>
          ) : null}

          <ProFormDigit
            name="totalQty"
            {...capabilities.getFieldHelpProps('本次待包装数量', 'totalQty')}
            min={0.0001}
            extra={selectedSource
              ? `当前最多可包装 ${selectedSource.availableQty}${selectedSourceUnitLabel ? ` ${selectedSourceUnitLabel}` : ''}；装箱明细合计必须与这里一致。`
              : '本次数量不能超过当前最多可包装数量，且要和下面装箱明细合计一致。'}
            fieldProps={{ precision: 4 }}
            rules={[{ required: true, message: '请输入本次待包装数量' }]}
          />
          <ProFormSelect
            name="packageSpecId"
            {...capabilities.getFieldHelpProps('包装规格', 'packageSpecId')}
            label={capabilities.renderConfigEntryLabel({
              target: 'packageSpecs',
              children: '包装规格',
              show: Boolean(selectedSource?.materialId),
              onOpen: () => { refreshAfterHostRouteRef.current = true; },
            })}
            params={{ materialId: selectedSource?.materialId, refreshKey: packageSpecRefreshKey }}
            showSearch
            request={async ({ materialId }) => {
              if (!materialId) return [];
              const result = await capabilities.listSpecs({ page: 1, pageSize: 50, materialId: String(materialId), isActive: true });
              return (result.list ?? []).map((item) => ({
                label: `${item.packageName || capabilities.packageTypeLabels[item.packageType] || item.packageType} / 标准 ${item.capacityQty}`,
                value: item.id,
              }));
            }}
          />
          <ProFormSelect
            name="packageType"
            {...capabilities.getFieldHelpProps('包装类型', 'packageType')}
            options={capabilities.packageTypeOptions}
          />
          <ProFormSwitch name="printNow" {...capabilities.getFieldHelpProps('生成后立即生成打印记录', 'printNow')} />
          <ProFormTextArea name="remarks" {...capabilities.getAutoFieldHelpProps('包装备注')} />
        </section>

        <Card
          size="small"
          title="装箱明细"
          extra={
            <Space>
              <Button onClick={() => void applySuggestedPlans()}>按箱规建议</Button>
              <Button icon={<PlusOutlined />} onClick={() => setPlans((current) => [...current, createPlan()])}>增加一箱</Button>
            </Space>
          }
        >
          <Space orientation="vertical" style={{ width: '100%' }} size={12}>
            {plans.map((plan, index) => (
              <Space key={plan.key} align="start" style={{ width: '100%' }}>
                <Text style={{ minWidth: 56, paddingTop: 6 }}>{`第 ${index + 1} 箱`}</Text>
                <InputNumber
                  min={0.0001}
                  step={0.0001}
                  precision={4}
                  style={{ width: 140 }}
                  value={plan.qty}
                  placeholder="数量"
                  onChange={(value) => setPlans((current) => current.map((item) => item.key === plan.key ? { ...item, qty: Number(value ?? 0) } : item))}
                />
                <Input
                  style={{ flex: 1 }}
                  value={plan.remarks || ''}
                  placeholder="单箱备注（可选）"
                  onChange={(event) => setPlans((current) => current.map((item) => item.key === plan.key ? { ...item, remarks: event.target.value || undefined } : item))}
                />
                <Button danger icon={<DeleteOutlined />} aria-label={`删除第 ${index + 1} 箱`} onClick={() => setPlans((current) => current.filter((item) => item.key !== plan.key))} />
              </Space>
            ))}
            <Text type="secondary">当前合计：{totalPlanQty}{selectedSourceUnitLabel ? ` ${selectedSourceUnitLabel}` : ''}</Text>
          </Space>
        </Card>
      </div>
    </DocumentModalForm>
  );
}

export type { PackageUnitCreateCapabilities, PackageUnitCreateDrawerProps } from './package-management-types';
