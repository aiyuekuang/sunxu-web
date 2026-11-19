import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Form, Input } from 'antd';
import { SectionCard, Space, Table, Typography } from '../../src';
import type { TableProps } from 'antd';
import {
  DocumentLineBatchSettingsButton,
  DocumentLineQuantityInput,
  DocumentModalForm,
  MesUiProvider,
  PermissionButton,
  StatusDisplay,
  TableLongText,
  type MesStatusEnum,
  type DocumentLineBatchField,
} from '../../src/mes';

type MesLine = {
  id: string;
  materialCode: string;
  description: string;
  quantity: number;
  dueDate?: string;
  warehouse?: string;
  note?: string;
};

const initialLines: MesLine[] = [
  {
    id: 'line-1',
    materialCode: 'RM-AL-0081',
    description:
      '6061 铝型材，阳极氧化银白色；到货后按图纸核对截面、长度、壁厚和表面处理要求，并检查端面与包装状态，发现磕碰或色差时单独记录并隔离。来料检验需要记录外观、关键尺寸、批次标签、包装状态和随货资料，遇到色差、变形或数量不符时先隔离该批物料并通知采购与质量负责人，确认处理结论后再更新入库记录。',
    quantity: 24,
  },
  {
    id: 'line-2',
    materialCode: 'PK-BOX-0003',
    description: '标准包装箱',
    quantity: 6,
  },
];

const warehouseOptions = [
  { label: '原材料仓', value: 'raw-materials' },
  { label: '线边仓', value: 'line-side' },
  { label: '成品仓', value: 'finished-goods' },
];

const statusOptions: MesStatusEnum = {
  in_progress: { text: '进行中', status: 'Processing' },
  completed: { text: '已完成', status: 'Success' },
  pending: { text: '待处理', status: 'Warning', color: '#FF8F1F' },
};

type DocumentModalDemoMode = 'workspace' | 'viewport' | 'fixed';

