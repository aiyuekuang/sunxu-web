import { Alert, Empty, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { formatUnitLabel } from '../utils/qty-unit';
import type {
  BomExplosionData,
  BomExplosionNode,
  BomExplosionTreeProps,
} from './bom-explosion-tree-types';

interface ExplosionChartNode {
  name: string;
  value: number;
  node: BomExplosionNode;
  itemStyle: {
    color: string;
    borderColor: string;
    borderWidth: number;
  };
  label: {
    color: string;
    fontWeight?: number;
  };
  children?: ExplosionChartNode[];
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getNodeColor = (node: BomExplosionNode) => {
  if (node.cycle) return '#ff4d4f';
  if (node.truncated || node.missingChildBom) return '#faad14';
  if (node.nodeType === 'root') return '#52c41a';
  if (node.hasChildBom) return '#1677ff';
  return '#8c8c8c';
};

const treeLabelStyle = {
  verticalAlign: 'middle',
  color: '#1f2933',
  fontSize: 12,
  lineHeight: 18,
  width: 220,
  overflow: 'break',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderColor: '#d9e2ec',
  borderWidth: 1,
  borderRadius: 6,
  padding: [6, 8],
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  shadowBlur: 8,
  shadowOffsetY: 2,
};

const formatBomExplosionQuantity = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString('zh-CN', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })
    : '-';

const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  const absolute = Math.abs(value);
  if (absolute >= 100_000_000) {
    const digits = absolute >= 1_000_000_000 ? 0 : 1;
    return `${trimTrailingZero(
      (value / 100_000_000).toLocaleString('zh-CN', {
        maximumFractionDigits: digits,
      }),
    )}亿`;
  }
  if (absolute >= 10_000) {
    const digits = absolute >= 1_000_000 ? 0 : 1;
    return `${trimTrailingZero(
      (value / 10_000).toLocaleString('zh-CN', {
        maximumFractionDigits: digits,
      }),
    )}万`;
  }
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

function trimTrailingZero(value: string) {
  return value.replace(/\.0$/, '');
}

const getNodeName = (
  node: BomExplosionNode,
  unitLabelMap: Readonly<Record<string, string>>,
) => {
  const title = `${node.materialCode || '-'} ${node.materialName || '-'}`.trim();
  if (node.nodeType === 'root') {
    return `${title}\n${node.bomVersion ?? '-'}`;
  }
  const label = node.quantityCaliber === 'direct' ? '本层' : '累计';
  return `${title}\n${label} ${formatBomExplosionQuantity(
    node.cumulativeQty,
  )} ${formatUnitLabel(node.unit, unitLabelMap)}`;
};

const toChartNode = (
  node: BomExplosionNode,
  unitLabelMap: Readonly<Record<string, string>>,
): ExplosionChartNode => {
  const color = getNodeColor(node);
  return {
    name: getNodeName(node, unitLabelMap),
    value: node.cumulativeQty,
    node,
    itemStyle: {
      color,
      borderColor: color,
      borderWidth: 1,
    },
    label: {
      color: '#1f2933',
      fontWeight: node.nodeType === 'root' ? 600 : undefined,
    },
    children: node.children.length
      ? node.children.map((child) => toChartNode(child, unitLabelMap))
      : undefined,
  };
};

const getTooltipNode = (params: unknown): BomExplosionNode | null => {
  if (typeof params !== 'object' || params === null) return null;
  const data = (params as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;
  const node = (data as { node?: unknown }).node;
  if (typeof node !== 'object' || node === null) return null;
  return node as BomExplosionNode;
};

const tooltipRow = (
  label: string,
  value: string | number | null | undefined,
) => `<div style="display:flex;gap:12px;justify-content:space-between;min-width:220px;">
    <span style="color:#667085;">${escapeHtml(label)}</span>
    <span style="font-weight:500;color:#1f2933;">${escapeHtml(
      value === null || value === undefined || value === ''
        ? '-'
        : String(value),
    )}</span>
  </div>`;

const formatWarningCode = (code: BomExplosionData['warnings'][number]['code']) => {
  const map: Record<BomExplosionData['warnings'][number]['code'], string> = {
    missing_child_bom: '缺少下级 BOM',
    cycle_detected: '循环引用',
    max_depth_reached: '层级截断',
  };
  return map[code];
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain bom
 * @sunxu-reason Keeps the MES recursive BOM tree, quantities, warnings, chart options, and summaries in the suite while the host supplies its optional ECharts renderer.
 */
export function BomExplosionTree({
  data,
  loading,
  unitLabelMap = {},
  renderChart,
}: BomExplosionTreeProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  const chartData = useMemo(
    () => (data?.root ? toChartNode(data.root, unitLabelMap) : null),
    [data, unitLabelMap],
  );

  const option = useMemo<Record<string, unknown> | null>(() => {
    if (!chartData) return null;
    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: unknown) => {
          const node = getTooltipNode(params);
          if (!node) return '';
          const title = escapeHtml(
            `${node.materialCode || '-'} ${node.materialName || '-'}`.trim(),
          );
          const unitLabel = formatUnitLabel(node.unit, unitLabelMap);
          return `<div style="padding:4px 0;">
            <div style="font-weight:600;margin-bottom:8px;color:#1f2933;">${title}</div>
            ${tooltipRow('层级', node.level)}
            ${tooltipRow('本层用量', `${formatBomExplosionQuantity(node.quantity)} ${unitLabel}`)}
            ${tooltipRow('损耗后用量', `${formatBomExplosionQuantity(node.effectiveQty)} ${unitLabel}`)}
            ${tooltipRow(
              node.quantityCaliber === 'direct' ? '本层需求' : '累计需求',
              `${formatBomExplosionQuantity(node.cumulativeQty)} ${unitLabel}`,
            )}
            ${tooltipRow('下级 BOM', node.bomVersion)}
            ${tooltipRow('物料属性', node.procurementType)}
          </div>`;
        },
      },
      series: [
        {
          type: 'tree',
          data: [chartData],
          orient: 'LR',
          top: 36,
          left: 72,
          bottom: 36,
          right: 280,
          symbol: 'roundRect',
          symbolSize: 12,
          roam: true,
          expandAndCollapse: true,
          initialTreeDepth: 3,
          animationDuration: reducedMotion ? 0 : 300,
          animationDurationUpdate: reducedMotion ? 0 : 300,
          lineStyle: {
            color: '#d9e2ec',
            width: 1,
          },
          label: {
            ...treeLabelStyle,
            position: 'left',
            align: 'right',
            distance: 10,
          },
          leaves: {
            label: {
              ...treeLabelStyle,
              position: 'right',
              align: 'left',
              distance: 10,
            },
          },
        },
      ],
    };
  }, [chartData, reducedMotion, unitLabelMap]);

  if (loading && !data) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!data || !option) {
    return <Empty description="暂无展开数据" />;
  }

  const chartHeight = Math.max(520, Math.min(1800, data.summary.totalNodes * 58));

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap>
        <Tag color="blue">
          节点 {formatCompactNumber(data.summary.totalNodes)}
        </Tag>
        <Tag color="green">最深 {data.summary.maxLevel} 层</Tag>
        <Tag color="default">
          叶子 {formatCompactNumber(data.summary.leafNodes)}
        </Tag>
        {data.summary.missingChildBomCount > 0 && (
          <Tag color="orange">
            缺下级 BOM {data.summary.missingChildBomCount}
          </Tag>
        )}
        {data.summary.cycleCount > 0 && (
          <Tag color="red">循环 {data.summary.cycleCount}</Tag>
        )}
      </Space>

      {data.warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="展开提示"
          description={
            <Space direction="vertical" size={4}>
              {data.warnings.slice(0, 5).map((warning) => (
                <Typography.Text key={`${warning.code}-${warning.path}`}>
                  [{formatWarningCode(warning.code)}] {warning.message}
                </Typography.Text>
              ))}
              {data.warnings.length > 5 && (
                <Typography.Text type="secondary">
                  还有 {data.warnings.length - 5} 条提示未展示
                </Typography.Text>
              )}
            </Space>
          }
        />
      )}

      {renderChart({
        option,
        style: { height: chartHeight, width: '100%' },
        notMerge: true,
        lazyUpdate: true,
        showLoading: Boolean(loading),
        ariaLabel: 'BOM 多级展开关系图',
      })}
    </Space>
  );
}
