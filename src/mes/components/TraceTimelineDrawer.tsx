import {
  Alert,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Input,
  Segmented,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MesStatusEnum } from './StatusDisplay';
import type {
  TraceBatchLookup,
  TraceBatchGraphRequest,
  TraceGraph,
  TraceGraphNode,
  TraceIdentifierType,
  TraceSerialRecord,
  TraceTimelineDirection,
  TraceTimelineDrawerProps,
} from './trace-timeline-drawer-types';

type TraceResult =
  | {
      kind: 'batch';
      identifier: string;
      batch: TraceBatchLookup;
      graph: TraceGraph;
    }
  | {
      kind: 'serial';
      identifier: string;
      serial: TraceSerialRecord;
      graph?: TraceGraph;
      warning?: string;
    };

type TimelineEvent = {
  id: string;
  scope: 'serial' | 'batch';
  type: string;
  title: string;
  subtitle?: string;
  occurredAt?: string;
  status?: string;
  quantity?: number;
  unit?: string;
  context?: TraceGraphNode['context'];
  remarks?: string[];
  photoUrls?: string[];
  missingContext?: string[];
  relationships?: string[];
};

function statusText(
  dictionary: MesStatusEnum | undefined,
  value: string,
  fallback: string,
) {
  return dictionary?.[value]?.text ?? fallback;
}

function currentStatusLabel(
  kind: TraceIdentifierType,
  status: string,
  dictionaries: TraceTimelineDrawerProps['capabilities']['dictionaries'],
) {
  return kind === 'batch'
    ? statusText(dictionaries.status.batch, status, dictionaries.unknownStatus)
    : (dictionaries.serialStatusLabels[status] ?? dictionaries.unknownStatus);
}

function eventStatusLabel(
  event: TimelineEvent,
  dictionaries: TraceTimelineDrawerProps['capabilities']['dictionaries'],
) {
  if (!event.status) return undefined;
  if (event.scope === 'serial') {
    return dictionaries.serialStatusLabels[event.status] ?? dictionaries.unknownStatus;
  }

  switch (event.type) {
    case 'batch':
      return statusText(dictionaries.status.batch, event.status, dictionaries.unknownStatus);
    case 'work_order':
      return statusText(dictionaries.status.workOrder, event.status, dictionaries.unknownStatus);
    case 'operation':
      return statusText(dictionaries.status.operation, event.status, dictionaries.unknownStatus);
    case 'report_log':
      return dictionaries.reportLogTypeLabels[event.status] ?? dictionaries.unknownType;
    case 'quality_inspection':
      return statusText(dictionaries.status.inspection, event.status, dictionaries.unknownStatus);
    case 'disposal_order':
      return statusText(dictionaries.status.disposal, event.status, dictionaries.unknownStatus);
    case 'production_scrap':
      return statusText(dictionaries.status.productionScrap, event.status, dictionaries.unknownStatus);
    case 'package_unit':
      return statusText(dictionaries.status.packageUnit, event.status, dictionaries.unknownStatus);
    case 'sale_delivery':
      return statusText(dictionaries.status.saleDelivery, event.status, dictionaries.unknownStatus);
    case 'stock_transaction':
    case 'material_issue':
      return undefined;
    default:
      return dictionaries.unknownStatus;
  }
}

function eventSubtitle(
  event: TimelineEvent,
  dictionaries: TraceTimelineDrawerProps['capabilities']['dictionaries'],
) {
  if (!event.subtitle) return undefined;
  switch (event.type) {
    case 'quality_inspection':
      return statusText(
        dictionaries.status.inspectionType,
        event.subtitle,
        dictionaries.unknownInspectionType,
      );
    case 'disposal_order':
      return event.subtitle === dictionaries.pendingDisposalLabel
        ? event.subtitle
        : statusText(
            dictionaries.status.disposalType,
            event.subtitle,
            dictionaries.unknownDisposalType,
          );
    case 'package_unit':
      return statusText(
        dictionaries.status.packageType,
        event.subtitle,
        dictionaries.unknownPackageType,
      );
    default:
      return event.subtitle;
  }
}

function sortTimeline(events: TimelineEvent[]) {
  return events.sort((left, right) => {
    if (!left.occurredAt) return right.occurredAt ? 1 : 0;
    if (!right.occurredAt) return -1;
    return Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
  });
}

