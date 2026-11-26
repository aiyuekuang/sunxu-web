import {
  CalculatorOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  FieldStringOutlined,
  FunctionOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { ProFormTextArea } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mergeDocumentModalStyles } from '../../documentModalStyles';
import type {
  FormulaCustomFieldDefinition,
  FormulaDataType,
  FormulaDesignerProps,
  FormulaFormSchema,
  FormulaReferenceField,
} from '../manufacturing/formula-designer-types';

// 后端静态推断的结果类型（number/text/boolean/date）到中文标签。
const RESULT_TYPE_LABELS: Record<string, string> = {
  number: '数字',
  text: '文本',
  boolean: '布尔',
  date: '日期',
};

// 把声明的数据类型归类到与 resultType 同一套四类，用于「结果类型与声明是否相符」比对。
function classifyDeclaredType(
  dataType?: FormulaDataType,
): 'number' | 'text' | 'boolean' | 'date' | null {
  if (!dataType) return null;
  if (dataType === 'number' || dataType === 'decimal' || dataType === 'money') {
    return 'number';
  }
  if (dataType === 'boolean') return 'boolean';
  if (dataType === 'date' || dataType === 'datetime') return 'date';
  return 'text';
}

// 从 previewFormula 返回（Record<string, any>）安全取字符串字段，空串按无值处理。
function readResultString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

type FormulaFunction = {
  name: string;
  signature: string;
  description: string;
  template: string;
  example: string;
};

type FormulaOperator = {
  token: string;
  label: string;
  description: string;
};

type FormulaLibraryTab = 'fields' | 'functions' | 'operators';

const FORMULA_LIBRARY_TAB_KEYS: FormulaLibraryTab[] = [
  'fields',
  'functions',
  'operators',
];

const DATA_TYPE_LABELS: Record<FormulaDataType, string> = {
  text: '文本',
  long_text: '长文本',
  number: '数字',
  decimal: '小数',
  money: '金额',
  boolean: '布尔',
  date: '日期',
  datetime: '日期时间',
  select: '单选',
  multi_select: '多选',
  file: '文件',
  image: '图片',
  user_ref: '用户',
  department_ref: '部门',
};

const FORMULA_FUNCTIONS: FormulaFunction[] = [
  {
    name: 'if',
    signature: 'if(condition, trueValue, falseValue)',
    description: '按条件返回不同结果。',
    template: 'if(condition, trueValue, falseValue)',
    example: 'if(cf_passed, "合格", "不合格")',
  },
  {
    name: 'coalesce',
    signature: '空值按指定值计算（coalesce）',
    description: '字段未填写时使用后面的值。',
    template: 'coalesce(value1, value2)',
    example: 'coalesce(cf_pack_fee, 0)',
  },
  {
    name: 'round',
    signature: 'round(value, scale)',
    description: '按小数位四舍五入。',
    template: 'round(value, 2)',
    example: 'round(cf_width * cf_height / 1000, 2)',
  },
  {
    name: 'floor',
    signature: 'floor(value)',
    description: '向下取整。',
    template: 'floor(value)',
    example: 'floor(cf_qty)',
  },
  {
    name: 'ceil',
    signature: 'ceil(value)',
    description: '向上取整。',
    template: 'ceil(value)',
    example: 'ceil(cf_qty)',
  },
  {
    name: 'abs',
    signature: 'abs(value)',
    description: '取绝对值。',
    template: 'abs(value)',
    example: 'abs(cf_offset)',
  },
  {
    name: 'min',
    signature: 'min(value1, value2, ...)',
    description: '取最小数字。',
    template: 'min(value1, value2)',
    example: 'min(cf_regular_price, cf_sale_price)',
  },
  {
    name: 'max',
    signature: 'max(value1, value2, ...)',
    description: '取最大数字。',
    template: 'max(value1, value2)',
    example: 'max(cf_width, cf_height)',
  },
  {
    name: 'concat',
    signature: 'concat(value1, value2, ...)',
    description: '拼接文本。',
    template: 'concat(value1, value2)',
    example: 'concat(code, "-", cf_material_grade)',
  },
  {
    name: 'dateDiff',
    signature: 'dateDiff(date1, date2, unit)',
    description: '计算日期差，unit 支持 day/hour/minute。',
    template: 'dateDiff(date1, date2, "day")',
    example: 'dateDiff(updatedAt, createdAt, "day")',
  },
];

