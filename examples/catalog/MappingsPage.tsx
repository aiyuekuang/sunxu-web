import { Space, Tag, Typography } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { ComponentMapping, MappingStatus } from './componentMappings';

const mappingColumns: ProColumns<ComponentMapping>[] = [
  { title: 'Sunxu 组件 / 任务', dataIndex: 'source', width: 260, ellipsis: true },
  { title: 'Web 权威实现', dataIndex: 'target', width: 280, ellipsis: true },
  {
    title: '处理方式',
    dataIndex: 'status',
    width: 124,
    render: (_, row) => <Tag color={statusColor[row.status]}>{row.status}</Tag>,
  },
  { title: '职责说明', dataIndex: 'note', ellipsis: true },
];

const statusColor: Record<MappingStatus, string> = {
  ADAPTED: 'success',
  UPSTREAM: 'processing',
  HOST: 'gold',
  DEFERRED: 'default',
};

export function MappingsPage({ dataSource, search }: { dataSource: ComponentMapping[]; search: string }) {
  return (
    <div className="sxw-docs-page-content">
      <ProCard variant="outlined" className="sxw-mapping-table-card">
        <div className="sxw-mapping-summary">
          <Typography.Text>
            {search ? `“${search}”匹配 ${dataSource.length} 项` : `当前映射 ${dataSource.length} 项`}
          </Typography.Text>
          <Space wrap size={4}>
            {!search && <Tag color="cyan">源组件适配：4 项</Tag>}
            <Tag color="success">ADAPTED：Sunxu Web</Tag>
            <Tag color="processing">UPSTREAM：AntD / Pro</Tag>
            <Tag color="gold">HOST：宿主</Tag>
            <Tag>DEFERRED：暂缓</Tag>
          </Space>
        </div>
        <ProTable<ComponentMapping>
          rowKey="source"
          columns={mappingColumns}
          dataSource={dataSource}
          search={false}
          options={false}
          toolBarRender={false}
          scroll={{ x: 760 }}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          locale={{ emptyText: search ? '没有匹配的组件' : '没有组件映射' }}
          size="small"
        />
      </ProCard>
      <Typography.Paragraph className="sxw-docs-note">
        同职责的 Ant Design / Pro Components 组件由上游拥有；Sunxu Web 仅维护有稳定跨项目价值的页面组合契约。
      </Typography.Paragraph>
    </div>
  );
}
