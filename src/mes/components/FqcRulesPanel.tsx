import { PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  ModalForm,
  ProFormDependency,
  type ProFormInstance,
  ProFormSelect,
  type ProFormSelectProps,
  type ProColumns,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, Form, Input, Space } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CrudListWorkbench } from '../../components/CrudListWorkbench';
import { PageHeader } from '../../components/PageHeader';
import { MaterialSelectField, materialSelectColumnProps } from './MaterialFilteredSelect';
import { PermissionButton } from './PermissionButton';
import { ResizableProTable } from './ResizableTable';
import type {
  FqcControlRuleRecord,
  FqcLotFormationMode,
  FqcRuleFormValues,
  FqcRuleMutationPayload,
  FqcRulesConfigEntryLabelProps,
  FqcRulesDictionaryOption,
  FqcRulesHealth,
  FqcRulesPanelCapabilities,
  FqcRulesPanelProps,
  FqcRulesSelectOption,
} from './fqc-rules-panel-types';

type FqcProFormSelectRequest = NonNullable<ProFormSelectProps['request']>;

const SCROLLABLE_RULE_FORM_MODAL = {
  centered: true,
  styles: {
    body: {
      maxHeight: 'calc(100vh - 200px)',
      overflowX: 'hidden' as const,
      overflowY: 'auto' as const,
    },
  },
};

function toValueEnum<TValue extends string | boolean>(
  options: readonly FqcRulesDictionaryOption<TValue>[],
) {
  return Object.fromEntries(
    options.map((option) => [
      String(option.value),
      {
        text: option.label,
        status: option.status,
        color: option.color,
      },
    ]),
  );
}

function hasSelectedValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function hasSearchKeyword(params: Record<string, unknown>): boolean {
  return ['keyWords', 'keyword', 'search', 'searchText'].some((key) => {
    const value = params[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

interface FqcRulesConfigurableSelectProps {
  name: string;
  label: string;
  target: FqcRulesConfigEntryLabelProps['target'];
  request: (params?: { keyWords?: string }) => Promise<FqcRulesSelectOption[]>;
  renderConfigEntryLabel: FqcRulesPanelCapabilities['renderConfigEntryLabel'];
}

/** Mirrors the source configurable selector's empty-list entry and focus-return refresh. */
function FqcRulesConfigurableSelect({
  name,
  label,
  target,
  request: sourceRequest,
  renderConfigEntryLabel,
}: FqcRulesConfigurableSelectProps) {
  const form = Form.useFormInstance();
  const currentValue = Form.useWatch(name, form);
  const [showConfigEntry, setShowConfigEntry] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestIdRef = useRef(0);
  const probeRequestIdRef = useRef(0);
  const refreshAfterConfigRef = useRef(false);
  const sourceRequestRef = useRef(sourceRequest);
  sourceRequestRef.current = sourceRequest;

  useEffect(() => {
    if (hasSelectedValue(currentValue)) {
      setShowConfigEntry(false);
      return undefined;
    }

    let active = true;
    const requestId = ++probeRequestIdRef.current;
    void sourceRequestRef
      .current({})
      .then((options) => {
        if (active && requestId === probeRequestIdRef.current) {
          setShowConfigEntry(options.length === 0);
        }
      })
      .catch(() => {
        if (active && requestId === probeRequestIdRef.current) {
          setShowConfigEntry(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentValue]);

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  const request = useCallback<FqcProFormSelectRequest>(
    async (...args) => {
      const params = (args[0] ?? {}) as Record<string, unknown>;
      const requestId = ++requestIdRef.current;
      const keyWords =
        typeof params.keyWords === 'string' ? params.keyWords : undefined;
      try {
        const options = await sourceRequestRef.current({ keyWords });
        if (requestId === requestIdRef.current && !hasSearchKeyword(params)) {
          setShowConfigEntry(options.length === 0 && !hasSelectedValue(currentValue));
        }
        return options;
      } catch (error) {
        if (requestId === requestIdRef.current) setShowConfigEntry(false);
        throw error;
      }
    },
    [currentValue],
  );

  const renderedLabel = renderConfigEntryLabel({
    target,
    children: label,
    show: showConfigEntry && !hasSelectedValue(currentValue),
    onOpen: () => {
      refreshAfterConfigRef.current = true;
    },
  });

  return (
    <ProFormSelect
      name={name}
      label={renderedLabel}
      messageVariables={{ label }}
      showSearch
      debounceTime={300}
      request={request}
      params={{ fqcConfigEntryRefreshVersion: refreshVersion }}
      fieldProps={{
        filterOption: false,
        notFoundContent: '暂无可选数据',
      }}
    />
  );
}

function createSelectedMaterialOption(
  record: FqcControlRuleRecord | undefined,
) {
  const material = record?.material;
  if (!material) return undefined;
  const label = [material.code, material.name].filter(Boolean).join(' ');
  return {
    label,
    value: material.id,
    code: material.code,
    name: material.name,
  };
}

function resolveSortQuery(sort?: Record<string, unknown>) {
  const activeSort = Object.entries(sort ?? {}).find(
    ([, value]) => value === 'ascend' || value === 'descend',
  );
  if (!activeSort) return {};
  return {
    orderBy: activeSort[0],
    orderDir: activeSort[1] === 'ascend' ? ('ASC' as const) : ('DESC' as const),
  };
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain quality-fqc-control-rules
 * @sunxu-reason Preserves FQC rule health, mutually exclusive material scope filters, remote option fields and CRUD actions while the host supplies APIs, permission results, dictionaries, routing and message effects.
 * @sunxu-page list
 */
export function FqcRulesPanel({
  capabilities,
  layout = 'page',
}: FqcRulesPanelProps) {
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;
  const actionRef = useRef<ActionType>(undefined);
  const listFormRef = useRef<ProFormInstance | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FqcControlRuleRecord>();
  const [health, setHealth] = useState<FqcRulesHealth>();
  const [keyword, setKeyword] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');

  const refreshHealth = useCallback(async () => {
    setHealth(await capabilitiesRef.current.requestHealth());
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const openCreate = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const openEdit = (record: FqcControlRuleRecord) => {
    setEditing(record);
    setOpen(true);
  };

  const handleListFilterValuesChange = (
    changedValues: Record<string, unknown>,
  ) => {
    const form = listFormRef.current;
    if (!form) return;
    if (changedValues.materialId) {
      form.setFieldValue('familyId', undefined);
    } else if (changedValues.familyId) {
      form.setFieldValue('materialId', undefined);
    }
  };

  const handleFinish = async (values: FqcRuleFormValues) => {
    const { scopeType, ...rest } = values;
    const payload: FqcRuleMutationPayload = {
      ...rest,
      materialId:
        scopeType === 'material' ? (rest.materialId ?? undefined) : undefined,
      familyId:
        capabilities.familyManagementVisible && scopeType === 'family'
          ? (rest.familyId ?? undefined)
          : undefined,
    };
    if (editing) {
      await capabilitiesRef.current.updateRule({
        ...payload,
        id: editing.id,
      });
    } else {
      const createPayload = { ...payload };
      delete createPayload.id;
      await capabilitiesRef.current.createRule(createPayload);
    }
    capabilitiesRef.current.notifySuccess(editing ? 'update' : 'create');
    setOpen(false);
    actionRef.current?.reload();
    void refreshHealth();
    return true;
  };

  const healthDescription =
    health && !health.healthy ? (
      <Alert
        type="error"
        showIcon
        message={`FQC配置存在${health.issues.length}项错误`}
        description={health.issues
          .map((issue) => `${issue.ruleCode}：${issue.message}`)
          .join('；')}
      />
    ) : undefined;

  const initialValues: Partial<FqcRuleFormValues> = editing
    ? {
        ...editing,
        scopeType:
          capabilities.familyManagementVisible && !editing.materialId
            ? 'family'
            : 'material',
      }
    : {
        isActive: true,
        lotFormationMode: 'work_order_completed',
        receiptGateMode: 'non_blocking',
        scopeType: 'material',
      };

  const workbench = (
    <CrudListWorkbench<FqcControlRuleRecord>
      as="section"
      layout={layout}
      search={
        <Input.Search
          aria-label="关键字搜索"
          allowClear
          placeholder="规则编码或物料搜索"
          value={keywordDraft}
          style={{ width: 'clamp(160px, 20vw, 256px)' }}
          onChange={(event) => {
            const value = event.target.value;
            setKeywordDraft(value);
            if (!value) setKeyword('');
          }}
          onSearch={(value) => setKeyword(value.trim())}
        />
      }
      toolbarActions={
        <Space size={8} wrap>
          <PermissionButton
            type="primary"
            permission={capabilities.permissions.create}
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            新增
          </PermissionButton>
          <ModalForm<FqcRuleFormValues>
            title={editing ? '编辑' : '新增'}
            open={open}
            modalProps={{
              destroyOnHidden: true,
              ...SCROLLABLE_RULE_FORM_MODAL,
              onCancel: () => setOpen(false),
            }}
            initialValues={initialValues}
            onFinish={handleFinish}
          >
            <ProFormText
              name="code"
              label="规则编码"
              placeholder="不填则自动生成"
            />
            <ProFormText
              name="name"
              label="规则名称"
              rules={[{ required: true }]}
            />
            <ProFormSelect
              name="scopeType"
              label="适用范围"
              initialValue="material"
              options={[
                { label: '具体物料', value: 'material' },
                ...(capabilities.familyManagementVisible
                  ? [{ label: '物料系列', value: 'family' }]
                  : []),
              ]}
              rules={[{ required: true }]}
            />
            <ProFormDependency name={['scopeType']}>
              {({ scopeType }) =>
                scopeType === 'material' ? (
                  <MaterialSelectField
                    name="materialId"
                    label="物料"
                    rules={[{ required: true }]}
                    request={capabilities.requestMaterialOptions}
                    selectedOption={createSelectedMaterialOption(editing)}
                    placeholder="搜索物料编码或名称"
                  />
                ) : scopeType === 'family' && capabilities.familyManagementVisible ? (
                  <FqcRulesConfigurableSelect
                    name="familyId"
                    label="物料系列"
                    target="materialFamilies"
                    request={capabilities.requestFamilyOptions}
                    renderConfigEntryLabel={capabilities.renderConfigEntryLabel}
                  />
                ) : null
              }
            </ProFormDependency>
            <FqcRulesConfigurableSelect
              name="templateId"
              label="FQC质检模板"
              target="qualityTemplate"
              request={capabilities.requestTemplateOptions}
              renderConfigEntryLabel={capabilities.renderConfigEntryLabel}
            />
            <ProFormSelect
              name="lotFormationMode"
              label="检验批形成方式"
              options={[...capabilities.dictionaries.lotFormationModes]}
              rules={[{ required: true }]}
            />
            <ProFormSelect
              name="receiptGateMode"
              label="入库放行模式"
              options={[...capabilities.dictionaries.receiptGateModes]}
              rules={[{ required: true }]}
              extra="无适用规则的物料不会生成FQC，也不会阻断入库；只有选择“合格后方可入库”的命中规则才校验FQC覆盖。"
            />
            <ProFormSwitch name="isActive" label="启用" />
          </ModalForm>
        </Space>
      }
      proTableSearch={{ labelWidth: 'auto' }}
      fill
      tableProps={{ rowKey: 'id', columns: [] }}
      renderTable={(tableProps) => (
        <ResizableProTable<FqcControlRuleRecord>
          {...tableProps}
          actionRef={actionRef}
          formRef={listFormRef}
          form={{ onValuesChange: handleListFilterValuesChange }}
          params={keyword ? { keyword } : {}}
          request={async (rawParams, sort) => {
            const params = rawParams as Record<string, unknown>;
            const current = typeof params.current === 'number' ? params.current : 1;
            const pageSize =
              typeof params.pageSize === 'number' ? params.pageSize : 20;
            const query = {
              page: current,
              pageSize,
              ...resolveSortQuery(sort),
              ...(typeof params.keyword === 'string'
                ? { keyword: params.keyword }
                : {}),
              ...(typeof params.materialId === 'string'
                ? { materialId: params.materialId }
                : {}),
              ...(typeof params.familyId === 'string'
                ? { familyId: params.familyId }
                : {}),
              ...(typeof params.lotFormationMode === 'string'
                ? {
                    lotFormationMode:
                      params.lotFormationMode as FqcLotFormationMode,
                  }
                : {}),
              ...(typeof params.receiptGateMode === 'string'
                ? {
                    receiptGateMode:
                      params.receiptGateMode as 'non_blocking' | 'blocking',
                  }
                : {}),
              ...(typeof params.isActive === 'boolean'
                ? { isActive: params.isActive }
                : {}),
            };
            const result = await capabilitiesRef.current.requestRules(query);
            return {
              data: [...(result.list ?? [])],
              total: result.total ?? 0,
              success: true,
            };
          }}
          columns={[
            {
              title: '关键词',
              dataIndex: 'keyword',
              hideInTable: true,
              search: false,
            },
            {
              title: '适用物料',
              dataIndex: 'materialId',
              hideInTable: true,
              ...materialSelectColumnProps(
                capabilities.requestMaterialOptions,
                '输入物料名称或编码搜索',
              ),
            },
            ...(capabilities.familyManagementVisible
              ? [
                  {
                    title: '适用物料系列',
                    dataIndex: 'familyId',
                    hideInTable: true,
                    valueType: 'select' as const,
                    debounceTime: 300,
                    request: capabilities.requestFamilyOptions,
                    fieldProps: {
                      showSearch: true,
                      filterOption: false,
                      fetchDataOnSearch: true,
                      placeholder: '输入物料系列名称或编码搜索',
                    },
                  },
                ]
              : []),
            {
              title: '规则编码',
              dataIndex: 'code',
              width: 150,
              search: false,
            },
            {
              title: '规则名称',
              dataIndex: 'name',
              width: 180,
              search: false,
            },
            {
              title: '适用范围',
              search: false,
              render: (_value, record) =>
                record.material?.name ??
                record.family?.name ??
                '历史无范围规则（已停用）',
            },
            {
              title: '入库放行',
              dataIndex: 'receiptGateMode',
              valueType: 'select',
              valueEnum: toValueEnum(capabilities.dictionaries.receiptGateModes),
            },
            {
              title: '形成方式',
              dataIndex: 'lotFormationMode',
              valueType: 'select',
              valueEnum: toValueEnum(capabilities.dictionaries.lotFormationModes),
            },
            {
              title: 'FQC模板',
              search: false,
              render: (_value, record) => record.template?.name ?? '-',
            },
            {
              title: '状态',
              dataIndex: 'isActive',
              valueType: 'select',
              valueEnum: toValueEnum(capabilities.dictionaries.activeStates),
            },
            {
              title: '操作',
              key: 'actions',
              dataIndex: '__actions',
              valueType: 'option',
              render: (_value, record) => (
                <Space>
                  {capabilities.familyManagementVisible || record.materialId ? (
                    <PermissionButton
                      type="link"
                      size="small"
                      permission={capabilities.permissions.update}
                      onClick={() => openEdit(record)}
                    >
                      编辑
                    </PermissionButton>
                  ) : null}
                  <PermissionButton
                    type="link"
                    size="small"
                    danger
                    permission={capabilities.permissions.delete}
                    confirm={{
                      title: capabilities.messages.deleteConfirmTitle,
                      danger: true,
                    }}
                    onConfirm={() =>
                      capabilitiesRef.current.removeRule({ id: record.id })
                    }
                    successMessage={capabilities.messages.deleteSuccess}
                    onSuccess={() => actionRef.current?.reload()}
                  >
                    删除
                  </PermissionButton>
                </Space>
              ),
            },
          ] satisfies ProColumns<FqcControlRuleRecord>[]}
        />
      )}
    />
  );

  return (
    <>
      {layout === 'page' ? <PageHeader title="FQC 检验批规则" /> : null}
      {healthDescription}
      {workbench}
    </>
  );
}

export default FqcRulesPanel;
