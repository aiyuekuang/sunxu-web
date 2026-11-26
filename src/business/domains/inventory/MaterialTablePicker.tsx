import type { ActionType, ProColumns, ProTableProps } from '@ant-design/pro-components';
import {
  App,
  Button,
  Empty,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Tabs,
  Tree,
} from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMaterialTablePickerCapabilities } from '../../providers/BusinessUiProvider';
import { EntityThumbnail } from '../documents/EntityThumbnail';
import { ResizableProTable as ProTable } from '../shared/ResizableTable';
import type {
  MaterialCategoryNode,
  MaterialPickerRecord,
  MaterialTablePickerListRequest,
  MaterialTablePickerProps,
  MaterialTablePickerSelection,
} from './material-table-picker-types';
import './MaterialTablePicker.css';

const DEFAULT_WIDTH = 1080;
const PICKER_BODY_HEIGHT = 480;
const PICKER_TABLE_MAX_BODY_HEIGHT = 320;
const ALL_MATERIAL_CATEGORIES_KEY = '__all_material_categories__';

function createMaterialThumbnailColumn<
  TMaterial extends MaterialPickerRecord,
>(): ProColumns<TMaterial> {
  return {
    title: '缩略图',
    dataIndex: 'thumbnailUrl',
    search: false,
    width: 74,
    align: 'center',
    render: (_, record) => (
      <EntityThumbnail
        thumbnailUrl={record.thumbnailUrl}
        previewUrl={record.primaryImageUrl}
        alt={record.name ?? undefined}
        size={40}
      />
    ),
  };
}

type MaterialCategoryTreeData = {
  key: string;
  title: string;
  children: MaterialCategoryTreeData[];
};

function mapMaterialCategoryTree(
  nodes: MaterialCategoryNode[],
): MaterialCategoryTreeData[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.name,
    children: mapMaterialCategoryTree(node.children ?? []),
  }));
}

function findMaterialCategoryTreeNode(
  nodes: MaterialCategoryNode[],
  id: string,
): MaterialCategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findMaterialCategoryTreeNode(node.children ?? [], id);
    if (child) return child;
  }
  return undefined;
}

