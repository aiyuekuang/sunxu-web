import type { ActionType, ProColumns, ProFormRef } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Modal, Space, Tag } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import { MaterialSelectField, materialSelectColumnProps } from './MaterialFilteredSelect';
import { ResizableProTable } from './ResizableTable';
import type {
  MaterialPackageSpecRecord,
  PackageSpecManagerProps,
  PackageSpecWriteValues,
} from './package-management-types';

const DEFAULT_PAGINATION = {
  defaultCurrent: 1,
  defaultPageSize: 20,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50, 100],
};

/** @sunxu-component mes-specific @sunxu-domain warehouse-packaging @sunxu-reason Preserves MES package specification search, permission gated actions, validation and create/edit/delete flow while the host supplies data, permissions and help. */
export function PackageSpecManager({
  open,
  onOpenChange,
  capabilities,
}: PackageSpecManagerProps) {
  const tableRef = useRef<ActionType | undefined>(undefined);
  const formRef = useRef<ProFormRef<PackageSpecWriteValues> | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaterialPackageSpecRecord | null>(null);

  const requestMaterialOptions = useCallback(
    (params?: { keyWords?: string } & Record<string, unknown>) =>
      capabilities.requestMaterialOptions({
        keyWords: params?.keyWords,
        activeOnly: false,
      }),
    [capabilities.requestMaterialOptions],
  );
  const packageTypeValueEnum = useMemo(
    () => Object.fromEntries(
      capabilities.packageTypeOptions.map((option) => [String(option.value), { text: option.label }]),
    ),
    [capabilities.packageTypeOptions],
  );

  const openEdit = async (record: MaterialPackageSpecRecord) => {
    const detail = await capabilities.getSpec(record.id);
    setEditingRecord(detail);
    setFormOpen(true);
    requestAnimationFrame(() => {
      formRef.current?.setFieldsValue({
        id: detail.id,
        materialId: detail.materialId,
        packageType: detail.packageType,
        packageName: detail.packageName ?? undefined,
        capacityQty: detail.capacityQty,
        minQty: detail.minQty ?? undefined,
        maxQty: detail.maxQty ?? undefined,
        isDefault: detail.isDefault,
        isActive: detail.isActive,
        sortOrder: detail.sortOrder,
        remarks: detail.remarks ?? undefined,
      });
    });
  };

  const confirmDelete = (record: MaterialPackageSpecRecord) => {
    Modal.confirm({
      title: '删除包装规格',
      content: `确认删除规格「${record.packageName || record.packageType}」吗？`,
      onOk: async () => {
        await capabilities.deleteSpec(record.id);
        capabilities.notify.success('删除成功');
        tableRef.current?.reload();
      },
    });
  };

  const columns = useMemo<ProColumns<MaterialPackageSpecRecord>[]>(() => [
    {
      title: '物料档案',
      dataIndex: 'materialId',
      hideInTable: true,
      ...materialSelectColumnProps(requestMaterialOptions, '搜索物料档案'),
    },
    {
      title: '物料名称', dataIndex: ['material', 'name'], search: false, width: 180,
      render: (_, record) => record.material?.name ?? '-',
    },
    {
      title: '物料编码', dataIndex: ['material', 'code'], search: false, width: 140,
      render: (_, record) => record.material?.code ?? '-',
    },
    { title: '包装类型', dataIndex: 'packageType', valueType: 'select', width: 110, valueEnum: packageTypeValueEnum },
    { title: '规格名称', dataIndex: 'packageName', width: 140 },
    { title: '标准箱规', dataIndex: 'capacityQty', search: false, width: 110 },
    { title: '最小值', dataIndex: 'minQty', search: false, width: 100 },
    { title: '最大值', dataIndex: 'maxQty', search: false, width: 100 },
    {
      title: '默认', dataIndex: 'isDefault', search: false, width: 80,
      render: (_, record) => record.isDefault ? <Tag color="success">默认</Tag> : '-',
    },
    {
      title: '启用', dataIndex: 'isActive', search: false, width: 80,
      render: (_, record) => record.isActive ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
    },
    {
      title: '创建时间', dataIndex: 'createdAt', search: false, width: 170,
      valueType: 'dateTime',
    },
    {
      title: '操作', valueType: 'option', key: 'option', fixed: 'right', width: 130,
      render: (_, record) => (
        <Space size="small">
          {capabilities.canUpdate ? (
            <Button type="link" size="small" onClick={() => void openEdit(record)}>
              编辑
            </Button>
          ) : null}
          {capabilities.canDelete ? (
            <Button type="link" size="small" danger onClick={() => confirmDelete(record)}>
              删除
            </Button>
          ) : null}
        </Space>
      ),
    },
  ], [capabilities.canDelete, capabilities.canUpdate, packageTypeValueEnum, requestMaterialOptions]);

  return (
    <>
      <Modal
        title="包装规格管理"
        open={open}
        width={1100}
        footer={null}
        destroyOnHidden
        onCancel={() => onOpenChange(false)}
      >
        <ResizableProTable<MaterialPackageSpecRecord>
          rowKey="id"
          columns={columns}
          actionRef={tableRef}
          pagination={capabilities.pagination ?? DEFAULT_PAGINATION}
          fitContainerHeight={false}
          request={async (params) => {
            const sort = Object.entries(params).find(([, value]) => value === 'ascend' || value === 'descend');
            const result = await capabilities.listSpecs({
              page: Number(params.current ?? 1),
              pageSize: Number(params.pageSize ?? 20),
              keyword: typeof params.keyword === 'string' ? params.keyword : undefined,
              materialId: typeof params.materialId === 'string' ? params.materialId : undefined,
              packageType: typeof params.packageType === 'string' ? params.packageType as MaterialPackageSpecRecord['packageType'] : undefined,
              packageName: typeof params.packageName === 'string' ? params.packageName : undefined,
              isActive: typeof params.isActive === 'boolean' ? params.isActive : undefined,
              orderBy: sort?.[0],
              orderDir: sort ? sort[1] === 'ascend' ? 'ASC' : 'DESC' : undefined,
            });
            return {
              data: result.list ?? [],
              success: true,
              total: result.total ?? result.list?.length ?? 0,
            };
          }}
          scroll={{ x: 1500 }}
          toolBarRender={() => [
            capabilities.canCreate ? (
              <Button
                key="create"
                type="primary"
                onClick={() => {
                  setEditingRecord(null);
                  formRef.current?.resetFields();
                  setFormOpen(true);
                }}
              >
                新增
              </Button>
            ) : null,
          ]}
        />
      </Modal>

      <ModalForm<PackageSpecWriteValues>
        title={editingRecord ? '编辑' : '新增'}
        formRef={formRef}
        open={formOpen}
        modalProps={{ destroyOnHidden: true }}
        onOpenChange={(nextOpen) => {
          setFormOpen(nextOpen);
          if (!nextOpen) {
            setEditingRecord(null);
            formRef.current?.resetFields();
          }
        }}
        onFinish={async (values) => {
          if (editingRecord) {
            await capabilities.updateSpec({ id: editingRecord.id, ...values });
            capabilities.notify.success('保存成功');
          } else {
            await capabilities.createSpec(values);
            capabilities.notify.success('创建成功');
          }
          tableRef.current?.reload();
          return true;
        }}
      >
        <MaterialSelectField
          name="materialId"
          {...capabilities.getFieldHelpProps('物料档案', 'specMaterialId')}
          rules={[{ required: true, message: '请选择物料' }]}
          disabled={Boolean(editingRecord)}
          request={(params) => capabilities.requestMaterialOptions({
            keyWords: params?.keyWords,
            activeOnly: !editingRecord,
          })}
        />
        <ProFormSelect
          name="packageType"
          {...capabilities.getFieldHelpProps('包装类型', 'specPackageType')}
          options={capabilities.packageTypeOptions}
          rules={[{ required: true, message: '请选择包装类型' }]}
        />
        <ProFormText name="packageName" {...capabilities.getFieldHelpProps('规格名称', 'specPackageName')} />
        <ProFormDigit
          name="capacityQty"
          {...capabilities.getFieldHelpProps('标准装箱数量', 'specCapacityQty')}
          min={0.0001}
          fieldProps={{ precision: 4 }}
          rules={[{ required: true, message: '请输入标准装箱数量' }]}
        />
        <ProFormDigit name="minQty" {...capabilities.getFieldHelpProps('最小值', 'specMinQty')} min={0} fieldProps={{ precision: 4 }} />
        <ProFormDigit name="maxQty" {...capabilities.getFieldHelpProps('最大值', 'specMaxQty')} min={0} fieldProps={{ precision: 4 }} />
        <ProFormDigit name="sortOrder" {...capabilities.getAutoFieldHelpProps('排序号')} min={0} fieldProps={{ precision: 0 }} />
        <ProFormSwitch name="isDefault" {...capabilities.getFieldHelpProps('默认规格', 'specIsDefault')} />
        <ProFormSwitch name="isActive" {...capabilities.getAutoFieldHelpProps('启用')} />
        <ProFormText name="remarks" {...capabilities.getAutoFieldHelpProps('备注')} />
      </ModalForm>
    </>
  );
}

export type { PackageSpecManagerCapabilities, PackageSpecManagerProps } from './package-management-types';