function eventRelationships(node: TraceGraphNode, graph: TraceGraph): string[] {
  if (node.type === 'batch') return [];
  const nodesById = new Map(graph.nodes.map((graphNode) => [graphNode.id, graphNode]));
  const relationships = graph.edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .map((edge) => {
      const from = nodesById.get(edge.from);
      const to = nodesById.get(edge.to);
      if (!from || !to) return undefined;
      const fromTitle = from.type === 'batch' ? `批号 ${from.title}` : from.title;
      const toTitle = to.type === 'batch' ? `批号 ${to.title}` : to.title;
      return `${fromTitle} —${edge.label ?? '关联'}→ ${toTitle}`;
    })
    .filter((relationship): relationship is string => Boolean(relationship));
  const uniqueRelationships = [...new Set(relationships)];
  return uniqueRelationships.length > 3
    ? [...uniqueRelationships.slice(0, 3), `另有 ${uniqueRelationships.length - 3} 条关联`]
    : uniqueRelationships;
}

function batchEvents(graph: TraceGraph, eventTypes: ReadonlySet<string>): TimelineEvent[] {
  return graph.nodes
    .filter((node) => eventTypes.has(node.type))
    .map((node) => ({
      id: node.id,
      scope: 'batch',
      type: node.type,
      title: node.title,
      subtitle: node.subtitle ?? undefined,
      occurredAt: node.occurredAt ?? undefined,
      status: node.status ?? undefined,
      quantity: node.qty ?? undefined,
      unit: node.unit ?? undefined,
      context: node.context ?? undefined,
      remarks: node.remarks ? [node.remarks] : undefined,
      photoUrls: node.photoUrls ?? undefined,
      missingContext: node.missingContext ?? undefined,
      relationships: eventRelationships(node, graph),
    }));
}

function serialEvents(
  serial: TraceSerialRecord,
  dictionaries: TraceTimelineDrawerProps['capabilities']['dictionaries'],
): TimelineEvent[] {
  const shipments = new Map(
    serial.shipments.map((shipment) => [shipment.deliveryItemId, shipment]),
  );

  return serial.movements.map((movement) => {
    const shipment = movement.referenceId
      ? shipments.get(movement.referenceId)
      : undefined;
    const referenceType = movement.referenceType ?? (shipment ? 'sale_delivery_item' : null);
    const referenceLabel = referenceType
      ? (dictionaries.serialReferenceLabels[referenceType] ?? dictionaries.unknownReference)
      : null;
    const referenceDescription = shipment?.deliveryNo
      ? `${shipment.deliveryNo}${shipment.customerName ? ` / ${shipment.customerName}` : ''}`
      : referenceType === 'work_order_report_log' && serial.productionReport
        ? `工序 ${serial.productionReport.operationName}`
        : referenceType === 'production_receipt_order' && serial.productionReceipt
          ? serial.productionReceipt.receiptNo
          : referenceType === 'work_order'
            ? serial.workOrder?.orderNo
            : movement.referenceId;
    const details = [
      movement.fromStatus
        ? `${dictionaries.serialStatusLabels[movement.fromStatus] ?? dictionaries.unknownStatus} → ${dictionaries.serialStatusLabels[movement.toStatus] ?? dictionaries.unknownStatus}`
        : (dictionaries.serialStatusLabels[movement.toStatus] ?? dictionaries.unknownStatus),
      movement.batchNo ? `批号 ${movement.batchNo}` : null,
      movement.movementType === 'produced' && serial.productionReport
        ? [
            serial.productionReport.equipmentName
              ? `设备 ${serial.productionReport.equipmentName}`
              : null,
            serial.productionReport.scrappedQty > 0
              ? `报废 ${serial.productionReport.scrappedQty}`
              : null,
          ]
            .filter(Boolean)
            .join(' / ')
        : null,
      referenceLabel
        ? `来源 ${referenceLabel}${referenceDescription ? ` ${referenceDescription}` : ''}`
        : null,
    ].filter((item): item is string => Boolean(item));
    const remarks = [
      movement.remarks,
      movement.movementType === 'produced' || movement.movementType === 'scrapped'
        ? serial.productionReport?.remarks
        : null,
      movement.movementType === 'received' ? serial.productionReceipt?.remarks : null,
      movement.movementType === 'shipped' ? shipment?.remarks : null,
    ]
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));

    return {
      id: `serial-movement:${movement.id}`,
      scope: 'serial' as const,
      type: movement.movementType,
      title: dictionaries.eventLabels[movement.movementType] ?? movement.movementType,
      subtitle: details.join(' · '),
      remarks: [...new Set(remarks)],
      photoUrls:
        movement.movementType === 'produced' || movement.movementType === 'scrapped'
          ? serial.productionReport?.photoUrls ?? undefined
          : undefined,
      occurredAt:
        movement.movementType === 'produced'
          ? (serial.productionReport?.occurredAt ?? movement.createdAt)
          : movement.movementType === 'received'
            ? (serial.productionReceipt?.confirmedAt ?? movement.createdAt)
            : movement.movementType === 'shipped'
              ? (shipment?.shipmentRecordedAt ?? movement.createdAt)
              : movement.createdAt,
      status: movement.toStatus,
      quantity: 1,
      unit: serial.material?.unit ?? undefined,
    };
  });
}

