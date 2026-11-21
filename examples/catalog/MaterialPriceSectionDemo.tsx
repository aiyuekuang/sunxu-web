import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { MaterialPriceSection } from '../../src/mes';

export function MaterialPriceSectionDemo() {
  const [canEdit, setCanEdit] = useState(true);
  const [canViewBounds, setCanViewBounds] = useState(true);
  const [lastAction, setLastAction] = useState('尚未保存或导航');

  return (
    <SectionCard title="物料参考价格与价格控制">
      <Typography.Paragraph type="secondary">
        参考进价/售价维护、价格边界只读展示与价格管理跳转；权限、更新服务和路由由 MES 宿主注入。
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button onClick={() => setCanEdit((value) => !value)}>
          {canEdit ? '关闭编辑权限' : '开启编辑权限'}
        </Button>
        <Button onClick={() => setCanViewBounds((value) => !value)}>
          {canViewBounds ? '隐藏价格边界' : '显示价格边界'}
        </Button>
      </Space>
      <MaterialPriceSection
        materialId="material-demo-001"
        unitCost={12.5}
        referenceSalePrice={18.75}
        minSalePrice={17}
        maxPurchasePrice={13}
        boundsCurrency="CNY"
        averageCost={12.2}
        canEditMaterial={canEdit}
        canViewBounds={canViewBounds}
        updateMaterialPrice={async ({ unitCost, referenceSalePrice }) => {
          await new Promise((resolve) => window.setTimeout(resolve, 150));
          setLastAction(
            `已模拟保存：进价 ${unitCost ?? '空'}，售价 ${referenceSalePrice ?? '空'}`,
          );
        }}
        navigate={(path) => setLastAction(`宿主路由：${path}`)}
        onSaved={() => setLastAction('物料价格保存完成，宿主列表已刷新')}
      />
      <Typography.Text type="secondary" aria-live="polite">
        {lastAction}
      </Typography.Text>
    </SectionCard>
  );
}
