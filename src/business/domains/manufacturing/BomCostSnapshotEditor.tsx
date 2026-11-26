import { ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Alert,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MaterialFilteredSelect } from '../inventory/MaterialFilteredSelect';
import { ResizableTable as Table } from '../shared/ResizableTable';
import { useBomCostSnapshotCapabilities } from '../../providers/BusinessUiProvider';
import { formatUnitLabel } from '../../utils/qty-unit';
import type {
  BomCostApprovedSubstitute,
  BomCostPreviewCandidate,
  BomCostPreviewLine,
  BomCostPreviewSnapshot,
} from './bom-cost-types';

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Preserves host BOM cost/inventory snapshot editing, approved substitutions, line capabilities, supplier-price selection, and shortage summaries while preview services and unit labels stay host supplied.
 */

export function buildBomCostApprovedSubstituteOption(
  substitute: BomCostApprovedSubstitute,
) {
  const identity = [
    substitute.substituteMaterialCode,
    substitute.substituteMaterialName,
  ]
    .filter(Boolean)
    .join(' - ');
  return {
    label: `${identity || substitute.substituteMaterialId}${
      substitute.conversionFactor && substitute.conversionFactor !== 1
        ? `（×${substitute.conversionFactor}）`
        : ''
    }`,
    value: substitute.substituteMaterialId,
    code: substitute.substituteMaterialCode,
    name: substitute.substituteMaterialName,
  };
}

export type BomCostSnapshotEditorProps = {
  bomHeaderId?: string;
  productQty?: number;
  asOfDate?: string;
  variant?: 'cost' | 'inventory';
  value?: unknown;
  onChange?: (snapshot: BomCostPreviewSnapshot | undefined) => void;
};

function readSnapshot(
  value: unknown,
): BomCostPreviewSnapshot | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const candidate = value as { lines?: unknown };
  return Array.isArray(candidate.lines)
    ? (value as BomCostPreviewSnapshot)
    : undefined;
}

function formatQty(value?: number | null) {
  return Number(value ?? 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 4,
  });
}

function formatMoney(value?: number | null, currency?: string | null) {
  if (value === null || value === undefined) return '-';
  const amount = Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const normalizedCurrency = currency?.trim();
  return normalizedCurrency ? `${amount} ${normalizedCurrency}` : amount;
}

function getCommonSnapshotCurrency(
  snapshot?: BomCostPreviewSnapshot | null,
) {
  const currencies = new Set(
    (snapshot?.lines ?? [])
      .map((line) => line.currency?.trim())
      .filter((currency): currency is string => !!currency),
  );
  return currencies.size === 1 ? [...currencies][0] : undefined;
}

function candidateLabel(candidate: BomCostPreviewCandidate) {
  const tags = [
    candidate.isPreferred ? '主选' : '',
    candidate.isDefault ? '默认' : '',
    candidate.grade ? `等级 ${candidate.grade}` : '',
  ].filter(Boolean);
  const suffix = tags.length > 0 ? `（${tags.join(' / ')}）` : '';
  return `${candidate.supplierName ?? candidate.supplierId} - ${formatMoney(
    candidate.unitPrice,
    candidate.currency,
  )}${suffix}`;
}

