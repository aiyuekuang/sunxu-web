import type { ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { ResizableProTable as ProTable } from '../shared/ResizableTable';
import type {
  PurchaseReceiptSourcePickerCapabilities,
  PurchaseReceiptSourcePickerProps,
  PurchaseReceiptSourceRow,
} from './purchase-receipt-source-picker-types';

/**
 * @sunxu-layer business
 * @sunxu-domain procurement purchasing and receipt source selection
 * @sunxu-reason Preserves the supplier-scoped pending-receipt picker and selection flow while the host supplies the API, pending-order policy, quantity/unit dictionaries, and warnings.
 *
 * Lets a purchase receipt select one or more pending purchase-order lines from
 * the current supplier and keeps the draft/source-change rules with its host.
 */
export function PurchaseReceiptSourcePicker({
  supplierId,
  selectedOrderNo,
  sourceOrderNos = [],
  disabled = false,
  canChangeSource = false,
  onChangeSource,
  onSelectItems,
  capabilities,
}: PurchaseReceiptSourcePickerProps) {
  const [open, setOpen] = useState(false);
  const [isPreviewingSelection, setIsPreviewingSelection] = useState(false);
  const [isChangingSource, setIsChangingSource] = useState(false);
  const [selectedSourceItemIds, setSelectedSourceItemIds] = useState<string[]>(
    [],
  );
  const [selectedSourceSupplierId, setSelectedSourceSupplierId] = useState<
    string | undefined
  >(undefined);
  const normalizedSourceOrderNos = useMemo(
    () =>
      [...new Set([...sourceOrderNos, selectedOrderNo].filter(Boolean))] as string[],
    [selectedOrderNo, sourceOrderNos],
  );
  const hasSelectedSource = normalizedSourceOrderNos.length > 0;
  const showSourceSummary = hasSelectedSource && disabled;
  const canRenderChangeSource = Boolean(
    hasSelectedSource && canChangeSource && onChangeSource,
  );
  const sourceSelectionDisabled = disabled || !supplierId;
  const sourceSummary = normalizedSourceOrderNos.join('、');

  const clearSelection = () => {
    setSelectedSourceItemIds([]);
    setSelectedSourceSupplierId(undefined);
  };

  const selectSourceItems = async (): Promise<void> => {
    if (selectedSourceItemIds.length === 0 || isPreviewingSelection) return;
    if (selectedSourceItemIds.length > capabilities.maxSelectionCount) {
      capabilities.warnTooManySelected(
        selectedSourceItemIds.length,
        capabilities.maxSelectionCount,
      );
      return;
    }
    setIsPreviewingSelection(true);
    try {
      await onSelectItems(selectedSourceItemIds);
      setOpen(false);
      clearSelection();
    } catch {
      // The host owns request error reporting; keep the user's selection intact.
    } finally {
      setIsPreviewingSelection(false);
    }
  };

  const changeSource = async (): Promise<void> => {
    if (!onChangeSource || isChangingSource) return;
    setIsChangingSource(true);
    try {
      const sourceChanged = await onChangeSource();
      if (sourceChanged) {
        clearSelection();
        setOpen(true);
      }
    } catch {
      // The host owns request error reporting; keep the current source intact.
    } finally {
      setIsChangingSource(false);
    }
  };

  const columns = useMemo<ProColumns<PurchaseReceiptSourceRow>[]>(
    () => [
      {
        title: '订单或物料',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '输入采购订单号、物料编码或名称搜索' },
      },
      {
        title: '物料名称',
        dataIndex: ['material', 'name'],
        width: 180,
        ellipsis: true,
        search: false,
      },
      {
        title: '物料编码',
        dataIndex: ['material', 'code'],
        width: 140,
        ellipsis: true,
        search: false,
      },
      {
        title: '规格型号',
        dataIndex: ['material', 'spec'],
        width: 140,
        ellipsis: true,
        search: false,
      },
      {
        title: '单位',
        dataIndex: 'baseUnit',
        width: 88,
        search: false,
        render: (_, record) => capabilities.formatUnit(record.baseUnit) || '-',
      },
      {
        title: '订购数量',
        dataIndex: 'orderedQty',
        width: 112,
        align: 'right',
        search: false,
        render: (_, record) => capabilities.formatQuantity(record.orderedQty),
      },
      {
        title: '已收数量',
        dataIndex: 'receivedQty',
        width: 112,
        align: 'right',
        search: false,
        render: (_, record) => capabilities.formatQuantity(record.receivedQty),
      },
      {
        title: '待处理占用',
        dataIndex: 'reservedReceiptQty',
        width: 120,
        align: 'right',
        search: false,
        render: (_, record) =>
          capabilities.formatQuantity(record.reservedReceiptQty),
      },
      {
        title: '建议可收数量',
        dataIndex: 'receivableQty',
        width: 112,
        align: 'right',
        search: false,
        render: (_, record) => capabilities.formatQuantity(record.receivableQty),
      },
      {
        title: '最大可收数量',
        dataIndex: 'remainingReceiptCapacityQty',
        width: 128,
        align: 'right',
        search: false,
        render: (_, record) =>
          capabilities.formatQuantity(record.remainingReceiptCapacityQty),
      },
      {
        title: '采购订单',
        dataIndex: 'orderNo',
        width: 150,
        search: false,
        ellipsis: true,
      },
      {
        title: '供应商',
        dataIndex: 'supplierName',
        width: 160,
        search: false,
        ellipsis: true,
      },
      {
        title: '交货日期',
        dataIndex: 'effectiveDeliveryDate',
        valueType: 'date',
        width: 120,
        search: false,
      },
    ],
    [capabilities],
  );

  return (
    <>
      <Space orientation="vertical" size={4}>
        <Space.Compact>
          <Button
            disabled={sourceSelectionDisabled}
            onClick={() => setOpen(true)}
            title={
              showSourceSummary
                ? sourceSummary
                : !supplierId
                  ? '请先选择供应商'
                  : undefined
            }
          >
            {showSourceSummary
              ? `采购订单来源（${normalizedSourceOrderNos.length} 张）`
              : selectedOrderNo
                ? `采购订单 ${selectedOrderNo}`
                : '选择本供应商待收订单'}
          </Button>
          {canRenderChangeSource ? (
            <Button
              disabled={isPreviewingSelection}
              loading={isChangingSource}
              onClick={() => void changeSource()}
            >
              更换来源
            </Button>
          ) : null}
        </Space.Compact>
        {showSourceSummary ? (
          <Typography.Text
            type="secondary"
            ellipsis={{ tooltip: `订单摘要：${sourceSummary}` }}
            style={{ display: 'block', maxWidth: 420 }}
          >
            订单摘要：{sourceSummary}
          </Typography.Text>
        ) : null}
      </Space>
      <Modal
        title="选择本供应商待收采购订单"
        open={open}
        width={1280}
        footer={
          <Space>
            <Button
              disabled={isPreviewingSelection}
              onClick={() => {
                if (isPreviewingSelection) return;
                setOpen(false);
                clearSelection();
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              disabled={
                selectedSourceItemIds.length === 0 || isPreviewingSelection
              }
              loading={isPreviewingSelection}
              onClick={() => void selectSourceItems()}
            >
              确定（{selectedSourceItemIds.length}）
            </Button>
          </Space>
        }
        destroyOnHidden
        closable={!isPreviewingSelection}
        keyboard={!isPreviewingSelection}
        mask={{ closable: !isPreviewingSelection }}
        onCancel={() => {
          if (isPreviewingSelection) return;
          setOpen(false);
          clearSelection();
        }}
      >
        {selectedSourceSupplierId ? (
          <Typography.Text type="secondary">
            本次采购收货只能合并同一供应商的明细
          </Typography.Text>
        ) : null}
        <ProTable<PurchaseReceiptSourceRow>
          rowKey="id"
          columns={columns}
          request={(params) =>
            capabilities.requestRows({
              current: params.current ?? 1,
              pageSize: params.pageSize ?? 20,
              keyword:
                typeof params.keyword === 'string' ? params.keyword : undefined,
              supplierId,
            })
          }
          pagination={capabilities.pagination}
          fitContainerHeight={false}
          options={false}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 1650 }}
          locale={{ emptyText: '没有待收的采购订单明细' }}
          rowSelection={{
            selectedRowKeys: selectedSourceItemIds,
            preserveSelectedRowKeys: true,
            onChange: (keys, selectedRows) => {
              setSelectedSourceItemIds(keys.map(String));
              setSelectedSourceSupplierId(
                selectedRows.find((record) => Boolean(record.supplierId))
                  ?.supplierId ?? undefined,
              );
            },
            getCheckboxProps: (record) => {
              const blockReason = capabilities.getSelectionBlockReason(
                record,
                selectedSourceSupplierId ?? supplierId,
              );
              return {
                disabled: Boolean(blockReason),
                name: record.orderNo ?? undefined,
                title: blockReason,
              };
            },
          }}
          tableAlertOptionRender={({ onCleanSelected }) => (
            <Button
              type="link"
              disabled={isPreviewingSelection}
              onClick={() => {
                clearSelection();
                onCleanSelected?.();
              }}
            >
              清空
            </Button>
          )}
        />
      </Modal>
    </>
  );
}