const FORMULA_OPERATORS: FormulaOperator[] = [
  { token: '+', label: '+', description: '加' },
  { token: '-', label: '-', description: '减或负数' },
  { token: '*', label: '*', description: '乘' },
  { token: '/', label: '/', description: '除' },
  { token: '%', label: '%', description: '取余' },
  { token: '>', label: '>', description: '大于' },
  { token: '>=', label: '>=', description: '大于等于' },
  { token: '<', label: '<', description: '小于' },
  { token: '<=', label: '<=', description: '小于等于' },
  { token: '==', label: '==', description: '等于' },
  { token: '!=', label: '!=', description: '不等于' },
  { token: 'and', label: 'and', description: '并且' },
  { token: 'or', label: 'or', description: '或者' },
  { token: 'not', label: 'not', description: '非' },
  { token: '(', label: '(', description: '左括号' },
  { token: ')', label: ')', description: '右括号' },
  { token: ',', label: ',', description: '函数参数分隔' },
  { token: '""', label: '""', description: '文本值' },
];

// The original workbench styles lived in the host application global stylesheet.
// Keep the isolated suite component self-contained without requiring a global CSS entry.
const FORMULA_DESIGNER_STYLES = `
.sxw-formula-designer { margin-bottom: 16px; }
.sxw-formula-actions { margin-top: -8px; }
.sxw-formula-preview-summary { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--sxw-border-subtle, var(--ant-color-border-secondary, #f0f0f0)); border-radius: 6px; background: var(--sxw-bg-elevated, var(--ant-color-bg-container, #fff)); }
.sxw-formula-workbench { display: grid; grid-template-columns: 300px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); height: clamp(540px, 72vh, 680px); }
.sxw-formula-workbench-collapsed { grid-template-columns: 56px minmax(0, 1fr); }
.sxw-formula-library { display: flex; flex-direction: column; min-width: 0; overflow: hidden; border-right: 1px solid var(--sxw-border-subtle, var(--ant-color-border-secondary, #f0f0f0)); background: var(--sxw-bg-elevated, var(--ant-color-bg-container, #fff)); }
.sxw-formula-library-header { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 8px 12px; border-bottom: 1px solid var(--sxw-border-subtle, var(--ant-color-border-secondary, #f0f0f0)); }
.sxw-formula-workbench-collapsed .sxw-formula-library-header { justify-content: center; padding: 8px; }
.sxw-formula-library-icons { display: grid; gap: 8px; justify-content: center; padding: 10px 8px; }
.sxw-formula-library-icons .ant-btn { width: 40px; height: 40px; }
.sxw-formula-library .ant-tabs { flex: none; padding: 0 12px; }
.sxw-formula-library .ant-tabs-nav { margin-bottom: 10px; }
.sxw-formula-library > .ant-input-affix-wrapper { flex: none; width: calc(100% - 24px); margin: 0 12px; }
.sxw-formula-library-content { flex: 1; min-height: 0; padding: 12px; overflow: auto; }
.sxw-formula-library-loading { min-height: 160px; }
.sxw-formula-library-groups { width: 100%; }
.sxw-formula-token-list, .sxw-formula-function-list { display: grid; gap: 4px; margin: 6px 0 14px; }
.sxw-formula-operator-panel { display: flex; flex-wrap: wrap; gap: 6px; }
.sxw-formula-operator-panel .ant-btn { min-width: 34px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
.sxw-formula-token-list .ant-btn, .sxw-formula-function-list .ant-btn { height: auto; min-height: 44px; padding: 8px 10px; text-align: left; white-space: normal; }
.sxw-formula-disabled-token { display: block; }
.sxw-formula-token-list .ant-btn > span, .sxw-formula-function-list .ant-btn > span { display: grid; gap: 2px; width: 100%; }
.sxw-formula-token-main { color: rgba(0, 0, 0, .88); font-size: 13px; line-height: 1.4; }
.sxw-formula-token-meta { color: rgba(0, 0, 0, .45); font-size: 12px; line-height: 1.4; }
.sxw-formula-editor-panel { display: flex; flex-direction: column; gap: 12px; min-width: 0; padding: 16px; overflow: auto; background: var(--ant-color-bg-container, #fff); }
.sxw-formula-editor-header { display: flex; gap: 12px; align-items: center; justify-content: space-between; }
.sxw-formula-editor-panel .ant-input { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
.sxw-formula-editor-preview { padding: 12px; border: 1px solid var(--sxw-border-subtle, var(--ant-color-border-secondary, #f0f0f0)); border-radius: 6px; background: var(--sxw-bg-elevated, var(--ant-color-bg-container, #fff)); }
.sxw-formula-editor-preview-body { margin-top: 10px; }
@media (max-width: 768px) {
  .sxw-formula-modal { max-width: calc(100vw - 16px); }
  .sxw-formula-workbench, .sxw-formula-workbench-collapsed { grid-template-columns: minmax(0, 1fr); grid-template-rows: none; height: auto; min-height: 0; max-height: none; }
  .sxw-formula-library { max-height: 260px; border-right: 0; border-bottom: 1px solid var(--sxw-border-subtle, var(--ant-color-border-secondary, #f0f0f0)); }
  .sxw-formula-workbench-collapsed .sxw-formula-library { max-height: 56px; }
  .sxw-formula-library-icons { display: flex; justify-content: flex-start; padding: 0 8px 8px; }
  .sxw-formula-editor-panel { min-height: 360px; }
}
`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function formatPreviewValue(value: unknown) {
  if (value === undefined) return '-';
  if (value === null) return '空值';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string' || typeof value === 'number')
    return String(value);
  return JSON.stringify(value);
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (isRecord(error) && typeof error.message === 'string')
    return error.message;
  return '公式预览失败';
}

