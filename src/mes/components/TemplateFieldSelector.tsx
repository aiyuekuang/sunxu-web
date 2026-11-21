import {
  CloseOutlined,
  HolderOutlined,
  LockOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Input,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  TemplateCodeFieldOption,
  TemplateFieldSelectorCapabilities,
  TemplatePrintField,
} from './template-print-types';

export interface TemplateFieldSelectorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  businessType?: string;
  templateType?: string;
  layoutPreset?: string;
  disabled?: boolean;
  capabilities: TemplateFieldSelectorCapabilities;
}

const EMPTY_FIELD_PATHS: string[] = [];

const selectorWrapStyle: CSSProperties = {
  border: '1px solid var(--ant-color-border)',
  borderRadius: 8,
  overflow: 'hidden',
};

const selectorBodyStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  minHeight: 360,
};

const panelStyle: CSSProperties = {
  minWidth: 0,
  padding: 12,
};

const leftPanelStyle: CSSProperties = {
  ...panelStyle,
  borderInlineEnd: '1px solid var(--ant-color-border-secondary)',
};

const panelHeaderStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 8,
};

const fieldListStyle: CSSProperties = {
  maxHeight: 282,
  overflow: 'auto',
  paddingInlineEnd: 4,
};

const groupTitleStyle: CSSProperties = {
  color: 'var(--ant-color-text-secondary)',
  fontSize: 12,
  fontWeight: 600,
  margin: '12px 0 6px',
};

const fieldRowStyle: CSSProperties = {
  alignItems: 'center',
  borderRadius: 6,
  display: 'flex',
  gap: 8,
  minHeight: 34,
  padding: '5px 6px',
};

const selectedRowStyle: CSSProperties = {
  alignItems: 'center',
  background: 'var(--ant-color-fill-quaternary)',
  border: '1px solid var(--ant-color-border-secondary)',
  borderRadius: 6,
  display: 'flex',
  gap: 8,
  marginBottom: 8,
  minHeight: 38,
  padding: '6px 8px',
};

const selectedNameStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

