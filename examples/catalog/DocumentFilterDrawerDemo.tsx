import { useState } from 'react';
import { Button, Form, Input, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DocumentFilterButton,
  DocumentFilterDrawer,
  renderDocumentFilterDrawerActions,
} from '../../src/business';

export function DocumentFilterDrawerDemo() {
  const [open, setOpen] = useState(false);
  const [appliedCount, setAppliedCount] = useState(2);
  const [query, setQuery] = useState('');

  return (
    <SectionCard title="单据筛选抽屉">
      <Typography.Paragraph type="secondary">
        内容区独立滚动，QueryFilter/ProForm 的查询和重置动作可传送到固定底部；抽屉关闭后保留表单内容。
      </Typography.Paragraph>
      <DocumentFilterButton
        appliedCount={appliedCount}
        onClick={() => setOpen(true)}
      />
      <DocumentFilterDrawer
        open={open}
        onOpenChange={setOpen}
        appliedCount={appliedCount}
      >
        <Form layout="vertical" style={{ padding: 24 }}>
          <Form.Item label="单据编号">
            <Input
              value={query}
              placeholder="输入单据编号"
              onChange={(event) => setQuery(event.target.value)}
            />
          </Form.Item>
          <Typography.Text type="secondary">
            这里模拟 QueryFilter 或 ProForm 的筛选内容。
          </Typography.Text>
          {renderDocumentFilterDrawerActions(
            null,
            <Space>
              <Button
                onClick={() => {
                  setQuery('');
                  setAppliedCount(0);
                }}
              >
                重置
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setAppliedCount(query.trim() ? 3 : 2);
                  setOpen(false);
                }}
              >
                查询
              </Button>
            </Space>,
          )}
        </Form>
      </DocumentFilterDrawer>
    </SectionCard>
  );
}
