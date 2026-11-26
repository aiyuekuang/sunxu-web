import { lazy } from 'react';
import { Col, Descriptions, Row, Typography } from 'antd';
import { SectionCard } from '../../src';

const SunxuWebProviderDemo = lazy(() =>
  import('./SunxuWebProviderDemo').then((module) => ({
    default: module.SunxuWebProviderDemo,
  })),
);

const colorTokens = [
  { name: 'Primary', light: '#007D35', dark: '#1F7A45' },
  { name: 'Primary surface', light: '#E6F7EC', dark: '#10271A' },
  { name: 'Workspace', light: '#F5F6F8', dark: '#0F0F0F' },
  { name: 'Surface', light: '#FFFFFF', dark: '#1C1C1E' },
  { name: 'Text', light: '#1A1A1A', dark: '#F5F5F5' },
  { name: 'Border', light: '#EBEBEB', dark: '#2C2C2E' },
  { name: 'Success', light: '#00B578', dark: '#00D68F' },
  { name: 'Warning', light: '#FF8F1F', dark: '#FFAA00' },
  { name: 'Error', light: '#FF3141', dark: '#FF4D4F' },
  { name: 'Info', light: '#1677FF', dark: '#4096FF' },
];

export function TokensPage({ appearance }: { appearance: 'light' | 'dark' }) {
  return (
    <div className="sxw-docs-page-content">
      <SectionCard title="语义色">
        <div className="sxw-token-grid">
          {colorTokens.map((token) => {
            const color = appearance === 'dark' ? token.dark : token.light;
            return (
              <div className="sxw-token-swatch" key={token.name}>
                <span className="sxw-token-swatch__color" style={{ backgroundColor: color }} />
                <span className="sxw-token-swatch__meta">
                  <strong>{token.name}</strong>
                  <code>{color}</code>
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <SectionCard title="尺寸与间距">
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'spacing', label: '间距', children: '4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 px' },
                { key: 'controls', label: '控件高度', children: '32 px 紧凑 · 36 px 标准 · 40 px 舒适' },
                { key: 'radius', label: '圆角', children: '4 / 6 / 10 / 14 px' },
                { key: 'motion', label: '动效', children: '150 / 220 / 300 ms；支持减少动态效果' },
              ]}
            />
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard title="字体与几何">
            <div className="sxw-token-type-sample">
              <Typography.Title level={3}>标题 24 px</Typography.Title>
              <Typography.Paragraph>正文 14 px · 使用系统 UI 字体栈</Typography.Paragraph>
              <Typography.Text type="secondary">说明文本 12–13 px · 只保留能帮助判断或操作的内容</Typography.Text>
            </div>
          </SectionCard>
        </Col>
      </Row>
      <SunxuWebProviderDemo appearance={appearance} />
      <Typography.Paragraph className="sxw-docs-note">
        Light / Dark 色值继承自 Sunxu；主题算法、控件状态和组件 token 由 Ant Design ConfigProvider 管理。
      </Typography.Paragraph>
    </div>
  );
}