function sameStringArray(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

function uniquePaths(paths: string[]) {
  return Array.from(new Set(paths.filter(Boolean)));
}

function isBarcodeContentField(
  field: TemplatePrintField,
  capabilities: TemplateFieldSelectorCapabilities,
) {
  return field.fieldPath === capabilities.fieldPathValues.barcode;
}

export function usesTemplateCodeField(
  templateType: string | undefined,
  layoutPreset: string | undefined,
  capabilities: TemplateFieldSelectorCapabilities,
) {
  return capabilities.isCodeLayout(templateType, layoutPreset);
}

export function filterSelectablePrintFields(
  fields: TemplatePrintField[],
  templateType: string | undefined,
  layoutPreset: string | undefined,
  capabilities: TemplateFieldSelectorCapabilities,
) {
  const { compactLabel, serialLabel, documentFlow } =
    capabilities.templateTypeValues;

  return fields.filter((field) => {
    if (!field.visible) return false;
    if (templateType === compactLabel || templateType === serialLabel) {
      if (field.isArray) return false;
      if (
        templateType === serialLabel &&
        field.fieldPath === capabilities.fieldPathValues.serialBarcode
      ) {
        return false;
      }
      return (
        !usesTemplateCodeField(templateType, layoutPreset, capabilities) ||
        !isBarcodeContentField(field, capabilities)
      );
    }
    if (templateType === documentFlow) {
      return !isBarcodeContentField(field, capabilities);
    }
    return true;
  });
}

export function toTemplateCodeFieldOptions(
  fields: TemplatePrintField[],
): TemplateCodeFieldOption[] {
  return fields
    .filter((field) => field.visible && !field.isArray)
    .map((field) => ({
      label: `${field.groupName} / ${field.fieldLabel}`,
      value: field.fieldPath,
    }));
}

function isPreferredField(
  field: TemplatePrintField,
  capabilities: TemplateFieldSelectorCapabilities,
) {
  if (field.requiredInTemplate) return true;
  if (field.fieldPath === capabilities.fieldPathValues.barcode) return false;
  return capabilities.preferredFieldPaths.includes(field.fieldPath);
}

function defaultSelectedFieldPaths(
  fields: TemplatePrintField[],
  templateType: string | undefined,
  capabilities: TemplateFieldSelectorCapabilities,
) {
  const { compactLabel, serialLabel } = capabilities.templateTypeValues;
  if (templateType === serialLabel) {
    return fields.some(
      (field) => field.fieldPath === capabilities.fieldPathValues.serialNumber,
    )
      ? [capabilities.fieldPathValues.serialNumber]
      : [];
  }

  const businessType = fields.find((field) => field.businessType)?.businessType;
  const required = fields
    .filter((field) => field.requiredInTemplate)
    .map((field) => field.fieldPath);
  const preferredLimit =
    templateType === compactLabel
      ? capabilities.defaultSelectionLimits.compactLabel
      : businessType === capabilities.businessTypeValues.workOrder
        ? capabilities.defaultSelectionLimits.workOrder
        : capabilities.defaultSelectionLimits.other;
  const preferred = fields
    .filter((field) => !field.requiredInTemplate && isPreferredField(field, capabilities))
    .slice(0, Math.max(preferredLimit - required.length, 0))
    .map((field) => field.fieldPath);
  const fallback = fields
    .filter((field) => !field.requiredInTemplate)
    .slice(
      0,
      Math.max(preferredLimit - required.length - preferred.length, 0),
    )
    .map((field) => field.fieldPath);
  return uniquePaths([...required, ...preferred, ...fallback]);
}

function groupFields(fields: TemplatePrintField[]) {
  const groups = new Map<string, TemplatePrintField[]>();
  for (const field of fields) {
    const groupName = field.groupName || '其他';
    groups.set(groupName, [...(groups.get(groupName) ?? []), field]);
  }
  return Array.from(groups.entries()).map(([groupName, groupFields]) => ({
    groupName,
    fields: groupFields,
  }));
}

function includesKeyword(field: TemplatePrintField, keyword: string) {
  if (!keyword) return true;
  const normalized = keyword.trim().toLowerCase();
  return (
    field.fieldLabel.toLowerCase().includes(normalized) ||
    field.fieldPath.toLowerCase().includes(normalized) ||
    field.groupName.toLowerCase().includes(normalized)
  );
}

function SortableSelectedField({
  field,
  locked,
  disabled,
  onRemove,
}: {
  field: TemplatePrintField;
  locked: boolean;
  disabled?: boolean;
  onRemove: (fieldPath: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.fieldPath, disabled });
  const style: CSSProperties = {
    ...selectedRowStyle,
    opacity: isDragging ? 0.72 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Button
        type="text"
        size="small"
        icon={<HolderOutlined />}
        disabled={disabled}
        aria-label={`拖动${field.fieldLabel}以调整打印顺序`}
        style={{ cursor: disabled ? 'not-allowed' : 'grab' }}
        {...attributes}
        {...listeners}
      />
      <div style={selectedNameStyle}>
        <Typography.Text ellipsis style={{ display: 'block' }}>
          {field.fieldLabel}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {field.groupName}
          {field.isArray ? ' / 明细列' : ''}
        </Typography.Text>
      </div>
      {locked ? (
        <Tooltip title="模板必选字段，不能移除">
          <Tag icon={<LockOutlined />} color="blue">
            必选
          </Tag>
        </Tooltip>
      ) : (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          disabled={disabled}
          aria-label={`移除${field.fieldLabel}`}
          onClick={() => onRemove(field.fieldPath)}
        />
      )}
    </div>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain print-templates
 * @sunxu-reason Shares searchable field selection and sortable print order while field requests and business enum/path policy come from the host.
 */
export function TemplateFieldSelector({
  value,
  onChange,
  businessType,
  templateType,
  layoutPreset,
  disabled,
  capabilities,
}: TemplateFieldSelectorProps) {
  const [fields, setFields] = useState<TemplatePrintField[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const selectedValue = value ?? EMPTY_FIELD_PATHS;

  useEffect(() => {
    let active = true;
    setFields([]);
    if (!businessType || !templateType) return;

    setLoading(true);
    capabilities
      .loadFields({ businessType, templateType })
      .then((rows) => {
        if (active) setFields(Array.isArray(rows) ? rows : []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [businessType, capabilities.loadFields, templateType]);

  const selectableFields = useMemo(
    () =>
      filterSelectablePrintFields(
        fields,
        templateType,
        layoutPreset,
        capabilities,
      ),
    [capabilities, fields, layoutPreset, templateType],
  );
  const fieldMap = useMemo(
    () => new Map(selectableFields.map((field) => [field.fieldPath, field])),
    [selectableFields],
  );
  const requiredPaths = useMemo(
    () =>
      selectableFields
        .filter((field) => field.requiredInTemplate)
        .map((field) => field.fieldPath),
    [selectableFields],
  );
  const requiredSet = useMemo(() => new Set(requiredPaths), [requiredPaths]);
  const selectedPaths = useMemo(() => {
    const selected = selectedValue.filter((fieldPath) =>
      fieldMap.has(fieldPath),
    );
    const selectedSet = new Set(selected);
    const missingRequired = requiredPaths.filter(
      (fieldPath) => !selectedSet.has(fieldPath),
    );
    return uniquePaths([...selected, ...missingRequired]);
  }, [fieldMap, requiredPaths, selectedValue]);
  const selectedSet = useMemo(() => new Set(selectedPaths), [selectedPaths]);
  const filteredGroups = useMemo(
    () =>
      groupFields(
        selectableFields.filter((field) => includesKeyword(field, keyword)),
      ),
    [keyword, selectableFields],
  );
  const selectedFields = useMemo(
    () =>
      selectedPaths
        .map((fieldPath) => fieldMap.get(fieldPath))
        .filter((field): field is TemplatePrintField => Boolean(field)),
    [fieldMap, selectedPaths],
  );

  useEffect(() => {
    if (
      !businessType ||
      !templateType ||
      loading ||
      selectableFields.length === 0
    ) {
      return;
    }
    const next =
      selectedValue.length > 0
        ? selectedPaths
        : defaultSelectedFieldPaths(selectableFields, templateType, capabilities);
    if (!sameStringArray(selectedValue, next)) {
      onChange?.(next);
    }
  }, [
    businessType,
    capabilities,
    loading,
    onChange,
    selectableFields,
    selectedPaths,
    selectedValue,
    templateType,
  ]);

  const updateSelected = useCallback(
    (next: string[]) => {
      onChange?.(
        uniquePaths(next.filter((fieldPath) => fieldMap.has(fieldPath))),
      );
    },
    [fieldMap, onChange],
  );

  const toggleField = useCallback(
    (fieldPath: string) => {
      if (disabled) return;
      if (selectedSet.has(fieldPath)) {
        if (requiredSet.has(fieldPath)) return;
        updateSelected(selectedPaths.filter((path) => path !== fieldPath));
        return;
      }
      updateSelected([...selectedPaths, fieldPath]);
    },
    [disabled, requiredSet, selectedPaths, selectedSet, updateSelected],
  );

  const handleRemove = useCallback(
    (fieldPath: string) => {
      if (requiredSet.has(fieldPath)) return;
      updateSelected(selectedPaths.filter((path) => path !== fieldPath));
    },
    [requiredSet, selectedPaths, updateSelected],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = selectedPaths.indexOf(String(active.id));
      const newIndex = selectedPaths.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      updateSelected(arrayMove(selectedPaths, oldIndex, newIndex));
    },
    [selectedPaths, updateSelected],
  );

  if (!businessType || !templateType) {
    return (
      <div style={selectorWrapStyle}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="先选择适用单据和模板类型"
          style={{ margin: 32 }}
        />
      </div>
    );
  }

  return (
    <div style={selectorWrapStyle}>
      <Alert
        type="info"
        showIcon
        banner
        message={`当前模板可选 ${selectableFields.length} 个字段，已选 ${selectedPaths.length} 个；必选字段会自动保留，可拖拽调整打印顺序。`}
      />
      <Spin spinning={loading}>
        <div style={selectorBodyStyle}>
          <div style={leftPanelStyle}>
            <div style={panelHeaderStyle}>
              <Typography.Text strong>可选字段</Typography.Text>
              <Typography.Text type="secondary">
                {selectableFields.length}
              </Typography.Text>
            </div>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索字段名称、路径或分组"
              aria-label="搜索字段名称、路径或分组"
              value={keyword}
              disabled={disabled}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <div style={fieldListStyle}>
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div key={group.groupName}>
                    <div style={groupTitleStyle}>{group.groupName}</div>
                    {group.fields.map((field) => (
                      <div key={field.fieldPath} style={fieldRowStyle}>
                        <Checkbox
                          checked={selectedSet.has(field.fieldPath)}
                          aria-label={`选择字段：${field.fieldLabel}`}
                          disabled={
                            disabled || requiredSet.has(field.fieldPath)
                          }
                          onChange={() => toggleField(field.fieldPath)}
                        />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <Typography.Text
                            ellipsis
                            style={{ display: 'block' }}
                          >
                            {field.fieldLabel}
                          </Typography.Text>
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                          >
                            {field.fieldPath}
                          </Typography.Text>
                        </span>
                        <Space size={4}>
                          {field.isArray ? <Tag>明细</Tag> : null}
                          {field.requiredInTemplate ? (
                            <Tag color="blue">必选</Tag>
                          ) : null}
                        </Space>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="没有匹配字段"
                  style={{ marginTop: 48 }}
                />
              )}
            </div>
          </div>
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <Typography.Text strong>已选字段顺序</Typography.Text>
              <Typography.Text type="secondary">
                {selectedPaths.length}
              </Typography.Text>
            </div>
            {selectedFields.length > 0 ? (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedPaths}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={fieldListStyle}>
                    {selectedFields.map((field) => (
                      <SortableSelectedField
                        key={field.fieldPath}
                        field={field}
                        locked={requiredSet.has(field.fieldPath)}
                        disabled={disabled}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="从左侧选择要打印的字段"
                style={{ marginTop: 76 }}
              />
            )}
          </div>
        </div>
      </Spin>
    </div>
  );
}