function readStringParam(
  params: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readSelectedQuantity(
  quantities: Record<string, number | null>,
  materialId: string,
): number | null {
  return Object.hasOwn(quantities, materialId) ? quantities[materialId] : 1;
}

function formatStockQty(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
    : '0';
}

interface StockQtySummaryItem {
  unitLabel: string;
  stockQty: number;
  orderQty: number;
}

function formatQtySummary(
  items: StockQtySummaryItem[],
  pick: (item: StockQtySummaryItem) => number,
): string {
  if (items.length === 0) return '0';
  return items
    .map(
      (item) =>
        `${formatStockQty(pick(item))}${item.unitLabel ? ` ${item.unitLabel}` : ''}`,
    )
    .join(' + ');
}

function normalizeBooleanFilter(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

function createMaterialListParams(
  params: Record<string, unknown>,
  requestParams: object | undefined,
): Record<string, unknown> {
  const fixed = (requestParams ?? {}) as Record<string, unknown>;
  const keyword = readStringParam(params, 'keyword');
  const code = readStringParam(params, 'code');
  const name = readStringParam(params, 'name');
  const categoryId = readStringParam(params, 'categoryId');
  const baseType = readStringParam(params, 'baseType');
  const procurementType = readStringParam(params, 'procurementType');
  const isActive = normalizeBooleanFilter(params.isActive);

  return {
    ...fixed,
    keyword: fixed.keyword ?? keyword,
    code: fixed.code ?? code,
    name: fixed.name ?? name,
    categoryId: fixed.categoryId ?? categoryId,
    baseType: fixed.baseType ?? baseType,
    procurementType: fixed.procurementType ?? procurementType,
    isActive: fixed.isActive ?? isActive,
  };
}

function buildCategoryTreeData(
  categoryTree: MaterialCategoryNode[],
): MaterialCategoryTreeData[] {
  return [
    {
      key: ALL_MATERIAL_CATEGORIES_KEY,
      title: '全部物料',
      children: mapMaterialCategoryTree(categoryTree),
    },
  ];
}

function resolveUnitLabel(
  unit: string | null | undefined,
  unitLabelMap: Readonly<Record<string, string>> | undefined,
): string {
  const normalized = unit?.trim();
  if (!normalized) return '';
  return unitLabelMap?.[normalized] ?? normalized;
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves host material picker selection and stock behavior while catalog, category, customer-stock, and pagination services stay host injected.
 */
export function MaterialTablePicker<
  TMaterial extends MaterialPickerRecord = MaterialPickerRecord,
>({
  value,
  values,
  selectedRecords,
  mode = 'single',
  onChange,
  onValuesChange,
  open,
  onOpenChange,
  trigger,
  buttonProps,
  title,
  placeholder,
  disabled = false,
  width = DEFAULT_WIDTH,
  quantityLabel,
  requestParams,
  customerId,
}: MaterialTablePickerProps<TMaterial>) {
  const { message } = App.useApp();
  const capabilities = useMaterialTablePickerCapabilities();
  const messageRef = useRef(message);
  messageRef.current = message;
  const actionRef = useRef<ActionType>(undefined);
  const [innerOpen, setInnerOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : innerOpen;
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('catalog');
  const [categoryTree, setCategoryTree] = useState<MaterialCategoryNode[]>([]);
  const [categoryTreeLoading, setCategoryTreeLoading] = useState(false);
  const [activeCategoryKey, setActiveCategoryKey] = useState(
    ALL_MATERIAL_CATEGORIES_KEY,
  );
  const [catalogKeyword, setCatalogKeyword] = useState('');
  const [catalogKeywordDraft, setCatalogKeywordDraft] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number | null>
  >({});
  const selectedRecordsRef = useRef(new Map<string, TMaterial>());
  const quantityEnabled = mode === 'multiple' && Boolean(quantityLabel);

  const setPickerOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setInnerOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) return;
    const initialKeys =
      mode === 'multiple' ? (values ?? []) : value ? [value] : [];
    setSelectedRowKeys(initialKeys);
    setActiveTab('catalog');
    setActiveCategoryKey(ALL_MATERIAL_CATEGORIES_KEY);
    setCatalogKeyword('');
    setCatalogKeywordDraft('');
    setSelectedQuantities(
      Object.fromEntries(initialKeys.map((materialId) => [materialId, 1])),
    );
    selectedRecordsRef.current = new Map(
      (selectedRecords ?? []).map((record) => [record.id, record]),
    );
  }, [isOpen, mode, selectedRecords, value, values]);

  useEffect(() => {
    if (!isOpen || !capabilities?.requestCategoryTree) return;

    let cancelled = false;
    const loadCategoryTree = async () => {
      setCategoryTreeLoading(true);
      try {
        const tree = await capabilities.requestCategoryTree({
          includeInactive: false,
        });
        if (!cancelled) setCategoryTree(tree ?? []);
      } catch {
        if (!cancelled) {
          setCategoryTree([]);
          messageRef.current.error('加载物料业务分类失败');
        }
      } finally {
        if (!cancelled) setCategoryTreeLoading(false);
      }
    };

    void loadCategoryTree();
    return () => {
      cancelled = true;
    };
  }, [capabilities, isOpen]);

  const rememberRecord = useCallback((record: TMaterial) => {
    selectedRecordsRef.current.set(record.id, record);
  }, []);

  const selectSingleRecord = useCallback(
    (record: TMaterial) => {
      rememberRecord(record);
      setSelectedRowKeys([record.id]);
    },
    [rememberRecord],
  );

  const toggleMultipleRecord = useCallback(
    (record: TMaterial, selected: boolean) => {
      rememberRecord(record);
      setSelectedRowKeys((current) => {
        if (selected) {
          return current.includes(record.id)
            ? current
            : [...current, record.id];
        }
        selectedRecordsRef.current.delete(record.id);
        return current.filter((id) => id !== record.id);
      });
      setSelectedQuantities((current) => {
        if (selected) {
          return Object.hasOwn(current, record.id)
            ? current
            : { ...current, [record.id]: 1 };
        }
        const { [record.id]: _removed, ...next } = current;
        return next;
      });
    },
    [rememberRecord],
  );

  const updateSelectedQuantity = useCallback(
    (materialId: string, quantity: number | null) => {
      setSelectedQuantities((current) => ({
        ...current,
        [materialId]: quantity,
      }));
    },
    [],
  );

  const selectedMaterials = useMemo(
    () =>
      selectedRowKeys
        .map((id) => selectedRecordsRef.current.get(id))
        .filter((record): record is TMaterial => Boolean(record)),
    [selectedRowKeys],
  );

  const stockQtySummary = useMemo<StockQtySummaryItem[]>(() => {
    if (!quantityEnabled) return [];
    const byUnit = new Map<string, StockQtySummaryItem>();
    for (const material of selectedMaterials) {
      const unitLabel =
        resolveUnitLabel(material.unit, capabilities?.unitLabelMap) ||
        material.unit ||
        '-';
      const entry = byUnit.get(unitLabel) ?? {
        unitLabel,
        stockQty: 0,
        orderQty: 0,
      };
      entry.stockQty += Number(material.currentStockQty ?? 0);
      const quantity = readSelectedQuantity(selectedQuantities, material.id);
      entry.orderQty +=
        quantity && Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
      byUnit.set(unitLabel, entry);
    }
    return [...byUnit.values()];
  }, [
    capabilities?.unitLabelMap,
    quantityEnabled,
    selectedMaterials,
    selectedQuantities,
  ]);

  const categoryTreeData = useMemo(
    () => buildCategoryTreeData(categoryTree),
    [categoryTree],
  );
  const activeCategory = useMemo(
    () =>
      activeCategoryKey === ALL_MATERIAL_CATEGORIES_KEY
        ? undefined
        : findMaterialCategoryTreeNode(categoryTree, activeCategoryKey),
    [activeCategoryKey, categoryTree],
  );
  const categoryFilterParams = useMemo(() => {
    if (!activeCategory) return {};
    return activeCategory.isSystem
      ? { baseType: activeCategory.baseType }
      : { categoryId: activeCategory.id };
  }, [activeCategory]);
  const catalogFilterParams = useMemo(
    () => ({ ...categoryFilterParams, keyword: catalogKeyword || undefined }),
    [catalogKeyword, categoryFilterParams],
  );

  const columns = useMemo<ProColumns<TMaterial>[]>(() => {
    const materialColumns: ProColumns<TMaterial>[] = [
      {
        title: '物料名称',
        dataIndex: 'name',
        search: false,
        width: 190,
        ellipsis: true,
      },
      {
        title: '物料编码',
        dataIndex: 'code',
        search: false,
        width: 170,
        copyable: true,
        ellipsis: true,
      },
      ...(quantityEnabled && quantityLabel
        ? [
            {
              title: quantityLabel,
              dataIndex: '__quantity',
              search: false,
              width: 120,
              render: (_: React.ReactNode, record: TMaterial) => (
                <InputNumber
                  aria-label={`${record.name ?? ''}${quantityLabel}`}
                  disabled={!selectedRowKeys.includes(record.id)}
                  min={0}
                  precision={4}
                  step={1}
                  value={readSelectedQuantity(selectedQuantities, record.id)}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(nextValue) =>
                    updateSelectedQuantity(record.id, nextValue)
                  }
                />
              ),
            },
          ]
        : []),
      {
        title: '实时库存',
        dataIndex: 'currentStockQty',
        search: false,
        width: 110,
        align: 'right',
        render: (_value, record) => formatStockQty(record.currentStockQty),
      },
      {
        title: '规格型号',
        dataIndex: 'spec',
        search: false,
        width: 180,
        ellipsis: true,
        render: (_value, record) => record.spec || '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        search: false,
        width: 90,
        render: (_value, record) =>
          resolveUnitLabel(record.unit, capabilities?.unitLabelMap) || '-',
      },
      createMaterialThumbnailColumn<TMaterial>(),
    ];
    return materialColumns;
  }, [
    capabilities?.unitLabelMap,
    quantityEnabled,
    quantityLabel,
    selectedQuantities,
    selectedRowKeys,
    updateSelectedQuantity,
  ]);

  const request = useMemo<NonNullable<ProTableProps<TMaterial, Record<string, unknown>>['request']>>(
    () =>
      async (params) => {
        if (!capabilities?.requestMaterials) {
          return { data: [], success: false, total: 0 };
        }
        const current =
          typeof params.current === 'number' ? params.current : 1;
        const pageSize =
          typeof params.pageSize === 'number' ? params.pageSize : 20;
        const requestBody = {
          page: current,
          pageSize,
          ...createMaterialListParams(params, requestParams),
        } as MaterialTablePickerListRequest;
        const response = await capabilities.requestMaterials(requestBody);
        const rows = (response?.list ?? []) as TMaterial[];
        if (!customerId || rows.length === 0) {
          return {
            data: rows,
            total: response?.total ?? 0,
            success: true,
          };
        }
        try {
          const summary = await capabilities.requestCustomerStockSummary({
            materialIds: rows.map((row) => row.id),
            customerId,
          });
          const availableById = new Map(
            (summary?.items ?? []).map((item) => [
              item.materialId,
              item.availableQty,
            ]),
          );
          return {
            data: rows.map((row) => ({
              ...row,
              currentStockQty:
                availableById.get(row.id) ?? row.currentStockQty,
            })) as TMaterial[],
            total: response?.total ?? 0,
            success: true,
          };
        } catch {
          return {
            data: rows,
            total: response?.total ?? 0,
            success: true,
          };
        }
      },
    [capabilities, customerId, requestParams],
  );

  const rowSelection = useMemo<TableRowSelection<TMaterial>>(() => {
    if (mode === 'multiple') {
      return {
        type: 'checkbox',
        preserveSelectedRowKeys: true,
        selectedRowKeys,
        onSelect: (record, selected) => toggleMultipleRecord(record, selected),
        onSelectAll: (selected, _selectedRows, changedRows) => {
          changedRows.forEach((record) => {
            toggleMultipleRecord(record, selected);
          });
        },
      };
    }
    return {
      type: 'radio',
      selectedRowKeys,
      onSelect: (record) => selectSingleRecord(record),
    };
  }, [mode, selectSingleRecord, selectedRowKeys, toggleMultipleRecord]);

  const handleConfirm = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择物料');
      return;
    }
    if (mode === 'multiple') {
      const records = selectedRowKeys
        .map((id) => selectedRecordsRef.current.get(id))
        .filter((record): record is TMaterial => Boolean(record));
      if (quantityEnabled && quantityLabel) {
        const selections: MaterialTablePickerSelection<TMaterial>[] = [];
        for (const material of records) {
          const quantity = readSelectedQuantity(
            selectedQuantities,
            material.id,
          );
          if (
            quantity === null ||
            !Number.isFinite(quantity) ||
            quantity <= 0
          ) {
            message.warning(`${quantityLabel}必须大于 0`);
            setActiveTab('catalog');
            return;
          }
          selections.push({ material, quantity });
        }
        onValuesChange?.(selectedRowKeys, records, selections);
      } else {
        onValuesChange?.(selectedRowKeys, records);
      }
    } else {
      const selectedId = selectedRowKeys[0];
      onChange?.(selectedId, selectedRecordsRef.current.get(selectedId));
    }
    setPickerOpen(false);
  }, [
    message,
    mode,
    onChange,
    onValuesChange,
    quantityEnabled,
    quantityLabel,
    selectedQuantities,
    selectedRowKeys,
    setPickerOpen,
  ]);

  const handleOpen = () => {
    if (!disabled) setPickerOpen(true);
  };
  const removeSelectedRecord = useCallback(
    (record: TMaterial) => toggleMultipleRecord(record, false),
    [toggleMultipleRecord],
  );

  const selectedColumns = useMemo<ProColumns<TMaterial>[]>(
    () => [
      { title: '物料名称', dataIndex: 'name', ellipsis: true },
      { title: '物料编码', dataIndex: 'code', copyable: true, width: 180 },
      ...(quantityEnabled && quantityLabel
        ? [
            {
              title: quantityLabel,
              dataIndex: '__quantity',
              width: 120,
              render: (_: React.ReactNode, record: TMaterial) => (
                <InputNumber
                  aria-label={`${record.name ?? ''}${quantityLabel}`}
                  min={0}
                  precision={4}
                  step={1}
                  value={readSelectedQuantity(selectedQuantities, record.id)}
                  onChange={(nextValue) =>
                    updateSelectedQuantity(record.id, nextValue)
                  }
                />
              ),
            },
          ]
        : []),
      {
        title: '实时库存',
        dataIndex: 'currentStockQty',
        width: 110,
        align: 'right',
        render: (_value, record) => formatStockQty(record.currentStockQty),
      },
      {
        title: '规格型号',
        dataIndex: 'spec',
        width: 180,
        render: (_value, record) => record.spec || '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 90,
        render: (_value, record) =>
          resolveUnitLabel(record.unit, capabilities?.unitLabelMap) || '-',
      },
      createMaterialThumbnailColumn<TMaterial>(),
      {
        title: '操作',
        key: 'actions',
        dataIndex: '__actions',
        valueType: 'option',
        width: 90,
        render: (_value, record) => (
          <Button
            type="link"
            danger
            onClick={() => removeSelectedRecord(record)}
          >
            移除
          </Button>
        ),
      },
    ],
    [
      capabilities?.unitLabelMap,
      quantityEnabled,
      quantityLabel,
      removeSelectedRecord,
      selectedQuantities,
      updateSelectedQuantity,
    ],
  );

  return (
    <>
      {trigger ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleOpen}
          style={{
            padding: 0,
            border: 0,
            background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {trigger}
        </button>
      ) : (
        <Button {...buttonProps} disabled={disabled} onClick={handleOpen}>
          {placeholder ?? (mode === 'multiple' ? '批量选择物料' : '选择物料')}
        </Button>
      )}
      <Modal
        className="mes-material-table-picker-modal"
        title={title ?? (mode === 'multiple' ? '批量选择物料' : '选择物料')}
        open={isOpen}
        width={width}
        destroyOnHidden={false}
        styles={{
          body: {
            height: PICKER_BODY_HEIGHT,
            padding: '12px 16px 12px 0',
            overflow: 'hidden',
          },
        }}
        onCancel={() => setPickerOpen(false)}
        footer={
          <Space wrap>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              已选择 {selectedRowKeys.length} 条
            </span>
            {stockQtySummary.length > 0 ? (
              <>
                <span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                  实时库存合计：
                  {formatQtySummary(stockQtySummary, (item) => item.stockQty)}
                </span>
                <span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                  订购数量合计：
                  {formatQtySummary(stockQtySummary, (item) => item.orderQty)}
                </span>
              </>
            ) : null}
            <Button onClick={() => setPickerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleConfirm}>
              确定
            </Button>
          </Space>
        }
      >
        {!capabilities ? (
          <Empty description="物料选择器服务未配置" />
        ) : (
          <div className="mes-material-table-picker">
            <aside
              aria-label="业务分类筛选"
              className="mes-material-table-picker__type-filter"
            >
              <div className="mes-material-table-picker__type-filter-title">
                业务分类
              </div>
              <Spin spinning={categoryTreeLoading} size="small">
                <Tree
                  defaultExpandAll
                  selectedKeys={[activeCategoryKey]}
                  treeData={categoryTreeData}
                  onSelect={(selectedKeys) => {
                    const selectedKey = selectedKeys[0];
                    setActiveCategoryKey(
                      typeof selectedKey === 'string'
                        ? selectedKey
                        : ALL_MATERIAL_CATEGORIES_KEY,
                    );
                  }}
                />
              </Spin>
            </aside>
            <div className="mes-material-table-picker__content">
              <Tabs
                className="mes-material-table-picker__tabs"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'catalog',
                    label: '物料目录',
                    children: (
                      <div className="mes-material-table-picker__panel">
                        <div className="mes-material-table-picker__catalog-search">
                          <Input.Search
                            allowClear
                            aria-label="搜索物料名称或编码"
                            placeholder="搜索物料名称或编码"
                            value={catalogKeywordDraft}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setCatalogKeywordDraft(nextValue);
                              if (!nextValue) setCatalogKeyword('');
                            }}
                            onSearch={(searchValue) =>
                              setCatalogKeyword(searchValue.trim())
                            }
                          />
                        </div>
                        <ProTable<TMaterial>
                          actionRef={actionRef}
                          rowKey="id"
                          columns={columns}
                          request={request}
                          params={catalogFilterParams}
                          rowSelection={rowSelection}
                          tableAlertOptionRender={false}
                          pagination={capabilities.pagination}
                          search={false}
                          options={false}
                          cardBordered={false}
                          dateFormatter="string"
                          fitContainerHeight={{
                            bottomOffset: 0,
                            maxBodyHeight: PICKER_TABLE_MAX_BODY_HEIGHT,
                          }}
                          onRow={(record) => ({
                            onClick: () => {
                              if (mode === 'single') selectSingleRecord(record);
                            },
                            onDoubleClick: () => {
                              if (mode === 'multiple') {
                                toggleMultipleRecord(
                                  record,
                                  !selectedRowKeys.includes(record.id),
                                );
                              }
                            },
                          })}
                        />
                      </div>
                    ),
                  },
                  ...(mode === 'multiple'
                    ? [
                        {
                          key: 'selected',
                          label: `已选物料 (${selectedRowKeys.length})`,
                          children:
                            selectedMaterials.length > 0 ? (
                              <div className="mes-material-table-picker__panel">
                                <ProTable<TMaterial>
                                  rowKey="id"
                                  columns={selectedColumns}
                                  dataSource={selectedMaterials}
                                  search={false}
                                  pagination={false}
                                  options={false}
                                  cardBordered={false}
                                  fitContainerHeight={{
                                    bottomOffset: 0,
                                    maxBodyHeight: PICKER_TABLE_MAX_BODY_HEIGHT,
                                  }}
                                />
                              </div>
                            ) : (
                              <Empty description="暂未选择物料" />
                            ),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
