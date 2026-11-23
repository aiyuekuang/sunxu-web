import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Button, Modal, Popconfirm, Space, Tag } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ResizableProTable } from './ResizableTable';
import TableActions from '../table/TableActions';
import { todayBusinessDate } from '../utils/businessDate';
import { formatUnitLabel } from '../utils/qty-unit';
import {
  useMesAmountMask,
  useMesSupplierPriceTierCapabilities,
} from '../MesUiProvider';
import type {
  MaterialSupplierPriceTierFormValues,
  SupplierPriceTierOption,
  SupplierPriceTierContext,
  SupplierPriceTierMutation,
  SupplierPriceTierRecord,
} from './supplier-price-tier-types';

const DEFAULT_CURRENCY = 'CNY';
const SCROLLABLE_FORM_MODAL_PROPS = {
  centered: true,
  destroyOnHidden: true,
  styles: {
    body: {
      maxHeight: 'calc(100vh - 200px)',
      overflowX: 'hidden' as const,
      overflowY: 'auto' as const,
    },
  },
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function getMutationSuccessText(mutation: SupplierPriceTierMutation) {
  if (mutation === 'create') return '新增成功';
  if (mutation === 'update') return '更新成功';
  return '删除成功';
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchasing
 * @sunxu-reason Preserves MES supplier tier listing and editing while requests, dictionary data, permission results, and mutation calls are host injected.
 */
export function MaterialSupplierPriceTiersModal({
  materialSupplier,
  createImmediately = false,
  onClose,
  onChanged,
}: {
  materialSupplier: SupplierPriceTierContext | null;
  createImmediately?: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const capabilities = useMesSupplierPriceTierCapabilities();
  const maskAmount = useMesAmountMask();
  const { message } = App.useApp();
  const priceTierActionRef = useRef<ActionType>(null);
  const [priceTierFormOpen, setPriceTierFormOpen] = useState(false);
  const [editingPriceTier, setEditingPriceTier] =
    useState<SupplierPriceTierRecord | null>(null);

  useEffect(() => {
    if (!materialSupplier || !createImmediately) return;
    setEditingPriceTier(null);
    setPriceTierFormOpen(true);
  }, [createImmediately, materialSupplier]);

  const getMaterialGradeLabel = useCallback(
    (grade?: string | null) =>
      grade
        ? (capabilities?.materialGradeLabelMap?.[grade] ?? grade)
        : '无等级',
    [capabilities?.materialGradeLabelMap],
  );

  const notifyChanged = useCallback(() => {
    priceTierActionRef.current?.reload();
    onChanged?.();
  }, [onChanged]);

  const handleClose = useCallback(() => {
    setEditingPriceTier(null);
    setPriceTierFormOpen(false);
    onClose();
  }, [onClose]);

  const canCreate = Boolean(
    capabilities?.canCreate && capabilities.createPriceTier,
  );
  const canUpdate = Boolean(
    capabilities?.canUpdate && capabilities.updatePriceTier,
  );
  const canDelete = Boolean(
    capabilities?.canDelete && capabilities.removePriceTier,
  );

  const handleDelete = useCallback(
    async (record: SupplierPriceTierRecord) => {
      if (!capabilities?.removePriceTier) return;
      await capabilities.removePriceTier({ id: record.id });
      capabilities.onMutationSuccess?.('delete');
      message.success(getMutationSuccessText('delete'));
      notifyChanged();
    },
    [capabilities, message, notifyChanged],
  );

  const columns: ProColumns<SupplierPriceTierRecord>[] = [
    {
      title: '等级',
      dataIndex: 'grade',
      width: 100,
      render: (_: unknown, record: SupplierPriceTierRecord) =>
        getMaterialGradeLabel(record.grade),
    },
    {
      title: '采购价',
      dataIndex: 'unitPrice',
      width: 150,
      align: 'right' as const,
      render: (_: unknown, record: SupplierPriceTierRecord) => {
        const unitLabel = record.priceUnit
          ? formatUnitLabel(record.priceUnit, capabilities?.unitLabelMap)
          : '';
        const amount = `${record.currency ?? capabilities?.defaultCurrency ?? DEFAULT_CURRENCY} ${Number(
          record.unitPrice,
        ).toFixed(4)}${unitLabel ? ` /${unitLabel}` : ''}`;
        return maskAmount(amount);
      },
    },
    {
      title: '税率/口径',
      width: 110,
      render: (_: unknown, record: SupplierPriceTierRecord) => (
        <Space size={4}>
          <span>{record.taxRate != null ? `${record.taxRate}%` : '-'}</span>
          {record.priceIncludesTax && <Tag>含税录入</Tag>}
        </Space>
      ),
    },
    {
      title: '数量范围',
      width: 150,
      render: (_: unknown, record: SupplierPriceTierRecord) =>
        `${record.minOrderQty ?? 0} - ${record.maxOrderQty ?? '∞'}`,
    },
    {
      title: '有效期',
      width: 190,
      render: (_: unknown, record: SupplierPriceTierRecord) =>
        `${record.validFrom}${record.validTo ? ` 至 ${record.validTo}` : ' 起'}`,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      align: 'right' as const,
      render: (_value, record) => record.priority ?? '-',
    },
    {
      title: '默认',
      dataIndex: 'isDefault',
      width: 70,
      render: (value: unknown) =>
        value ? <Tag color="blue">是</Tag> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (_: unknown, record: SupplierPriceTierRecord) =>
        record.status === 'active' ? (
          <Tag color="success">启用</Tag>
        ) : (
          <Tag>停用</Tag>
        ),
    },
    {
      title: '供应商料号',
      dataIndex: 'supplierMaterialCode',
      width: 130,
      ellipsis: true,
      render: (value) => (typeof value === 'string' && value ? value : '-'),
    },
    {
      title: '',
      key: 'actions',
      dataIndex: '__actions',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: SupplierPriceTierRecord) => (
        <TableActions
          actions={[
            canUpdate && (
              <Button
                key="edit"
                type="link"
                size="small"
                onClick={() => {
                  setEditingPriceTier(record);
                  setPriceTierFormOpen(true);
                }}
              >
                编辑
              </Button>
            ),
            canDelete && (
              <Popconfirm
                key="delete"
                title={`确认删除「${getMaterialGradeLabel(record.grade)}」价目？`}
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            ),
          ]}
        />
      ),
    },
  ];

  const requestPriceTiers = async () => {
    if (!materialSupplier || !capabilities?.requestPriceTiers) {
      return { data: [], total: 0, success: true };
    }
    const result = await capabilities.requestPriceTiers({
      materialId: materialSupplier.materialId,
      supplierId: materialSupplier.supplierId,
      page: 1,
      pageSize: 100,
    });
    return {
      data: result?.list ?? [],
      total: result?.total ?? 0,
      success: true,
    };
  };

  const renderForm = Boolean(
    materialSupplier &&
      priceTierFormOpen &&
      ((editingPriceTier && canUpdate) || (!editingPriceTier && canCreate)),
  );

  return (
    <>
      <Modal
        open={Boolean(materialSupplier)}
        title={`采购价目 - ${
          [materialSupplier?.material?.code, materialSupplier?.material?.name]
            .filter(Boolean)
            .join(' ') || '-'
        } / ${materialSupplier?.supplier?.name ?? '-'}`}
        width={1040}
        footer={null}
        destroyOnHidden
        onCancel={handleClose}
      >
        {materialSupplier && capabilities?.requestPriceTiers ? (
          <ResizableProTable<SupplierPriceTierRecord>
            actionRef={priceTierActionRef}
            rowKey="id"
            request={requestPriceTiers}
            search={false}
            fitContainerHeight={false}
            size="small"
            pagination={false}
            showRowIndex={false}
            options={{
              reload: false,
              density: false,
              fullScreen: false,
              setting: true,
            }}
            toolBarRender={() => [
              canCreate ? (
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingPriceTier(null);
                    setPriceTierFormOpen(true);
                  }}
                >
                  新增价目
                </Button>
              ) : null,
            ]}
            columns={columns}
            scroll={{ x: 1160 }}
          />
        ) : (
          <Alert
            type="error"
            showIcon
            message="供应商价目服务未配置"
          />
        )}
      </Modal>

      {renderForm && materialSupplier && capabilities && (
        <ModalForm<MaterialSupplierPriceTierFormValues>
          open={priceTierFormOpen}
          title={editingPriceTier ? '编辑' : '新增'}
          width={560}
          modalProps={SCROLLABLE_FORM_MODAL_PROPS}
          onOpenChange={(open) => {
            setPriceTierFormOpen(open);
            if (!open) setEditingPriceTier(null);
          }}
          initialValues={
            editingPriceTier
              ? { ...editingPriceTier, grade: editingPriceTier.grade ?? '' }
              : {
                  currency:
                    capabilities.defaultCurrency ?? DEFAULT_CURRENCY,
                  validFrom: todayBusinessDate(),
                  status: 'active',
                  priceIncludesTax: false,
                  isDefault: false,
                  supplierMaterialCode:
                    materialSupplier.supplierMaterialCode ?? undefined,
                  leadTimeDays: materialSupplier.leadTimeDays ?? undefined,
                  minOrderQty: materialSupplier.minOrderQty ?? undefined,
                }
          }
          onFinish={async (values) => {
            if (editingPriceTier) {
              if (!capabilities.updatePriceTier) return false;
              await capabilities.updatePriceTier({
                id: editingPriceTier.id,
                unitPrice: values.unitPrice ?? undefined,
                priceUnit: optionalText(values.priceUnit),
                taxRate: values.taxRate,
                priceIncludesTax: values.priceIncludesTax,
                supplierMaterialCode: values.supplierMaterialCode,
                supplierModelCode: values.supplierModelCode,
                supplierSpec: values.supplierSpec,
                validTo: optionalText(values.validTo),
                priority: values.priority,
                quotaPercent: values.quotaPercent,
                minOrderQty: values.minOrderQty,
                maxOrderQty: values.maxOrderQty,
                isDefault: values.isDefault,
                leadTimeDays: values.leadTimeDays,
                status: values.status,
                remarks: values.remarks,
              });
              capabilities.onMutationSuccess?.('update');
              message.success(getMutationSuccessText('update'));
              notifyChanged();
              return true;
            }

            if (!capabilities.createPriceTier) return false;
            if (values.unitPrice == null) {
              message.error('请输入采购单价');
              return false;
            }
            await capabilities.createPriceTier({
              materialId: materialSupplier.materialId,
              supplierId: materialSupplier.supplierId,
              grade: optionalText(values.grade),
              unitPrice: values.unitPrice,
              priceUnit: optionalText(values.priceUnit),
              currency:
                optionalText(values.currency) ??
                capabilities.defaultCurrency ??
                DEFAULT_CURRENCY,
              supplierMaterialCode: values.supplierMaterialCode,
              supplierModelCode: values.supplierModelCode,
              supplierSpec: values.supplierSpec,
              taxRate: values.taxRate,
              priceIncludesTax: values.priceIncludesTax,
              validFrom: optionalText(values.validFrom),
              validTo: optionalText(values.validTo),
              priority: values.priority,
              quotaPercent: values.quotaPercent,
              minOrderQty: values.minOrderQty,
              maxOrderQty: values.maxOrderQty,
              isDefault: values.isDefault,
              leadTimeDays: values.leadTimeDays,
              remarks: values.remarks,
            });
            capabilities.onMutationSuccess?.('create');
            message.success(getMutationSuccessText('create'));
            notifyChanged();
            return true;
          }}
        >
          <ProFormSelect
            name="grade"
            label="物料等级"
            options={[
              { label: '无等级', value: '' },
              ...(capabilities.materialGradeOptions ?? []),
            ]}
            disabled={Boolean(editingPriceTier)}
          />
          <ProFormDigit
            name="unitPrice"
            label="采购单价"
            min={0}
            rules={[{ required: true, message: '请输入采购单价' }]}
            tooltip="供应商协议价，按「计价单位」解释；采购下单会按物料、供应商、等级、数量区间、有效期和优先级匹配。不要用 0 表示缺价。"
            fieldProps={{
              precision: 4,
              placeholder: '按计价单位填写，例如 12.5000',
            }}
          />
          <ProFormSelect
            name="priceUnit"
            label="计价单位"
            allowClear
            tooltip="采购单价按此单位计；留空=按物料基本单位。按 kg/L/箱 等大单位报价时务必选对单位，否则成本会按基本单位算错（虚高）。可选单位须先在物料的「单位换算」中维护。"
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
            request={async () => {
              const baseUnit = materialSupplier.material?.unit;
              const options: SupplierPriceTierOption[] = [];
              if (baseUnit) {
                const baseUnitLabel = formatUnitLabel(
                  baseUnit,
                  capabilities.unitLabelMap,
                );
                options.push({
                  label: `${baseUnitLabel}（基本单位）`,
                  value: baseUnit,
                });
              }
              const response = await capabilities.requestUnitConversions?.({
                materialId: materialSupplier.materialId,
                page: 1,
                pageSize: 100,
              });
              for (const conversion of response?.list ?? []) {
                if (!conversion.unit || conversion.unit === baseUnit) continue;
                const unitLabel = formatUnitLabel(
                  conversion.unit,
                  capabilities.unitLabelMap,
                );
                const displayBaseUnit = formatUnitLabel(
                  conversion.baseUnit ?? baseUnit,
                  capabilities.unitLabelMap,
                );
                options.push({
                  label: `${unitLabel}（1${unitLabel}=${conversion.factorToBase}${displayBaseUnit}）`,
                  value: conversion.unit,
                });
              }
              return options;
            }}
          />
          <ProFormSelect
            name="currency"
            label="币别"
            disabled={Boolean(editingPriceTier)}
            rules={[{ required: true, message: '请选择币别' }]}
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
            tooltip="币别取自数据字典「币别」，可在系统设置 > 字典管理维护"
            request={async () => {
              const options = await capabilities.requestCurrencyOptions?.();
              return [...(options ?? capabilities.currencyOptions ?? [])];
            }}
          />
          <ProFormDigit
            name="taxRate"
            label="税率（%）"
            min={0}
            max={100}
            tooltip="仅填写税率数值，例如 13 表示 13%；是否为含税价由「录入价含税」控制。"
            fieldProps={{ precision: 4, placeholder: '例如 13' }}
          />
          <ProFormSwitch
            name="priceIncludesTax"
            label="录入价含税"
            tooltip="开启表示采购单价为含税价；关闭表示采购单价为未税价，系统按税率计算税额。"
          />
          <ProFormText
            name="validFrom"
            label="生效日期"
            disabled={Boolean(editingPriceTier)}
            placeholder="YYYY-MM-DD"
          />
          <ProFormText
            name="validTo"
            label="失效日期"
            placeholder="YYYY-MM-DD"
          />
          <ProFormDigit
            name="minOrderQty"
            label="起订量"
            min={0}
            tooltip="该价目适用的最小采购数量；留空表示不限制下限。采购数量低于此值时不应命中该阶梯价。"
            fieldProps={{ precision: 4, placeholder: '留空=不限制下限' }}
          />
          <ProFormDigit
            name="maxOrderQty"
            label="最大订购量"
            min={0}
            tooltip="该价目适用的最大采购数量；留空表示不限制上限。用于和起订量组成数量阶梯。"
            fieldProps={{ precision: 4, placeholder: '留空=不限制上限' }}
          />
          <ProFormDigit
            name="leadTimeDays"
            label="交期天数"
            min={0}
            fieldProps={{ precision: 0 }}
          />
          <ProFormDigit
            name="priority"
            label="推荐优先级"
            min={0}
            tooltip="同一供应商、等级和数量区间存在多条有效价目时，数字越小越优先。建议用 10、20、30 预留插入空间。"
            fieldProps={{ precision: 0, placeholder: '数字越小越优先' }}
          />
          <ProFormDigit
            name="quotaPercent"
            label="配额比例（%）"
            min={0}
            max={100}
            tooltip="用于供应商配额参考，填写 0-100；不参与单价数值计算，留空表示未设置配额。"
            fieldProps={{ precision: 2, placeholder: '例如 60' }}
          />
          <ProFormSwitch
            name="isDefault"
            label="设为默认价目"
            tooltip="当没有更精确的等级或数量阶梯命中时，可作为该供应商物料的默认参考价。"
          />
          {editingPriceTier && (
            <ProFormSelect
              name="status"
              label="状态"
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]}
            />
          )}
          <ProFormText name="supplierMaterialCode" label="供应商物料编号" />
          <ProFormText name="supplierModelCode" label="供应商型号编码/牌号" />
          <ProFormText name="supplierSpec" label="供应商规格描述" />
          <ProFormTextArea
            name="remarks"
            label="备注"
            tooltip={capabilities.remarksTooltip}
            fieldProps={{ rows: 2 }}
          />
        </ModalForm>
      )}
    </>
  );
}
