import { useMemo, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Form, Input, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  AccountingCrudPage,
  MesUiProvider,
  type AccountingCrudService,
} from '../../src/business';

type DemoAccountingRow = {
  id: string;
  code: string;
  name: string;
  remarks?: string;
};

const columns: ProColumns<DemoAccountingRow>[] = [
  { title: '编码', dataIndex: 'code', width: 180 },
  { title: '名称', dataIndex: 'name', width: 240 },
  { title: '备注', dataIndex: 'remarks', ellipsis: true },
];

export function AccountingCrudPageDemo() {
  const [canManage, setCanManage] = useState(true);
  const [rows, setRows] = useState<DemoAccountingRow[]>([
    { id: 'account-1', code: 'AC-001', name: '原材料', remarks: '库存类核算科目' },
    { id: 'account-2', code: 'AC-002', name: '制造费用', remarks: '生产成本归集' },
    { id: 'account-3', code: 'AC-003', name: '应付账款', remarks: '供应商往来' },
  ]);

  const service = useMemo<AccountingCrudService<DemoAccountingRow>>(
    () => ({
      list: async (body) => {
        const keyword = String(body.keyword ?? '').trim().toLocaleLowerCase();
        const filtered = rows.filter((row) =>
          `${row.code} ${row.name} ${row.remarks ?? ''}`
            .toLocaleLowerCase()
            .includes(keyword),
        );
        const page = Number(body.page ?? 1);
        const pageSize = Number(body.pageSize ?? 20);
        return {
          list: filtered.slice((page - 1) * pageSize, page * pageSize),
          total: filtered.length,
        };
      },
      create: async (body) => {
        const row = {
          id: `account-${Date.now()}`,
          code: String(body.code ?? ''),
          name: String(body.name ?? ''),
          remarks: String(body.remarks ?? ''),
        };
        setRows((current) => [...current, row]);
        return row;
      },
      update: async (body) => {
        const row = {
          id: String(body.id ?? ''),
          code: String(body.code ?? ''),
          name: String(body.name ?? ''),
          remarks: String(body.remarks ?? ''),
        };
        setRows((current) => current.map((item) => item.id === row.id ? row : item));
        return row;
      },
    }),
    [rows],
  );

  return (
    <SectionCard title="会计基础资料 CRUD">
      <Typography.Paragraph type="secondary">
        通用台账保留搜索、分页、新增/编辑表单和操作权限；服务、字段定义与分页策略由页面提供。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap>
          <Typography.Text>权限</Typography.Text>
          <Segmented
            aria-label="会计资料维护权限"
            value={canManage ? 'manage' : 'read-only'}
            options={[
              { label: '可维护', value: 'manage' },
              { label: '只读', value: 'read-only' },
            ]}
            onChange={(value) => setCanManage(value === 'manage')}
          />
          <Button onClick={() => setRows((current) => [...current])}>刷新演示数据</Button>
        </Space>
        <MesUiProvider hasPermission={() => canManage}>
          <AccountingCrudPage<DemoAccountingRow>
            title="会计基础资料"
            columns={columns}
            service={service}
            managePermission="demo:accounting-manage"
            canManage={canManage}
            pagination={{ defaultPageSize: 20, showSizeChanger: false }}
            scrollX={720}
            listParamMapper={(params) => ({
              keyword: typeof params.keyword === 'string' ? params.keyword : undefined,
            })}
            renderFormItems={() => (
              <>
                <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="remarks" label="备注">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </>
            )}
          />
        </MesUiProvider>
      </Space>
    </SectionCard>
  );
}
