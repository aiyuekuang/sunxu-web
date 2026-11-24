import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Space } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RemoteSelect } from '../../components/RemoteSelect';
import { MaterialFilteredSelect } from './MaterialFilteredSelect';
import type {
  InspectionTemplateBinding,
  InspectionTemplateSummary,
  ProcessOperationInspectionMaterialOption,
  ProcessOperationInspectionRulesFormProps,
} from './process-operation-inspection-rules-types';

interface PendingBinding {
  key: string;
  materialId?: string;
  templateId?: string;
}

/** Returns whether at least one direct default-template binding is present. */
export function hasDefaultInspectionTemplateBinding(
  bindings?: InspectionTemplateBinding[],
): boolean {
  return (bindings ?? []).some(
    (binding) =>
      !binding.materialId &&
      !binding.routeApplicabilityId &&
      Boolean(binding.templateId),
  );
}

function templateLabel(template: InspectionTemplateSummary): string {
  return `${template.code ?? template.id} - ${template.name ?? 'IPQC模板'}`;
}

function materialSelectedOption(
  binding: InspectionTemplateBinding,
): ProcessOperationInspectionMaterialOption | undefined {
  const material = binding.material;
  if (!material || material.id !== binding.materialId) return undefined;
  return {
    value: material.id,
    label: `${material.code ?? material.id} - ${material.name ?? '物料'}`,
    title: material.name ?? material.code ?? material.id,
    code: material.code,
    name: material.name,
    spec: material.spec,
    unit: material.unit,
  };
}

function toDirectBindings(
  bindings: InspectionTemplateBinding[] | undefined,
): InspectionTemplateBinding[] {
  const direct = new Map<string, InspectionTemplateBinding>();
  for (const binding of bindings ?? []) {
    // Historical route-condition rules are preserved, but never rendered as direct bindings.
    if (binding.routeApplicabilityId) continue;
    const key = binding.materialId ?? '__default__';
    if (!direct.has(key)) {
      direct.set(key, {
        materialId: binding.materialId ?? null,
        material: binding.material ?? null,
        templateId: binding.templateId,
      });
    }
  }
  return [...direct.values()];
}