export function MesComponentSuitePage() {
  const [lines] = useState(initialLines);
  const [lastPatches, setLastPatches] = useState<Array<Partial<MesLine>>>();
  const [lineQuantity, setLineQuantity] = useState(24);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentModalMode, setDocumentModalMode] =
    useState<DocumentModalDemoMode>('workspace');
  const [lastSubmittedNote, setLastSubmittedNote] = useState('尚未提交');
  const [permissionAction, setPermissionAction] = useState('尚未触发操作');
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const tableHostRef = useRef<HTMLDivElement>(null);

  const fields = useMemo<DocumentLineBatchField<MesLine>[]>(
    () => [
      {
        key: 'quantity',
        label: '数量',
        type: 'number',
        min: 0,
        precision: 2,
        required: true,
        patch: (value) => ({ quantity: value ?? 0 }),
      },
      {
        key: 'dueDate',
        label: '交期',
        type: 'date',
        patch: (value) => ({ dueDate: value }),
      },
      {
        key: 'warehouse',
        label: '仓库',
        type: 'select',
        request: async ({ keyWords }) => {
          const query = keyWords?.trim().toLocaleLowerCase();
          await new Promise((resolve) => window.setTimeout(resolve, 350));
          if (query === '错误') throw new Error('仓库候选加载失败，请重试');
          return query
            ? warehouseOptions.filter((option) =>
                option.label.toLocaleLowerCase().includes(query),
              )
            : warehouseOptions;
        },
        patch: (value) => ({ warehouse: value }),
      },
      {
        key: 'note',
        label: '备注',
        type: 'text',
        maxLength: 120,
        patch: (value) => ({ note: value }),
      },
    ],
    [],
  );

  const columns: TableProps<MesLine>['columns'] = [
    { title: '物料编码', dataIndex: 'materialCode', width: 150 },
    {
      title: '说明',
      dataIndex: 'description',
      width: 320,
      render: (_, row) => <TableLongText value={row.description} />,
    },
    { title: '数量', dataIndex: 'quantity', width: 96, align: 'right' },
  ];

  useEffect(() => {
    const viewport = tableHostRef.current?.querySelector<HTMLElement>(
      '.sxw-mes-component-suite__table-content',
    );
    if (!viewport) return;

    const updateOverflow = () => {
      const next = viewport.scrollWidth > viewport.clientWidth + 1;
      setHasHorizontalOverflow((current) => (current === next ? current : next));
    };

    updateOverflow();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(updateOverflow);
    resizeObserver?.observe(viewport);
    const table = viewport.querySelector('table');
    if (table) resizeObserver?.observe(table);
    window.addEventListener('resize', updateOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateOverflow);
    };
  }, [lines.length]);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <SectionCard title="MES 表格长文本">
        <Typography.Paragraph type="secondary">
          默认两行预览，悬停或点击查看全文；显式截断模式仍保留 64 字截断和“更多”弹层。
        </Typography.Paragraph>
        <div
          ref={tableHostRef}
          role="region"
          aria-label="物料明细表，可用左右方向键查看全部列"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            const viewport = event.currentTarget.querySelector<HTMLElement>(
              '.sxw-mes-component-suite__table-content',
            );
            if (!viewport || viewport.scrollWidth <= viewport.clientWidth + 1) {
              return;
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              viewport.scrollLeft -= 120;
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              viewport.scrollLeft += 120;
            } else if (event.key === 'Home') {
              event.preventDefault();
              viewport.scrollLeft = 0;
            } else if (event.key === 'End') {
              event.preventDefault();
              viewport.scrollLeft = viewport.scrollWidth;
            }
          }}
        >
          <Table<MesLine>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={lines}
            pagination={false}
            tableLayout="fixed"
            classNames={{ content: 'sxw-mes-component-suite__table-content' }}
            scroll={{ x: 566 }}
          />
        </div>
        {hasHorizontalOverflow ? (
          <Typography.Text
            className="sxw-table-scroll-hint"
            type="secondary"
            role="note"
          >
            左右滚动查看其余列
          </Typography.Text>
        ) : null}
      </SectionCard>

      <SectionCard title="MES 明细批量字段设置">
        <Typography.Paragraph type="secondary">
          每个字段单独勾选；日期 patch 使用 YYYY-MM-DD，远程候选和提交回调由宿主提供。
        </Typography.Paragraph>
        <Space wrap size={8} style={{ marginBottom: 12 }}>
          <Typography.Text>明细数量</Typography.Text>
          <DocumentLineQuantityInput
            aria-label="明细数量"
            min={0}
            precision={2}
            value={lineQuantity}
            onChange={setLineQuantity}
          />
          <Typography.Text type="secondary">
            清空后离开输入框会恢复当前有效值；当前为 {lineQuantity}。
          </Typography.Text>
        </Space>
        <DocumentLineBatchSettingsButton
          selectedCount={3}
          fields={fields}
          onApply={setLastPatches}
        />
        {lastPatches !== undefined ? (
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Typography.Text role="status">
              已生成 {lastPatches.length} 项字段 patch
            </Typography.Text>
            <Typography.Text
              code
              style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
            >
              {JSON.stringify(lastPatches)}
            </Typography.Text>
          </Space>
        ) : null}
      </SectionCard>

      <SectionCard title="MES 状态与权限组件">
        <Typography.Paragraph type="secondary">
          状态字典、标签和权限判断由 MES 宿主提供；权限不通过时操作不渲染。
        </Typography.Paragraph>
        <Space wrap size={12} style={{ marginBottom: 12 }}>
          <StatusDisplay value="in_progress" enumMap={statusOptions} />
          <StatusDisplay value="completed" enumMap={statusOptions} mode="badge" />
          <StatusDisplay value="pending" enumMap={statusOptions} mode="text" />
          <StatusDisplay value={null} enumMap={statusOptions} />
        </Space>
        <MesUiProvider
          hasPermission={(permission) => permission !== 'mes:catalog:hidden'}
        >
          <Space wrap size={8}>
            <PermissionButton
              type="primary"
              permission="mes:catalog:create"
              onClick={() => setPermissionAction('已触发新增操作回调')}
            >
              新建操作
            </PermissionButton>
            <PermissionButton
              danger
              permission="mes:catalog:cancel"
              confirm={{
                title: '确认撤销当前单据？',
                content: '此示例只展示宿主注入的确认前后交互。',
                danger: true,
              }}
              onConfirm={async () => {
                setPermissionAction('确认回调已完成');
              }}
              successMessage="操作已完成"
            >
              撤销操作
            </PermissionButton>
            <PermissionButton permission="mes:catalog:hidden">
              无权限时隐藏
            </PermissionButton>
          </Space>
        </MesUiProvider>
        <Typography.Text role="status">{permissionAction}</Typography.Text>
      </SectionCard>

      <div className="sxw-mes-document-modal-demo">
        <SectionCard title="MES 单据编辑弹窗">
          <Typography.Paragraph type="secondary">
            对比工作区全屏、视口全屏和固定宽度；最小化会保留表单草稿。
          </Typography.Paragraph>
          <Space wrap size={8}>
            <Button
              type="primary"
              onClick={() => {
                setDocumentModalMode('workspace');
                setDocumentModalOpen(true);
              }}
            >
              工作区全屏
            </Button>
            <Button
              onClick={() => {
                setDocumentModalMode('viewport');
                setDocumentModalOpen(true);
              }}
            >
              视口全屏
            </Button>
            <Button
              onClick={() => {
                setDocumentModalMode('fixed');
                setDocumentModalOpen(true);
              }}
            >
              固定宽度
            </Button>
            <Typography.Text role="status">
              最近提交备注：{lastSubmittedNote}
            </Typography.Text>
          </Space>
        </SectionCard>
        <DocumentModalForm<{ note: string }>
          title="编辑入库单"
          width={documentModalMode === 'fixed' ? 520 : undefined}
          viewportFullscreen={documentModalMode === 'viewport'}
          open={documentModalOpen}
          onOpenChange={setDocumentModalOpen}
          initialValues={{ note: '最小化后检查此草稿仍然保留。' }}
          onFinish={async (values) => {
            setLastSubmittedNote(values.note);
            return true;
          }}
        >
          <Form.Item name="note" label="单据备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </DocumentModalForm>
      </div>
    </Space>
  );
}
