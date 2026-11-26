/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves price-permission gating, candidate selection, group merge/split/move, invoice-number checks, live precheck and idempotent batch creation while the host injects requests, permissions, messages, and formatters. */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  DatePicker,
  Dropdown,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { ResizableProTable as ProTable } from '../shared/ResizableTable';
import {
  createInvoiceSourceCandidateLineColumns,
  InvoiceSourceCandidateTable,
} from './InvoiceSourceCandidateTable';
import {
  BUSINESS_INVOICE_NUMBER_ERROR_MESSAGE,
  isValidBusinessInvoiceNumber,
} from './BusinessInvoiceCreateDrawer';
import type {
  BusinessInvoiceSourceCandidate,
  InvoiceSourceCandidateTableCapabilities,
  InvoiceDateValue,
  InvoiceSourceBatchModalProps,
  SourceInvoiceGroup,
  SourceInvoiceGroupRow,
} from './business-invoice-workflow-types';
import type { BusinessInvoiceMode } from './business-invoice-types';

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function sourceGroupKey(source: BusinessInvoiceSourceCandidate): string {
  return [
    optionalText(source.partnerId) ?? '',
    optionalText(source.currency) ?? '',
    optionalNumber(source.exchangeRate)?.toString() ?? '',
  ].join(':');
}

function createSourceInvoiceGroup(
  sourceIds: string[],
  id = sourceIds.join(':'),
): SourceInvoiceGroup {
  return { id, sourceIds };
}

function reconcileSourceInvoiceGroups(
  currentGroups: readonly SourceInvoiceGroup[],
  selectedIds: readonly string[],
  sourceById: Readonly<Record<string, BusinessInvoiceSourceCandidate>>,
): SourceInvoiceGroup[] {
  const selectedIdSet = new Set(selectedIds);
  const nextGroups = currentGroups
    .map((group) => ({
      ...group,
      sourceIds: group.sourceIds.filter((sourceId) =>
        selectedIdSet.has(sourceId),
      ),
    }))
    .filter((group) => group.sourceIds.length > 0);
  const groupedIds = new Set(nextGroups.flatMap((group) => group.sourceIds));

  for (const sourceId of selectedIds) {
    if (groupedIds.has(sourceId)) continue;
    const source = sourceById[sourceId];
    if (!source) continue;
    const matchedGroup = nextGroups.find((group) => {
      const firstSource = sourceById[group.sourceIds[0]];
      return firstSource
        ? sourceGroupKey(firstSource) === sourceGroupKey(source)
        : false;
    });
    if (matchedGroup) {
      matchedGroup.sourceIds.push(sourceId);
    } else {
      nextGroups.push(createSourceInvoiceGroup([sourceId]));
    }
    groupedIds.add(sourceId);
  }
  return nextGroups;
}

function buildSourceInvoiceGroupRows(
  groups: readonly SourceInvoiceGroup[],
  sourceById: Readonly<Record<string, BusinessInvoiceSourceCandidate>>,
): SourceInvoiceGroupRow[] {
  return groups.map((group, index) => {
    const sources = group.sourceIds
      .map((sourceId) => sourceById[sourceId])
      .filter((source): source is BusinessInvoiceSourceCandidate => source != null);
    const firstSource = sources[0];
    return {
      ...group,
      groupNo: index + 1,
      partnerName: optionalText(firstSource?.partnerName) ?? '-',
      currency: optionalText(firstSource?.currency) ?? '本位币',
      exchangeRate:
        optionalNumber(firstSource?.exchangeRate)?.toString() ?? '—',
      amount: sources.every(
        (source) => optionalNumber(source.remainingAmount) != null,
      )
        ? sources.reduce(
            (total, source) => total + Number(source.remainingAmount),
            0,
          )
        : null,
      lineCount: sources.reduce(
        (total, source) => total + Number(source.remainingLineCount),
        0,
      ),
      lines: sources.flatMap((source) =>
        source.lines.map((line) => ({
          ...line,
          sourceDocumentNo: optionalText(source.documentNo) ?? '-',
        })),
      ),
    };
  });
}

