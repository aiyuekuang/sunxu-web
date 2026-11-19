import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Space, Switch, Table, Tag, Typography } from 'antd';
import type { ActionType, ProColumns, ProTableProps } from '@ant-design/pro-components';
import {
  ResizableProTable,
  ResizableTable,
  TableActions,
  TableLongText,
  MesUiProvider,
  useTableExportLayout,
} from '../../src/mes';
import { SectionCard } from '../../src';

type DemoMaterial = {
  id: string;
  materialCode: string;
  materialName: string;
  materialSpec: string;
  materialUnit: string;
  quantity: number;
  status: '在用' | '待检' | '停用';
  remark: string;
  createdAt: string;
};

const materials: DemoMaterial[] = [
  {
    id: 'mat-001',
    materialCode: 'RM-AL-0081',
    materialName: '6061 铝型材',
    materialSpec: '40 × 40 × 2.0 mm，阳极氧化银白色',
    materialUnit: '支',
    quantity: 24,
    status: '在用',
    remark: '来料后按图纸核对截面、长度、壁厚和表面处理要求，并记录包装状态。',
    createdAt: '2026-11-18 09:20:00',
  },
  {
    id: 'mat-002',
    materialCode: 'PK-BOX-0003',
    materialName: '标准包装箱',
    materialSpec: '五层瓦楞，内尺寸 600 × 400 × 320 mm',
    materialUnit: '个',
    quantity: 6,
    status: '待检',
    remark: '核对供应商标签、箱体破损和本批包装数量。',
    createdAt: '2026-11-17 14:10:00',
  },
  {
    id: 'mat-003',
    materialCode: 'EL-MTR-0012',
    materialName: '三相异步电机',
    materialSpec: 'YE3-90S-4，1.1 kW，380 V',
    materialUnit: '台',
    quantity: 3,
    status: '在用',
    remark: '安装前确认铭牌、接线盒、轴端和防护等级符合采购技术要求。',
    createdAt: '2026-11-16 11:45:00',
  },
  {
    id: 'mat-004',
    materialCode: 'HW-BOLT-0040',
    materialName: '六角螺栓',
    materialSpec: 'M8 × 40，8.8 级，镀锌',
    materialUnit: '件',
    quantity: 180,
    status: '在用',
    remark: '按包装批次抽检螺纹和镀层，异常件单独隔离。',
    createdAt: '2026-11-15 08:15:00',
  },
  {
    id: 'mat-005',
    materialCode: 'RM-SS-0210',
    materialName: '不锈钢板',
    materialSpec: 'SUS304，厚度 1.5 mm，2B 面',
    materialUnit: '张',
    quantity: 12,
    status: '待检',
    remark: '确认炉批号、材质证明和表面划伤后完成来料检验。',
    createdAt: '2026-11-14 16:30:00',
  },
  {
    id: 'mat-006',
    materialCode: 'EL-SEN-0108',
    materialName: '接近开关',
    materialSpec: 'M12，PNP 常开，检测距离 4 mm',
    materialUnit: '只',
    quantity: 8,
    status: '停用',
    remark: '替代型号评审通过后再恢复领用。',
    createdAt: '2026-11-13 10:05:00',
  },
  {
    id: 'mat-007',
    materialCode: 'PK-FILM-0009',
    materialName: '拉伸缠绕膜',
    materialSpec: '宽 500 mm，厚 20 μm',
    materialUnit: '卷',
    quantity: 15,
    status: '在用',
    remark: '确认膜卷端面和净重后入库。',
    createdAt: '2026-11-12 13:25:00',
  },
];

const ACTION_COLUMN = Symbol('catalog-action-column');
const EDITABLE_ACTION_COLUMN = Symbol('catalog-editable-action-column');
type DemoActionColumn = ProColumns<DemoMaterial> & {
  [ACTION_COLUMN]?: true;
  [EDITABLE_ACTION_COLUMN]?: true;
};

function KeyboardTableRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const regionRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={regionRef}
      className={['sxw-catalog-table-region', className]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const content = Array.from(
          regionRef.current?.querySelectorAll<HTMLElement>(
            '.ant-table-body, .ant-table-content',
          ) ?? [],
        ).find((element) => {
          const overflowX = window.getComputedStyle(element).overflowX;
          return (
            element.scrollWidth > element.clientWidth + 1 &&
            (overflowX === 'auto' || overflowX === 'scroll')
          );
        });
        if (!content) return;
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          content.scrollLeft -= 120;
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          content.scrollLeft += 120;
        } else if (event.key === 'Home') {
          event.preventDefault();
          content.scrollLeft = 0;
        } else if (event.key === 'End') {
          event.preventDefault();
          content.scrollLeft = content.scrollWidth;
        }
      }}
    >
      {children}
    </div>
  );
}

