import { useState } from 'react';
import { Button, Form, Input, Select, Space, Tag, Typography } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  FilterBar,
  FormScreenContainer,
  ListScreenContainer,
  ScreenContainer,
  SectionCard,
  StatusTabs,
} from '../../src';

const demoRows = [
  { code: 'EX-001', name: '筛选与结果区', status: '进行中', owner: '容器示例' },
  { code: 'EX-002', name: '固定表单操作', status: '待处理', owner: '表单示例' },
  { code: 'EX-003', name: '详情信息分组', status: '已完成', owner: '详情示例' },
  { code: 'EX-004', name: '受控状态切换', status: '进行中', owner: '筛选示例' },
];

const demoColumns: ProColumns<(typeof demoRows)[number]>[] = [
  { title: '编号', dataIndex: 'code', width: 120 },
  { title: '示例任务', dataIndex: 'name', ellipsis: true },
  {
    title: '状态',
    dataIndex: 'status',
    width: 112,
    render: (_, record) => <Tag color={record.status === '已完成' ? 'success' : record.status === '进行中' ? 'processing' : 'default'}>{record.status}</Tag>,
  },
  { title: '组件契约', dataIndex: 'owner', width: 132 },
];

export function ContainersPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [status, setStatus] = useState('全部');
  const [filter, setFilter] = useState('');
  const [form] = Form.useForm();
  const visibleRows = demoRows.filter((row) =>
    (status === '全部' || row.status === status) &&
    `${row.code} ${row.name}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="sxw-docs-page-content">
      <SectionCard title="列表容器" subtitle="工具栏紧邻一个结果区">
        <ListScreenContainer
          as="section"
          title="示例记录"
          headingLevel={2}
          toolbar={
            <FilterBar
              ariaLabel="示例记录筛选"
              actions={<Button type="primary" onClick={() => onMessage('操作由宿主项目提供')}>新建示例</Button>}
            >
              <Input.Search
                aria-label="搜索示例记录"
                placeholder="编号或名称"
                allowClear
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
              <StatusTabs
                ariaLabel="按状态筛选"
                value={status}
                onChange={setStatus}
                items={[
                  { key: '全部', label: '全部', count: demoRows.length },
                  { key: '进行中', label: '进行中' },
                  { key: '待处理', label: '待处理' },
                  { key: '已完成', label: '已完成' },
                ]}
              />
            </FilterBar>
          }
        >
          <ProTable
            rowKey="code"
            columns={demoColumns}
            dataSource={visibleRows}
            search={false}
            options={false}
            toolBarRender={false}
            scroll={{ x: 620 }}
            pagination={{ pageSize: 5, showSizeChanger: false }}
          />
        </ListScreenContainer>
      </SectionCard>

      <ScreenContainer as="section" frame="none">
        <Typography.Text type="secondary">
          多模块统计页：概览、对比、趋势和明细是页面级区块，间距由 ScreenContainer 统一管理。
        </Typography.Text>
        <SectionCard title="统计概览">当前业务周期的汇总指标由宿主提供。</SectionCard>
        <SectionCard title="组内对比">对比结果与趋势沿用同一统计周期。</SectionCard>
        <SectionCard title="趋势与明细">趋势图、筛选和结果表按页面任务组合。</SectionCard>
      </ScreenContainer>

      <SectionCard title="表单容器" subtitle="字段滚动区与流程 footer 分离">
        <div className="sxw-form-preview-frame">
          <FormScreenContainer
            as="section"
            title="编辑示例"
            headingLevel={2}
            footer={
              <Space>
                <Button onClick={() => form.resetFields()}>取消</Button>
                <Button type="primary" onClick={() => form.submit()}>保存</Button>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{ title: '组件契约示例', category: '页面容器' }}
              onFinish={() => onMessage('表单提交回调由宿主项目提供')}
            >
              <Form.Item label="名称" name="title" rules={[{ required: true, message: '请输入名称' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="分类" name="category">
                <Select options={[{ value: '页面容器' }, { value: '筛选与列表' }, { value: '信息与状态' }]} />
              </Form.Item>
            </Form>
          </FormScreenContainer>
        </div>
      </SectionCard>
    </div>
  );
}
