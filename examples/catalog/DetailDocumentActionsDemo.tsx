import { useMemo, useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DetailDocumentActions,
  DetailLedgerDocumentActions,
  BusinessUiProvider,
  type DocumentActionDefinition,
  type DocumentActionState,
} from '../../src/business';

type DemoDocument = DocumentActionState & { documentNo: string };

const demoDocument: DemoDocument = {
  id: 'purchase-order-demo',
  documentNo: 'PO-2026-018',
  availableActions: ['update', 'submit', 'cancel'],
};

const demoActions: readonly DocumentActionDefinition<DemoDocument>[] = [
  { key: 'detail', label: '查看详情' },
  {
    key: 'edit',
    label: '编辑',
    permission: 'purchase:order:update',
    requiredAvailableAction: 'update',
  },
  {
    key: 'submit',
    label: (document) => `提交 ${document.documentNo}`,
    permission: 'purchase:order:submit',
    requiredAvailableAction: 'submit',
  },
  {
    key: 'cancel',
    label: '撤销',
    permission: 'purchase:order:cancel',
    requiredAvailableAction: 'cancel',
    danger: true,
  },
];

export function DetailDocumentActionsDemo() {
  const [lastAction, setLastAction] = useState('尚未触发操作');
  const navigation = useMemo(
    () => ({ push: (path: string) => setLastAction(`宿主路由跳转：${path}`) }),
    [],
  );

  return (
    <SectionCard title="详情页与台账单据动作">
      <Typography.Paragraph type="secondary">
        详情动作按服务端可用动作与宿主权限共同筛选；高频操作显示完整名称，低频操作放入“更多操作”。台账菜单按需加载权威单据后由宿主处理跳转。
      </Typography.Paragraph>
      <BusinessUiProvider
        hasPermission={() => true}
        documentNavigation={navigation}
      >
        <Space wrap>
          <DetailDocumentActions
            document={demoDocument}
            actions={demoActions}
            directActionKeys={['detail', 'edit']}
            primaryActionKeys={['edit']}
            onAction={(key, document) =>
              setLastAction(`${key}：${document.documentNo}`)
            }
          />
          <DetailLedgerDocumentActions
            documentId={demoDocument.id}
            documentNo={demoDocument.documentNo}
            documentPath="/purchase/orders/purchase-order-demo"
            actions={demoActions}
            actionIntentKeys={['edit']}
            actionHandlers={{
              submit: (document) =>
                setLastAction(`台账直接提交：${document.documentNo}`),
            }}
            loadDocument={async () => demoDocument}
          />
        </Space>
      </BusinessUiProvider>
      <Typography.Text type="secondary" aria-live="polite">
        {lastAction}
      </Typography.Text>
    </SectionCard>
  );
}