function ExportLayoutStatus() {
  const layout = useTableExportLayout();
  return (
    <Tag color="cyan">导出列 {layout?.columns.length ?? 0}</Tag>
  );
}

export function ResizableTablePage() {
  const [showEmpty, setShowEmpty] = useState(false);
  const [lastAction, setLastAction] = useState('尚未触发行操作');
  const [requestCount, setRequestCount] = useState(0);
  const actionRef = useRef<ActionType | undefined>(undefined);
  const previousShowEmpty = useRef(showEmpty);
  const data = useMemo(() => (showEmpty ? [] : materials), [showEmpty]);

  useEffect(() => {
    if (previousShowEmpty.current === showEmpty) return;
    previousShowEmpty.current = showEmpty;
    actionRef.current?.reload();
  }, [showEmpty]);

  const columns = useMemo<ProColumns<DemoMaterial>[]>(() => {
    const editActionColumn: DemoActionColumn = {
      title: '操作',
      key: 'actions',
      valueType: 'option',
      width: 120,
      search: false,
      [ACTION_COLUMN]: true,
      [EDITABLE_ACTION_COLUMN]: true,
      render: (_, row) => (
        <TableActions
          actions={[
            <Button
              key="edit"
              type="link"
              size="small"
              onClick={() => setLastAction(`编辑 ${row.materialCode}`)}
            >
              编辑
            </Button>,
            <Button
              key="detail"
              type="link"
              size="small"
              onClick={() => setLastAction(`查看 ${row.materialCode}`)}
            >
              查看
            </Button>,
          ]}
        />
      ),
    };

    return [
      {
        title: '状态',
        dataIndex: 'status',
        valueType: 'select',
        valueEnum: {
          在用: { text: '在用', status: 'Success' },
          待检: { text: '待检', status: 'Warning' },
          停用: { text: '停用', status: 'Default' },
        },
        width: 100,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        width: 280,
        search: false,
        ellipsis: true,
        render: (_, row) => <TableLongText value={row.remark} />,
      },
      { title: '数量', dataIndex: 'quantity', width: 100, search: false, align: 'right' },
      { title: '单位', dataIndex: 'materialUnit', width: 84, search: false },
      { title: '规格型号', dataIndex: 'materialSpec', search: false, ellipsis: true },
      { title: '物料编码', dataIndex: 'materialCode', width: 148, search: false },
      { title: '物料名称', dataIndex: 'materialName', width: 160, search: false },
      { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime', width: 168, search: false },
      {
        title: '关键字',
        dataIndex: 'keyword',
        valueType: 'text',
        hideInTable: true,
        hideInSetting: true,
        fieldProps: { placeholder: '物料编码或名称' },
      },
      {
        title: '创建日期',
        dataIndex: 'createdAtRange',
        valueType: 'dateRange',
        hideInTable: true,
        hideInSetting: true,
        search: {
          transform: (value: [string, string]) => ({
            createdAtStart: value?.[0],
            createdAtEnd: value?.[1],
          }),
        },
      },
      editActionColumn,
    ];
  }, []);

  const request = useCallback<
    NonNullable<ProTableProps<DemoMaterial, Record<string, unknown>>['request']>
  >(
    async (params, sort) => {
      setRequestCount((count) => count + 1);
      const query = params as Record<string, unknown>;
      const keyword = String(query.keyword ?? '').trim().toLocaleLowerCase();
      const start = String(query.createdAtStart ?? '');
      const end = String(query.createdAtEnd ?? '');
      let rows = data.filter((row) => {
        const matchesKeyword =
          !keyword ||
          row.materialCode.toLocaleLowerCase().includes(keyword) ||
          row.materialName.toLocaleLowerCase().includes(keyword);
        const date = row.createdAt.slice(0, 10);
        return (
          matchesKeyword &&
          (!start || date >= start) &&
          (!end || date <= end)
        );
      });

      const [field, order] = Object.entries(sort ?? {}).find(
        ([, value]) => value === 'ascend' || value === 'descend',
      ) ?? [];
      if (field && (order === 'ascend' || order === 'descend')) {
        const direction = order === 'ascend' ? 1 : -1;
        rows = [...rows].sort((left, right) => {
          const leftValue = left[field as keyof DemoMaterial];
          const rightValue = right[field as keyof DemoMaterial];
          return String(leftValue).localeCompare(String(rightValue), 'zh-CN', {
            numeric: true,
          }) * direction;
        });
      }

      const current = Math.max(1, Number(query.current ?? 1));
      const pageSize = Math.max(1, Number(query.pageSize ?? 5));
      return {
        data: rows.slice((current - 1) * pageSize, current * pageSize),
        success: true,
        total: rows.length,
      };
    },
    [data],
  );

  return (
    <div className="sxw-docs-page-content sxw-catalog-resizable-table-page">
      <SectionCard title="ResizableProTable：完整 MES 列表行为">
        <Space wrap size={12} className="sxw-catalog-resizable-table-page__controls">
          <label className="sxw-catalog-toggle">
            <Switch
              checked={showEmpty}
              onChange={setShowEmpty}
              aria-label="查看业务空态"
            />
            <span>查看业务空态</span>
          </label>
          <Tag color="blue">请求 {requestCount} 次</Tag>
          <Typography.Text type="secondary" role="status">
            {lastAction}；双击普通行可触发行编辑回调。
          </Typography.Text>
        </Space>

        <div className="sxw-mes-fit-table-boundary sxw-catalog-fit-table-boundary">
          <KeyboardTableRegion
            label="MES 物料台账，可用左右方向键查看全部列"
            className="sxw-catalog-fit-table-region"
          >
            <MesUiProvider
              hasPermission={() => true}
              isTableActionColumn={(column) =>
                Boolean((column as DemoActionColumn)[ACTION_COLUMN])
              }
              resolveRowEditAction={(columns, record) => {
                const canEdit = columns?.some((column) =>
                  Boolean((column as DemoActionColumn)[EDITABLE_ACTION_COLUMN]),
                );
                if (!canEdit || !record || typeof record !== 'object') return;
                const row = record as DemoMaterial;
                return {
                  onClick: () => setLastAction(`双击编辑 ${row.materialCode}`),
                };
              }}
            >
              <ResizableProTable<DemoMaterial>
                rowKey="id"
                actionRef={actionRef}
                headerTitle="物料台账"
                columns={columns}
                request={request}
                search={{
                  defaultCollapsed: false,
                  labelWidth: 'auto',
                }}
                options={{ density: true, setting: true, reload: false, fullScreen: false }}
                toolBarRender={() => [<ExportLayoutStatus key="export-layout" />]}
                pagination={{ defaultPageSize: 5, pageSizeOptions: [5, 10] }}
                scroll={{ x: 'max-content' }}
                fitContainerHeight={{ bottomOffset: 12, minBodyHeight: 120 }}
                resizable={{
                  persistenceKey: 'sxw_catalog_mes_material_table',
                  sortPersistenceKey: 'sxw_catalog_mes_material_sort',
                  serverSortFields: ['materialCode', 'materialName', 'quantity', 'createdAt'],
                }}
                materialColumnPriority={{
                  mode: 'auto',
                  primaryQuantityKeys: ['quantity'],
                }}
                emptyGuidance="先检查当前筛选条件，或确认上游采购与物料配置已生成数据。"
                summary={(pageData) => {
                  const total = pageData.reduce((sum, row) => sum + row.quantity, 0);
                  return (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                          当前页数量合计
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          {total}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </MesUiProvider>
          </KeyboardTableRegion>
        </div>
      </SectionCard>

      <SectionCard title="ResizableTable：本地明细表格">
        <Typography.Paragraph type="secondary">
          原生 Table 保留 MES 的序号、列宽记忆和排序状态；列宽拖动手柄仅在表头出现。
        </Typography.Paragraph>
        <KeyboardTableRegion label="MES 本地物料明细，可用左右方向键查看全部列">
          <ResizableTable<DemoMaterial>
            rowKey="id"
            columns={[
              { title: '物料名称', dataIndex: 'materialName' },
              { title: '物料编码', dataIndex: 'materialCode', width: 148 },
              {
                title: '本地数量排序',
                dataIndex: 'quantity',
                width: 140,
                sorter: (left, right) => left.quantity - right.quantity,
              },
              { title: '状态', dataIndex: 'status', width: 100 },
            ]}
            dataSource={materials.slice(0, 4)}
            pagination={{ defaultPageSize: 4, pageSize: 4 }}
            scroll={{ x: 568 }}
            resizable={{ persistenceKey: 'sxw_catalog_mes_local_detail_table' }}
            materialColumnPriority="preserve"
          />
        </KeyboardTableRegion>
      </SectionCard>
    </div>
  );
}
