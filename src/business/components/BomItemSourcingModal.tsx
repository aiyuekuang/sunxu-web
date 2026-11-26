import { Button, InputNumber, Modal, Popconfirm, Radio, Select, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { ResizableTable as Table, type ResizableTableProps } from './ResizableTable';
import type {
  BomItemSourcingModalProps,
  BomSupplierSourcingPriceTier,
} from './bom-item-sourcing-modal-types';

interface SourcingOptionRow {
  materialSupplierPriceTierId: string;
  supplierName: string;
  grade?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  isPreferred: boolean;
  priority?: number | null;
}

function priceLabel(value?: number | null, currency?: string | null) {
  if (value === null || value === undefined) return '—';
  const normalizedCurrency = currency?.trim();
  return `${Number(value).toLocaleString('zh-CN')}${
    normalizedCurrency ? ` ${normalizedCurrency}` : ''
  }`;
}

function tierLabel(tier: BomSupplierSourcingPriceTier) {
  const parts = [
    tier.supplier?.name ?? tier.supplierId,
    tier.grade ? `等级 ${tier.grade}` : '无等级',
    priceLabel(tier.unitPrice, tier.currency),
  ];
  return parts.join(' · ');
}

/**
 * @sunxu-layer business
 * @sunxu-domain bom
 * @sunxu-reason Preserves per-BOM-line supplier sourcing options and preferred-tier editing while loading, saving, and feedback remain host supplied.
 */
export function BomItemSourcingModal({
  open,
  bomItemId,
  materialId,
  materialName,
  capabilities,
  onClose,
}: BomItemSourcingModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<BomSupplierSourcingPriceTier[]>([]);
  const [rows, setRows] = useState<SourcingOptionRow[]>([]);

  useEffect(() => {
    if (!open || !bomItemId || !materialId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [group, tierRes] = await Promise.all([
          capabilities.loadOptions({ bomItemId }),
          capabilities.loadPriceTiers({ materialId, page: 1, pageSize: 100 }),
        ]);
        if (cancelled) return;
        const tierList = (tierRes.list ?? []).filter(
          (tier) => tier.status !== 'inactive',
        );
        setTiers([...tierList]);
        const tierMap = new Map(tierList.map((tier) => [tier.id, tier]));
        setRows(
          (group?.options ?? []).map((option) => {
            const tier =
              option.priceTier ??
              tierMap.get(option.materialSupplierPriceTierId);
            return {
              materialSupplierPriceTierId:
                option.materialSupplierPriceTierId,
              supplierName:
                tier?.supplier?.name ?? option.supplier?.name ?? '未知供应商',
              grade: tier?.grade ?? null,
              unitPrice: tier?.unitPrice ?? null,
              currency: tier?.currency ?? null,
              isPreferred: option.isPreferred,
              priority: option.priority ?? null,
            };
          }),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    capabilities,
    open,
    bomItemId,
    materialId,
  ]);

  const availableTierOptions = useMemo(() => {
    const used = new Set(rows.map((row) => row.materialSupplierPriceTierId));
    return tiers
      .filter((tier) => !used.has(tier.id))
      .map((tier) => ({ label: tierLabel(tier), value: tier.id }));
  }, [tiers, rows]);

  const addTier = (tierId: string) => {
    const tier = tiers.find((item) => item.id === tierId);
    if (!tier) return;
    setRows((previous) => [
      ...previous,
      {
        materialSupplierPriceTierId: tier.id,
        supplierName: tier.supplier?.name ?? tier.supplierId,
        grade: tier.grade ?? null,
        unitPrice: tier.unitPrice ?? null,
        currency: tier.currency ?? null,
        isPreferred: previous.length === 0,
        priority: previous.length,
      },
    ]);
  };

  const setPreferred = (tierId: string) => {
    setRows((previous) =>
      previous.map((row) => ({
        ...row,
        isPreferred: row.materialSupplierPriceTierId === tierId,
      })),
    );
  };

  const removeRow = (tierId: string) => {
    setRows((previous) =>
      previous.filter((row) => row.materialSupplierPriceTierId !== tierId),
    );
  };

  const handleSave = async () => {
    if (!bomItemId) return;
    setSaving(true);
    try {
      const result = await capabilities.saveOptions({
        bomItemId,
        options: rows.map((row) => ({
          materialSupplierPriceTierId: row.materialSupplierPriceTierId,
          isPreferred: row.isPreferred,
          priority:
            row.priority === null || row.priority === undefined
              ? undefined
              : Number(row.priority),
        })),
      });
      if (result?.warnings?.length) {
        capabilities.notifyWarning(
          result.warnings.map((warning) => warning.message).join('；'),
        );
      } else {
        capabilities.notifySuccess('来源选项已保存');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const columns: ResizableTableProps<SourcingOptionRow>['columns'] = [
    {
      title: '供应商 / 等级 / 价目',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text>{record.supplierName}</Typography.Text>
          <Typography.Text type="secondary">
            {record.grade ? `等级 ${record.grade}` : '无等级'} ·{' '}
            {record.unitPrice !== null && record.unitPrice !== undefined
              ? priceLabel(record.unitPrice, record.currency)
              : '—'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '主选',
      width: 80,
      render: (_, record) => (
        <Radio
          checked={record.isPreferred}
          aria-label={`将 ${record.supplierName} 设为主选供应商`}
          onChange={() => setPreferred(record.materialSupplierPriceTierId)}
        />
      ),
    },
    {
      title: '优先级',
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.priority ?? undefined}
          aria-label={`${record.supplierName} 优先级`}
          style={{ width: 90 }}
          onChange={(value) =>
            setRows((previous) =>
              previous.map((row) =>
                row.materialSupplierPriceTierId ===
                record.materialSupplierPriceTierId
                  ? {
                      ...row,
                      priority: typeof value === 'number' ? value : null,
                    }
                  : row,
              ),
            )
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="移除该来源选项？"
          onConfirm={() => removeRow(record.materialSupplierPriceTierId)}
        >
          <Button type="link" size="small" danger>
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={`来源选项 — ${materialName ?? ''}`}
      width={680}
      onCancel={onClose}
      onOk={() => void handleSave()}
      okButtonProps={{ loading: saving }}
      okText="保存"
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
        约束本 BOM 位允许哪些供应商 / 等级供货（候选范围与主选）。价格仍来自采购域供应商价目，此处不维护价格。
      </Typography.Paragraph>
      <Space style={{ width: '100%', marginBottom: 8 }}>
        <Select
          aria-label="添加供应商价目"
          showSearch
          loading={loading}
          placeholder={
            availableTierOptions.length > 0
              ? '从采购域价目添加允许来源'
              : '无可添加的供应商价目（请先到采购维护价目）'
          }
          disabled={availableTierOptions.length === 0}
          options={availableTierOptions}
          value={undefined}
          style={{ width: 420 }}
          optionFilterProp="label"
          onChange={(tierId: string | undefined) => {
            if (tierId) addTier(tierId);
          }}
        />
      </Space>
      <Table<SourcingOptionRow>
        size="small"
        rowKey="materialSupplierPriceTierId"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={false}
        locale={{
          emptyText: '未配置来源选项（不限制供应来源，按采购域价目自动取候选）',
        }}
      />
    </Modal>
  );
}
