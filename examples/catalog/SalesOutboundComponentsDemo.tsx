import { App, Button, Modal, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { ConvertToProductionDrawer } from '../../src/business/domains/sales/ConvertToProductionDrawer';
import { SaleDeliveryDocumentActionsDropdown } from '../../src/business/domains/sales/SaleDeliveryDocumentActionsDropdown';
import { SaleOrderShipActionModal } from '../../src/business/domains/sales/SaleOrderShipActionModal';
import type { ConvertToProductionDrawerProps } from '../../src/business/domains/manufacturing/convert-to-production-types';
import type {
  SaleOrderConvertInfoItem,
  SaleOrderProductionPreparation,
} from '../../src/business/domains/manufacturing/convert-to-production-types';
import type { SaleDeliveryDocumentActionsCapabilities } from '../../src/business/domains/sales/sale-delivery-document-actions-dropdown-types';
import type { SaleOrderShipActionCapabilities } from '../../src/business/domains/sales/sale-order-ship-action-types';

const demoOrder = { id: 'sale-order-demo-018', orderNo: 'SO-2026-018' };

const convertInfoRow: SaleOrderConvertInfoItem = {
  saleOrderItemId: 'sale-order-item-demo-1',
  saleOrderItemLineNo: 1,
  drawingCount: 2,
  materialId: 'material-demo-018',
  materialName: '精密铝合金支架',
  materialCode: 'AL-BR-018',
  materialUnit: '件',
  selectedBomHeaderId: 'bom-demo-v3',
  bomSourceType: 'standard_bom',
  deliveryDate: '2026-12-05',
  orderQty: 24,
  convertedRequiredQty: 4,
  deliveredQty: 0,
  remainingRequiredQty: 20,
  grossDemandQty: 20,
  currentStockQty: 6,
  safetyStockQty: 2,
  stockOffsetQty: 4,
  suggestedProductionQty: 16,
  source: 'stock_and_production',
  defaultLossRate: 5,
  suggestedPlannedQty: 16.8,
  defaultBomHeaderId: 'bom-demo-v3',
  defaultBomLabel: 'AL-BR-018 标准 BOM V3',
  defaultBomStatus: 'matched',
  defaultBomMessage: '已匹配当前有效标准 BOM',
  defaultRouteId: 'route-demo-v2',
  defaultRouteLabel: '铝合金支架加工路线',
  defaultRouteVersionLabel: 'V2',
  defaultRouteStatus: 'matched',
  defaultRouteMessage: '按计划开始日期匹配',
  compatibilityStatus: 'matched',
  warnings: ['建议复核库存抵扣数量'],
};

const preparation: SaleOrderProductionPreparation = {
  saleOrderId: demoOrder.id,
  conclusion: 'warning',
  drawing: { hasDrawing: true, orderAttachmentCount: 1, itemDrawingCount: 2 },
  bom: { totalCount: 1, activeConfirmedCount: 1 },
  route: { matchedCount: 1, missingCount: 0 },
  todo: { unfinishedCount: 2, overdueCount: 0 },
  warnings: ['有 2 项协同待办尚未完成'],
  blockers: [],
};

const approvalStatus = {
  status: 'none',
  totalSteps: 2,
  canRecall: false,
};

export function SalesOutboundComponentsDemo() {
  const { message } = App.useApp();
  const [shipOpen, setShipOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [lastAction, setLastAction] = useState('等待销售出库操作');

  const shipCapabilities = useMemo<SaleOrderShipActionCapabilities>(
    () => ({
      renderDeliveryEditor: ({ open, saleOrderId, onClose, onSuccess }) => (
        <Modal
          title={`销售出库单编辑 · ${saleOrderId ?? ''}`}
          open={open}
          onCancel={onClose}
          onOk={() => {
            setLastAction('销售订单出库编辑完成');
            onSuccess();
          }}
          destroyOnHidden
        >
          <Typography.Text>
            宿主在此渲染权威的销售出库单编辑器，页面及单据请求留在宿主应用。
          </Typography.Text>
        </Modal>
      ),
    }),
    [],
  );

  const deliveryActionCapabilities = useMemo<SaleDeliveryDocumentActionsCapabilities>(
    () => ({
      permissions: {
        loadApprovalStatus: true,
        edit: true,
        confirm: true,
        submitApproval: true,
        recallApproval: true,
        print: true,
        printRecords: true,
        cancel: true,
        reverse: true,
        createSaleReturn: true,
      },
      loadDetail: async (deliveryId) => ({
        id: deliveryId,
        deliveryNo: 'XSCK-DEMO-018',
        status: 'draft',
        availableActions: [
          'update',
          'confirm',
          'cancel',
          'reverse',
          'recall',
          'return',
        ],
        items: [{ unitPrice: 18.5 }],
      }),
      loadApprovalStatus: async () => approvalStatus,
      cancelDelivery: async () => setLastAction('销售出库单已取消'),
      confirmDelivery: async ({ skipCreditCheck }) =>
        setLastAction(
          skipCreditCheck
            ? '演示：跳过信用额度检查并确认出库'
            : '销售出库单已确认',
        ),
      reverseDelivery: async ({ reason }) =>
        setLastAction(`销售出库单已冲正：${reason}`),
      submitApproval: async () => setLastAction('销售出库审批已提交'),
      recallApproval: async () => setLastAction('销售出库审批已撤回'),
      createSaleReturnFromDelivery: async () => ({
        id: 'sale-return-demo-018',
      }),
      returnReasonOptions: [
        { label: '质量问题', value: 'quality_issue' },
        { label: '客户取消', value: 'customer_request' },
      ],
      returnReasonLoading: false,
      openPrint: ({ templateType }) =>
        setLastAction(
          templateType === 'continuous_fixed' ? '打开连续纸打印' : '打开送货单打印',
        ),
      openPrintRecords: ({ title }) => setLastAction(`打开${title}`),
      navigateToSaleReturn: (returnId) => setLastAction(`打开销售退货单 ${returnId}`),
      getErrorCode: () => undefined,
      getErrorMessage: (error, fallback = '操作失败') =>
        error instanceof Error ? error.message : fallback,
      notifySuccess: (text) => message.success(text),
      notifyError: (text) => message.error(text),
      notifyWarning: (text) => message.warning(text),
      messages: {
        createSuccess: '销售退货单已创建',
        confirmSuccess: '销售出库单已确认',
        submitApprovalSuccess: '审批已提交',
        recallApprovalSuccess: '审批已撤回',
        cancelSuccess: '销售出库单已取消',
        reverseSuccess: '销售出库单已冲正',
      },
    }),
    [message],
  );

  const convertCapabilities = useMemo<
    ConvertToProductionDrawerProps['capabilities']
  >(
    () => ({
      getConvertInfo: async () => ({
        items: [convertInfoRow],
        productionPreparation: preparation,
      }),
      batchConvert: async (input) => ({
        plans: input.items.map((item, index) => ({
          workOrderId: input.autoCreateWorkOrder
            ? `work-order-demo-${index + 1}`
            : undefined,
        })),
        warnings: ['目录演示：请复核生产配置提醒'],
        productionPreparation: preparation,
      }),
      requestBomOptions: async () => [
        { label: 'AL-BR-018 标准 BOM V3', value: 'bom-demo-v3' },
        { label: 'AL-BR-018 标准 BOM V2', value: 'bom-demo-v2' },
      ],
      requestRouteOptions: async () => [
        { label: '铝合金支架加工路线 V2', value: 'route-demo-v2' },
        { label: '铝合金支架加工路线 V1', value: 'route-demo-v1' },
      ],
      notify: {
        success: (text) => message.success(text),
        warning: (text) => message.warning(text),
        error: (text) => message.error(text),
      },
      messages: { convertSuccess: '转生产成功' },
      fieldHelp: {
        productionProps: (label) => ({ label }),
        productionLabel: (label) => label,
        automaticProps: (label) => ({ label }),
      },
    }),
    [message],
  );

  return (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <Typography.Paragraph type="secondary">
        示例展示销售订单出库入口、销售出库单生命周期菜单，以及带库存净额、生产 BOM、路线和生产准备信息的转生产抽屉。请求、权限、消息和页面导航均由宿主提供。
      </Typography.Paragraph>
      <Space wrap>
        <Button type="primary" onClick={() => setShipOpen(true)}>
          从订单编辑出库单
        </Button>
        <SaleDeliveryDocumentActionsDropdown
          deliveryId="sale-delivery-demo-018"
          deliveryNo="XSCK-DEMO-018"
          onActionSuccess={() => setLastAction('销售出库单动作已完成')}
          onEdit={(id) => setLastAction(`编辑销售出库单 ${id}`)}
          onOpenDetail={(id) => setLastAction(`查看销售出库单 ${id}`)}
          capabilities={deliveryActionCapabilities}
        />
        <Button onClick={() => setConvertOpen(true)}>转生产计划</Button>
      </Space>
      <Typography.Text role="status">{lastAction}</Typography.Text>
      <SaleOrderShipActionModal
        open={shipOpen}
        order={demoOrder}
        onClose={() => setShipOpen(false)}
        onSuccess={() => {
          setShipOpen(false);
          setLastAction('销售出库单已保存');
        }}
        capabilities={shipCapabilities}
      />
      <ConvertToProductionDrawer
        open={convertOpen}
        order={demoOrder}
        onOpenChange={setConvertOpen}
        onSuccess={() => {
          setConvertOpen(false);
          setLastAction('生产计划已创建');
        }}
        capabilities={convertCapabilities}
      />
    </Space>
  );
}
