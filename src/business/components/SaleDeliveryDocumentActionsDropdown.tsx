import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  MoreOutlined,
  PrinterOutlined,
  RollbackOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Input, Modal, Select } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  SaleDeliveryAction,
  SaleDeliveryActionDetail,
  SaleDeliveryApprovalStatus,
  SaleDeliveryDocumentActionsDropdownProps,
} from './sale-delivery-document-actions-dropdown-types';

const CREDIT_OVERRIDE_CANCELLED = 'sale_delivery_credit_override_cancelled';

/** @sunxu-layer business @sunxu-domain sales-delivery-actions @sunxu-reason Preserves the action menu, permission and available-action filtering, approval lifecycle, credit override, print entries, cancel/reverse confirmations and return flow while the host supplies all APIs, permission results, navigation, dictionaries and side effects. */
export function SaleDeliveryDocumentActionsDropdown({
  deliveryId,
  deliveryNo,
  hideDetailAction = false,
  onActionSuccess,
  onEdit,
  onOpenDetail,
  capabilities,
}: SaleDeliveryDocumentActionsDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [order, setOrder] = useState<SaleDeliveryActionDetail | null>(null);
  const [approvalStatus, setApprovalStatus] =
    useState<SaleDeliveryApprovalStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReasonCode, setReturnReasonCode] = useState('');
  const detailRequestSequence = useRef(0);

  const loadDetail = useCallback(async () => {
    const requestId = ++detailRequestSequence.current;
    setLoading(true);
    try {
      const [detail, nextApprovalStatus] = await Promise.all([
        capabilities.loadDetail(deliveryId),
        capabilities.permissions.loadApprovalStatus
          ? capabilities.loadApprovalStatus(deliveryId)
          : Promise.resolve(null),
      ]);
      if (requestId !== detailRequestSequence.current) return;
      setOrder(detail ?? null);
      setApprovalStatus(nextApprovalStatus);
    } finally {
      if (requestId === detailRequestSequence.current) setLoading(false);
    }
  }, [capabilities, deliveryId]);

  useEffect(() => {
    detailRequestSequence.current += 1;
    setMenuOpen(false);
    setOrder(null);
    setApprovalStatus(null);
  }, [deliveryId]);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      if (actionLoading) return;
      setActionLoading(true);
      try {
        await action();
        capabilities.notifySuccess(successMessage);
        await loadDetail();
        onActionSuccess?.();
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === CREDIT_OVERRIDE_CANCELLED
        ) {
          return;
        }
        capabilities.notifyError(capabilities.getErrorMessage(error));
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, capabilities, loadDetail, onActionSuccess],
  );

  const createSaleReturn = useCallback(async () => {
    if (!order || actionLoading) return;
    if (!returnReasonCode) {
      capabilities.notifyWarning('请选择退货原因');
      return;
    }
    setActionLoading(true);
    try {
      const returnOrder = await capabilities.createSaleReturnFromDelivery({
        sourceDeliveryId: order.id,
        reasonCode: returnReasonCode,
      });
      capabilities.notifySuccess(capabilities.messages.createSuccess);
      setReturnModalOpen(false);
      setReturnReasonCode('');
      onActionSuccess?.();
      if (returnOrder?.id) capabilities.navigateToSaleReturn(returnOrder.id);
    } catch (error: unknown) {
      capabilities.notifyError(capabilities.getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }, [
    actionLoading,
    capabilities,
    onActionSuccess,
    order,
    returnReasonCode,
  ]);

  const confirmWithCreditOverride = useCallback(
    async (id: string) => {
      try {
        await capabilities.confirmDelivery({ id });
      } catch (error: unknown) {
        if (capabilities.getErrorCode(error) !== 4001) throw error;
        await new Promise<void>((resolve, reject) => {
          Modal.confirm({
            title: '客户信用额度超限',
            content: capabilities.getErrorMessage(error, '客户信用额度超限'),
            okText: '继续确认出库',
            cancelText: '返回修改',
            onOk: async () => {
              try {
                await capabilities.confirmDelivery({
                  id,
                  skipCreditCheck: true,
                });
                resolve();
              } catch (retryError: unknown) {
                capabilities.notifyError(
                  capabilities.getErrorMessage(retryError),
                );
                reject(retryError);
              }
            },
            onCancel: () => reject(new Error(CREDIT_OVERRIDE_CANCELLED)),
          });
        });
      }
    },
    [capabilities],
  );

  const availableActions = order?.availableActions ?? [];
  const canUpdate = availableActions.includes('update');
  const canConfirm = availableActions.includes('confirm');
  const canCancel = availableActions.includes('cancel');
  const canReverse = availableActions.includes('reverse');
  const canSubmitApproval = Boolean(
    order?.status === 'draft' &&
      approvalStatus?.status === 'none' &&
      approvalStatus.totalSteps > 0 &&
      capabilities.permissions.submitApproval,
  );
  const canRecallApproval = Boolean(
    availableActions.includes('recall') &&
      approvalStatus?.status === 'pending_approval' &&
      approvalStatus.canRecall &&
      capabilities.permissions.recallApproval,
  );
  const canCreateSaleReturn = Boolean(
    order?.availableActions?.includes('return') === true &&
      capabilities.permissions.createSaleReturn,
  );

  const menuItems = useMemo<MenuProps['items']>(() => {
    if (loading || !order) {
      return [
        {
          key: 'loading',
          label: '正在加载可用操作…',
          disabled: true,
        },
      ];
    }

    return [
      hideDetailAction
        ? null
        : { key: 'detail', label: '单据详情', icon: <FileSearchOutlined /> },
      canUpdate && capabilities.permissions.edit
        ? { key: 'edit', label: '编辑' }
        : null,
      canConfirm && capabilities.permissions.confirm
        ? { key: 'confirm', label: '确认出库', icon: <CheckCircleOutlined /> }
        : null,
      canSubmitApproval ? { key: 'submitApproval', label: '提交审批' } : null,
      canRecallApproval ? { key: 'recallApproval', label: '撤回审批' } : null,
      capabilities.permissions.print ? { type: 'divider' } : null,
      capabilities.permissions.print
        ? { key: 'print', label: '打印', icon: <PrinterOutlined /> }
        : null,
      capabilities.permissions.print
        ? {
            key: 'printContinuous',
            label: '连续纸打印',
            icon: <PrinterOutlined />,
          }
        : null,
      capabilities.permissions.printRecords
        ? { key: 'printRecords', label: '打印记录', icon: <HistoryOutlined /> }
        : null,
      canCancel && capabilities.permissions.cancel
        ? { type: 'divider' }
        : null,
      canCancel && capabilities.permissions.cancel
        ? {
            key: 'cancel',
            label: '取消',
            icon: <CloseCircleOutlined />,
            danger: true,
          }
        : null,
      canReverse && capabilities.permissions.reverse
        ? {
            key: 'reverse',
            label: '冲正',
            icon: <RollbackOutlined />,
            danger: true,
          }
        : null,
      canCreateSaleReturn
        ? { key: 'return', label: '发起销售退货', icon: <UndoOutlined /> }
        : null,
    ].filter(Boolean) as MenuProps['items'];
  }, [
    canCancel,
    canConfirm,
    canCreateSaleReturn,
    canRecallApproval,
    canReverse,
    canSubmitApproval,
    canUpdate,
    capabilities.permissions,
    hideDetailAction,
    loading,
    order,
  ]);

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      const action = key as SaleDeliveryAction;
      if (action === 'loading') return;
      setMenuOpen(false);

      if (action === 'detail') {
        onOpenDetail(deliveryId);
        return;
      }
      if (action === 'edit') {
        onEdit(deliveryId);
        return;
      }
      if (action === 'print') {
        capabilities.openPrint({
          businessType: 'sale_delivery',
          businessId: deliveryId,
          templateType: 'document_flow',
        });
        return;
      }
      if (action === 'printContinuous') {
        capabilities.openPrint({
          businessType: 'sale_delivery',
          businessId: deliveryId,
          templateType: 'continuous_fixed',
        });
        return;
      }
      if (action === 'printRecords') {
        void capabilities.openPrintRecords({
          businessType: 'sale_delivery',
          businessId: deliveryId,
          title: `送货单 ${order?.deliveryNo ?? deliveryNo ?? ''} 的打印记录`,
        });
        return;
      }
      if (!order) return;

      if (action === 'confirm') {
        const unpricedCount = (order.items ?? []).filter(
          (item) => item.unitPrice == null || Number(item.unitPrice) <= 0,
        ).length;
        Modal.confirm({
          title: '确认销售出库？',
          content:
            unpricedCount > 0
              ? `本单存在 ${unpricedCount} 行未定价明细（单价为空或为 0）。确认后将扣减库存并冻结价格快照，该部分货品不会自动生成应收；请确认是否继续？`
              : '确认前请核对实发数量、仓库/批号和每行价格；确认后将扣减库存并冻结价格快照。',
          okText: '确认出库',
          onOk: () =>
            runAction(
              () => confirmWithCreditOverride(order.id),
              capabilities.messages.confirmSuccess,
            ),
        });
      }
      if (action === 'submitApproval') {
        Modal.confirm({
          title: '提交审批？',
          content: '提交后将进入审批流程，审批通过后才能确认出库。',
          okText: '提交审批',
          onOk: () =>
            runAction(
              () => capabilities.submitApproval({ id: order.id }),
              capabilities.messages.submitApprovalSuccess,
            ),
        });
      }
      if (action === 'recallApproval') {
        Modal.confirm({
          title: '撤回审批？',
          content: '撤回后单据会退出审批流程并恢复为可编辑状态。',
          okText: '撤回审批',
          onOk: () =>
            runAction(
              () => capabilities.recallApproval({ id: order.id }),
              capabilities.messages.recallApprovalSuccess,
            ),
        });
      }
      if (action === 'cancel') {
        Modal.confirm({
          title: '确认取消该销售出库单？',
          okText: '确认取消',
          okButtonProps: { danger: true },
          onOk: () =>
            runAction(
              () => capabilities.cancelDelivery({ id: order.id }),
              capabilities.messages.cancelSuccess,
            ),
        });
      }
      if (action === 'reverse') {
        let reason = '';
        Modal.confirm({
          title: '确认冲正？',
          content: (
            <>
              <p>
                冲正后库存将回滚，关联销售订单状态也会更新。此操作不可撤销。
              </p>
              <Input.TextArea
                rows={3}
                maxLength={500}
                placeholder="请输入冲正原因"
                onChange={(event) => {
                  reason = event.target.value;
                }}
              />
            </>
          ),
          okText: '确认冲正',
          okButtonProps: { danger: true },
          onOk: () => {
            const normalizedReason = reason.trim();
            if (!normalizedReason) {
              capabilities.notifyWarning('请输入冲正原因');
              return Promise.reject(new Error('冲正原因不能为空'));
            }
            return runAction(
              () =>
                capabilities.reverseDelivery({
                  id: order.id,
                  reason: normalizedReason,
                }),
              capabilities.messages.reverseSuccess,
            );
          },
        });
      }
      if (action === 'return') {
        setReturnReasonCode('');
        setReturnModalOpen(true);
      }
    },
    [
      capabilities,
      confirmWithCreditOverride,
      deliveryId,
      deliveryNo,
      onEdit,
      onOpenDetail,
      order,
      runAction,
    ],
  );

  return (
    <>
      <Dropdown
        trigger={['click']}
        open={menuOpen}
        menu={{ items: menuItems, onClick: handleMenuClick }}
        onOpenChange={(nextOpen) => {
          setMenuOpen(nextOpen);
          if (nextOpen) void loadDetail();
        }}
      >
        <Button
          type="text"
          size="small"
          aria-label={`更多操作 ${deliveryNo ?? ''}`}
          title="更多操作"
          icon={<MoreOutlined />}
          loading={loading || actionLoading}
          onClick={(event) => event.stopPropagation()}
        />
      </Dropdown>

      <Modal
        title="发起销售退货"
        open={returnModalOpen}
        onCancel={() => setReturnModalOpen(false)}
        okText="发起退货"
        cancelText="取消"
        confirmLoading={actionLoading}
        okButtonProps={{ disabled: !returnReasonCode }}
        onOk={createSaleReturn}
        destroyOnHidden
      >
        <p>将按当前销售出库单的可退数量生成销售退货草稿。</p>
        <Select
          aria-label="退货原因"
          style={{ width: '100%' }}
          placeholder="请选择退货原因"
          value={returnReasonCode || undefined}
          options={[...capabilities.returnReasonOptions]}
          loading={capabilities.returnReasonLoading}
          onChange={setReturnReasonCode}
          showSearch
          optionFilterProp="label"
        />
      </Modal>
      {capabilities.printJobActionNode}
    </>
  );
}