function graphBatchEventsForSerial(
  graph: TraceGraph,
  serial: TraceSerialRecord,
  eventTypes: ReadonlySet<string>,
): TimelineEvent[] {
  const serialReportId = serial.productionReport?.reportLogId;
  return batchEvents(graph, eventTypes).filter(
    (event) =>
      event.id !== graph.root.id &&
      !(event.type === 'report_log' && event.id === `report_log:${serialReportId}`),
  );
}

function eventContext(node: TimelineEvent): string[] {
  return [
    ...(node.context?.man ?? []).map((item) => `人：${item.label}`),
    ...(node.context?.machine ?? []).map((item) => `设备：${item.label}`),
    ...(node.context?.material ?? []).map((item) => `${item.role}：${item.label}`),
    ...(node.context?.method ?? []).map((item) => `${item.role}：${item.label}`),
    ...(node.context?.environment ?? []).map(
      (item) => `环境：${item.dataType} ${item.min ?? '—'}~${item.max ?? '—'}${item.unit ?? ''}（${item.count}次）`,
    ),
    ...(node.context?.measurement ?? []).map(
      (item) =>
        `检验：${item.label}${item.measuredValue ? `=${item.measuredValue}${item.unit ?? ''}` : ''}${item.passed === false ? ' 不合格' : ''}`,
    ),
  ];
}

