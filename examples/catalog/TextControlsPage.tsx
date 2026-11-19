import { useCallback, useMemo, useState } from 'react';
import { Col, Form, Row } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { LongText, RemoteSelect, SectionCard } from '../../src';

type Contact = {
  value: string;
  label: string;
};

type LongTextRow = {
  id: string;
  description: string;
};

const allContacts: Contact[] = [
  { value: 'u-01', label: '林见 · 客服' },
  { value: 'u-02', label: '王明 · 仓储' },
  { value: 'u-03', label: '王宁 · 财务' },
];

const longTextRows: LongTextRow[] = [
  {
    id: 'delivery-note',
    description:
      '发货前核对收货地址、联系人和现场卸货条件；若预约时间变化，请先联系仓储窗口并更新本次配送说明。还需逐项确认包装标识、装箱数量和客户指定的随货资料；发现地址或预约信息不一致时，先暂停发货并与负责人员核实后再更新记录。',
  },
  {
    id: 'packing-note',
    description: '包装完好。',
  },
  {
    id: 'width-only-note',
    description: 'WWWWWWWWWWWWWWWW',
  },
];

export function TextControlsPage() {
  const [contactOptions, setContactOptions] = useState(allContacts);
  const [contactValue, setContactValue] = useState<string>();

  const searchContacts = useCallback((keyword: string) => {
    const query = keyword.trim().toLocaleLowerCase();
    setContactOptions(
      allContacts.filter((contact) =>
        `${contact.value} ${contact.label}`.toLocaleLowerCase().includes(query),
      ),
    );
  }, []);

  const longTextColumns = useMemo<ProColumns<LongTextRow>[]>(
    () => [
      {
        title: '备注',
        dataIndex: 'description',
        width: 180,
        render: (_, row) => (
          <LongText
            value={row.description}
            displayMode="truncate"
            maxLength={18}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="sxw-docs-page-content">
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <SectionCard
            className="sxw-text-controls__remote"
            title="远程候选搜索"
            subtitle="搜索由组件防抖；候选数据和请求由宿主提供。"
          >
            <Form layout="vertical">
              <Form.Item label="联系人" style={{ marginBottom: 0 }}>
                <RemoteSelect<string>
                  aria-label="搜索联系人"
                  placeholder="输入姓名或编号"
                  value={contactValue}
                  options={contactOptions}
                  onChange={setContactValue}
                  onSearch={searchContacts}
                  allowClear
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Form>
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard
            className="sxw-text-controls__long-text"
            title="长文本单元格"
            subtitle="字数或列宽触发省略时都可打开全文。"
          >
            <div style={{ width: 180, maxWidth: '100%' }}>
              <ProTable<LongTextRow>
                rowKey="id"
                columns={longTextColumns}
                dataSource={longTextRows}
                search={false}
                options={false}
                toolBarRender={false}
                pagination={false}
                cardProps={false}
                tableLayout="fixed"
                scroll={{ x: 180 }}
              />
            </div>
          </SectionCard>
        </Col>
      </Row>
    </div>
  );
}