function appendExpression(expression: string | undefined, token: string) {
  const current = (expression ?? '').trimEnd();
  if (!current) return token;
  if (/[(,+\-*/%<>=]\s*$/.test(current)) return `${current}${token}`;
  return `${current} ${token}`;
}

function insertExpressionAtCursor(
  expression: string,
  token: string,
  start?: number,
  end?: number,
) {
  if (typeof start !== 'number' || typeof end !== 'number') {
    const nextExpression = appendExpression(expression, token);
    return { expression: nextExpression, cursor: nextExpression.length };
  }

  const before = expression.slice(0, start);
  const after = expression.slice(end);
  const leadingSpace =
    before.length > 0 && !/[\s([{,+\-*/%<>=]$/.test(before) ? ' ' : '';
  const trailingSpace =
    after.length > 0 && !/^[\s)\],+\-*/%<>=]/.test(after) ? ' ' : '';
  const nextExpression = `${before}${leadingSpace}${token}${trailingSpace}${after}`;

  return {
    expression: nextExpression,
    cursor: before.length + leadingSpace.length + token.length,
  };
}

function sampleValueForField(
  field: Pick<FormulaReferenceField, 'key' | 'label' | 'dataType'>,
) {
  if (
    field.dataType === 'number' ||
    field.dataType === 'decimal' ||
    field.dataType === 'money'
  ) {
    if (/width|宽/.test(`${field.key}${field.label}`)) return 20;
    if (/height|高/.test(`${field.key}${field.label}`)) return 30;
    if (/length|长/.test(`${field.key}${field.label}`)) return 100;
    return 1;
  }
  if (field.dataType === 'boolean') return true;
  if (field.dataType === 'date') return '2026-06-03';
  if (field.dataType === 'datetime') return '2026-06-03T08:00:00+08:00';
  return `${field.label}样例`;
}

function isFormulaLibraryTab(value: string): value is FormulaLibraryTab {
  return FORMULA_LIBRARY_TAB_KEYS.includes(value as FormulaLibraryTab);
}

function matchesKeyword(parts: Array<string | undefined>, keyword: string) {
  if (!keyword) return true;
  return parts.some((part) => part?.toLowerCase().includes(keyword));
}

function buildFormulaFields(
  schema: FormulaFormSchema | null,
  currentFieldKey?: string,
  options?: {
    systemFields?: FormulaReferenceField[];
    customFieldFilter?: (field: FormulaCustomFieldDefinition) => boolean;
  },
): FormulaReferenceField[] {
  const systemFields =
    options?.systemFields ??
    schema?.systemFields?.map<FormulaReferenceField>((field) => ({
      key: field.key,
      label: field.label,
      dataType: field.dataType,
      source: 'system',
    })) ??
    [];

  const customFields =
    schema?.fields?.flatMap<FormulaReferenceField>((field) => {
      if (options?.customFieldFilter && !options.customFieldFilter(field)) {
        return [];
      }
      if (field.fieldKind === 'formula') {
        return [
          {
            key: field.fieldKey,
            label: field.label,
            dataType: field.dataType,
            source: 'custom',
            disabled: true,
            disabledReason:
              field.fieldKey === currentFieldKey
                ? '计算属性不能引用自身'
                : '当前暂不支持引用其他计算属性',
          },
        ];
      }
      if (field.dataType === 'multi_select') {
        return [
          {
            key: field.fieldKey,
            label: field.label,
            dataType: field.dataType,
            source: 'custom',
            disabled: true,
            disabledReason: '多选字段当前不能稳定参与公式计算',
          },
        ];
      }
      return [
        {
          key: field.fieldKey,
          label: field.label,
          dataType: field.dataType,
          source: 'custom',
        },
      ];
    }) ?? [];

  return [...systemFields, ...customFields];
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps formula authoring, sample evaluation, dependency/type diagnostics, and expression normalization together while schema, evaluation, permission outcome, and error wording stay host supplied.
 */
export default function FormulaDesigner({
  objectType,
  currentFieldKey,
  expression,
  fieldName = 'formulaExpression',
  label = '公式',
  placeholder = '例如：round(cf_width * cf_height / 1000, 2)',
  required = true,
  dataType,
  systemFields,
  customFieldFilter,
  availableFunctionNames,
  availableOperatorTokens,
  getReferenceExpression,
  getExpression,
  setExpression,
  disabled = false,
  capabilities,
}: FormulaDesignerProps) {
  const expressionText = typeof expression === 'string' ? expression : '';
  const formulaInputRef = useRef<TextAreaRef>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [schema, setSchema] = useState<FormulaFormSchema | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [previewValue, setPreviewValue] = useState<unknown>(undefined);
  const [dependencyKeys, setDependencyKeys] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [resultType, setResultType] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [normalizedExpression, setNormalizedExpression] = useState<
    string | null
  >(null);
  const [readableExpression, setReadableExpression] = useState<string | null>(
    null,
  );
  const [designerOpen, setDesignerOpen] = useState(false);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] =
    useState<FormulaLibraryTab>('fields');
  const [libraryKeyword, setLibraryKeyword] = useState('');
  const [draftExpression, setDraftExpression] = useState(expressionText);

  useEffect(() => {
    setDraftExpression(expressionText);
  }, [expressionText]);

  useEffect(() => {
    setPreviewValue(undefined);
    setDependencyKeys([]);
    setPreviewError(null);
    setResultType(null);
    setTypeError(null);
    setNormalizedExpression(null);
    setReadableExpression(null);
    setLibraryKeyword('');
    setActiveLibraryTab('fields');
    if (!objectType) {
      setSchema(null);
      setSchemaError(null);
      return;
    }
    setLoading(true);
    setSchemaError(null);
    void capabilities.requestFormSchema({ objectType })
      .then((nextSchema) => {
        setSchema(nextSchema ?? null);
      })
      .catch((error) => {
        setSchema(null);
        setSchemaError(
          capabilities.getErrorMessage(error, '字段加载失败') ||
            readErrorMessage(error),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [capabilities, objectType]);

  const formulaFields = useMemo(
    () =>
      buildFormulaFields(schema, currentFieldKey, {
        systemFields,
        customFieldFilter,
      }),
    [currentFieldKey, customFieldFilter, schema, systemFields],
  );

  const sampleData = useMemo(
    () =>
      Object.fromEntries(
        formulaFields
          .filter((field) => !field.disabled)
          .map((field) => [field.key, sampleValueForField(field)]),
      ),
    [formulaFields],
  );

  const updateExpression = useCallback(
    (nextExpression: string) => {
      setDraftExpression(nextExpression);
      setExpression(nextExpression);
    },
    [setExpression],
  );

  useEffect(() => {
    if (!designerOpen) return;
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      formulaInputRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [designerOpen]);

  const insertToken = useCallback(
    (token: string) => {
      const currentExpression = getExpression();
      const currentText =
        typeof currentExpression === 'string'
          ? currentExpression
          : draftExpression;
      const textArea = formulaInputRef.current?.resizableTextArea?.textArea;
      const inserted = insertExpressionAtCursor(
        currentText,
        token,
        textArea?.selectionStart,
        textArea?.selectionEnd,
      );
      updateExpression(inserted.expression);
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          formulaInputRef.current?.focus();
          formulaInputRef.current?.resizableTextArea?.textArea.setSelectionRange(
            inserted.cursor,
            inserted.cursor,
          );
        }, 0);
      }
    },
    [draftExpression, getExpression, updateExpression],
  );

  const handlePreview = useCallback(async () => {
    if (!objectType) {
      setPreviewError('请先选择适用单据/档案');
      return;
    }
    const currentExpression = String(
      getExpression() ?? draftExpression ?? '',
    ).trim();
    if (!currentExpression) {
      setPreviewError('请先填写公式');
      return;
    }

    setPreviewing(true);
    setPreviewError(null);
    try {
      const result = await capabilities.previewFormula({
        objectType,
        expression: currentExpression,
        sampleData,
      });
      setPreviewValue(result.value);
      setDependencyKeys(readStringArray(result.dependencyKeys));
      setResultType(readResultString(result.resultType));
      setTypeError(readResultString(result.typeError));
      setNormalizedExpression(readResultString(result.normalizedExpression));
      setReadableExpression(readResultString(result.readableExpression));
    } catch (error) {
      setPreviewValue(undefined);
      setDependencyKeys([]);
      setResultType(null);
      setTypeError(null);
      setNormalizedExpression(null);
      setReadableExpression(null);
      setPreviewError(
        capabilities.getErrorMessage(error, '公式预览失败') ||
          readErrorMessage(error),
      );
    } finally {
      setPreviewing(false);
    }
  }, [capabilities, draftExpression, getExpression, objectType, sampleData]);

  // 整理公式：把编辑框内容替换为后端返回的统一空格版本（需先成功预览一次）。
  const handleNormalize = useCallback(() => {
    if (!normalizedExpression) return;
    updateExpression(normalizedExpression);
  }, [normalizedExpression, updateExpression]);

  const formulaSystemFields = useMemo(
    () => formulaFields.filter((field) => field.source === 'system'),
    [formulaFields],
  );
  const customFields = useMemo(
    () => formulaFields.filter((field) => field.source === 'custom'),
    [formulaFields],
  );
  const normalizedKeyword = libraryKeyword.trim().toLowerCase();
  const filteredSystemFields = useMemo(
    () =>
      formulaSystemFields.filter((field) =>
        matchesKeyword(
          [
            field.key,
            field.label,
            DATA_TYPE_LABELS[field.dataType],
            field.disabledReason,
          ],
          normalizedKeyword,
        ),
      ),
    [formulaSystemFields, normalizedKeyword],
  );
  const filteredCustomFields = useMemo(
    () =>
      customFields.filter((field) =>
        matchesKeyword(
          [
            field.key,
            field.label,
            DATA_TYPE_LABELS[field.dataType],
            field.disabledReason,
          ],
          normalizedKeyword,
        ),
      ),
    [customFields, normalizedKeyword],
  );
  const filteredFunctions = useMemo(
    () =>
      FORMULA_FUNCTIONS.filter((item) => {
        if (
          availableFunctionNames &&
          !availableFunctionNames.includes(item.name)
        ) {
          return false;
        }
        return matchesKeyword(
          [item.name, item.signature, item.description, item.example],
          normalizedKeyword,
        );
      }),
    [availableFunctionNames, normalizedKeyword],
  );
  const filteredOperators = useMemo(
    () =>
      FORMULA_OPERATORS.filter((operator) => {
        if (
          availableOperatorTokens &&
          !availableOperatorTokens.includes(operator.token)
        ) {
          return false;
        }
        return matchesKeyword(
          [operator.token, operator.label, operator.description],
          normalizedKeyword,
        );
      }),
    [availableOperatorTokens, normalizedKeyword],
  );

  const renderFieldList = (fields: FormulaReferenceField[]) => {
    if (fields.length === 0) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配字段" />
      );
    }
    return (
      <div className="sxw-formula-token-list">
        {fields.map((field) => {
          const button = (
            <Button
              key={field.key}
              type="text"
              block
              disabled={field.disabled || disabled}
              onClick={() =>
                insertToken(getReferenceExpression?.(field) ?? field.key)
              }
            >
              <span className="sxw-formula-token-main">{field.label}</span>
              <span className="sxw-formula-token-meta">
                {field.key} · {DATA_TYPE_LABELS[field.dataType]}
              </span>
            </Button>
          );
          return field.disabled ? (
            <Tooltip key={field.key} title={field.disabledReason}>
              <span className="sxw-formula-disabled-token">{button}</span>
            </Tooltip>
          ) : (
            button
          );
        })}
      </div>
    );
  };

  const renderFunctionList = () => {
    if (filteredFunctions.length === 0) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配函数" />
      );
    }
    return (
      <div className="sxw-formula-function-list">
        {filteredFunctions.map((item) => (
          <Button
            key={item.name}
            type="text"
            block
            disabled={disabled}
            onClick={() => insertToken(item.template)}
          >
            <span className="sxw-formula-token-main">{item.signature}</span>
            <span className="sxw-formula-token-meta">
              {item.description} 示例：{item.example}
            </span>
          </Button>
        ))}
      </div>
    );
  };

  const renderOperatorList = () => {
    if (filteredOperators.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="无匹配运算符"
        />
      );
    }
    return (
      <div className="sxw-formula-operator-panel">
        {filteredOperators.map((operator) => (
          <Tooltip key={operator.token} title={operator.description}>
            <Button
              disabled={disabled}
              onClick={() => insertToken(operator.token)}
            >
              {operator.label}
            </Button>
          </Tooltip>
        ))}
      </div>
    );
  };

  const renderFieldLibrary = () => {
    if (!objectType) {
      return (
        <Typography.Text type="secondary">
          请先选择适用单据或档案。
        </Typography.Text>
      );
    }
    if (schemaError) {
      return <Alert type="error" showIcon message={schemaError} />;
    }
    if (loading) {
      return (
        <Spin spinning>
          <div className="sxw-formula-library-loading" />
        </Spin>
      );
    }
    const hasMatchedFields =
      filteredSystemFields.length > 0 || filteredCustomFields.length > 0;
    if (!hasMatchedFields) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配字段" />
      );
    }
    return (
      <Space
        orientation="vertical"
        size={6}
        className="sxw-formula-library-groups"
      >
        {filteredSystemFields.length > 0 && (
          <div>
            <Typography.Text type="secondary">系统字段</Typography.Text>
            {renderFieldList(filteredSystemFields)}
          </div>
        )}
        {filteredCustomFields.length > 0 && (
          <div>
            <Typography.Text type="secondary">普通自定义字段</Typography.Text>
            {renderFieldList(filteredCustomFields)}
          </div>
        )}
      </Space>
    );
  };

  const renderLibraryContent = () => {
    if (activeLibraryTab === 'functions') return renderFunctionList();
    if (activeLibraryTab === 'operators') return renderOperatorList();
    return renderFieldLibrary();
  };

  const renderPreviewResult = () => {
    // 解析/依赖错误维持原有 Alert error 行为不变。
    if (previewError) {
      return <Alert type="error" showIcon message={previewError} />;
    }
    if (previewValue === undefined) {
      return <Typography.Text type="secondary">暂无预览结果</Typography.Text>;
    }
    const declaredCategory = classifyDeclaredType(dataType);
    const resultTypeLabel = resultType
      ? (RESULT_TYPE_LABELS[resultType] ?? resultType)
      : null;
    const declaredLabel = dataType ? DATA_TYPE_LABELS[dataType] : null;
    const typeMismatch =
      resultType !== null &&
      declaredCategory !== null &&
      resultType !== declaredCategory;
    return (
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Typography.Text>
          结果：
          <Typography.Text strong>
            {formatPreviewValue(previewValue)}
          </Typography.Text>
        </Typography.Text>
        <Space size={[4, 4]} wrap>
          <Typography.Text type="secondary">计算结果类型：</Typography.Text>
          {resultTypeLabel ? (
            <Tag color="blue">{resultTypeLabel}</Tag>
          ) : (
            <Typography.Text type="secondary">无法确定</Typography.Text>
          )}
        </Space>
        {typeError ? (
          <Alert type="warning" showIcon message={typeError} />
        ) : null}
        {typeMismatch ? (
          <Alert
            type="warning"
            showIcon
            message={`结果类型与声明不符，保存会被拒（声明：${declaredLabel}，推断：${resultTypeLabel}）`}
          />
        ) : null}
        {readableExpression ? (
          <Typography.Text type="secondary">
            业务口径：{readableExpression}
          </Typography.Text>
        ) : null}
        <Space size={[4, 4]} wrap>
          <Typography.Text type="secondary">用到的字段：</Typography.Text>
          {dependencyKeys.length > 0 ? (
            dependencyKeys.map((key) => {
              const field = formulaFields.find((item) => item.key === key);
              return (
                <Tooltip key={key} title={key}>
                  <Tag>{field?.label ?? key}</Tag>
                </Tooltip>
              );
            })
          ) : (
            <Typography.Text type="secondary">无</Typography.Text>
          )}
        </Space>
      </Space>
    );
  };

  const handleLibraryTabChange = (key: string) => {
    if (isFormulaLibraryTab(key)) {
      setActiveLibraryTab(key);
    }
  };

  const libraryTabs: Array<{
    key: FormulaLibraryTab;
    label: string;
    icon: ReactNode;
  }> = [
    {
      key: 'fields',
      label: '字段',
      icon: <FieldStringOutlined />,
    },
    {
      key: 'functions',
      label: '函数',
      icon: <FunctionOutlined />,
    },
    {
      key: 'operators',
      label: '运算符',
      icon: <CodeOutlined />,
    },
  ];

  return (
    <div className="sxw-formula-designer">
      <style>{FORMULA_DESIGNER_STYLES}</style>
      <ProFormTextArea
        name={fieldName}
        label={label}
        rules={required ? [{ required: true }] : undefined}
        fieldProps={{
          rows: 3,
          placeholder,
          disabled,
        }}
      />
      <div className="sxw-formula-actions">
        <Space size={[8, 8]} wrap>
          <Button
            type="primary"
            ghost
            icon={<CalculatorOutlined />}
            onClick={() => setDesignerOpen(true)}
          >
            打开公式设计器
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            loading={previewing}
            onClick={handlePreview}
          >
            预览
          </Button>
          <Tooltip title="按标准格式整理公式（需先预览一次）">
            <Button
              disabled={disabled || !normalizedExpression}
              onClick={handleNormalize}
            >
              整理公式
            </Button>
          </Tooltip>
        </Space>
      </div>
      <div className="sxw-formula-preview-summary">{renderPreviewResult()}</div>

      <Modal
        className="sxw-formula-modal"
        styles={mergeDocumentModalStyles(
          { body: { padding: 0 } },
          { variant: 'formula-workbench' },
        )}
        title={
          <Space>
            <CalculatorOutlined />
            <span>公式设计器</span>
          </Space>
        }
        open={designerOpen}
        width={1080}
        onCancel={() => setDesignerOpen(false)}
        footer={[
          <Button
            key="normalize"
            disabled={disabled || !normalizedExpression}
            onClick={handleNormalize}
          >
            整理公式
          </Button>,
          <Button
            key="preview"
            icon={<PlayCircleOutlined />}
            loading={previewing}
            onClick={handlePreview}
          >
            预览公式
          </Button>,
          <Button
            key="done"
            type="primary"
            onClick={() => setDesignerOpen(false)}
          >
            完成
          </Button>,
        ]}
      >
        <div
          className={
            libraryCollapsed
              ? 'sxw-formula-workbench sxw-formula-workbench-collapsed'
              : 'sxw-formula-workbench'
          }
        >
          <aside className="sxw-formula-library">
            <div className="sxw-formula-library-header">
              {!libraryCollapsed && (
                <Typography.Text strong>可选内容</Typography.Text>
              )}
              <Tooltip
                title={libraryCollapsed ? '展开可选内容' : '收起可选内容'}
              >
                <Button
                  type="text"
                  icon={
                    libraryCollapsed ? (
                      <MenuUnfoldOutlined />
                    ) : (
                      <MenuFoldOutlined />
                    )
                  }
                  onClick={() => setLibraryCollapsed((value) => !value)}
                />
              </Tooltip>
            </div>

            {libraryCollapsed ? (
              <div className="sxw-formula-library-icons">
                {libraryTabs.map((item) => (
                  <Tooltip key={item.key} title={item.label} placement="right">
                    <Button
                      type={activeLibraryTab === item.key ? 'primary' : 'text'}
                      icon={item.icon}
                      onClick={() => setActiveLibraryTab(item.key)}
                    />
                  </Tooltip>
                ))}
              </div>
            ) : (
              <>
                <Tabs
                  activeKey={activeLibraryTab}
                  items={libraryTabs.map((item) => ({
                    key: item.key,
                    label: (
                      <Space size={6}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Space>
                    ),
                  }))}
                  onChange={handleLibraryTabChange}
                />
                <Input
                  allowClear
                  value={libraryKeyword}
                  placeholder="搜索字段、函数、运算符"
                  onChange={(event) => setLibraryKeyword(event.target.value)}
                />
                <div className="sxw-formula-library-content">
                  {renderLibraryContent()}
                </div>
              </>
            )}
          </aside>

          <section className="sxw-formula-editor-panel">
            <div className="sxw-formula-editor-header">
              <Space>
                <CodeOutlined />
                <Typography.Text strong>公式</Typography.Text>
              </Space>
              <Button
                icon={<PlayCircleOutlined />}
                loading={previewing}
                onClick={handlePreview}
              >
                预览
              </Button>
            </div>
            <Input.TextArea
              ref={formulaInputRef}
              value={draftExpression}
              rows={10}
              disabled={disabled}
              autoSize={{ minRows: 10, maxRows: 16 }}
              placeholder={placeholder}
              onChange={(event) => updateExpression(event.target.value)}
            />

            <div className="sxw-formula-editor-preview">
              <Space align="center">
                <CheckCircleOutlined />
                <Typography.Text strong>预览结果</Typography.Text>
              </Space>
              <div className="sxw-formula-editor-preview-body">
                {renderPreviewResult()}
              </div>
            </div>
          </section>
        </div>
      </Modal>
    </div>
  );
}