function getCandidateLabel(source: BusinessInvoiceSourceCandidate | undefined) {
  return source?.documentNo ?? '来源单已不可用';
}

function createClientRequestId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
      .slice(6, 8)
      .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function InvoiceSourceBatchGroupTable({
  canViewPrices,
  groups,
  mode,
  onGroupsChange,
  sourceById,
  formatNumber,
  formatCurrencyAmount,
  formatUnitLabel,
  notifyWarning,
  notifyError,
}: {
  canViewPrices: boolean;
  groups: SourceInvoiceGroup[];
  mode: BusinessInvoiceMode;
  onGroupsChange: (groups: SourceInvoiceGroup[]) => void;
  sourceById: Readonly<Record<string, BusinessInvoiceSourceCandidate>>;
  formatNumber: InvoiceSourceCandidateTableCapabilities['formatNumber'];
  formatCurrencyAmount: InvoiceSourceCandidateTableCapabilities['formatCurrencyAmount'];
  formatUnitLabel: InvoiceSourceCandidateTableCapabilities['formatUnitLabel'];
  notifyWarning: (message: string) => void;
  notifyError: (message: string) => void;
}) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const isPurchase = mode === 'purchase';
  const partnerLabel = isPurchase ? '供应商' : '客户';
  const groupRows = useMemo(
    () => buildSourceInvoiceGroupRows(groups, sourceById),
    [groups, sourceById],
  );
  const lineColumns = useMemo(
    () =>
      createInvoiceSourceCandidateLineColumns({
        canViewPrices,
        includeSourceDocument: true,
        formatNumber,
        formatUnitLabel,
      }),
    [canViewPrices, formatNumber, formatUnitLabel],
  );

  const renderGroupLines = (group: SourceInvoiceGroupRow) => (
    <div style={{ padding: '8px 24px' }}>
      {group.lines.length ? (
        <ProTable
          rowKey={(_line, index) => String(index)}
          className="sxw-expanded-detail-table"
          search={false}
          options={false}
          headerTitle={false}
          dataSource={group.lines}
          pagination={false}
          fitContainerHeight={false}
          resizable={false}
          size="small"
          scroll={{ x: 'max-content' }}
          columns={lineColumns}
        />
      ) : (
        <Typography.Text type="secondary">
          该发票分组当前没有剩余可收票/开票的产品明细
        </Typography.Text>
      )}
    </div>
  );

  const mergeSelectedGroups = () => {
    const targetGroups = groups.filter((group) =>
      selectedGroupIds.includes(group.id),
    );
    if (targetGroups.length < 2) {
      notifyWarning('请至少选择两个发票分组后再合并');
      return;
    }
    const groupKeys = new Set(
      targetGroups.map((group) => {
        const source = sourceById[group.sourceIds[0]];
        return source ? sourceGroupKey(source) : '';
      }),
    );
    if (groupKeys.size !== 1 || groupKeys.has('')) {
      notifyError('只能合并相同往来方、币种和汇率的发票分组');
      return;
    }
    const invoiceNumbers = [
      ...new Set(
        targetGroups
          .map((group) => optionalText(group.invoiceNo))
          .filter((invoiceNo): invoiceNo is string => invoiceNo != null),
      ),
    ];
    if (invoiceNumbers.length > 1) {
      notifyError('待合并分组填写了不同真实发票号，请先清空或统一后再合并');
      return;
    }
    const targetId = targetGroups[0].id;
    onGroupsChange([
      ...groups.filter((group) => !selectedGroupIds.includes(group.id)),
      {
        id: targetId,
        sourceIds: targetGroups.flatMap((group) => group.sourceIds),
        invoiceNo: invoiceNumbers[0],
      },
    ]);
    setSelectedGroupIds([targetId]);
  };

  const splitSelectedGroups = () => {
    const targetGroups = groups.filter((group) =>
      selectedGroupIds.includes(group.id),
    );
    if (
      !targetGroups.length
    ) {
      notifyWarning('请先选择要拆分的发票分组');
      return;
    }
    if (targetGroups.some((group) => optionalText(group.invoiceNo))) {
      notifyError('已填写真实发票号的分组不能直接拆分，请先清空真实发票号');
      return;
    }
    onGroupsChange([
      ...groups.filter((group) => !selectedGroupIds.includes(group.id)),
      ...targetGroups.flatMap((group) =>
        group.sourceIds.map((sourceId) => createSourceInvoiceGroup([sourceId])),
      ),
    ]);
    setSelectedGroupIds([]);
  };

  const moveSource = (sourceId: string, targetGroupId?: string) => {
    const originGroup = groups.find((group) =>
      group.sourceIds.includes(sourceId),
    );
    if (!originGroup) return;
    const targetGroup = targetGroupId
      ? groups.find((group) => group.id === targetGroupId)
      : undefined;
    if (
      optionalText(originGroup.invoiceNo) ||
      optionalText(targetGroup?.invoiceNo)
    ) {
      notifyError(
        '涉及已填写真实发票号的分组不能直接移动来源单，请先清空真实发票号',
      );
      return;
    }
    const withoutSource = groups
      .map((group) =>
        group.id === originGroup.id
          ? {
              ...group,
              sourceIds: group.sourceIds.filter((id) => id !== sourceId),
            }
          : group,
      )
      .filter((group) => group.sourceIds.length > 0);
    onGroupsChange(
      targetGroupId
        ? withoutSource.map((group) =>
            group.id === targetGroupId
              ? { ...group, sourceIds: [...group.sourceIds, sourceId] }
              : group,
          )
        : [...withoutSource, createSourceInvoiceGroup([sourceId])],
    );
  };

  const updateGroupInvoiceNo = (groupId: string, invoiceNo: string) => {
    onGroupsChange(
      groups.map((group) =>
        group.id === groupId
          ? { ...group, invoiceNo: invoiceNo || undefined }
          : group,
      ),
    );
  };

  const columns = useMemo<ProColumns<SourceInvoiceGroupRow>[]>(
    () => [
      {
        title: '分组',
        dataIndex: 'groupNo',
        width: 76,
        renderText: (value) => `第 ${value} 组`,
      },
      { title: partnerLabel, dataIndex: 'partnerName', width: 160, search: false },
      { title: '币种', dataIndex: 'currency', width: 90, search: false },
      { title: '汇率', dataIndex: 'exchangeRate', width: 90, search: false },
      {
        title: '来源单',
        dataIndex: 'sourceIds',
        search: false,
        render: (_, group) => (
          <Space wrap size={[4, 4]}>
            {group.sourceIds.map((sourceId) => {
              const source = sourceById[sourceId];
              const currentKey = source ? sourceGroupKey(source) : '';
              const targetGroups = groupRows.filter((candidateGroup) => {
                const targetSource = sourceById[candidateGroup.sourceIds[0]];
                return (
                  candidateGroup.id !== group.id &&
                  targetSource != null &&
                  sourceGroupKey(targetSource) === currentKey
                );
              });
              return (
                <Dropdown
                  key={sourceId}
                  menu={{
                    items: [
                      {
                        key: 'new',
                        label: '拆为独立发票分组',
                        onClick: () => moveSource(sourceId),
                      },
                      ...targetGroups.map((target) => ({
                        key: target.id,
                        label: `移至第 ${target.groupNo} 组`,
                        onClick: () => moveSource(sourceId, target.id),
                      })),
                    ],
                  }}
                >
                  <Tag style={{ cursor: 'pointer' }}>
                    {getCandidateLabel(source)}
                  </Tag>
                </Dropdown>
              );
            })}
          </Space>
        ),
      },
      {
        title: '真实发票号',
        dataIndex: 'invoiceNo',
        width: 180,
        search: false,
        render: (_, group) => (
          <Input
            value={group.invoiceNo}
            maxLength={20}
            status={isValidBusinessInvoiceNumber(group.invoiceNo) ? undefined : 'error'}
            placeholder="20位发票号（阿拉伯数字）"
            onChange={(event) =>
              updateGroupInvoiceNo(group.id, event.target.value)
            }
          />
        ),
      },
      {
        title: '来源行',
        dataIndex: 'lineCount',
        width: 110,
        search: false,
        render: (_, group) => {
          if (!group.lineCount) {
            return <Typography.Text type="secondary">-</Typography.Text>;
          }
          return (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() =>
                setExpandedRowKeys((keys) =>
                  keys.includes(group.id)
                    ? keys.filter((key) => key !== group.id)
                    : [...keys, group.id],
                )
              }
            >
              {group.lineCount} 项
              {expandedRowKeys.includes(group.id) ? ' 收起' : ' 展开'}
            </Button>
          );
        },
      },
      ...(canViewPrices
        ? [
            {
              title: '价税合计',
              dataIndex: 'amount',
              width: 130,
              align: 'right' as const,
              search: false,
              renderText: (value: unknown) => {
                const amount = optionalNumber(value);
                return amount == null ? '-' : formatCurrencyAmount(amount);
              },
            },
          ]
        : []),
    ],
    [
      canViewPrices,
      expandedRowKeys,
      formatCurrencyAmount,
      formatNumber,
      groupRows,
      partnerLabel,
      sourceById,
    ],
  );

  return (
    <ProTable<SourceInvoiceGroupRow>
      rowKey="id"
      headerTitle="发票草稿分组"
      size="small"
      search={false}
      options={false}
      pagination={false}
      dataSource={groupRows}
      expandable={{
        expandedRowKeys,
        onExpandedRowsChange: (keys) => setExpandedRowKeys(keys.map(String)),
        rowExpandable: (group) => group.lines.length > 0,
        expandedRowRender: renderGroupLines,
      }}
      rowSelection={{
        selectedRowKeys: selectedGroupIds,
        onChange: (keys) => setSelectedGroupIds(keys.map(String)),
      }}
      tableAlertOptionRender={({ onCleanSelected }) => (
        <Space>
          <Button type="link" onClick={mergeSelectedGroups}>
            合并所选分组
          </Button>
          <Button type="link" onClick={splitSelectedGroups}>
            拆分所选分组
          </Button>
          <Button type="link" onClick={onCleanSelected}>
            清空选择
          </Button>
        </Space>
      )}
      columns={columns}
      scroll={{ x: 1100 }}
    />
  );
}

