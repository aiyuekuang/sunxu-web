/** @sunxu-component mes-specific @sunxu-domain business-invoice-source-match @sunxu-reason Preserves source lookup, coverage preview, proportional allocation matching, stale-selection protection, and result feedback while the host supplies APIs, status labels, and notifications. */
import { DrawerForm, ProFormSelect } from '@ant-design/pro-components';
import { useState } from 'react';
import { ResizableProTable as ProTable } from './ResizableTable';
import type {
  BusinessInvoiceMatchDrawerProps,
  BusinessInvoiceLineAllocationInput,
  InvoiceMatchLineInput,
} from './business-invoice-workflow-types';
import type {
  InvoiceCoverageLine,
  InvoiceCoverageResponse,
} from './business-invoice-types';

type MatchFormValues = { sourceId: string };

/** Matches remaining source quantities and amounts to this invoice's unmatched lines. */
export function BusinessInvoiceMatchDrawer({
  mode,
  record,
  open,
  onOpenChange,
  onSuccess,
  capabilities,
}: BusinessInvoiceMatchDrawerProps) {
  const isPurchase = mode === 'purchase';
  const sourceType = isPurchase ? 'purchase_receipt' : 'sale_delivery';
  const [coverage, setCoverage] = useState<InvoiceCoverageResponse>();

  const loadCoverage = async (sourceId?: string) => {
    if (!sourceId) {
      setCoverage(undefined);
      return;
    }
    const result = await capabilities.requestCoverage({
      mode,
      sourceId,
      sourceType,
    });
    setCoverage(result);
  };

  const submit = async ({ sourceId }: MatchFormValues) => {
    if (!coverage || coverage.sourceId !== sourceId) {
      capabilities.notifyError('请先选择并加载有效的来源单');
      return false;
    }
    const candidates = coverage.lines.map((line) => ({
      ...line,
      availableQuantity: Number(line.remainingQuantity),
      availableAmount: Number(line.remainingAmount),
    }));
    const lines: InvoiceMatchLineInput[] = record.lines
      .map((invoiceLine) => {
        const formalAllocations = invoiceLine.allocations.filter(
          (allocation) =>
            allocation.sourceType === 'purchase_receipt' ||
            allocation.sourceType === 'sale_delivery',
        );
        let requiredQuantity = Math.max(
          0,
          Number(invoiceLine.quantity) -
            formalAllocations.reduce(
              (sum, allocation) => sum + Number(allocation.allocatedQuantity),
              0,
            ),
        );
        let requiredAmount = Math.max(
          0,
          Number(invoiceLine.totalAmount) -
            formalAllocations.reduce(
              (sum, allocation) => sum + Number(allocation.allocatedAmount),
              0,
            ),
        );
        const allocations: BusinessInvoiceLineAllocationInput[] = [];
        for (const candidate of candidates) {
          if (
            candidate.availableQuantity <= 0 ||
            (candidate.materialId &&
              invoiceLine.materialId &&
              candidate.materialId !== invoiceLine.materialId)
          ) {
            continue;
          }
          const quantity = Math.min(
            requiredQuantity,
            candidate.availableQuantity,
          );
          if (quantity <= 0.0001) continue;
          const proportionalAmount =
            requiredQuantity > 0
              ? (requiredAmount * quantity) / requiredQuantity
              : requiredAmount;
          const amount = Math.min(
            requiredAmount,
            candidate.availableAmount,
            proportionalAmount,
          );
          allocations.push({
            sourceId,
            sourceLineId: candidate.sourceLineId,
            sourceNo: coverage.sourceNo,
            allocatedQuantity: Number(quantity.toFixed(4)),
            allocatedAmount: Number(amount.toFixed(2)),
          });
          requiredQuantity -= quantity;
          requiredAmount -= amount;
          candidate.availableQuantity -= quantity;
          candidate.availableAmount -= amount;
        }
        return allocations.length
          ? { invoiceLineId: invoiceLine.id, allocations }
          : null;
      })
      .filter((line): line is InvoiceMatchLineInput => line !== null);

    if (!lines.length) {
      capabilities.notifyError('所选来源单没有可与当前发票物料匹配的剩余明细');
      return false;
    }
    await capabilities.matchInvoice({
      id: record.id,
      mode,
      sourceType,
      lines,
    });
    capabilities.notifySuccess('来源匹配成功');
    onOpenChange(false);
    await onSuccess();
    return true;
  };

  return (
    <DrawerForm<MatchFormValues>
      title={`匹配${isPurchase ? '采购入库单' : '销售出库单'}`}
      open={open}
      onOpenChange={(next) => {
        if (!next) setCoverage(undefined);
        onOpenChange(next);
      }}
      width={820}
      drawerProps={{ destroyOnHidden: true }}
      onFinish={submit}
    >
      <ProFormSelect
        name="sourceId"
        label={isPurchase ? '采购入库单' : '销售出库单'}
        showSearch
        debounceTime={300}
        request={async ({ keyWords }) => {
          const result = await capabilities.listSourceOptions({
            mode,
            keyword: typeof keyWords === 'string' ? keyWords : undefined,
            partnerId: record.partnerId,
            page: 1,
            pageSize: 50,
            status: isPurchase ? 'received' : 'delivered',
          });
          return result.map((item) => ({
            label: `${item.documentNo} - ${item.partnerName ?? ''}`,
            value: item.id,
          }));
        }}
        fieldProps={{
          filterOption: false,
          onChange: (value) =>
            void loadCoverage(typeof value === 'string' ? value : undefined),
        }}
        rules={[{ required: true }]}
      />
      <ProTable<InvoiceCoverageLine>
        rowKey="sourceLineId"
        search={false}
        options={false}
        pagination={false}
        dataSource={coverage?.lines ?? []}
        columns={[
          { title: '项目', dataIndex: 'itemName' },
          { title: '剩余数量', dataIndex: 'remainingQuantity' },
          { title: '剩余金额', dataIndex: 'remainingAmount' },
          {
            title: '状态',
            dataIndex: 'status',
            valueType: 'select',
            valueEnum: capabilities.coverageStatusLabels,
          },
        ]}
      />
    </DrawerForm>
  );
}
