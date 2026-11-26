import type { ProColumns } from '@ant-design/pro-components';
import { ProDescriptions } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Drawer,
  Popconfirm,
  Space,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DetailDocumentActions } from './DetailDocumentActions';
import { ResizableProTable } from './ResizableTable';
import { StatusDisplay } from '../../components/StatusDisplay';
import type {
  LandedCostAccountingSourceDocument,
  LandedCostAllocation,
  LandedCostDetailDrawerProps,
  LandedCostRecord,
} from './landed-cost-components-types';

function snapshotText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * @sunxu-layer business
 * @sunxu-domain purchasing
 * @sunxu-reason Preserves purchase landed-cost detail fields, frozen allocation results, accounting-source status/replay, and server-authoritative actions while requests, permissions, formatting, and navigation remain host supplied.
 */
export function LandedCostDetailDrawer({
  open,
  landedCostId,
  onOpenChange,
  onAction,
  capabilities,
}: LandedCostDetailDrawerProps) {
  const [detail, setDetail] = useState<LandedCostRecord>();
  const [loading, setLoading] = useState(false);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [accountingSources, setAccountingSources] = useState<
    LandedCostAccountingSourceDocument[]
  >([]);
  const [accountingSourcesLoading, setAccountingSourcesLoading] =
    useState(false);
  const [accountingSourcesLoadFailed, setAccountingSourcesLoadFailed] =
    useState(false);
  const [replayingSourceId, setReplayingSourceId] = useState<string>();
  const detailRequestId = useRef(0);
  const accountingSourceRequestId = useRef(0);

  useEffect(() => {
    const requestId = ++detailRequestId.current;
    if (!open || !landedCostId) {
      setDetail(undefined);
      setLoading(false);
      return () => {
        detailRequestId.current += 1;
      };
    }
    setLoading(true);
    void capabilities
      .loadDetail(landedCostId)
      .then((next) => {
        if (detailRequestId.current === requestId) setDetail(next);
      })
      .catch(() => {
        if (detailRequestId.current === requestId) setDetail(undefined);
      })
      .finally(() => {
        if (detailRequestId.current === requestId) setLoading(false);
      });
    return () => {
      if (detailRequestId.current === requestId) detailRequestId.current += 1;
    };
  }, [capabilities, detailReloadKey, landedCostId, open]);

  const accountingSourceIds = useMemo(
    () => [
      ...new Set(
        (detail?.allocations ?? [])
          .map((allocation) => allocation.accountingSourceDocumentId)
          .filter((id): id is string => Boolean(id)),
      ),
    ],
    [detail?.allocations],
  );

  useEffect(() => {
    const requestId = ++accountingSourceRequestId.current;
    if (
      !open ||
      accountingSourceIds.length === 0 ||
      !capabilities.canReadAccountingSource
    ) {
      setAccountingSources([]);
      setAccountingSourcesLoading(false);
      setAccountingSourcesLoadFailed(false);
      return () => {
        accountingSourceRequestId.current += 1;
      };
    }

    setAccountingSourcesLoading(true);
    setAccountingSourcesLoadFailed(false);
    void capabilities
      .loadAccountingSourceDetails(accountingSourceIds)
      .then((next) => {
        if (accountingSourceRequestId.current === requestId) {
          setAccountingSources(next);
        }
      })
      .catch(() => {
        if (accountingSourceRequestId.current === requestId) {
          setAccountingSources([]);
          setAccountingSourcesLoadFailed(true);
        }
      })
      .finally(() => {
        if (accountingSourceRequestId.current === requestId) {
          setAccountingSourcesLoading(false);
        }
      });
    return () => {
      if (accountingSourceRequestId.current === requestId) {
        accountingSourceRequestId.current += 1;
      }
    };
  }, [
    accountingSourceIds,
    capabilities,
    open,
  ]);

  const replayAccountingSource = async (sourceId: string) => {
    setReplayingSourceId(sourceId);
    try {
      await capabilities.replayAccountingSource(sourceId);
      capabilities.notify('success', '会计来源单已按最新配置重新处理');
      setDetailReloadKey((current) => current + 1);
    } finally {
      setReplayingSourceId(undefined);
    }
  };

  const allocationColumns = useMemo<ProColumns<LandedCostAllocation>[]>(
    () => [
      { title: '采购入库单', dataIndex: 'receiptNoSnapshot', width: 150 },
      {
        title: '物料名称',
        key: 'materialName',
        width: 180,
        render: (_, allocation) => allocation.receiptItem?.material?.name ?? '-',
      },
      {
        title: '物料编码',
        key: 'materialCode',
        width: 140,
        render: (_, allocation) => allocation.receiptItem?.material?.code ?? '-',
      },
      {
        title: '规格型号',
        key: 'materialSpec',
        width: 150,
        render: (_, allocation) => allocation.receiptItem?.material?.spec ?? '-',
      },
      { title: '批号', dataIndex: 'batchNoSnapshot', width: 130 },
      {
        title: '入库数量',
        dataIndex: 'receiptQuantitySnapshot',
        width: 110,
        align: 'right',
      },
      {
        title: '分摊基数',
        dataIndex: 'allocationBase',
        width: 110,
        align: 'right',
      },
      {
        title: '分摊金额',
        dataIndex: 'allocatedAmount',
        width: 120,
        align: 'right',
        render: (_, allocation) =>
          capabilities.formatAmount(allocation.allocatedAmount),
      },
      {
        title: '分摊税额',
        key: 'allocatedTaxAmount',
        width: 120,
        align: 'right',
        render: (_, allocation) =>
          capabilities.formatAmount(allocation.allocatedTaxAmount),
      },
    ],
    [capabilities],
  );
  const accountingSourceById = useMemo(
    () => new Map(accountingSources.map((source) => [source.id, source])),
    [accountingSources],
  );
  const detailActions = useMemo(
    () => capabilities.actions.filter((action) => action.key !== 'detail'),
    [capabilities.actions],
  );

  return (
    <Drawer
      title="分摊单详情"
      size={960}
      open={open}
      onClose={() => onOpenChange(false)}
      destroyOnHidden
      loading={loading}
    >
      {detail ? (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <DetailDocumentActions
            document={detail}
            actions={detailActions}
            primaryActionKeys={['confirm']}
            directActionKeys={['edit', 'submit', 'confirm']}
            onAction={(key, document) => onAction?.(key, document)}
          />
          <ProDescriptions
            column={3}
            dataSource={detail}
            columns={[
              { title: '分摊单号', dataIndex: 'costNo' },
              {
                title: '状态',
                render: () => (
                  <StatusDisplay
                    value={detail.status}
                    enumMap={capabilities.statusEnum}
                  />
                ),
              },
              {
                title: '单据类型',
                render: () => (
                  <StatusDisplay
                    value={detail.documentType}
                    enumMap={capabilities.documentTypeEnum}
                  />
                ),
              },
              {
                title: '费用类型',
                render: () =>
                  snapshotText(
                    detail.expenseTypeNameSnapshot,
                    detail.expenseType?.name ?? '-',
                  ),
              },
              {
                title: '承运方',
                render: () =>
                  snapshotText(
                    detail.carrierNameSnapshot,
                    detail.carrier?.name ?? '-',
                  ),
              },
              { title: '物流账单/运单号', dataIndex: 'externalRefNo' },
              {
                title: '费用金额',
                render: () => `${detail.currency}${capabilities.formatAmount(detail.amount)}`,
              },
              {
                title: '不含税成本金额',
                render: () => `${detail.currency}${capabilities.formatAmount(detail.amountExcludingTax)}`,
              },
              {
                title: '税额',
                render: () => `${detail.currency}${capabilities.formatAmount(detail.taxAmount)}`,
              },
              {
                title: '税率',
                render: () => capabilities.formatTaxRate(detail.taxRate),
              },
              {
                title: '汇率',
                render: () => capabilities.formatAmount(detail.exchangeRate),
              },
              {
                title: '业务日期',
                render: () => capabilities.formatDate(detail.businessDate),
              },
              {
                title: '分摊方式',
                render: () =>
                  capabilities.allocationBasisEnum[detail.allocationBasis]?.text ??
                  detail.allocationBasis,
              },
              {
                title: '物流应付/贷项',
                render: () => detail.financeInvoice?.invoiceNo ?? '-',
              },
              {
                title: '会计来源单',
                span: 3,
                render: () =>
                  !capabilities.canReadAccountingSource ? (
                    '无会计来源查看权限'
                  ) : accountingSourcesLoading ? (
                    <Typography.Text type="secondary">
                      正在加载会计来源状态…
                    </Typography.Text>
                  ) : accountingSourcesLoadFailed ? (
                    <Alert
                      showIcon
                      type="warning"
                      message="会计来源状态加载失败，请稍后刷新或到会计来源单查询。"
                    />
                  ) : accountingSourceIds.length === 0 ? (
                    '-'
                  ) : (
                    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                      {accountingSourceIds.map((sourceId) => {
                        const source = accountingSourceById.get(sourceId);
                        if (!source) return null;
                        const canReplay =
                          capabilities.canReplayAccountingSource &&
                          capabilities.replayableAccountingSourceStatuses.has(
                            source.status,
                          );
                        return (
                          <Space key={source.id} wrap>
                            <Typography.Text>{source.sourceNo}</Typography.Text>
                            <StatusDisplay
                              value={source.status}
                              enumMap={capabilities.accountingSourceStatusEnum}
                            />
                            {source.lastErrorMessage ? (
                              <Typography.Text type="danger">
                                {source.lastErrorMessage}
                              </Typography.Text>
                            ) : null}
                            <Button
                              type="link"
                              size="small"
                              onClick={() =>
                                capabilities.navigateAccountingSource(source.id)
                              }
                            >
                              查看会计来源单
                            </Button>
                            {canReplay ? (
                              <Popconfirm
                                title="按最新配置重新处理该会计来源单？"
                                onConfirm={() => replayAccountingSource(source.id)}
                              >
                                <Button
                                  size="small"
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
                  ),
              },
              {
                title: '确认时间',
                render: () => capabilities.formatDateTime(detail.confirmedAt),
              },
              {
                title: '冲销原因',
                span: 3,
                render: () => detail.reversalReason ?? '-',
              },
              { title: '备注', span: 3, render: () => detail.remark ?? '-' },
            ]}
          />
          <Typography.Text strong>冻结的成本目标与分摊结果</Typography.Text>
          <ResizableProTable<LandedCostAllocation>
            columns={allocationColumns}
            dataSource={detail.allocations}
            rowKey="id"
            search={false}
            options={false}
            pagination={false}
            scroll={{ x: 1100 }}
          />
        </Space>
      ) : null}
    </Drawer>
  );
}
