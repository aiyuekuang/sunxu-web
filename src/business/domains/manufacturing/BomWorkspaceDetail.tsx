import {
  Alert,
  Button,
  Card,
  Empty,
  Segmented,
  Space,
  Spin,
  Tag,
  Tree,
  Typography,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InfoCard, type InfoField } from '../documents/InfoCard';
import { BomEffectiveBomSelector } from './BomEffectiveBomSelector';
import type { BomResolutionResponse } from './bom-effective-bom-selector-types';
import { BomExplosionTree } from './BomExplosionTree';
import { downloadBlob } from '../../utils/downloadBlob';
import { formatUnitLabel, type UnitLabelMap } from '../../utils/qty-unit';
import type {
  BomWorkspaceBomDetail,
  BomWorkspaceDetailCapabilities,
  BomWorkspaceDetailProps,
  BomWorkspaceExplosion,
  BomWorkspaceExplosionNode,
} from './bom-workspace-detail-types';

const DEFAULT_BOM_STATUS_ENUM = {
  draft: { text: '草稿', status: 'Default', color: '#999999' },
  active: { text: '激活', status: 'Success', color: '#00B578' },
  obsolete: { text: '已归档', status: 'Error', color: '#FF3141' },
};

function formatBomExplosionQuantity(value: number): string {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function getExplosionQuantityLabel(
  node: BomWorkspaceExplosionNode,
): '累计' | '本层需求' {
  return node.quantityCaliber === 'direct' ? '本层需求' : '累计';
}

function buildTreeData(
  nodes: BomWorkspaceExplosionNode[],
  unitLabelMap: UnitLabelMap,
): DataNode[] {
  return nodes.map((node) => {
    const quantity = `${formatBomExplosionQuantity(
      node.cumulativeQty,
    )} ${formatUnitLabel(node.unit, unitLabelMap)}`.trim();
    const labels = [node.materialCode, node.materialName, node.materialSpec]
      .filter(Boolean)
      .join(' · ');
    return {
      key: node.key,
      title: (
        <Space size={[6, 4]} wrap>
          <Typography.Text strong>{labels || '-'}</Typography.Text>
          <Typography.Text type="secondary">
            {getExplosionQuantityLabel(node)} {quantity}
          </Typography.Text>
          {node.bomVersion ? <Tag color="blue">{node.bomVersion}</Tag> : null}
          {node.missingChildBom ? <Tag color="warning">缺下级 BOM</Tag> : null}
          {node.cycle ? <Tag color="error">循环</Tag> : null}
          {node.truncated ? <Tag color="warning">已到展开上限</Tag> : null}
        </Space>
      ),
      children: buildTreeData(node.children ?? [], unitLabelMap),
    };
  });
}

function createInfoFields(
  statusEnum: BomWorkspaceDetailCapabilities['statusEnum'],
): InfoField<BomWorkspaceBomDetail>[] {
  return [
    {
      label: 'BOM 方案',
      dataIndex: 'bomMasterId',
      valueType: 'custom',
      render: (record) => <span>{record.bomMaster?.name || '-'}</span>,
    },
    {
      label: '产品',
      dataIndex: 'materialId',
      valueType: 'custom',
      render: (record) => (
        <span>
          {[record.material?.code, record.material?.name]
            .filter(Boolean)
            .join(' ') || '-'}
        </span>
      ),
    },
    { label: '当前版本', dataIndex: 'version' },
    {
      label: '状态',
      dataIndex: 'status',
      valueType: 'status',
      enumMap: { ...DEFAULT_BOM_STATUS_ENUM, ...statusEnum },
    },
    { label: '变更说明', dataIndex: 'changeRemark', span: 2 },
  ];
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Preserves the host BOM detail workspace, effective-BOM resolution, recursive explosion, retry/export/navigation actions, and tree/graph switch while all host services remain host supplied.
 */
export function BomWorkspaceDetail({
  bomId,
  refreshKey,
  capabilities,
  unitLabelMap = {},
}: BomWorkspaceDetailProps) {
  const [detail, setDetail] = useState<BomWorkspaceBomDetail | null>(null);
  const [explosion, setExplosion] = useState<BomWorkspaceExplosion | null>(null);
  const [explosionBomId, setExplosionBomId] = useState<string>();
  const [explosionError, setExplosionError] = useState<string | null>(null);
  const [resolvedBom, setResolvedBom] = useState<
    (BomWorkspaceBomDetail & { version: string }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [explosionLoading, setExplosionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree');
  const requestIdRef = useRef(0);
  const explosionRequestIdRef = useRef(0);
  const explosionTargetIdRef = useRef<string | undefined>(undefined);
  const activeBomIdRef = useRef<string | undefined>(undefined);
  const capabilitiesRef = useRef(capabilities);
  activeBomIdRef.current = bomId;
  capabilitiesRef.current = capabilities;

  const loadExplosion = useCallback(async (id: string, detailRequestId: number) => {
    const requestId = explosionRequestIdRef.current + 1;
    explosionRequestIdRef.current = requestId;
    explosionTargetIdRef.current = id;
    setExplosionLoading(true);
    setExplosionError(null);
    setExplosion(null);
    setExplosionBomId(undefined);
    try {
      const nextExplosion = await capabilitiesRef.current.requestExplosion({
        id,
        maxDepth: 20,
      });
      if (
        requestId !== explosionRequestIdRef.current ||
        detailRequestId !== requestIdRef.current
      ) return;
      setExplosion(nextExplosion);
      setExplosionBomId(id);
    } catch (cause) {
      if (
        requestId === explosionRequestIdRef.current &&
        detailRequestId === requestIdRef.current
      ) {
        setExplosionError(
          cause instanceof Error ? cause.message : '加载 BOM 展开明细失败',
        );
      }
      throw cause;
    } finally {
      if (
        requestId === explosionRequestIdRef.current &&
        detailRequestId === requestIdRef.current
      ) setExplosionLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    explosionRequestIdRef.current += 1;
    setLoading(true);
    setDetail(null);
    setExplosion(null);
    setExplosionBomId(undefined);
    setExplosionError(null);
    setExplosionLoading(false);
    setResolvedBom(null);
    try {
      const nextDetail = await capabilitiesRef.current.requestDetail(id);
      if (requestId !== requestIdRef.current) return;
      setDetail(nextDetail);
      if (capabilitiesRef.current.canExpandBomDirectly(nextDetail)) {
        try {
          await loadExplosion(nextDetail.id, requestId);
        } catch {
          if (requestId === requestIdRef.current) setExplosion(null);
        }
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [loadExplosion]);

  const handleResolved = useCallback(async (
    resolution: BomResolutionResponse,
    context: { bomId: string; resolutionKey: number },
  ) => {
    if (
      !resolution.bomHeaderId ||
      context.bomId !== activeBomIdRef.current ||
      context.resolutionKey !== requestIdRef.current
    ) return;
    setResolvedBom(
      (resolution.bom as (BomWorkspaceBomDetail & { version: string }) | null) ?? null,
    );
    await loadExplosion(resolution.bomHeaderId, context.resolutionKey);
  }, [loadExplosion]);

  const retryExplosion = useCallback(() => {
    const targetId = explosionTargetIdRef.current;
    const detailRequestId = requestIdRef.current;
    if (!targetId || !detail) return;
    void loadExplosion(targetId, detailRequestId).catch(() => undefined);
  }, [detail, loadExplosion]);

  useEffect(() => {
    if (!bomId) {
      requestIdRef.current += 1;
      explosionRequestIdRef.current += 1;
      setDetail(null);
      setExplosion(null);
      setExplosionBomId(undefined);
      setExplosionError(null);
      setResolvedBom(null);
      setLoading(false);
      setExplosionLoading(false);
      return;
    }
    void loadDetail(bomId);
  }, [bomId, loadDetail, refreshKey]);

  const treeData = useMemo(
    () => (explosion ? buildTreeData([explosion.root], unitLabelMap) : []),
    [explosion, unitLabelMap],
  );
  const infoFields = useMemo(
    () => createInfoFields(capabilities.statusEnum),
    [capabilities.statusEnum],
  );

  if (!bomId) {
    return <Empty description="请选择一个当前 BOM 版本" style={{ marginTop: 96 }} />;
  }
  if (loading && !detail) {
    return <div style={{ padding: 72, textAlign: 'center' }}><Spin /></div>;
  }

  const handleExport = async () => {
    if (!explosionBomId) return;
    setExporting(true);
    try {
      const file = await capabilitiesRef.current.exportExplosion({
        id: explosionBomId,
        maxDepth: 20,
      });
      downloadBlob(file, `${resolvedBom?.material?.code ?? detail?.material?.code ?? detail?.id}_${resolvedBom?.version ?? detail?.version}_BOM展开明细.xlsx`);
    } catch (error) {
      capabilitiesRef.current.onExportError?.(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      {detail ? (
        <InfoCard<BomWorkspaceBomDetail>
          title="BOM 明细"
          data={detail}
          fields={infoFields}
          column={2}
          extra={
            <Space size={4}>
              {capabilities.canExport ? (
                <Button
                  type="link"
                  size="small"
                  disabled={!explosionBomId}
                  loading={exporting}
                  onClick={() => void handleExport()}
                >
                  导出展开明细
                </Button>
              ) : null}
              <Button type="link" onClick={() => capabilitiesRef.current.navigateToBom(detail.id)}>
                打开完整详情
              </Button>
            </Space>
          }
        />
      ) : null}

      {detail && !capabilities.canExpandBomDirectly(detail) ? (
        <BomEffectiveBomSelector
          bom={detail}
          resolvedBom={resolvedBom ?? undefined}
          resolutionKey={requestIdRef.current}
          capabilities={capabilities.bomResolutionCapabilities}
          onResolved={handleResolved}
        />
      ) : null}

      <Card
        size="small"
        title="多级展开明细"
        extra={
          <Segmented
            value={viewMode}
            options={[{ label: '展开树', value: 'tree' }, { label: '结构图', value: 'graph' }]}
            onChange={(value) => setViewMode(value as 'tree' | 'graph')}
          />
        }
        loading={loading || explosionLoading}
      >
        {explosionError ? (
          <Alert
            showIcon
            type="error"
            message="BOM 展开失败"
            description={explosionError}
            action={<Button size="small" onClick={retryExplosion}>重试</Button>}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {!explosionError && explosion?.warnings.length ? (
          <Alert
            showIcon
            type="warning"
            message="展开提示"
            description={explosion.warnings.map((warning) => warning.message).join('；')}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {explosionError ? null : viewMode === 'graph' ? (
          <BomExplosionTree
            data={explosion}
            loading={loading || explosionLoading}
            unitLabelMap={unitLabelMap}
            renderChart={capabilities.renderChart}
          />
        ) : treeData.length ? (
          <Tree
            key={`${bomId}-${refreshKey}`}
            treeData={treeData}
            defaultExpandAll
            showLine={{ showLeafIcon: false }}
            blockNode
            virtual
          />
        ) : (
          <Empty
            description={
              detail && !capabilities.canExpandBomDirectly(detail)
                ? '请先选择型号查看有效 BOM'
                : '暂无可展开的 BOM 明细'
            }
          />
        )}
      </Card>
    </Space>
  );
}
