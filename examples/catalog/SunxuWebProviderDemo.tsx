import {
  Button,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { SectionCard, SunxuWebProvider } from '../../src';

type ProviderSize = 'small' | 'middle' | 'large';

function ProviderSizeSample({
  appearance,
  componentSize,
  label,
}: {
  appearance: 'light' | 'dark';
  componentSize: ProviderSize;
  label: string;
}) {
  return (
    <SunxuWebProvider
      appearance={appearance}
      componentSize={componentSize}
      workspaceFrame="host"
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Text strong>{label}</Typography.Text>
        <Space wrap>
          <Input aria-label="单号" placeholder="单号" style={{ width: 160 }} />
          <Select
            aria-label="状态"
            defaultValue="待处理"
            options={[
              { label: '待处理', value: '待处理' },
              { label: '已完成', value: '已完成' },
            ]}
            style={{ width: 120 }}
          />
          <DatePicker aria-label="创建日期" placeholder="创建日期" />
          <Button>重置</Button>
          <Button type="primary">查询</Button>
        </Space>
      </Space>
    </SunxuWebProvider>
  );
}

export function SunxuWebProviderDemo({
  appearance,
}: {
  appearance: 'light' | 'dark';
}) {
  return (
    <SectionCard title="Provider 控件默认尺寸">
      <Typography.Paragraph type="secondary">
        在应用根级选择默认尺寸；Small 使用 32 px，Middle 使用 36 px。单个控件只在有明确需要时覆盖尺寸。
      </Typography.Paragraph>
      <Row gutter={[16, 20]}>
        <Col xs={24} xl={12}>
          <ProviderSizeSample
            appearance={appearance}
            componentSize="small"
            label="Small · 紧凑 32 px"
          />
        </Col>
        <Col xs={24} xl={12}>
          <ProviderSizeSample
            appearance={appearance}
            componentSize="middle"
            label="Middle · 标准 36 px"
          />
        </Col>
      </Row>
    </SectionCard>
  );
}
