import { useCallback, useMemo, useRef, useState } from 'react';
import { Input, InputNumber, Select } from 'antd';
import {
  EditableDetailTable,
  SectionCard,
  type EditableDetailBatchOperations,
  type EditableDetailColumn,
} from '../../src';

type DemoLine = {
  key: string;
  description: string;
  category: '标准' | '可选';
  quantity: number;
  note: string;
};

const categoryOptions = [
  { label: '标准', value: '标准' },
  { label: '可选', value: '可选' },
];

const initialRows: DemoLine[] = [
  {
    key: 'line-1',
    description: '基础配置项',
    category: '标准',
    quantity: 2,
    note: '此行用于展示可编辑单元格和多行批量设置。',
  },
  {
    key: 'line-2',
    description: '扩展配置项',
    category: '可选',
    quantity: 1,
    note: '批量操作由组件维护选择状态，字段和业务联动由宿主传入。',
  },
];

export function EditableDetailTablePage() {
  const [rows, setRows] = useState(initialRows);
  const nextId = useRef(3);

  const createRow = useCallback((): DemoLine => {
    const key = `line-${nextId.current++}`;
    return {
      key,
      description: '',
      category: '标准',
      quantity: 1,
      note: '',
    };
  }, []);

  const cloneRow = useCallback(
    (row: DemoLine): DemoLine => ({ ...row, key: `line-${nextId.current++}` }),
    [],
  );

  const columns = useMemo<EditableDetailColumn<DemoLine>[]>(
    () => [
      {
        key: 'description',
        title: '明细名称',
        required: true,
        width: 220,
        render: (row, _index, update) => (
          <Input
            aria-label="明细名称"
            value={row.description}
            placeholder="填写名称"
            onChange={(event) => update({ description: event.target.value })}
          />
        ),
      },
      {
        key: 'category',
        title: '分类',
        width: 140,
        render: (row, _index, update) => (
          <Select
            aria-label="分类"
            value={row.category}
            options={categoryOptions}
            style={{ width: '100%' }}
            onChange={(category: DemoLine['category']) => update({ category })}
          />
        ),
      },
      {
        key: 'quantity',
        title: '数量',
        width: 140,
        align: 'right',
        render: (row, _index, update) => (
          <InputNumber
            aria-label="数量"
            min={0}
            precision={0}
            value={row.quantity}
            style={{ width: '100%' }}
            onChange={(quantity) =>
              update({ quantity: typeof quantity === 'number' ? quantity : 0 })
            }
          />
        ),
      },
      {
        key: 'note',
        title: '备注',
        width: 300,
        render: (row, _index, update) => (
          <Input
            aria-label="备注"
            value={row.note}
            onChange={(event) => update({ note: event.target.value })}
          />
        ),
      },
    ],
    [],
  );

  const batchOperations = useMemo<EditableDetailBatchOperations<DemoLine>>(
    () => ({
      allowCopy: true,
      fields: [
        {
          key: 'quantity',
          label: '数量',
          type: 'number',
          min: 0,
          precision: 0,
          patch: (quantity) => ({ quantity: quantity ?? 0 }),
        },
        {
          key: 'category',
          label: '分类',
          type: 'select',
          options: categoryOptions,
          patch: (category) =>
            category === '标准' || category === '可选' ? { category } : {},
        },
      ],
    }),
    [],
  );

  return (
    <div className="sxw-docs-page-content">
      <SectionCard
        title="可编辑明细表格"
        subtitle="行选择、字段编辑、批量设置和行操作由复合组件提供；行数据和字段规则由宿主控制。"
      >
        <EditableDetailTable
          rows={rows}
          onRowsChange={setRows}
          rowKey={(row) => row.key}
          columns={columns}
          createRow={createRow}
          cloneRow={cloneRow}
          minRows={1}
          batchOperations={batchOperations}
        />
      </SectionCard>
    </div>
  );
}