/** @sunxu-component mes-specific @sunxu-domain warehouse traceability @sunxu-reason Preserves the MES batch and finished-serial trace workflow while injecting requests, dictionaries, and formatting. */
export const TraceTimelineDrawer: React.FC<TraceTimelineDrawerProps> = ({
  open,
  initialIdentifierType = 'batch',
  initialIdentifier = '',
  onClose,
  capabilities,
}) => {
  const [identifierType, setIdentifierType] = useState<TraceIdentifierType>(initialIdentifierType);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TraceResult>();
  const [error, setError] = useState('');
  const [direction, setDirection] = useState<TraceTimelineDirection>('both');
  const searchRequestId = useRef(0);
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;

  const invalidateSearch = useCallback(() => {
    searchRequestId.current += 1;
    setLoading(false);
  }, []);

  const runSearch = useCallback(
    async (
      type: TraceIdentifierType,
      rawIdentifier: string,
      batchDirection: TraceTimelineDirection = 'both',
    ) => {
      const currentCapabilities = capabilitiesRef.current;
      const requestId = ++searchRequestId.current;
      const normalizedIdentifier = rawIdentifier.trim();
      if (!normalizedIdentifier) {
        setError(type === 'batch' ? '请输入批号' : '请输入成品序列号');
        setResult(undefined);
        return;
      }
      setLoading(true);
      setError('');
      setResult(undefined);
      try {
        if (type === 'batch') {
          const batch = await currentCapabilities.loadBatchByNumber({ batchNo: normalizedIdentifier });
          const graphRequest: TraceBatchGraphRequest = {
            batchId: batch.id,
            direction: batchDirection,
            maxDepth: 10,
            contextLevel: 'summary',
            includeDocs: true,
            includeEnvironment: true,
            includeMeasurement: true,
          };
          const graph = await currentCapabilities.loadBatchGraph(graphRequest);
          if (requestId !== searchRequestId.current) return;
          setResult({ kind: 'batch', identifier: normalizedIdentifier, batch, graph });
        } else {
          const serial = await currentCapabilities.loadSerialTrace({ serialNo: normalizedIdentifier });
          let graph: TraceGraph | undefined;
          let warning: string | undefined;
          if (serial.batchId) {
            try {
              graph = await currentCapabilities.loadBatchGraph({
                batchId: serial.batchId,
                direction: 'backward',
                maxDepth: 10,
                contextLevel: 'summary',
                includeDocs: true,
                includeEnvironment: false,
                includeMeasurement: true,
              });
            } catch {
              warning = '同批物料谱系暂时无法加载；单件流转记录仍可查看';
            }
          } else if (serial.batchNo) {
            warning = '该序列号未关联批号记录；以下仅展示成品序列号自身的流转记录';
          }
          if (requestId !== searchRequestId.current) return;
          setResult({ kind: 'serial', identifier: normalizedIdentifier, serial, graph, warning });
        }
      } catch (cause) {
        if (requestId !== searchRequestId.current) return;
        setError(cause instanceof Error ? cause.message : '追溯查询失败');
      } finally {
        if (requestId === searchRequestId.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      searchRequestId.current += 1;
      setLoading(false);
      return;
    }
    setIdentifierType(initialIdentifierType);
    setIdentifier(initialIdentifier);
    setDirection('both');
    setResult(undefined);
    setError('');
    if (initialIdentifier.trim()) {
      void runSearch(initialIdentifierType, initialIdentifier, 'both');
    }
  }, [initialIdentifier, initialIdentifierType, open, runSearch]);

  const timelineEvents = useMemo(() => {
    if (!result) return [];
    const directEvents =
      result.kind === 'batch'
        ? batchEvents(result.graph, capabilities.dictionaries.batchGraphEventTypes)
        : serialEvents(result.serial, capabilities.dictionaries);
    const relatedBatchEvents =
      result.kind === 'serial' && result.graph
        ? graphBatchEventsForSerial(
            result.graph,
            result.serial,
            capabilities.dictionaries.batchGraphEventTypes,
          )
        : [];
    return sortTimeline([...directEvents, ...relatedBatchEvents]);
  }, [capabilities.dictionaries, result]);

  const warnings =
    result?.kind === 'batch'
      ? result.graph.warnings.map((warning) => warning.message)
      : result?.kind === 'serial'
        ? [
            ...(result.warning ? [result.warning] : []),
            ...(result.graph?.warnings.map((warning) => warning.message) ?? []),
          ]
        : [];
  const graphSummary = result?.kind === 'batch' ? result.graph.summary : result?.graph?.summary;
  const dictionaries = capabilities.dictionaries;

  return (
    <Drawer
      title="追溯查询"
      open={open}
      onClose={onClose}
      size="min(900px, 94vw)"
      destroyOnHidden
      styles={{ body: { padding: 20 } }}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Segmented
          disabled={loading}
          value={identifierType}
          options={[
            { label: '批号', value: 'batch' },
            { label: '成品序列号', value: 'serial' },
          ]}
          onChange={(value) => {
            invalidateSearch();
            setIdentifierType(value as TraceIdentifierType);
            setResult(undefined);
            setError('');
          }}
        />
        {identifierType === 'batch' ? (
          <Segmented
            aria-label="批号追溯方向"
            block
            disabled={loading}
            value={direction}
            options={[
              { label: '正向追溯', value: 'forward' },
              { label: '反向追溯', value: 'backward' },
              { label: '双向追溯', value: 'both' },
            ]}
            onChange={(value) => {
              invalidateSearch();
              setDirection(value as TraceTimelineDirection);
              setResult(undefined);
              setError('');
            }}
          />
        ) : null}
        <Input.Search
          disabled={loading}
          value={identifier}
          onChange={(event) => {
            invalidateSearch();
            setIdentifier(event.target.value);
            setResult(undefined);
            setError('');
          }}
          placeholder={identifierType === 'batch' ? '扫码或输入批号' : '扫码或输入成品序列号'}
          enterButton="查询追溯"
          loading={loading}
          allowClear
          onSearch={(value) => void runSearch(identifierType, value, direction)}
        />
        {loading ? <Spin description="正在整理追溯记录…" /> : null}
        {error ? <Alert type="error" showIcon message={error} /> : null}

        {result ? (
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Card size="small">
              <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label={result.kind === 'batch' ? '批号' : '成品序列号'}>
                  {result.identifier}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  {currentStatusLabel(
                    result.kind,
                    result.kind === 'batch' ? result.batch.status : result.serial.status,
                    dictionaries,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="物料">
                  {result.kind === 'batch'
                    ? [result.batch.material?.name, result.batch.material?.code]
                        .filter(Boolean)
                        .join(' / ') || '-'
                    : [result.serial.material?.name, result.serial.material?.code]
                        .filter(Boolean)
                        .join(' / ') || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="规格">
                  {result.kind === 'batch'
                    ? result.batch.material?.spec || '-'
                    : result.serial.material?.spec || '-'}
                </Descriptions.Item>
                {result.kind === 'batch' ? (
                  <>
                    <Descriptions.Item label="数量">
                      {result.batch.qty} {capabilities.formatUnitLabel(result.batch.material?.unit)}
                    </Descriptions.Item>
                    <Descriptions.Item label="仓库">
                      {result.batch.warehouse?.name || '-'}
                    </Descriptions.Item>
                  </>
                ) : (
                  <>
                    <Descriptions.Item label="来源工单">
                      {result.serial.workOrder?.orderNo || '-'}
                    </Descriptions.Item>
                    {result.serial.sourceDemand ? (
                      <Descriptions.Item label="需求来源">
                        {[
                          result.serial.sourceDemand.sourceOrderNo,
                          `需求行 ${result.serial.sourceDemand.demandLineNo}`,
                        ]
                          .filter(Boolean)
                          .join(' · ') || result.serial.sourceDemand.sourceType}
                      </Descriptions.Item>
                    ) : null}
                    <Descriptions.Item label="批号">
                      {result.serial.batchNo || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="当前仓库">
                      {result.serial.warehouse?.name || '-'}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
              {graphSummary ? (
                <Typography.Text type="secondary">
                  批号数 {graphSummary.batchCount} · 工单 {graphSummary.workOrderCount} · 质检{' '}
                  {graphSummary.qualityCount} · 客户 {graphSummary.customerCount}
                </Typography.Text>
              ) : null}
            </Card>

            {warnings.length ? (
              <Alert type="warning" showIcon message="追溯提示" description={warnings.join('；')} />
            ) : null}

            {timelineEvents.length ? (
              <>
                <Typography.Text type="secondary">
                  共 {timelineEvents.length} 条记录，按发生时间从早到晚排列
                </Typography.Text>
                <Timeline
                  items={timelineEvents.map((event) => {
                    const status = eventStatusLabel(event, dictionaries);
                    const subtitle = eventSubtitle(event, dictionaries);
                    const context = eventContext(event);
                    return {
                      key: event.id,
                      color: event.scope === 'serial' ? 'blue' : 'gray',
                      children: (
                        <Card size="small" styles={{ body: { padding: '10px 12px' } }}>
                          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                            <Space wrap size={[6, 4]}>
                              <Typography.Text strong>
                                {event.title || dictionaries.eventLabels[event.type] || '追溯记录'}
                              </Typography.Text>
                              <Tag color={event.scope === 'serial' ? 'blue' : 'default'}>
                                {event.scope === 'serial' ? '单件记录' : '批号记录'}
                              </Tag>
                              {status ? <Tag>{status}</Tag> : null}
                            </Space>
                            <Typography.Text type="secondary">
                              {event.occurredAt
                                ? capabilities.formatDateTimeSeconds(event.occurredAt)
                                : '时间未记录'}
                            </Typography.Text>
                            {subtitle ? <Typography.Text>{subtitle}</Typography.Text> : null}
                            {event.remarks?.map((remark) => (
                              <Typography.Paragraph
                                key={`${event.id}:remark:${remark}`}
                                style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
                              >
                                <Typography.Text type="secondary">备注：</Typography.Text>
                                {remark}
                              </Typography.Paragraph>
                            ))}
                            {event.photoUrls?.length ? (
                              <Image.PreviewGroup>
                                <Space wrap size={[6, 6]}>
                                  {event.photoUrls.map((url, index) => (
                                    <Image
                                      key={`${event.id}:photo:${url}`}
                                      src={url}
                                      alt={`追溯照片${index + 1}`}
                                      width={64}
                                      height={64}
                                      loading="lazy"
                                      style={{
                                        objectFit: 'cover',
                                        borderRadius: 4,
                                        border: '1px solid var(--ant-color-border-secondary)',
                                      }}
                                    />
                                  ))}
                                </Space>
                              </Image.PreviewGroup>
                            ) : null}
                            {event.relationships?.length ? (
                              <Typography.Text type="secondary">
                                追溯关系：{event.relationships.join('；')}
                              </Typography.Text>
                            ) : null}
                            {event.quantity !== undefined ? (
                              <Typography.Text type="secondary">
                                数量：{event.quantity} {capabilities.formatUnitLabel(event.unit)}
                              </Typography.Text>
                            ) : null}
                            {context.length ? (
                              <Typography.Text type="secondary">{context.join(' · ')}</Typography.Text>
                            ) : null}
                            {event.missingContext?.length ? (
                              <Typography.Text type="warning">
                                缺少记录：{event.missingContext.join('、')}
                              </Typography.Text>
                            ) : null}
                          </Space>
                        </Card>
                      ),
                    };
                  })}
                />
              </>
            ) : (
              <Empty description="暂无可展示的追溯事件" />
            )}
          </Space>
        ) : null}
      </Space>
    </Drawer>
  );
};

export type { TraceTimelineDrawerProps } from './trace-timeline-drawer-types';