function toLegacyBindings(
  bindings: InspectionTemplateBinding[] | undefined,
): InspectionTemplateBinding[] {
  return (bindings ?? []).flatMap((binding) =>
    binding.routeApplicabilityId
      ? [
          {
            routeApplicabilityId: binding.routeApplicabilityId,
            templateId: binding.templateId,
          },
        ]
      : [],
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain process-routes
 * @sunxu-reason Preserves default and material-specific IPQC template bindings and read-only legacy route rules while template/material requests, configuration links, field help, and feedback remain host supplied.
 *
 * Controlled form field for process/standard-operation inspection-template rules.
 */
export function ProcessOperationInspectionRulesForm({
  value,
  onChange,
  disabled = false,
  capabilities,
}: ProcessOperationInspectionRulesFormProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<
    Map<string, InspectionTemplateSummary>
  >(new Map());
  const [searchTemplates, setSearchTemplates] = useState<
    InspectionTemplateSummary[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [templateBaseLoaded, setTemplateBaseLoaded] = useState(false);
  const [templateBaseEmpty, setTemplateBaseEmpty] = useState(false);
  const [templateSearchKeyword, setTemplateSearchKeyword] = useState('');
  const [materialBaseEmpty, setMaterialBaseEmpty] = useState(false);
  const [materialRequestVersion, setMaterialRequestVersion] = useState(0);
  const refreshMaterialAfterConfigRef = useRef(false);
  const refreshTemplateAfterConfigRef = useRef(false);
  const [pendingBindings, setPendingBindings] = useState<PendingBinding[]>([]);
  const templateRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const bindings = useMemo(() => toDirectBindings(value), [value]);
  const legacyBindings = useMemo(() => toLegacyBindings(value), [value]);
  const defaultBinding = bindings.find((binding) => !binding.materialId);
  const materialBindings = bindings.filter((binding) => !!binding.materialId);
  const hasLegacyBindings = (value ?? []).some(
    (binding) => !!binding.routeApplicabilityId,
  );

  useEffect(() => {
    const missingTemplateIds = Array.from(
      new Set(
        bindings
          .map((binding) => binding.templateId)
          .filter((templateId) => !selectedTemplates.has(templateId)),
      ),
    );
    if (missingTemplateIds.length === 0) return;

    const requestId = ++templateRequestIdRef.current;
    void Promise.all(
      missingTemplateIds.map((templateId) =>
        capabilities.loadTemplateDetail(templateId),
      ),
    ).then((templates) => {
      if (templateRequestIdRef.current !== requestId) return;
      setSelectedTemplates((current) => {
        const next = new Map(current);
        templates.forEach((template) => next.set(template.id, template));
        return next;
      });
    });
  }, [bindings, capabilities, selectedTemplates]);

  const requestTemplates = async (keyword = ''): Promise<void> => {
    const normalizedKeyword = keyword.trim();
    setTemplateSearchKeyword(normalizedKeyword);
    if (!normalizedKeyword) {
      setTemplateBaseLoaded(false);
      setTemplateBaseEmpty(false);
    }
    const requestId = ++searchRequestIdRef.current;
    setIsSearching(true);
    try {
      const response = await capabilities.listTemplates({
        page: 1,
        pageSize: 50,
        keyword: normalizedKeyword,
        type: 'ipqc',
        isActive: true,
      });
      if (searchRequestIdRef.current === requestId) {
        const templates = response?.list ?? [];
        setSearchTemplates(templates);
        if (!normalizedKeyword) {
          setTemplateBaseEmpty(templates.length === 0);
          setTemplateBaseLoaded(true);
        }
      }
    } finally {
      if (searchRequestIdRef.current === requestId) setIsSearching(false);
    }
  };

  const requestTemplatesRef = useRef(requestTemplates);
  requestTemplatesRef.current = requestTemplates;

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (refreshMaterialAfterConfigRef.current) {
        refreshMaterialAfterConfigRef.current = false;
        setMaterialRequestVersion((version) => version + 1);
      }
      if (refreshTemplateAfterConfigRef.current) {
        refreshTemplateAfterConfigRef.current = false;
        void requestTemplatesRef.current();
      }
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  const templateOptions = useMemo(() => {
    const templates = new Map<string, InspectionTemplateSummary>(
      selectedTemplates,
    );
    searchTemplates.forEach((template) => templates.set(template.id, template));
    return [...templates.values()].map((template) => ({
      value: template.id,
      label: templateLabel(template),
    }));
  }, [searchTemplates, selectedTemplates]);

  const refreshTemplateOptions = (): void => {
    setSearchTemplates([]);
    void requestTemplates();
  };

  const updateBindings = (next: InspectionTemplateBinding[]): void => {
    onChange?.([...legacyBindings, ...next]);
    refreshTemplateOptions();
  };

  const updateDefaultTemplate = (templateId: string | undefined): void => {
    const next = materialBindings.map((binding) => ({ ...binding }));
    if (templateId) next.unshift({ templateId });
    updateBindings(next);
  };

  const updateMaterialTemplate = (
    materialId: string,
    templateId: string | undefined,
  ): void => {
    const next = bindings.filter((binding) => binding.materialId !== materialId);
    if (templateId) next.push({ materialId, templateId });
    updateBindings(next);
  };

  const updatePendingBinding = (
    key: string,
    patch: Partial<PendingBinding>,
  ): void => {
    setPendingBindings((current) => {
      const next = current.map((binding) =>
        binding.key === key ? { ...binding, ...patch } : binding,
      );
      const candidate = next.find((binding) => binding.key === key);
      if (!candidate?.materialId || !candidate.templateId) return next;
      if (
        materialBindings.some(
          (binding) => binding.materialId === candidate.materialId,
        )
      ) {
        capabilities.notifyError('该物料已经配置了 IPQC 专属模板');
        return next.map((binding) =>
          binding.key === key ? { ...binding, materialId: undefined } : binding,
        );
      }
      updateBindings([
        ...bindings,
        {
          materialId: candidate.materialId,
          templateId: candidate.templateId,
        },
      ]);
      return next.filter((binding) => binding.key !== key);
    });
  };

  const renderTemplateSelect = (
    label: string,
    templateId: string | undefined,
    onSelect: (next: string | undefined) => void,
    placeholder: string,
  ) => (
    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
      {capabilities.renderConfigEntryFieldLabel({
        target: 'qualityTemplate',
        label,
        show:
          !disabled &&
          templateBaseLoaded &&
          templateBaseEmpty &&
          !templateSearchKeyword &&
          !templateId,
        onOpen: () => {
          refreshTemplateAfterConfigRef.current = true;
        },
      })}
      <RemoteSelect<string>
        value={templateId}
        options={templateOptions}
        disabled={disabled}
        loading={isSearching}
        placeholder={placeholder}
        searchDebounceTime={300}
        style={{ width: '100%' }}
        onSearch={(keyword) => void requestTemplates(keyword)}
        onChange={onSelect}
        onFocus={() => {
          if (searchTemplates.length === 0 && !isSearching) {
            void requestTemplates();
          }
        }}
      />
    </Space>
  );

  const renderMaterialLabel = (show: boolean) =>
    capabilities.renderConfigEntryFieldLabel({
      target: 'material',
      label: '适配物料',
      show: !disabled && show,
      onOpen: () => {
        refreshMaterialAfterConfigRef.current = true;
      },
    });

  return (
    <Form.Item
      label="IPQC 模板"
      required
      extra="先选默认模板；可按单个物料新增专属模板。工单创建时优先命中物料专属模板，未命中则冻结默认模板。"
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        {hasLegacyBindings ? (
          <Alert
            type="warning"
            showIcon
            message="检测到历史条件模板规则"
            description="系统会继续兼容历史规则；本次保存的默认模板和物料专属模板不会修改这些历史条件。"
          />
        ) : null}
        {renderTemplateSelect(
          '默认 IPQC 模板',
          defaultBinding?.templateId,
          updateDefaultTemplate,
          '搜索编码或名称，选择默认 IPQC 模板',
        )}

        {materialBindings.map((binding) => (
          <Space
            key={binding.materialId}
            align="start"
            wrap
            style={{ display: 'flex', width: '100%' }}
          >
            <Space orientation="vertical" size={4} style={{ width: 260 }}>
              {capabilities.renderConfigEntryFieldLabel({
                target: 'material',
                label: '适配物料',
                show: !disabled && materialBaseEmpty && !binding.materialId,
                onOpen: () => {
                  refreshMaterialAfterConfigRef.current = true;
                },
              })}
              <MaterialFilteredSelect
                request={capabilities.requestMaterials}
                requestKey={String(materialRequestVersion)}
                value={binding.materialId ?? undefined}
                selectedOption={materialSelectedOption(binding)}
                disabled={disabled}
                placeholder="适配物料"
                filterMode="hidden"
                selectWidth="100%"
                onBaseOptionsEmptyChange={setMaterialBaseEmpty}
                onChange={(nextMaterialId) => {
                  if (!nextMaterialId || nextMaterialId === binding.materialId) {
                    return;
                  }
                  if (
                    materialBindings.some(
                      (item) => item.materialId === nextMaterialId,
                    )
                  ) {
                    capabilities.notifyError('该物料已经配置了 IPQC 专属模板');
                    return;
                  }
                  const next = bindings.filter(
                    (item) => item.materialId !== binding.materialId,
                  );
                  next.push({
                    materialId: nextMaterialId,
                    templateId: binding.templateId,
                  });
                  updateBindings(next);
                }}
              />
            </Space>
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderTemplateSelect(
                '物料专属 IPQC 模板',
                binding.templateId,
                (templateId) =>
                  updateMaterialTemplate(binding.materialId ?? '', templateId),
                '选择该物料的 IPQC 模板',
              )}
            </div>
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              disabled={disabled}
              aria-label="删除物料专属模板"
              onClick={() =>
                updateBindings(
                  bindings.filter(
                    (item) => item.materialId !== binding.materialId,
                  ),
                )
              }
            />
          </Space>
        ))}

        {pendingBindings.map((binding) => (
          <Space
            key={binding.key}
            align="start"
            wrap
            style={{ display: 'flex', width: '100%' }}
          >
            <Space orientation="vertical" size={4} style={{ width: 260 }}>
              {renderMaterialLabel(materialBaseEmpty && !binding.materialId)}
              <MaterialFilteredSelect
                request={capabilities.requestMaterials}
                requestKey={String(materialRequestVersion)}
                value={binding.materialId}
                disabled={disabled}
                placeholder="选择适配物料"
                filterMode="hidden"
                selectWidth="100%"
                onBaseOptionsEmptyChange={setMaterialBaseEmpty}
                onChange={(materialId) =>
                  updatePendingBinding(binding.key, { materialId })
                }
              />
            </Space>
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderTemplateSelect(
                '物料专属 IPQC 模板',
                binding.templateId,
                (templateId) =>
                  updatePendingBinding(binding.key, { templateId }),
                '选择该物料的 IPQC 模板',
              )}
            </div>
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              disabled={disabled}
              aria-label="取消新增物料专属模板"
              onClick={() =>
                setPendingBindings((current) =>
                  current.filter((item) => item.key !== binding.key),
                )
              }
            />
          </Space>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          disabled={disabled}
          onClick={() =>
            setPendingBindings((current) => [
              ...current,
              { key: `material-template-${Date.now()}-${current.length}` },
            ])
          }
        >
          新增物料专属模板
        </Button>
      </Space>
    </Form.Item>
  );
}