/** Batch-generates purchase receipts or sales deliveries into invoice drafts. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable invoice source batch modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function InvoiceSourceBatchModal({
  mode,
  open,
  onCancel,
  onDone,
  capabilities,
}: InvoiceSourceBatchModalProps) {
  const canViewPrices = capabilities.canViewPrices;
  const isPurchase = mode === 'purchase';
  const sourceLabel = isPurchase ? '采购入库单' : '销售出库单';
  const actionLabel = isPurchase ? '批量收票' : '批量开票';
  const candidateTableRef = useRef<ActionType | undefined>(undefined);
  const sourceByIdRef = useRef<
    Record<string, BusinessInvoiceSourceCandidate>
  >({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sourceById, setSourceById] = useState<
    Record<string, BusinessInvoiceSourceCandidate>
  >({});
  const [groups, setGroups] = useState<SourceInvoiceGroup[]>([]);
  const [invoiceDate, setInvoiceDate] = useState<InvoiceDateValue>(dayjs());
  const [submitting, setSubmitting] = useState(false);

  const resetSelection = () => {
    setSelectedIds([]);
    sourceByIdRef.current = {};
    setSourceById({});
    setGroups([]);
  };

  const handleCandidateSelectionChange = (
    ids: string[],
    changedSources: Record<string, BusinessInvoiceSourceCandidate>,
  ) => {
    const nextSources = { ...sourceByIdRef.current, ...changedSources };
    sourceByIdRef.current = nextSources;
    setSourceById(nextSources);
    setGroups((currentGroups) =>
      reconcileSourceInvoiceGroups(currentGroups, ids, nextSources),
    );
    setSelectedIds(ids);
  };

  const handleCancel = () => {
    resetSelection();
    onCancel();
  };

  const execute = async () => {
    const normalizedGroups = groups
      .filter((group) => group.sourceIds.length > 0)
      .map((group) => ({
        sourceIds: group.sourceIds,
        invoiceNo: group.invoiceNo || undefined,
      }));
    const invoiceDateValue = invoiceDate?.isValid()
      ? invoiceDate.format('YYYY-MM-DD')
      : undefined;
    if (!selectedIds.length || !normalizedGroups.length) {
      capabilities.notifyWarning(
        `请至少勾选一张可${isPurchase ? '收票' : '开票'}来源单`,
      );
      return;
    }
    if (!invoiceDateValue) {
      capabilities.notifyWarning(`请选择${isPurchase ? '收票' : '开票'}日期`);
      return;
    }
    if (
      normalizedGroups.some(
        (group) => !isValidBusinessInvoiceNumber(group.invoiceNo),
      )
    ) {
      capabilities.notifyWarning(BUSINESS_INVOICE_NUMBER_ERROR_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      const preview = await capabilities.previewBatchCreate({
        mode,
        ids: selectedIds,
      });
      if (!preview.eligible || preview.blocked) {
        capabilities.notifyWarning(
          preview.eligible
            ? `预检通过 ${preview.eligible} 张，已拦截 ${preview.blocked} 张来源单；请刷新后重新分组`
            : '所选来源单均不可生成，请处理预检问题后刷新候选列表',
        );
        candidateTableRef.current?.reload();
        return;
      }
      const clientRequestId = createClientRequestId();
      const result = await capabilities.batchCreate({
        mode,
        ids: selectedIds,
        invoiceDate: invoiceDateValue,
        groups: normalizedGroups,
        previewToken: preview.previewToken,
        clientRequestId,
      });
      const messagePrefix = `已处理 ${result.succeeded} 张来源单，计划生成 ${normalizedGroups.length} 张发票草稿`;
      if (result.failed) {
        capabilities.notifyWarning(
          `${messagePrefix}；${result.failed} 张来源单需处理后重试`,
        );
      } else {
        capabilities.notifySuccess(messagePrefix);
      }
      resetSelection();
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={actionLabel}
      open={open && canViewPrices}
      width={1200}
      destroyOnHidden
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={() => void execute()}
        >
          预检并生成草稿
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={`勾选${sourceLabel}后，系统先按实时剩余金额预检，再生成${isPurchase ? '采购收票' : '销售开票'}草稿`}
        description="系统按往来方、币种、汇率建议分组。可在同一分组条件内合并、拆分或移动来源单；所有来源明细与分摊关系会保留。旧版专票填8位号码，数电票填20位号码，均为阿拉伯数字。草稿可暂时留空，确认前必须回填。展开“剩余明细”或发票分组的“来源行”可核对将要收票/开票的产品明细。"
      />
      <Space style={{ marginBottom: 12 }}>
        <Typography.Text>{isPurchase ? '收票日期' : '开票日期'}：</Typography.Text>
        <DatePicker value={invoiceDate} onChange={setInvoiceDate} />
        <Button onClick={resetSelection}>清空已选来源</Button>
      </Space>
      <InvoiceSourceCandidateTable
        actionRef={candidateTableRef}
        canViewPrices={canViewPrices}
        mode={mode}
        selectedIds={selectedIds}
        onClearSelection={resetSelection}
        onSelectionChange={handleCandidateSelectionChange}
        capabilities={capabilities.candidateTable}
      />
      {groups.length ? (
        <InvoiceSourceBatchGroupTable
          canViewPrices={canViewPrices}
          groups={groups}
          mode={mode}
          sourceById={sourceById}
          onGroupsChange={setGroups}
          formatNumber={capabilities.candidateTable.formatNumber}
          formatCurrencyAmount={
            capabilities.candidateTable.formatCurrencyAmount
          }
          formatUnitLabel={capabilities.candidateTable.formatUnitLabel}
          notifyWarning={capabilities.notifyWarning}
          notifyError={capabilities.notifyError}
        />
      ) : null}
    </Modal>
  );
}
