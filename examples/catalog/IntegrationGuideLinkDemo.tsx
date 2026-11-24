import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { IntegrationGuideLink } from '../../src/mes/components/IntegrationGuideLink';

export function IntegrationGuideLinkDemo() {
  return (
    <SectionCard title="MES 接入说明弹窗">
      <Space orientation="vertical" size={12}>
        <Typography.Text type="secondary">
          弹窗布局由组件提供，接入主题的标题和说明内容由宿主传入。
        </Typography.Text>
        <IntegrationGuideLink title="Webhook 接入说明">
          <Typography.Paragraph>
            订阅业务事件后，宿主系统可以接收单据状态变化通知。请先选择事件，再配置回调地址与签名校验。
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary">
            示例内容仅用于组件目录展示，实际指南正文仍由 MES 宿主维护。
          </Typography.Paragraph>
        </IntegrationGuideLink>
      </Space>
    </SectionCard>
  );
}
