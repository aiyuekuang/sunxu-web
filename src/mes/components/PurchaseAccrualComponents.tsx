import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ResizableProTable as ProTable,
  ResizableTable as Table,
} from './ResizableTable';
import { StatusDisplay } from './StatusDisplay';
import type {
  PurchaseAccrualDetailDrawerProps,
  PurchaseAccrualPreviewDrawerProps,
  PurchaseAccrualPreviewLine,
  PurchaseAccrualRunLine,
} from './purchase-accrual-components-types';

function formatMoney(value: number | undefined | null): string {
  return Number(value ?? 0).toFixed(2);
}

function formatQuantity(value: number | undefined | null): string {
  return Number(value ?? 0).toFixed(4);
}

function PurchaseReceiptLink({
  documentId,
  documentNo,
  canView,
  onOpen,
}: {
  documentId?: string | null;
  documentNo: string;
  canView: boolean;
  onOpen: (documentId: string) => void;
}) {
  if (!documentId || !canView) return documentNo;
  return (
    <Button
      type="link"
      style={{ paddingInline: 0 }}
      onClick={() => onOpen(documentId)}
    >
      {documentNo}
    </Button>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain accounting purchase accrual detail
 * @sunxu-reason Preserves batch metadata, source-receipt drilldown, line settlement status, totals, and confirmed-run reversal while the MES host supplies permission, navigation, accounting services, and messages.
 *
 * Shows a confirmed purchase-accrual run and its receipt-line settlement
 * progress, with a reversible action only when the host grants permission.
 */
export function PurchaseAccrualDetailDrawer({
  detail,
  onClose,
  onReversed,
  capabilities,
}: PurchaseAccrualDetailDrawerProps) {
  return (
    <Drawer
      size="88vw"
      title={`采购暂估批次 ${detail?.run.runNo ?? ''}`}
      open={Boolean(detail)}
      onClose={onClose}
      extra={
        detail?.run.status === 'confirmed' && capabilities.canReverse ? (
          <ModalForm<{ reason?: string }>
            title="冲销采购暂估批次"
            trigger={<Button danger>整批冲销</Button>}
            onFinish={async (values) => {
              const reversed = await capabilities.reverseRun({
                id: detail.run.id,
                reason: values.reason,
              });
              capabilities.notifySuccess('暂估批次已冲销并生成反向会计来源');
              onReversed(reversed);
              return true;
            }}
          >
            <Alert
              type="warning"
              showIcon
              message="已有来票清算的批次不能整批冲销"
              style={{ marginBottom: 16 }}
            />
            <ProFormTextArea
              name="reason"
              label="冲销原因"
              rules={[{ required: true }]}
            />
          </ModalForm>
        ) : undefined
      }
    >
      {detail ? (
        <>
          <Descriptions
            bordered
            size="small"
            column={4}
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="账簿">
              {detail.run.accountingBookCode}
            </Descriptions.Item>
            <Descriptions.Item label="期间">
              {detail.run.fiscalPeriod}
            </Descriptions.Item>
            <Descriptions.Item label="截止日期">
              {detail.run.cutoffDate}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusDisplay
                enumMap={capabilities.statusEnum}
                value={detail.run.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="暂估金额">
              {formatMoney(detail.run.totalAccrualAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="来源行">
              {detail.run.lineCount}
            </Descriptions.Item>
          </Descriptions>
          <Table<PurchaseAccrualRunLine>
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 1650, y: 'calc(100vh - 300px)' }}
            dataSource={detail.lines}
            columns={[
              {
                title: '采购入库单',
                dataIndex: 'sourceDocumentNo',
                width: 160,
                render: (_, row) => (
                  <PurchaseReceiptLink
                    documentId={row.sourceDocumentId}
                    documentNo={row.sourceDocumentNo}
                    canView={capabilities.canViewPurchaseReceipt}
                    onOpen={capabilities.onOpenPurchaseReceipt}
                  />
                ),
              },
              { title: '物料名称', dataIndex: 'materialName', width: 180 },
              { title: '物料编码', dataIndex: 'materialCode', width: 130 },
              { title: '供应商', dataIndex: 'supplierName', width: 180 },
              {
                title: '暂估数量',
                dataIndex: 'accrualQuantity',
                width: 120,
                align: 'right',
                render: (_, row) => formatQuantity(row.accrualQuantity),
              },
              {
                title: '暂估金额',
                dataIndex: 'accrualAmount',
                width: 120,
                align: 'right',
                render: (_, row) => formatMoney(row.accrualAmount),
              },
              {
                title: '已清数量',
                dataIndex: 'clearedQuantity',
                width: 120,
                align: 'right',
                render: (_, row) => formatQuantity(row.clearedQuantity),
              },
              {
                title: '已清金额',
                dataIndex: 'clearedAmount',
                width: 120,
                align: 'right',
                render: (_, row) => formatMoney(row.clearedAmount),
              },
              {
                title: '未清数量',
                dataIndex: 'remainingQuantity',
                width: 120,
                align: 'right',
                render: (_, row) => formatQuantity(row.remainingQuantity),
              },
              {
                title: '未清金额',
                dataIndex: 'remainingAmount',
                width: 120,
                align: 'right',
                render: (_, row) => formatMoney(row.remainingAmount),
              },
              {
                title: '清算状态',
                dataIndex: 'status',
                width: 110,
                render: (_, row) => (
                  <StatusDisplay
                    enumMap={capabilities.lineStatusEnum}
                    value={row.status}
                  />
                ),
              },
            ]}
            summary={(rows) => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <strong>合计</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {formatMoney(
                    rows.reduce((sum, row) => sum + row.accrualAmount, 0),
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>—</Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  {formatMoney(
                    rows.reduce((sum, row) => sum + row.clearedAmount, 0),
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>—</Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  {formatMoney(
                    rows.reduce((sum, row) => sum + row.remainingAmount, 0),
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10}>—</Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </>
      ) : null}
    </Drawer>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain accounting purchase accrual preview
 * @sunxu-reason Preserves selectable eligible receipt lines, blocked issue rows, selected total, source-receipt drilldown, fixed summary, and confirmation safeguards while the host owns confirmation and routing.
 *
 * Reviews a purchase-accrual preview before the host confirms the selected
 * source rows into a draft voucher.
 */
export function PurchaseAccrualPreviewDrawer({
  preview,
  selectedLineIds,
  confirming,
  canViewPurchaseReceipt,
  onSelectedLineIdsChange,
  onOpenPurchaseReceipt,
  onClose,
  onConfirm,
}: PurchaseAccrualPreviewDrawerProps) {
  const selectedLineIdSet = new Set(selectedLineIds.map(String));
  const selectedAmount = (preview?.result.lines ?? [])
    .filter((line) => selectedLineIdSet.has(line.sourceLineId))
    .reduce((sum, line) => sum + line.accrualAmount, 0);
  const columns: ProColumns<PurchaseAccrualPreviewLine>[] = [
    {
      title: '采购入库单',
      dataIndex: 'sourceDocumentNo',
      width: 160,
      render: (_, row) => (
        <PurchaseReceiptLink
          documentId={row.sourceDocumentId}
          documentNo={row.sourceDocumentNo}
          canView={canViewPurchaseReceipt}
          onOpen={onOpenPurchaseReceipt}
        />
      ),
    },
    { title: '入库日期', dataIndex: 'receiptDate', width: 110 },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 180,
      ellipsis: true,
    },
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      width: 170,
      ellipsis: true,
    },
    {
      title: '入库数量',
      dataIndex: 'receiptQuantity',
      width: 110,
      align: 'right',
      render: (_, row) => formatQuantity(row.receiptQuantity),
    },
    {
      title: '已退数量',
      dataIndex: 'returnedQuantity',
      width: 110,
      align: 'right',
      render: (_, row) => formatQuantity(row.returnedQuantity),
    },
    {
      title: '已开票数量',
      dataIndex: 'invoicedQuantity',
      width: 120,
      align: 'right',
      render: (_, row) => formatQuantity(row.invoicedQuantity),
    },
    {
      title: '历史未清暂估',
      dataIndex: 'existingAccrualQuantity',
      width: 130,
      align: 'right',
      render: (_, row) => formatQuantity(row.existingAccrualQuantity),
    },
    {
      title: '本次暂估数量',
      dataIndex: 'accrualQuantity',
      width: 130,
      align: 'right',
      render: (_, row) => formatQuantity(row.accrualQuantity),
    },
    {
      title: '本次暂估金额',
      dataIndex: 'accrualAmount',
      width: 140,
      align: 'right',
      render: (_, row) => formatMoney(row.accrualAmount),
    },
    {
      title: '问题',
      dataIndex: 'issue',
      width: 260,
      render: (_, row) =>
        row.issue ? <Tag color="red">{row.issue}</Tag> : '—',
    },
  ];

  return (
    <Drawer
      size="92vw"
      title={`采购暂估预览 ${preview?.fiscalPeriod ?? ''}`}
      open={Boolean(preview)}
      closable={!confirming}
      keyboard={!confirming}
      mask={{ closable: !confirming }}
      onClose={() => {
        if (!confirming) onClose();
      }}
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography.Text type="secondary">
            已选 {selectedLineIds.length} 行，金额 {formatMoney(selectedAmount)}
          </Typography.Text>
          <Space>
            <Button disabled={confirming} onClick={onClose}>
              取消
            </Button>
            <Popconfirm
              title="确认后将冻结来源快照并生成凭证草稿，是否继续？"
              onConfirm={onConfirm}
            >
              <Button
                type="primary"
                loading={confirming}
                disabled={selectedLineIds.length === 0}
              >
                确认暂估
              </Button>
            </Popconfirm>
          </Space>
        </div>
      }
    >
      <Alert
        showIcon
        type={preview?.result.issueLineCount ? 'warning' : 'success'}
        message={`可暂估 ${preview?.result.eligibleLineCount ?? 0} 行；问题 ${preview?.result.issueLineCount ?? 0} 行`}
        description="问题行默认不选中。会计可排除本期不处理的正常行，但不能强行确认缺少可靠估值依据的行。"
        style={{ marginBottom: 16 }}
      />
      <ProTable<PurchaseAccrualPreviewLine>
        rowKey="sourceLineId"
        search={false}
        options={false}
        pagination={false}
        columns={columns}
        dataSource={preview?.result.lines ?? []}
        scroll={{ x: 1850, y: 'calc(100vh - 330px)' }}
        rowSelection={{
          selectedRowKeys: selectedLineIds,
          getCheckboxProps: (line) => ({ disabled: Boolean(line.issue) }),
          onChange: onSelectedLineIdsChange,
        }}
        summary={(rows) => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={10}>
                <strong>合计</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} align="right">
                <strong>
                  {formatMoney(
                    rows.reduce((sum, row) => sum + row.accrualAmount, 0),
                  )}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={11}>—</Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Drawer>
  );
}
