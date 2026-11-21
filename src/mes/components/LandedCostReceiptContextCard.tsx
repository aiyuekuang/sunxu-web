import type { ProColumns } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Popconfirm,
  Space,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ResizableProTable } from './ResizableTable';
import { StatusDisplay } from './StatusDisplay';
import type {
  LandedCostAccountingSourceDocument,
  LandedCostReceiptContextCardProps,
  LandedCostRecord,
} from './landed-cost-components-types';

function snapshotText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function getAllocationAmountForReceipt(landedCost: LandedCostRecord): number {
  return (landedCost.allocations ?? []).reduce(
    (sum, allocation) => sum + Number(allocation.allocatedAmount ?? 0),
    0,
  );
}

function getAccountingSourceIds(landedCost: LandedCostRecord): string[] {
  return [
    ...new Set(
      (landedCost.allocations ?? [])
        .map((allocation) => allocation.accountingSourceDocumentId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchasing
 * @sunxu-reason Preserves the purchase-receipt landed-cost context, accounting-source status/replay, and failure/empty states while requests, permissions, and formatting remain host supplied.
 */
export function LandedCostReceiptContextCard({
  receiptOrderId,
  onOpenLandedCost,
  capabilities,
}: LandedCostReceiptContextCardProps) {
  const [landedCosts, setLandedCosts] = useState<LandedCostRecord[]>([]);
  const [accountingSources, setAccountingSources] = useState<
    LandedCostAccountingSourceDocument[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [landedCostLoadFailed, setLandedCostLoadFailed] = useState(false);
  const [accountingSourceLoadFailed, setAccountingSourceLoadFailed] =
    useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [replayingSourceId, setReplayingSourceId] = useState<string>();
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    if (!receiptOrderId) {
      setLandedCosts([]);
      setAccountingSources([]);
      setLoading(false);
      setLandedCostLoadFailed(false);
      setAccountingSourceLoadFailed(false);
      return () => {
        requestIdRef.current += 1;
      };
    }

    setLoading(true);
    setLandedCosts([]);
    setAccountingSources([]);
    setLandedCostLoadFailed(false);
    setAccountingSourceLoadFailed(false);
    const load = async () => {
      try {
        const landedCostRecords =
          (await capabilities.listByReceipt(receiptOrderId)) ?? [];
        if (requestIdRef.current !== requestId) return;
        setLandedCosts(landedCostRecords);
        const sourceIds = [
          ...new Set(landedCostRecords.flatMap(getAccountingSourceIds)),
        ];
        if (sourceIds.length === 0 || !capabilities.canReadAccountingSource) {
          return;
        }
        try {
          const sources = await capabilities.loadAccountingSourceDetails(sourceIds);
          if (requestIdRef.current === requestId) setAccountingSources(sources);
        } catch {
          if (requestIdRef.current === requestId) {
            setAccountingSourceLoadFailed(true);
          }
        }
      } catch {
        if (requestIdRef.current === requestId) setLandedCostLoadFailed(true);
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    };
    void load();
    return () => {
      if (requestIdRef.current === requestId) requestIdRef.current += 1;
    };
  }, [capabilities, receiptOrderId, reloadKey]);

  const replayAccountingSource = async (sourceId: string) => {
    setReplayingSourceId(sourceId);
    try {
      await capabilities.replayAccountingSource(sourceId);
      capabilities.notify('success', '会计来源单已按最新配置重新处理');
      setReloadKey((current) => current + 1);
    } finally {
      setReplayingSourceId(undefined);
    }
  };

  const accountingSourceById = useMemo(
    () => new Map(accountingSources.map((source) => [source.id, source])),
    [accountingSources],
  );
  const columns = useMemo<ProColumns<LandedCostRecord>[]>(
    () => [
      {
        title: '分摊单号',
        dataIndex: 'costNo',
        width: 160,
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            onClick={() => onOpenLandedCost(record.id)}
          >
            {record.costNo}
          </Button>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (_, record) => (
          <StatusDisplay
            value={record.status}
            enumMap={capabilities.landedCostStatusEnum}
          />
        ),
      },
      {
        title: '费用类型',
        width: 160,
        render: (_, record) =>
          snapshotText(record.expenseTypeNameSnapshot, record.expenseType?.name ?? '-'),
      },
      {
        title: '承运方',
        width: 160,
        render: (_, record) =>
          snapshotText(record.carrierNameSnapshot, record.carrier?.name ?? '-'),
      },
      {
        title: '本入库分摊金额',
        width: 130,
        align: 'right',
        render: (_, record) =>
          capabilities.formatAmount(getAllocationAmountForReceipt(record)),
      },
      {
        title: '物流应付/贷项',
        width: 150,
        render: (_, record) => record.financeInvoice?.invoiceNo ?? '-',
      },
      {
        title: '会计状态',
        width: 320,
        render: (_, record) => {
          const sourceIds = getAccountingSourceIds(record);
          if (sourceIds.length === 0) return '-';
          if (!capabilities.canReadAccountingSource) return '无会计来源查看权限';
          if (accountingSourceLoadFailed) return '会计来源状态加载失败';
          return (
            <Space direction="vertical" size={4}>
              {sourceIds.map((sourceId) => {
                const source = accountingSourceById.get(sourceId);
                if (!source) {
                  return (
                    <Typography.Text key={sourceId} type="secondary">
                      正在加载…
                    </Typography.Text>
                  );
                }
                const canReplay =
                  capabilities.canReplayAccountingSource &&
                  capabilities.replayableAccountingSourceStatuses.has(
                    source.status,
                  );
                return (
                  <Space key={source.id} size={4} wrap>
                    <StatusDisplay
                      value={source.status}
                      enumMap={capabilities.accountingSourceStatusEnum}
                    />
                    {source.lastErrorMessage ? (
                      <Typography.Text type="danger">
                        {source.lastErrorMessage}
                      </Typography.Text>
                    ) : null}
                    {canReplay ? (
                      <Popconfirm
                        title="按最新配置重新处理该会计来源单？"
                        onConfirm={() => replayAccountingSource(source.id)}
                      >
                        <Button
                          size="small"
                          type="link"
                          loading={replayingSourceId === source.id}
                        >
                          重放
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Space>
                );
              })}
            </Space>
          );
        },
      },
      {
        title: '业务日期',
        dataIndex: 'businessDate',
        width: 120,
        search: false,
        render: (_, record) => capabilities.formatDate(record.businessDate),
      },
    ],
    [
      accountingSourceById,
      accountingSourceLoadFailed,
      capabilities,
      onOpenLandedCost,
      replayingSourceId,
    ],
  );

  if (
    !loading &&
    !landedCostLoadFailed &&
    !accountingSourceLoadFailed &&
    landedCosts.length === 0
  ) {
    return null;
  }

  return (
    <Card title="采购附加费用分摊" size="small">
      {landedCostLoadFailed ? (
        <Alert
          showIcon
          type="error"
          message="采购附加费用分摊记录加载失败，请稍后刷新。"
          style={{ marginBottom: 12 }}
        />
      ) : null}
      {accountingSourceLoadFailed ? (
        <Alert
          showIcon
          type="warning"
          message="部分会计来源状态未能加载，请稍后刷新或到会计来源单查询。"
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <ResizableProTable<LandedCostRecord>
        rowKey="id"
        columns={columns}
        dataSource={landedCosts}
        loading={loading}
        search={false}
        options={false}
        pagination={false}
        scroll={{ x: 1180 }}
        tableAlertRender={false}
        headerTitle={false}
      />
    </Card>
  );
}