export function getBomCostSnapshotIssue<T extends Record<string, unknown>>(
  items: readonly T[],
): string | null {
  const index = items.findIndex((item) => {
    const selectedBomHeaderId = item.selectedBomHeaderId ?? item.bomHeaderId;
    if (!selectedBomHeaderId) return false;
    const snapshot = readSnapshot(item.bomCostSnapshot);
    return !snapshot;
  });
  if (index < 0) return null;
  return `第 ${index + 1} 行已选择 BOM，请等待本单 BOM 明细加载完成`;
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Presents reusable bom cost snapshot editor behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function BomCostSnapshotEditor({
  bomHeaderId,
  productQty,
  asOfDate,
  variant = 'cost',
  value,
  onChange,
}: BomCostSnapshotEditorProps) {
  const capabilities = useBomCostSnapshotCapabilities();
  const snapshot = readSnapshot(value);
  const snapshotRef = useRef<BomCostPreviewSnapshot | undefined>(snapshot);
  const onChangeRef = useRef(onChange);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const unitLabelMap = capabilities?.unitLabelMap;

  snapshotRef.current = snapshot;
  onChangeRef.current = onChange;
  const inventoryMode = variant === 'inventory';

  const preview = useCallback(
    async (baseSnapshot?: BomCostPreviewSnapshot) => {
      if (!bomHeaderId) {
        onChangeRef.current?.(undefined);
        return;
      }
      setLoading(true);
      setErrorText(null);
      try {
        if (!capabilities) {
          setErrorText('BOM 成本预览服务未配置');
          return;
        }
        const response = await capabilities.requestCostPreview({
          bomHeaderId,
          productQty,
          asOfDate,
          bomCostSnapshot: baseSnapshot,
        });
        onChangeRef.current?.(response.snapshot ?? undefined);
      } catch (error: unknown) {
        setErrorText(
          error instanceof Error ? error.message : '本单 BOM 明细加载失败',
        );
      } finally {
        setLoading(false);
      }
    },
    [asOfDate, bomHeaderId, capabilities, productQty],
  );

  useEffect(() => {
    if (!bomHeaderId) {
      onChangeRef.current?.(undefined);
      return;
    }
    void preview(snapshotRef.current);
  }, [bomHeaderId, preview]);

  const handlePriceTierChange = useCallback(
    (bomItemId: string, selectedPriceTierId?: string) => {
      if (!snapshot) return;
      const nextSnapshot: BomCostPreviewSnapshot = {
        ...snapshot,
        lines: snapshot.lines.map((line) =>
          line.bomItemId === bomItemId
            ? {
                ...line,
                selectedPriceTierId: selectedPriceTierId ?? undefined,
                selectedSupplierId: selectedPriceTierId
                  ? line.selectedSupplierId
                  : undefined,
                selectedGrade: selectedPriceTierId
                  ? line.selectedGrade
                  : undefined,
                unitPrice: undefined,
                lineCost: undefined,
                priceSource: selectedPriceTierId ? 'price_tier' : 'unpriced',
              }
            : line,
        ),
      };
      void preview(nextSnapshot);
    },
    [preview, snapshot],
  );

  // 订单改配:按 lineCapabilities 受控,更新行后重新预览(后端服务端二次校验并冻结快照)
  const patchLine = useCallback(
    (bomItemId: string, patch: Partial<BomCostPreviewLine>) => {
      if (!snapshot) return;
      const nextSnapshot: BomCostPreviewSnapshot = {
        ...snapshot,
        lines: snapshot.lines.map((line) =>
          line.bomItemId === bomItemId ? { ...line, ...patch } : line,
        ),
      };
      void preview(nextSnapshot);
    },
    [preview, snapshot],
  );

  const shortageLineCount = useMemo(
    () =>
      (snapshot?.lines ?? []).filter(
        (line) => !line.removed && Number(line.shortageQty ?? 0) > 0,
      ).length,
    [snapshot],
  );

  const columns = useMemo<TableColumnsType<BomCostPreviewLine>>(() => {
    const baseColumns: TableColumnsType<BomCostPreviewLine> = [
      {
        title: 'BOM 子件型号',
        dataIndex: 'materialName',
        render: (_, record) => (
          <Space orientation="vertical" size={0}>
            <Typography.Text delete={record.removed}>
              {record.materialName ?? '-'}
            </Typography.Text>
            <Typography.Text type="secondary">
              {record.materialCode ?? record.materialId}
            </Typography.Text>
            {record.originalMaterialName ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                替代自 {record.originalMaterialName}
              </Typography.Text>
            ) : null}
            {record.removed ? <Tag color="default">已删除</Tag> : null}
          </Space>
        ),
      },
      {
        title: '需求量',
        width: 180,
        render: (_, record) => {
          const canChange = record.lineCapabilities?.canChangeQuantity;
          const unitLabel = formatUnitLabel(record.unit, unitLabelMap);
          if (record.removed || !canChange) {
            return (
              <Typography.Text delete={record.removed}>
                {formatQty(record.requiredQty)} {unitLabel}
              </Typography.Text>
            );
          }
          const isOverridden =
            record.overrideQty !== null &&
            record.overrideQty !== undefined &&
            record.overrideQty !== record.computedQty;
          return (
            <Space orientation="vertical" size={0} style={{ width: '100%' }}>
              <Space size={4}>
                <InputNumber
                  min={0}
                  precision={4}
                  value={record.requiredQty ?? undefined}
                  placeholder={formatQty(record.computedQty)}
                  style={{ width: 88 }}
                  onChange={(value) =>
                    patchLine(record.bomItemId, {
                      overrideQty:
                        typeof value === 'number' ? value : undefined,
                    })
                  }
                />
                <Typography.Text type="secondary">{unitLabel}</Typography.Text>
                <Tooltip title="本行用量可在订单中调整(可改量),仅改本订单 BOM 快照">
                  <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                    可改
                  </Tag>
                </Tooltip>
              </Space>
              {isOverridden ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  标准 {formatQty(record.computedQty)} {unitLabel}
                </Typography.Text>
              ) : null}
            </Space>
          );
        },
      },
      ...(inventoryMode
        ? [
            {
              title: '库存',
              width: 260,
              render: (_: unknown, record: BomCostPreviewLine) => {
                if (record.removed) {
                  return (
                    <Typography.Text type="secondary">已删除</Typography.Text>
                  );
                }
                const unitLabel = formatUnitLabel(record.unit, unitLabelMap);
                const shortageQty = Number(record.shortageQty ?? 0);
                return (
                  <Space orientation="vertical" size={0}>
                    <Space size={6} wrap>
                      <Typography.Text
                        strong
                        type={shortageQty > 0 ? 'danger' : undefined}
                      >
                        可用 {formatQty(record.availableQty)} {unitLabel}
                      </Typography.Text>
                      {shortageQty > 0 ? (
                        <Tag color="error" style={{ marginInlineEnd: 0 }}>
                          缺 {formatQty(shortageQty)}
                        </Tag>
                      ) : (
                        <Tag color="success" style={{ marginInlineEnd: 0 }}>
                          足够
                        </Tag>
                      )}
                    </Space>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      账面 {formatQty(record.stockQty)}，预留{' '}
                      {formatQty(record.reservedQty)}，冻结{' '}
                      {formatQty(record.frozenQty)}
                    </Typography.Text>
                  </Space>
                );
              },
            },
          ]
        : []),
      {
        title: (
          <Tooltip title="按该 BOM 行的订单改配策略,本订单允许的删改;只改本订单 BOM 快照,不影响标准 BOM。可改量在「需求量」列直接调整。">
            <span>订单改配</span>
          </Tooltip>
        ),
        width: 240,
        render: (_, record) => {
          const caps = record.lineCapabilities;
          if (record.removed) {
            return (
              <Space orientation="vertical" size={4}>
                <Tag color="default">已删除</Tag>
                <Button
                  size="small"
                  type="link"
                  onClick={() =>
                    patchLine(record.bomItemId, { removed: false })
                  }
                >
                  恢复
                </Button>
              </Space>
            );
          }
          // 「可改量」已由「需求量」列的输入框与「可改」标签表达，本列不再重复，
          // 只保留本列可操作的能力（删除 / 替代）与「固定不可改」状态。
          const abilityTags = [
            caps?.canDelete ? '可删除' : '',
            caps?.canSubstitute ? '可选替代' : '',
          ].filter(Boolean);
          const hasAnyCapability = Boolean(
            caps?.canChangeQuantity || caps?.canDelete || caps?.canSubstitute,
          );
          const hasReasonInput = Boolean(
            record.originalMaterialId ||
              record.overrideQty !== null ||
              record.adjustReason,
          );
          return (
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              {abilityTags.length > 0 ? (
                <Space size={2} wrap>
                  {abilityTags.map((label) => (
                    <Tag
                      key={label}
                      color="blue"
                      style={{ marginInlineEnd: 0 }}
                    >
                      {label}
                    </Tag>
                  ))}
                </Space>
              ) : !hasAnyCapability ? (
                <Tag color="default">固定不可改</Tag>
              ) : !hasReasonInput ? (
                <Typography.Text type="secondary">—</Typography.Text>
              ) : null}
              {caps?.canSubstitute &&
              record.approvedSubstitutes.length === 0 ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  暂无批准替代料
                </Typography.Text>
              ) : null}
              {caps?.canSubstitute && record.approvedSubstitutes.length > 0 ? (
                <MaterialFilteredSelect
                  request={async (params) => {
                    const { keyWords } = params ?? {};
                    const keyword = keyWords?.trim().toLowerCase();
                    return record.approvedSubstitutes
                      .map(buildBomCostApprovedSubstituteOption)
                      .filter(
                        (option) =>
                          !keyword ||
                          option.label.toLowerCase().includes(keyword),
                      );
                  }}
                  filterMode="hidden"
                  placeholder="换批准替代料"
                  selectWidth="100%"
                  value={
                    record.originalMaterialId ? record.materialId : undefined
                  }
                  onChange={(substituteMaterialId) =>
                    patchLine(record.bomItemId, {
                      substituteMaterialId: substituteMaterialId ?? undefined,
                    })
                  }
                />
              ) : null}
              <Space size={4}>
                {caps?.canDelete ? (
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={() =>
                      patchLine(record.bomItemId, { removed: true })
                    }
                  >
                    删除
                  </Button>
                ) : null}
                {record.originalMaterialId ||
                record.overrideQty !== null ||
                record.adjustReason ? (
                  <Input
                    size="small"
                    allowClear
                    placeholder="改配原因(可选)"
                    defaultValue={record.adjustReason ?? undefined}
                    style={{ width: 150 }}
                    onBlur={(event) =>
                      patchLine(record.bomItemId, {
                        adjustReason: event.target.value || undefined,
                      })
                    }
                  />
                ) : null}
              </Space>
            </Space>
          );
        },
      },
    ];

    if (inventoryMode) return baseColumns;

    return [
      ...baseColumns,
      {
        title: '供应商价格',
        width: 360,
        render: (_, record) => {
          if (record.removed) {
            return <Typography.Text type="secondary">已删除</Typography.Text>;
          }
          const candidates = record.candidates ?? [];
          const options = candidates.map((candidate) => ({
            label: candidateLabel(candidate),
            value: candidate.priceTierId,
          }));
          const needsManualPick =
            !record.selectedPriceTierId && candidates.length > 1;
          return (
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Select
                allowClear
                showSearch
                disabled={candidates.length === 0}
                status={needsManualPick ? 'warning' : undefined}
                placeholder={
                  candidates.length > 0
                    ? '选择本行供应商价格'
                    : '没有可用供应商价格'
                }
                options={options}
                value={record.selectedPriceTierId ?? undefined}
                style={{ width: '100%' }}
                optionFilterProp="label"
                onChange={(priceTierId) =>
                  handlePriceTierChange(record.bomItemId, priceTierId)
                }
              />
              {needsManualPick ? (
                <Typography.Text type="warning">
                  多个有效价格，需要人工确认
                </Typography.Text>
              ) : null}
              {candidates.length === 0 ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  价格来自采购域供应商价目，缺价请到采购维护价目/询价/合同价
                </Typography.Text>
              ) : null}
            </Space>
          );
        },
      },
      {
        title: '小计',
        width: 140,
        render: (_, record) =>
          record.removed ? '-' : formatMoney(record.lineCost, record.currency),
      },
    ];
  }, [handlePriceTierChange, inventoryMode, patchLine, unitLabelMap]);

  if (!bomHeaderId) return null;

  return (
    <div style={{ width: '100%', marginTop: 8 }}>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Typography.Text strong>本单 BOM 明细</Typography.Text>
            {inventoryMode && snapshot ? (
              <Tag color={shortageLineCount > 0 ? 'error' : 'success'}>
                {shortageLineCount > 0
                  ? `缺料 ${shortageLineCount} 行`
                  : '库存充足'}
              </Tag>
            ) : null}
            {!inventoryMode && snapshot?.hasUnpriced ? (
              <Tag color="warning">待选价格</Tag>
            ) : null}
            {!inventoryMode && snapshot ? (
              <Typography.Text type="secondary">
                合计{' '}
                {formatMoney(
                  snapshot.totalMaterialCost,
                  getCommonSnapshotCurrency(snapshot),
                )}
              </Typography.Text>
            ) : null}
          </Space>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => preview(snapshotRef.current)}
          >
            刷新
          </Button>
        </Space>
        {errorText ? <Alert type="error" showIcon message={errorText} /> : null}
        {!inventoryMode && snapshot?.warnings?.length ? (
          <Alert
            type="warning"
            showIcon
            message={snapshot.warnings.join('；')}
          />
        ) : null}
        <Spin spinning={loading}>
          <Table<BomCostPreviewLine>
            size="small"
            rowKey="bomItemId"
            columns={columns}
            dataSource={snapshot?.lines ?? []}
            pagination={false}
          />
        </Spin>
      </Space>
    </div>
  );
}
