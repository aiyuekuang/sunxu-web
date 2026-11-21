/**
 * MES document BOM view/edit drawer.
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-bom
 * @sunxu-reason Preserves the MES single-document BOM review, edit, hierarchy, custom-field, paste and Excel-import workflow while all host data and side effects enter through capabilities.
 */
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ImportOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { formatUnitLabel } from '../utils/qty-unit';
import { renderCustomFieldCell } from './CustomFieldCell';
import { getVisibleMaterialCustomFields, resolveMaterialCustomFieldWidth, sumMaterialCustomFieldColumnWidths } from './materialCustomFieldColumns';
import { ResizableTable as Table } from './ResizableTable';
import { RemoteSelect } from '../../components/RemoteSelect';
import type { MesCustomFieldDefinition } from './custom-field-form-types';
import type {
  BomItemPartType,
  BomLineIssueRequirementMode,
  DocumentBomCustomFieldDefinition,
  DocumentBomCustomFieldSchema,
  DocumentBomDrawerProps,
  DocumentBomHeader,
  DocumentBomImportPreviewRow,
  DocumentBomItemSource,
  DocumentBomLine,
  DocumentBomLineCustomFieldCarrier,
  DocumentBomLineInput,
  DocumentBomLineWithCustomFields,
  DocumentBomMaterialRef,
  DocumentBomMaterialSelectOption,
  DocumentBomDrawerCapabilities,
  MaterialConsumptionMode,
  ProcessRouteSelectOption,
} from './document-bom-drawer-types';

type ItemSource = DocumentBomItemSource;

interface EditableBomLine extends DocumentBomLineCustomFieldCarrier {
  _key: string;
  id?: string;
  sourceStandardBomItemId?: string;
  sourceDocumentBomLineId?: string;
  itemSource?: ItemSource;
  materialId?: string;
  material?: DocumentBomMaterialRef | null;
  materialOption?: DocumentBomMaterialSelectOption;
  temporaryItemCode?: string;
  temporaryItemName?: string;
  temporaryItemSpec?: string;
  partType?: BomItemPartType;
  // 由后端 lineCapabilities.canCustomize 推导：仅「完全可调整」行才允许改供料方式(partType)
  canCustomize?: boolean;
  routeId?: string;
  routeOption?: ProcessRouteSelectOption;
  quantity?: number;
  unit?: string;
  lossRate?: number;
  // 冻结自标准 BOM 行的取整规则；单据 BOM 只读展示，不参与提交
  roundingMode?: string | null;
  roundingPrecision?: number | null;
  operationSequence?: number;
  issueRequirementMode?: BomLineIssueRequirementMode;
  materialConsumptionMode?: MaterialConsumptionMode;
  parentKey?: string;
  originalMaterialId?: string;
  lineState: 'active' | 'excluded';
  adjustReason?: string;
  sourceAttributes?: Record<string, unknown>;
  drawingUrls?: string[];
  imageUrls?: string[];
}

let editableKeySeq = 0;
function nextEditableKey(): string {
  editableKeySeq += 1;
  return `dbl-${editableKeySeq}`;
}

function formatNumber(value?: number | null): string {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString('zh-CN', {
    maximumFractionDigits: 6,
  });
}

function resolveLineItemSource(
  line: { itemSource?: string | null; materialId?: string | null },
  resolveSource: DocumentBomDrawerCapabilities['configuration']['resolveDocumentLineItemSource'],
): ItemSource {
  return resolveSource(line);
}

function formatMaterial(
  line: DocumentBomLine,
  resolveSource: DocumentBomDrawerCapabilities['configuration']['resolveDocumentLineItemSource'],
  temporaryFallback: string,
): string {
  if (resolveLineItemSource(line, resolveSource) === 'temporary') {
    return (
      [line.temporaryItemCode, line.temporaryItemName, line.temporaryItemSpec]
        .filter(Boolean)
        .join(' - ') || temporaryFallback
    );
  }
  const material = line.material;
  return [material?.code, material?.name].filter(Boolean).join(' - ') || '-';
}

function formatProcessRoute(
  line: DocumentBomLine,
  isManualRouteSelectableLine: DocumentBomDrawerCapabilities['configuration']['isManualRouteSelectableLine'],
  routeByMaterialRuleLabel: string,
): string {
  if (!isManualRouteSelectableLine(line)) return routeByMaterialRuleLabel;
  const route = line.route;
  return (
    [route?.code, route?.name].filter(Boolean).join(' - ') ||
    line.routeId ||
    '-'
  );
}

function formatPartType(
  value: BomItemPartType | undefined,
  labels: Readonly<Record<string, string>>,
): string {
  return value ? labels[value] || value : '-';
}

function formatSourceBom(
  bom: DocumentBomHeader | null | undefined,
  standardBomFallbackLabel: string,
): string {
  const source = bom?.sourceStandardBom;
  if (!source) return '-';
  const material = source.material;
  return [
    [material?.code, material?.name].filter(Boolean).join(' - ') ||
      standardBomFallbackLabel,
    source.version,
  ]
    .filter(Boolean)
    .join(' / ');
}

function getLineFileUrls(line: {
  drawingUrls?: string[] | null;
  imageUrls?: string[] | null;
}): string[] {
  return [...(line.drawingUrls ?? []), ...(line.imageUrls ?? [])].filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  );
}

function readErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const status = 'status' in error ? error.status : undefined;
  if (typeof status === 'number') return status;
  const response = 'response' in error ? error.response : undefined;
  if (typeof response !== 'object' || response === null) return undefined;
  const responseStatus = 'status' in response ? response.status : undefined;
  return typeof responseStatus === 'number' ? responseStatus : undefined;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error !== 'object' || error === null) return '';
  const message = 'message' in error ? error.message : undefined;
  return typeof message === 'string' ? message : '';
}

function isCurrentDocumentBomNotFound(error: unknown): boolean {
  return (
    readErrorStatus(error) === 404 ||
    readErrorMessage(error).includes('当前单据BOM')
  );
}

function buildMaterialOption(
  material?: DocumentBomMaterialRef | null,
): DocumentBomMaterialSelectOption | undefined {
  if (!material?.id) return undefined;
  return {
    value: material.id,
    label:
      [material.code, material.name].filter(Boolean).join(' - ') || material.id,
    code: material.code,
    name: material.name,
    unit: material.unit,
    spec: material.spec ?? null,
    procurementType: material.procurementType ?? null,
    customValues: material.customValues,
    customComputedValues: material.customComputedValues,
    customComputedErrors: material.customComputedErrors,
  };
}

function readCustomFieldObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getVisibleDocumentLineCustomFields(
  schema: DocumentBomCustomFieldSchema | null,
  displayKey: 'showInForm' | 'showInDetail',
): DocumentBomCustomFieldDefinition[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter((field) => readCustomFieldObject(field.displayJson)[displayKey] === true)
    .slice()
    .sort((left, right) => {
      const leftSort = readCustomFieldObject(left.displayJson).sortOrder;
      const rightSort = readCustomFieldObject(right.displayJson).sortOrder;
      const leftOrder = typeof leftSort === 'number' ? leftSort : left.sortOrder ?? 0;
      const rightOrder = typeof rightSort === 'number' ? rightSort : right.sortOrder ?? 0;
      return leftOrder - rightOrder;
    });
}

function getDocumentLineCustomFormFields(
  schema: DocumentBomCustomFieldSchema | null,
): DocumentBomCustomFieldDefinition[] {
  return getVisibleDocumentLineCustomFields(schema, 'showInForm').filter(
    (field) => field.fieldKind === 'input',
  );
}

function resolveDocumentLineCustomFieldWidth(
  field: DocumentBomCustomFieldDefinition,
): number {
  const width = readCustomFieldObject(field.displayJson).listWidth;
  if (typeof width === 'number' && width > 0) return width;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function sumDocumentLineCustomFieldColumnWidths(
  schema: DocumentBomCustomFieldSchema | null,
  displayKey: 'showInForm' | 'showInDetail',
): number {
  return getVisibleDocumentLineCustomFields(schema, displayKey).reduce(
    (sum, field) => sum + resolveDocumentLineCustomFieldWidth(field),
    0,
  );
}

function buildDocumentLineCustomValuePayload(
  line: EditableBomLine,
  schema: DocumentBomCustomFieldSchema | null,
): {
  customFieldSchemaVersion: number;
  customValues: Record<string, unknown>;
} | null {
  const fields = getDocumentLineCustomFormFields(schema);
  if (!schema || fields.length === 0) return null;
  const inputKeys = new Set(
    (schema.fields ?? [])
      .filter((field) => field.isActive !== false && field.fieldKind === 'input')
      .map((field) => field.fieldKey),
  );
  const currentValues = readCustomFieldObject(line.customValues);
  const preservedValues = Object.fromEntries(
    Object.entries(currentValues).filter(([key]) => inputKeys.has(key)),
  );
  const visibleValues = Object.fromEntries(
    fields.flatMap((field) => {
      const hasValue = Object.hasOwn(currentValues, field.fieldKey);
      const currentValue = currentValues[field.fieldKey];
      if (!hasValue && currentValue == null) return [];
      return [[field.fieldKey, currentValue ?? null]];
    }),
  );
  return {
    customFieldSchemaVersion: schema.schemaVersion,
    customValues: { ...preservedValues, ...visibleValues },
  };
}

function getCustomFieldOptions(
  field: DocumentBomCustomFieldDefinition,
): { label: string; value: string; disabled?: boolean }[] {
  const rawOptions = readCustomFieldObject(field.optionsJson).options;
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions.flatMap((option) => {
    if (typeof option === 'string') return [{ label: option, value: option }];
    if (!option || typeof option !== 'object') return [];
    const record = option as Record<string, unknown>;
    const value =
      typeof record.value === 'string'
        ? record.value
        : typeof record.key === 'string'
          ? record.key
          : '';
    if (!value) return [];
    return [{
      label: typeof record.label === 'string' ? record.label : value,
      value,
      disabled: record.enabled === false,
    }];
  });
}

function renderDocumentLineCustomFieldEditor(
  field: DocumentBomCustomFieldDefinition,
  value: unknown,
  onChange: (value: unknown) => void,
): ReactNode {
  if (
    field.dataType === 'number' ||
    field.dataType === 'decimal' ||
    field.dataType === 'money'
  ) {
    return (
      <InputNumber
        value={typeof value === 'number' ? value : undefined}
        onChange={(nextValue) => onChange(nextValue ?? null)}
        style={{ width: '100%' }}
        controls={false}
      />
    );
  }
  if (field.dataType === 'boolean') {
    return (
      <Switch checked={value === true} onChange={(checked) => onChange(checked)} />
    );
  }
  if (field.dataType === 'date' || field.dataType === 'datetime') {
    const dateValue =
      typeof value === 'string' && value
        ? dayjs(value).isValid()
          ? dayjs(value)
          : undefined
        : undefined;
    return (
      <DatePicker
        value={dateValue as Dayjs | undefined}
        showTime={field.dataType === 'datetime'}
        style={{ width: '100%' }}
        onChange={(nextValue) =>
          onChange(
            !nextValue
              ? null
              : field.dataType === 'datetime'
                ? nextValue.toISOString()
                : nextValue.format('YYYY-MM-DD'),
          )
        }
      />
    );
  }
  if (field.dataType === 'select' || field.dataType === 'multi_select') {
    return (
      <Select
        value={
          value === null ? undefined : (value as string | string[] | undefined)
        }
        mode={field.dataType === 'multi_select' ? 'multiple' : undefined}
        options={getCustomFieldOptions(field)}
        style={{ width: '100%' }}
        allowClear
        showSearch
        optionFilterProp="label"
        onChange={(nextValue) => onChange(nextValue ?? null)}
      />
    );
  }
  if (
    field.dataType === 'long_text' ||
    field.dataType === 'file' ||
    field.dataType === 'image'
  ) {
    return (
      <Input.TextArea
        value={typeof value === 'string' ? value : ''}
        autoSize={{ minRows: 1, maxRows: 3 }}
        onChange={(event) => onChange(event.target.value || null)}
      />
    );
  }
  return (
    <Input
      value={typeof value === 'string' ? value : ''}
      allowClear
      onChange={(event) => onChange(event.target.value || null)}
    />
  );
}

function buildMaterialRefFromImportPreview(
  row: DocumentBomImportPreviewRow,
): DocumentBomMaterialRef | undefined {
  if (!row.materialId) return undefined;
  return {
    id: row.materialId,
    code: row.materialCode ?? row.code,
    name: row.materialName ?? row.name ?? null,
    unit: row.materialUnit ?? row.unit ?? null,
    spec: row.materialSpec ?? null,
    procurementType: row.materialProcurementType ?? null,
  };
}

function buildRouteOptionFromImportPreview(
  row: DocumentBomImportPreviewRow,
): ProcessRouteSelectOption | undefined {
  if (!row.routeId) return undefined;
  const label =
    [row.routeCode, row.routeName].filter(Boolean).join(' - ') || row.routeId;
  return { value: row.routeId, label };
}

function buildRouteOption(
  route?: DocumentBomLine['route'] | null,
): ProcessRouteSelectOption | undefined {
  if (!route) return undefined;
  const routeRecord: Record<string, unknown> = route;
  const id = typeof routeRecord.id === 'string' ? routeRecord.id : undefined;
  if (!id) return undefined;
  const code =
    typeof routeRecord.code === 'string' ? routeRecord.code : undefined;
  const name =
    typeof routeRecord.name === 'string' ? routeRecord.name : undefined;
  const genericSuffix =
    !routeRecord.materialId && !routeRecord.familyId ? '（通用）' : '';
  const label = `${code ? `${code} - ` : ''}${name ?? id}${genericSuffix}`;
  return { value: id, label };
}

function mergeRouteOptions(
  base: ProcessRouteSelectOption[],
  selected?: ProcessRouteSelectOption,
): ProcessRouteSelectOption[] {
  if (!selected) return base;
  if (base.some((option) => option.value === selected.value)) return base;
  return [selected, ...base];
}

/**
 * 导入的单位是自由文本（可能是「个」这类字典标签，也可能已是「EA」这类字典值）。
 * 统一归一化到字典 itemValue，与标准 BOM 保持同一值空间；无法识别时回退原文，
 * 交由用户在单位下拉里改正，不静默丢弃。
 */
function normalizeUnitToDictValue(
  raw: string | null | undefined,
  options: readonly { label: string; value: string }[],
): string {
  const text = raw?.trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  const byValue = options.find((o) => o.value.toLowerCase() === lower);
  if (byValue) return byValue.value;
  const byLabel = options.find((o) => o.label === text);
  if (byLabel) return byLabel.value;
  // 「千克(kg)」这类带括号后缀的标签，允许用裸中文名「千克」命中
  const byBareLabel = options.find(
    (o) => o.label.replace(/[(（].*$/, '').trim() === text,
  );
  return byBareLabel ? byBareLabel.value : text;
}

function readClientKey(
  sourceAttributes?: Record<string, unknown> | null,
): string | undefined {
  if (!sourceAttributes) return undefined;
  const key = sourceAttributes._clientKey;
  return typeof key === 'string' ? key : undefined;
}

function formatEditableLineItem(
  line: EditableBomLine,
  labels: Pick<
    DocumentBomDrawerCapabilities['configuration'],
    'unfilledTemporaryItemLabel' | 'unselectedMaterialLabel'
  >,
): string {
  if (line.itemSource === 'temporary') {
    return (
      [line.temporaryItemCode, line.temporaryItemName, line.temporaryItemSpec]
        .filter(Boolean)
        .join(' - ') || labels.unfilledTemporaryItemLabel
    );
  }
  return line.materialOption?.label || line.materialId || labels.unselectedMaterialLabel;
}

function buildLineDisplayLabel(
  line: EditableBomLine,
  index: number,
  labels: Pick<
    DocumentBomDrawerCapabilities['configuration'],
    'unfilledTemporaryItemLabel' | 'unselectedMaterialLabel'
  >,
): string {
  return `第 ${index + 1} 行 - ${formatEditableLineItem(line, labels)}`;
}

function buildDescendantKeySet(
  lines: EditableBomLine[],
  parentKey: string,
): Set<string> {
  const childrenByParentKey = new Map<string, string[]>();
  lines.forEach((line) => {
    if (!line.parentKey) return;
    const siblings = childrenByParentKey.get(line.parentKey) ?? [];
    siblings.push(line._key);
    childrenByParentKey.set(line.parentKey, siblings);
  });

  const descendants = new Set<string>();
  const stack = [...(childrenByParentKey.get(parentKey) ?? [])];
  while (stack.length > 0) {
    const key = stack.pop();
    if (!key || descendants.has(key)) continue;
    descendants.add(key);
    stack.push(...(childrenByParentKey.get(key) ?? []));
  }
  return descendants;
}

function findInvalidParentLine(
  lines: EditableBomLine[],
): EditableBomLine | undefined {
  const lineByKey = new Map(lines.map((line) => [line._key, line]));

  for (const line of lines) {
    if (line.lineState === 'excluded' || !line.parentKey) continue;
    const parent = lineByKey.get(line.parentKey);
    if (!parent || parent.lineState === 'excluded') return line;

    const visited = new Set<string>([line._key]);
    let currentParentKey: string | undefined = line.parentKey;
    while (currentParentKey) {
      if (visited.has(currentParentKey)) return line;
      visited.add(currentParentKey);
      currentParentKey = lineByKey.get(currentParentKey)?.parentKey;
    }
  }

  return undefined;
}

function toEditableLines(
  lines: DocumentBomLineWithCustomFields[],
  configuration: DocumentBomDrawerCapabilities['configuration'],
): EditableBomLine[] {
  const sorted = [...lines].sort((a, b) => (a.lineNo ?? 0) - (b.lineNo ?? 0));
  const idToKey = new Map<string, string>();
  const result = sorted.map<EditableBomLine>((line) => {
    const key = nextEditableKey();
    if (line.id) idToKey.set(line.id, key);
    return {
      _key: key,
      id: line.id,
      sourceStandardBomItemId: line.sourceStandardBomItemId ?? undefined,
      sourceDocumentBomLineId: line.sourceDocumentBomLineId ?? undefined,
      itemSource: resolveLineItemSource(
        line,
        configuration.resolveDocumentLineItemSource,
      ),
      materialId: line.materialId ?? line.material?.id ?? undefined,
      material: line.material,
      materialOption: buildMaterialOption(line.material),
      temporaryItemCode: line.temporaryItemCode ?? undefined,
      temporaryItemName: line.temporaryItemName ?? undefined,
      temporaryItemSpec: line.temporaryItemSpec ?? undefined,
      partType: line.partType ?? undefined,
      canCustomize: line.lineCapabilities?.canCustomize ?? false,
      routeId: line.routeId ?? line.route?.id ?? undefined,
      routeOption: buildRouteOption(line.route),
      quantity:
        line.quantity === undefined || line.quantity === null
          ? undefined
          : Number(line.quantity),
      unit: line.unit ?? undefined,
      lossRate:
        line.lossRate === undefined || line.lossRate === null
          ? undefined
          : Number(line.lossRate),
      roundingMode: line.roundingMode,
      roundingPrecision: line.roundingPrecision,
      operationSequence: line.operationSequence ?? undefined,
      issueRequirementMode:
        configuration.resolveLoadedIssueRequirementMode(
          line.issueRequirementMode,
        ),
      materialConsumptionMode: line.materialConsumptionMode ?? undefined,
      originalMaterialId: line.originalMaterialId ?? undefined,
      lineState: configuration.resolveLoadedLineState(line.lineState),
      adjustReason: line.adjustReason ?? undefined,
      sourceAttributes:
        (line.sourceAttributes as Record<string, unknown> | undefined) ??
        undefined,
      drawingUrls: Array.isArray(line.drawingUrls) ? line.drawingUrls : [],
      imageUrls: Array.isArray(line.imageUrls) ? line.imageUrls : [],
      customFieldSchemaVersion: line.customFieldSchemaVersion,
      customValues: line.customValues,
      customComputedValues: line.customComputedValues,
      customComputedErrors: line.customComputedErrors,
      parentKey: undefined,
    };
  });
  // 二次回填父子关系（用 id 映射 _key）
  sorted.forEach((line, index) => {
    const parentId = line.parentLineId;
    if (parentId && idToKey.has(parentId)) {
      result[index].parentKey = idToKey.get(parentId);
    }
  });
  return result;
}

interface ParsedPasteRow {
  sourceRowNo?: number;
  lineKey?: string;
  parentLineKey?: string;
  level?: number;
  code: string;
  name?: string;
  quantity?: number;
  unit?: string;
  lossRate?: number;
  operationSequence?: number;
  routeCode?: string;
  routeName?: string;
  routeId?: string;
  routeOption?: ProcessRouteSelectOption;
  issueRequirementMode?: BomLineIssueRequirementMode;
  materialConsumptionMode?: MaterialConsumptionMode;
  parentCode?: string;
  drawingUrls?: string[];
  imageUrls?: string[];
  material?: DocumentBomMaterialRef;
  matched: boolean;
  errors?: string[];
  warnings?: string[];
}

type ParsedBomImportRow = Omit<ParsedPasteRow, 'material' | 'matched'>;

function normalizeHeaderCell(value?: string): string {
  return (value ?? '').replace(/\s/g, '').toLowerCase();
}

function splitImportLine(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((cell) => cell.trim());
  return line.split(/,|，|；|;/).map((cell) => cell.trim());
}

function parseOptionalNumber(value?: string): number | undefined {
  const normalized = (value ?? '').replace(/%$/, '').replace(/,/g, '').trim();
  if (!normalized) return undefined;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseUrlList(value?: string): string[] {
  return (value ?? '')
    .split(/\s+|,|，|；|;|\|/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function findHeaderIndex(headers: string[], patterns: RegExp[]): number {
  return headers.findIndex((header) =>
    patterns.some((pattern) => pattern.test(header)),
  );
}

function looksLikeImportHeader(cells: string[]): boolean {
  const headers = cells.map(normalizeHeaderCell);
  const headerScore = headers.filter((header) =>
    /^(物料|子件|材料|零件).*(编码|编号|名称)$|^(行号|序号|层级|层次|编码|编号|料号|名称|品名|数量|用量|单位|损耗|损耗率|投料工序|工序|图纸|附件|参与领料|是否领料|生成领料|物料需求|领料模式|消耗模式|扣料模式|工艺路线|工艺编码|路线编码|路线名称|code|name|qty|quantity|unit|level|drawing|file|issue|materialreq|materialconsumptionmode|consumptionmode|route|routing)$|^(父项|上级|父级|父件).*(行号|序号|编码|编号)$/.test(
      header,
    ),
  ).length;
  return headerScore >= 2;
}

function parsePasteText(
  text: string,
  configuration: Pick<
    DocumentBomDrawerCapabilities['configuration'],
    'parseIssueRequirementMode' | 'parseMaterialConsumptionMode'
  >,
): ParsedBomImportRow[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(splitImportLine);

  if (rows.length === 0) return [];

  const firstRowIsHeader = looksLikeImportHeader(rows[0] ?? []);
  const headers = firstRowIsHeader
    ? (rows[0] ?? []).map(normalizeHeaderCell)
    : [];
  const dataRows = firstRowIsHeader ? rows.slice(1) : rows;
  const lineKeyIndex = findHeaderIndex(headers, [
    /^行号$/,
    /^序号$/,
    /^lineno$/,
    /^linenumber$/,
    /^rowno$/,
    /^itemno$/,
  ]);
  const levelIndex = findHeaderIndex(headers, [/层级/, /层次/, /^level$/]);
  const parentLineKeyIndex = findHeaderIndex(headers, [
    /上级.*(行号|序号)/,
    /父项.*(行号|序号)/,
    /父级.*(行号|序号)/,
    /父件.*(行号|序号)/,
    /^parent(line|row|item)/,
  ]);
  const codeIndex = findHeaderIndex(headers, [
    /物料.*(编码|编号)/,
    /子件.*(编码|编号)/,
    /材料.*(编码|编号)/,
    /零件.*(编码|编号)/,
    /^编码$/,
    /^编号$/,
    /^料号$/,
    /^code$/,
    /^partno$/,
  ]);
  const nameIndex = findHeaderIndex(headers, [
    /物料.*名称/,
    /材料.*名称/,
    /零件.*名称/,
    /^名称$/,
    /^品名$/,
    /^name$/,
  ]);
  const quantityIndex = findHeaderIndex(headers, [
    /数量/,
    /用量/,
    /^qty$/,
    /^quantity$/,
  ]);
  const unitIndex = findHeaderIndex(headers, [/单位/, /^unit$/]);
  const issueRequirementModeIndex = findHeaderIndex(headers, [
    /是否.*领料/,
    /参与.*领料/,
    /生成.*领料/,
    /物料需求/,
    /^issue/,
    /^materialreq/,
  ]);
  const materialConsumptionModeIndex = findHeaderIndex(headers, [
    /领料模式/,
    /消耗模式/,
    /扣料模式/,
    /^materialconsumptionmode$/,
    /^consumptionmode$/,
  ]);
  const lossRateIndex = findHeaderIndex(headers, [/损耗/, /^loss/]);
  const operationSequenceIndex = findHeaderIndex(headers, [
    /投料工序/,
    /工序序号/,
    /^operation/,
  ]);
  const routeCodeIndex = findHeaderIndex(headers, [
    /工艺路线/,
    /工艺编码/,
    /路线编码/,
    /路线名称/,
    /^route/,
    /^routing/,
  ]);
  const parentCodeIndex = findHeaderIndex(headers, [
    /上级.*(编码|编号)/,
    /父项.*(编码|编号)/,
    /父级.*(编码|编号)/,
    /父件.*(编码|编号)/,
    /^parent/,
  ]);
  const drawingUrlsIndex = findHeaderIndex(headers, [
    /图纸/,
    /附件/,
    /^drawing/,
    /^file/,
  ]);

  return dataRows
    .map((cells) => {
      if (firstRowIsHeader) {
        const code = cells[codeIndex >= 0 ? codeIndex : 0] ?? '';
        const quantity = parseOptionalNumber(cells[quantityIndex]);
        const lossRate = parseOptionalNumber(cells[lossRateIndex]);
        return {
          code,
          lineKey:
            lineKeyIndex >= 0 ? cells[lineKeyIndex] || undefined : undefined,
          parentLineKey:
            parentLineKeyIndex >= 0
              ? cells[parentLineKeyIndex] || undefined
              : undefined,
          level: parseOptionalNumber(cells[levelIndex]),
          name: nameIndex >= 0 ? cells[nameIndex] || undefined : undefined,
          quantity,
          unit: unitIndex >= 0 ? cells[unitIndex] || undefined : undefined,
          issueRequirementMode:
            issueRequirementModeIndex >= 0
              ? configuration.parseIssueRequirementMode(
                  cells[issueRequirementModeIndex],
                )
              : undefined,
          materialConsumptionMode:
            materialConsumptionModeIndex >= 0
              ? configuration.parseMaterialConsumptionMode(
                  cells[materialConsumptionModeIndex],
                )
              : undefined,
          lossRate,
          operationSequence: parseOptionalNumber(cells[operationSequenceIndex]),
          routeCode:
            routeCodeIndex >= 0
              ? cells[routeCodeIndex] || undefined
              : undefined,
          parentCode:
            parentCodeIndex >= 0
              ? cells[parentCodeIndex] || undefined
              : undefined,
          drawingUrls:
            drawingUrlsIndex >= 0
              ? parseUrlList(cells[drawingUrlsIndex])
              : undefined,
        };
      }

      const [code, second, third, fourth, fifth, sixth] = cells;
      const secondAsNumber = parseOptionalNumber(second);
      const quantity =
        secondAsNumber !== undefined
          ? secondAsNumber
          : parseOptionalNumber(third);
      const lossRate =
        secondAsNumber !== undefined
          ? parseOptionalNumber(fourth)
          : parseOptionalNumber(fifth);
      return {
        code,
        name: secondAsNumber === undefined ? second || undefined : undefined,
        quantity,
        unit:
          secondAsNumber !== undefined
            ? third || undefined
            : fourth || undefined,
        lossRate,
        drawingUrls: parseUrlList(secondAsNumber !== undefined ? fifth : sixth),
      };
    })
    .filter((row) => row.code);
}

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentBomDrawer({
  open,
  documentType,
  documentId,
  title,
  onClose,
  editable = false,
  productQty,
  onSaved,
  initialEdit = false,
  initialImport = false,
  capabilities,
}: DocumentBomDrawerProps) {
  const message = capabilities.messages;
  const { unitOptions, unitLabelMap } = capabilities.dictionaries;
  const canView = capabilities.permissions.canView();
  const [loading, setLoading] = useState(false);
  const [bom, setBom] = useState<DocumentBomHeader | null>(null);
  const [showExcludedLines, setShowExcludedLines] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLines, setEditLines] = useState<EditableBomLine[]>([]);
  const [routeOptionsByLine, setRouteOptionsByLine] = useState<
    Record<string, ProcessRouteSelectOption[]>
  >({});
  const [saving, setSaving] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteMatching, setPasteMatching] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [autoEditKey, setAutoEditKey] = useState<string | undefined>();
  const materialCustomFields = capabilities.customFields.materialFields;
  const visibleMaterialCustomFields = useMemo(
    () => getVisibleMaterialCustomFields([...materialCustomFields]),
    [materialCustomFields],
  );
  const materialCustomFieldScrollWidth = useMemo(
    () => sumMaterialCustomFieldColumnWidths([...materialCustomFields]),
    [materialCustomFields],
  );
  const lineCustomFieldSchema = capabilities.customFields.documentLineSchema;
  const visibleLineCustomFields = useMemo(
    () =>
      getVisibleDocumentLineCustomFields(lineCustomFieldSchema, 'showInDetail'),
    [lineCustomFieldSchema],
  );
  const editableLineCustomFields = useMemo(
    () => getDocumentLineCustomFormFields(lineCustomFieldSchema),
    [lineCustomFieldSchema],
  );
  const viewLineCustomFieldScrollWidth = useMemo(
    () =>
      sumDocumentLineCustomFieldColumnWidths(
        lineCustomFieldSchema,
        'showInDetail',
      ),
    [lineCustomFieldSchema],
  );
  const editLineCustomFieldScrollWidth = useMemo(
    () =>
      sumDocumentLineCustomFieldColumnWidths(
        lineCustomFieldSchema,
        'showInForm',
      ),
    [lineCustomFieldSchema],
  );

  const canEdit =
    canView &&
    editable &&
    capabilities.configuration.editableDocumentTypes.includes(documentType) &&
    capabilities.permissions.canUpdate();
  const statusEditable =
    !bom || capabilities.configuration.isEditableStatus(bom.status);

  const reloadDocumentBom = async (): Promise<DocumentBomHeader | null> => {
    if (!documentId) return null;
    const detail = await capabilities.api.current({
      documentType,
      documentId,
    });
    return detail;
  };

  useEffect(() => {
    setShowExcludedLines(false);
    setEditing(false);
    setEditLines([]);
    setRouteOptionsByLine({});
    if (!open || !documentId || !canView) {
      setBom(null);
      return;
    }
    if (initialEdit && canEdit) {
      setBom(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadDocumentBom = async () => {
      setLoading(true);
      try {
        const detail = await reloadDocumentBom();
        if (mounted) setBom(detail);
      } catch (error) {
        if (mounted) {
          setBom(null);
          if (!isCurrentDocumentBomNotFound(error)) {
            message.error(readErrorMessage(error) || '单据 BOM 加载失败');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDocumentBom();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, canView, capabilities, documentId, documentType, initialEdit, message, open]);

  const lines = useMemo<DocumentBomLineWithCustomFields[]>(
    () =>
      ([...(bom?.lines ?? [])] as DocumentBomLineWithCustomFields[]).sort(
        (a, b) => (a.lineNo ?? 0) - (b.lineNo ?? 0),
      ),
    [bom?.lines],
  );
  const activeCount = lines.filter(
    (line) => line.lineState !== 'excluded',
  ).length;
  const excludedCount = lines.length - activeCount;
  const visibleLines = showExcludedLines
    ? lines
    : lines.filter((line) => line.lineState !== 'excluded');

  const updateEditLine = (key: string, patch: Partial<EditableBomLine>) => {
    setEditLines((prev) =>
      prev.map((line) => (line._key === key ? { ...line, ...patch } : line)),
    );
  };

  const loadRouteOptionsForLine = async (
    line: EditableBomLine,
    keyWords?: string,
  ) => {
    if (!capabilities.configuration.isManualRouteSelectableLine(line)) {
      setRouteOptionsByLine((prev) => ({ ...prev, [line._key]: [] }));
      return;
    }
    const options = await capabilities.routes.requestEffectiveRouteOptions({
      keyWords,
      materialId: line.itemSource === 'material' ? line.materialId : undefined,
    });
    setRouteOptionsByLine((prev) => ({ ...prev, [line._key]: options }));
  };

  const removeEditLine = (key: string) => {
    setEditLines((prev) => {
      const target = prev.find((line) => line._key === key);
      if (target?.id) {
        // 已持久化行不物理删除，改为排除，保留追溯
        return prev.map((line) =>
          line._key === key
            ? { ...line, lineState: 'excluded' }
            : line.parentKey === key
              ? { ...line, parentKey: undefined }
              : line,
        );
      }
      return prev
        .filter((line) => line._key !== key)
        .map((line) =>
          line.parentKey === key ? { ...line, parentKey: undefined } : line,
        );
    });
  };

  const addEditLine = () => {
    const key = nextEditableKey();
    setEditLines((prev) => [
      ...prev,
      { _key: key, ...capabilities.configuration.createNewLineDefaults(key) },
    ]);
  };

  const enterEditing = async (options?: { openImport?: boolean }) => {
    if (!documentId || !canEdit || !canView) return;
    setSaving(true);
    try {
      let current = bom;
      if (
        current &&
        (current.documentId !== documentId ||
          current.documentType !== documentType)
      ) {
        current = null;
      }
      if (!current) {
        // 没有当前单据 BOM 时，显式 ensure 创建（含按来源标准 BOM 初始化），
        // 这正是“显式编辑/导入才生成单据 BOM”的触发点。
        const ensured = await capabilities.api.ensure({
          documentType,
          documentId,
          productQty,
        });
        current = ensured;
        setBom(ensured);
      }
      if (!capabilities.configuration.isEditableStatus(current?.status)) {
        message.warning('当前单据 BOM 已确认冻结或已设变，请通过设变流程修改');
        return;
      }
      setEditLines(
        toEditableLines(
          (current?.lines ?? []) as DocumentBomLineWithCustomFields[],
          capabilities.configuration,
        ),
      );
      setEditing(true);
      if (options?.openImport) {
        setPasteText('');
        setPasteOpen(true);
      }
    } catch (error) {
      message.error(readErrorMessage(error) || '进入编辑失败');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setAutoEditKey(undefined);
      return;
    }
    if (!initialEdit || !documentId || !canEdit || editing || loading || saving)
      return;
    const key = `${documentType}:${documentId}`;
    if (autoEditKey === key) return;
    setAutoEditKey(key);
    void enterEditing({ openImport: initialImport });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoEditKey,
    canEdit,
    documentId,
    documentType,
    editing,
    initialEdit,
    initialImport,
    loading,
    open,
    saving,
  ]);

  const cancelEditing = async () => {
    setEditing(false);
    setEditLines([]);
    setRouteOptionsByLine({});
    setLoading(true);
    try {
      const detail = await reloadDocumentBom();
      setBom(detail);
    } catch (error) {
      if (!isCurrentDocumentBomNotFound(error)) {
        message.error(readErrorMessage(error) || '单据 BOM 刷新失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const appendImportedRows = (
    parsed: ParsedPasteRow[],
    sourceLabel: string,
  ) => {
    const importableRows = parsed.filter(
      (row) =>
        (row.errors ?? []).length === 0 &&
        (row.material || row.code || row.name),
    );
    const skippedRows = parsed.filter((row) => (row.errors ?? []).length > 0);
    if (importableRows.length === 0) {
      message.warning(
        skippedRows.length > 0
          ? '没有可导入的 BOM 行，请先处理数量、单位或格式错误'
          : '未解析到有效行，请按“编码[Tab]数量[Tab]单位”整理 BOM',
      );
      return;
    }
    const importedKeyByLineKey = new Map<string, string>();
    const importedKeysByCode = new Map<string, string[]>();
    const importedPairs = importableRows.map((row) => {
      const itemSource: ItemSource = row.material ? 'material' : 'temporary';
      const importDefaults = capabilities.configuration.resolveImportDefaults({
        itemSource,
        material: row.material,
        row,
      });
      const partType = importDefaults.partType;
      const routeSelectable = capabilities.configuration.isManualRouteSelectableLine({
        itemSource,
        partType,
      });
      const line: EditableBomLine = {
        _key: nextEditableKey(),
        itemSource,
        materialId: itemSource === 'material' ? row.material?.id : undefined,
        material: itemSource === 'material' ? row.material : undefined,
        materialOption:
          itemSource === 'material'
            ? buildMaterialOption(row.material)
            : undefined,
        temporaryItemCode: itemSource === 'temporary' ? row.code : undefined,
        temporaryItemName:
          itemSource === 'temporary' ? (row.name ?? row.code) : undefined,
        temporaryItemSpec: undefined,
        partType,
        routeId: routeSelectable ? row.routeId : undefined,
        routeOption: routeSelectable ? row.routeOption : undefined,
        quantity: row.quantity ?? importDefaults.quantity,
        unit: normalizeUnitToDictValue(
          row.unit || row.material?.unit,
          unitOptions,
        ),
        lossRate: row.lossRate,
        operationSequence: row.operationSequence,
        issueRequirementMode:
          itemSource === 'temporary'
            ? importDefaults.issueRequirementMode
            : (row.issueRequirementMode ?? importDefaults.issueRequirementMode),
        materialConsumptionMode: row.materialConsumptionMode,
        lineState: importDefaults.lineState,
        drawingUrls: row.drawingUrls ?? [],
        imageUrls: row.imageUrls ?? [],
        sourceAttributes: {
          importCode: row.code,
          importItemSource: itemSource,
          importLineKey: row.lineKey,
          importLevel: row.level,
          importName: row.name,
          importRouteCode: row.routeCode,
          importRouteName: row.routeName,
          importRouteId: row.routeId,
          importPartType: partType,
          importParentCode: row.parentCode,
          importParentLineKey: row.parentLineKey,
          importIssueRequirementMode:
            itemSource === 'temporary'
              ? importDefaults.issueRequirementMode
              : (row.issueRequirementMode ?? importDefaults.issueRequirementMode),
          importMaterialConsumptionMode: row.materialConsumptionMode,
          importRowNo: row.sourceRowNo,
          importSource: sourceLabel,
          importWarnings: [
            ...(row.warnings ?? []),
            ...(itemSource === 'temporary'
              ? ['未匹配物料档案，已按本单临时自制件导入']
              : []),
          ],
        },
      };
      if (row.lineKey) {
        importedKeyByLineKey.set(row.lineKey.trim().toLowerCase(), line._key);
      }
      const codeKey = row.code.trim().toLowerCase();
      importedKeysByCode.set(codeKey, [
        ...(importedKeysByCode.get(codeKey) ?? []),
        line._key,
      ]);
      return { row, line };
    });
    let unresolvedParentCount = 0;
    const withParent = importedPairs.map(({ row, line }) => {
      const parentLineKey = row.parentLineKey?.trim().toLowerCase();
      const parentCode = row.parentCode?.trim().toLowerCase();
      const parentKey = parentLineKey
        ? importedKeyByLineKey.get(parentLineKey)
        : parentCode
          ? (() => {
              const keys = importedKeysByCode.get(parentCode) ?? [];
              return keys.length === 1 ? keys[0] : undefined;
            })()
          : undefined;
      if ((parentLineKey || parentCode) && !parentKey) {
        unresolvedParentCount += 1;
      }
      return parentKey ? { ...line, parentKey } : line;
    });
    setEditLines((prev) => [...prev, ...withParent]);
    setPasteOpen(false);
    setPasteText('');
    if (skippedRows.length > 0 || unresolvedParentCount > 0) {
      const skippedText =
        skippedRows.length > 0
          ? `；${skippedRows.length} 行未导入（${skippedRows
              .map((row) => row.code || row.name || `第${row.sourceRowNo}行`)
              .slice(0, 8)
              .join('、')}${skippedRows.length > 8 ? '…' : ''}）`
          : '';
      const parentText =
        unresolvedParentCount > 0
          ? `；${unresolvedParentCount} 行父项未匹配，已按顶层导入`
          : '';
      message.warning(
        `已导入 ${importableRows.length} 行${skippedText}${parentText}，请检查后保存`,
      );
    } else {
      message.success(`已导入 ${importableRows.length} 行`);
    }
  };

  const importBomRows = async (
    rows: ParsedBomImportRow[],
    sourceLabel: string,
  ) => {
    if (rows.length === 0) {
      message.warning('未解析到有效行，请按“编码[Tab]数量[Tab]单位”整理 BOM');
      return;
    }
    setPasteMatching(true);
    try {
      const resolveRouteOptionForImportRow = async (
        row: ParsedBomImportRow,
        material?: DocumentBomMaterialRef,
      ): Promise<ProcessRouteSelectOption | undefined> => {
        const routeKeyword = row.routeCode ?? row.routeName;
        const itemSource: ItemSource = material?.id ? 'material' : 'temporary';
        const importDefaults = capabilities.configuration.resolveImportDefaults({
          itemSource,
          material,
          row,
        });
        const partType = importDefaults.partType;
        if (!routeKeyword) return row.routeOption;
        if (!capabilities.configuration.isManualRouteSelectableLine({ itemSource, partType })) {
          return undefined;
        }
        const options = await capabilities.routes.requestEffectiveRouteOptions({
          keyWords: routeKeyword,
          materialId: itemSource === 'material' ? material?.id : undefined,
        });
        if (options.length === 1) return options[0];
        return row.routeOption;
      };
      const parsed = await Promise.all(
        rows.map<Promise<ParsedPasteRow>>(async (row) => {
          const candidates = await capabilities.api.searchMaterials({
            keyword: row.code,
            page: 1,
            pageSize: 10,
          });
          const matched = candidates.find(
            (m) =>
              (m.code ?? '').toLowerCase() === row.code.toLowerCase() ||
              (m.name ?? '').toLowerCase() === row.code.toLowerCase(),
          );
          const routeOption = await resolveRouteOptionForImportRow(
            row,
            matched,
          );
          const itemSource: ItemSource = matched ? 'material' : 'temporary';
          const importDefaults = capabilities.configuration.resolveImportDefaults({
            itemSource,
            material: matched,
            row,
          });
          const partType = importDefaults.partType;
          const routeSelectable = capabilities.configuration.isManualRouteSelectableLine({
            itemSource,
            partType,
          });
          return {
            ...row,
            material: matched,
            routeId: routeOption?.value ?? row.routeId,
            routeOption,
            matched: Boolean(matched),
            warnings: [
              ...(matched ? [] : ['未匹配物料档案，将按本单临时自制件导入']),
              ...(row.routeCode && routeSelectable && !routeOption
                ? ['未匹配启用工艺路线']
                : []),
            ],
          };
        }),
      );
      appendImportedRows(parsed, sourceLabel);
    } finally {
      setPasteMatching(false);
    }
  };

  const handlePasteMatch = async () => {
    try {
      await importBomRows(
        parsePasteText(pasteText, capabilities.configuration),
        'paste',
      );
    } catch (error) {
      message.error(readErrorMessage(error) || 'BOM 明细匹配失败');
    }
  };

  const importBomExcelFile = async (file: File) => {
    setPasteMatching(true);
    try {
      const base64 = await readFileBase64(file);
      const preview = await capabilities.api.parseExcel({
        base64,
        fileName: file.name,
        uploadEmbeddedImages: true,
      });
      const parsed = (preview.rows ?? []).map<ParsedPasteRow>((rawRow) => {
        const row = rawRow;
        const material = buildMaterialRefFromImportPreview(row);
        const routeOption = buildRouteOptionFromImportPreview(row);
        return {
          sourceRowNo: row.sourceRowNo,
          lineKey: row.lineKey,
          parentLineKey: row.parentLineKey,
          level: row.level,
          code: row.code,
          name: row.name,
          quantity: row.quantity,
          unit: row.unit,
          lossRate: row.lossRate,
          operationSequence: row.operationSequence,
          routeCode: row.routeCode,
          routeName: row.routeName,
          routeId: row.routeId,
          routeOption,
          issueRequirementMode:
            row.issueRequirementMode === 'required'
              ? 'required'
              : row.issueRequirementMode === 'not_required'
                ? 'not_required'
                : undefined,
          materialConsumptionMode: row.materialConsumptionMode,
          parentCode: row.parentCode,
          drawingUrls: row.drawingUrls ?? [],
          imageUrls: row.imageUrls ?? [],
          material,
          matched: row.matched,
          errors: row.errors ?? [],
          warnings: row.warnings ?? [],
        };
      });
      appendImportedRows(parsed, 'excel');
    } finally {
      setPasteMatching(false);
    }
  };

  const importBomFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    if (/\.xlsx$/.test(fileName)) {
      try {
        await importBomExcelFile(file);
      } catch (error) {
        message.error(readErrorMessage(error) || 'BOM Excel 解析失败');
      }
      return;
    }
    if (/\.xls$/.test(fileName)) {
      message.warning(
        '请将 Excel 文件另存为 .xlsx 后上传；内嵌图片仅支持 .xlsx',
      );
      return;
    }
    if (!/\.(csv|tsv|txt)$/.test(fileName)) {
      message.warning('请上传 XLSX、CSV、TSV 或 TXT 格式的 BOM 明细文件');
      return;
    }
    try {
      const text = await readTextFile(file);
      await importBomRows(
        parsePasteText(text, capabilities.configuration),
        'file',
      );
    } catch (error) {
      message.error(readErrorMessage(error) || 'BOM 文件读取失败');
    }
  };

  const handleBomFileBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    void importBomFile(file);
    return Upload.LIST_IGNORE;
  };

  const handleDownloadBomTemplate = async () => {
    setTemplateDownloading(true);
    try {
      const blob = await capabilities.api.downloadImportTemplate();
      capabilities.downloadBlob(
        blob,
        capabilities.configuration.importTemplateFileName,
      );
    } catch (error) {
      message.error(readErrorMessage(error) || 'BOM 模板下载失败');
    } finally {
      setTemplateDownloading(false);
    }
  };

  const buildLineInput = (
    line: EditableBomLine,
    index: number,
    resolveParentId: (key?: string) => string | undefined,
    resolveOwnId: (key: string) => string | undefined,
  ): DocumentBomLineInput => {
    const itemSource: ItemSource =
      capabilities.configuration.resolveDocumentLineItemSource(line);
    return {
      id: line.id ?? resolveOwnId(line._key),
      sourceStandardBomItemId: line.sourceStandardBomItemId,
      sourceDocumentBomLineId: line.sourceDocumentBomLineId,
      lineNo: index + 1,
      parentLineId: resolveParentId(line.parentKey),
      lineState: line.lineState,
      itemSource,
      materialId: itemSource === 'material' ? line.materialId : undefined,
      temporaryItemCode:
        itemSource === 'temporary' ? line.temporaryItemCode : undefined,
      temporaryItemName:
        itemSource === 'temporary' ? line.temporaryItemName : undefined,
      temporaryItemSpec:
        itemSource === 'temporary' ? line.temporaryItemSpec : undefined,
      routeId: capabilities.configuration.isManualRouteSelectableLine(line) ? line.routeId : undefined,
      quantity: line.quantity as number,
      unit: line.unit as string,
      lossRate: line.lossRate,
      operationSequence: line.operationSequence,
      ...capabilities.configuration.resolveLineSubmissionDefaults({
        itemSource,
        issueRequirementMode: line.issueRequirementMode,
        materialConsumptionMode: line.materialConsumptionMode,
      }),
      originalMaterialId:
        itemSource === 'material' ? line.originalMaterialId : undefined,
      partType: line.partType,
      adjustReason: line.adjustReason,
      drawingUrls: line.drawingUrls ?? [],
      imageUrls: line.imageUrls ?? [],
      ...(buildDocumentLineCustomValuePayload(line, lineCustomFieldSchema) ??
        {}),
      sourceAttributes: {
        ...(line.sourceAttributes ?? {}),
        _clientKey: line._key,
      },
    };
  };

  const handleSave = async () => {
    if (!documentId || !canView || !canEdit || !statusEditable) return;
    const activeLines = editLines.filter(
      (line) => line.lineState !== 'excluded',
    );
    const invalid = activeLines.find((line) => {
      const itemSource =
        capabilities.configuration.resolveDocumentLineItemSource(line);
      const hasValidQty =
        typeof line.quantity === 'number' && line.quantity > 0;
      const hasValidUnit = Boolean(line.unit);
      if (!hasValidQty || !hasValidUnit) return true;
      if (itemSource === 'material') return !line.materialId;
      return !line.temporaryItemCode && !line.temporaryItemName;
    });
    if (invalid) {
      const rowIndex = editLines.findIndex(
        (line) => line._key === invalid._key,
      );
      message.warning(
        `第 ${rowIndex + 1} 行需填写${
          invalid.itemSource === 'temporary' ? '临时件编码/名称' : '物料'
        }、数量(>0) 和单位`,
      );
      return;
    }
    const invalidTemporaryLine = activeLines.find(
      (line) =>
        line.itemSource === 'temporary' &&
        !capabilities.configuration.isTemporaryLineSaveable(line),
    );
    if (invalidTemporaryLine) {
      const rowIndex = editLines.findIndex(
        (line) => line._key === invalidTemporaryLine._key,
      );
      message.warning(
        `第 ${rowIndex + 1} 行临时件只能是自制/委外，且不能生成领料需求`,
      );
      return;
    }
    const invalidParent = findInvalidParentLine(editLines);
    if (invalidParent) {
      const rowIndex = editLines.findIndex(
        (line) => line._key === invalidParent._key,
      );
      message.warning(
        `第 ${rowIndex + 1} 行父项无效；父项必须是有效行，且不能形成循环层级`,
      );
      return;
    }
    setSaving(true);
    try {
      let headerId = bom?.id;
      if (!headerId) {
        const ensured = await capabilities.api.ensure({
          documentType,
          documentId,
          productQty,
        });
        headerId = ensured.id;
      }
      // pass 1：先用已有 id 解析父子，新行父链稍后回填
      const keyToId = new Map<string, string>();
      editLines.forEach((line) => {
        if (line.id) keyToId.set(line._key, line.id);
      });
      const resolveOwnId = (key: string) => keyToId.get(key);
      const resolveParentPass1 = (key?: string) =>
        key ? keyToId.get(key) : undefined;
      const pass1 = editLines.map((line, index) =>
        buildLineInput(line, index, resolveParentPass1, resolveOwnId),
      );
      const res1 = await capabilities.api.updateLines({
        id: headerId as string,
        lines: pass1,
        reason: capabilities.configuration.saveReason,
      });
      (res1.lines ?? []).forEach((serverLine) => {
        const clientKey = readClientKey(
          serverLine.sourceAttributes as Record<string, unknown> | undefined,
        );
        if (clientKey && serverLine.id) keyToId.set(clientKey, serverLine.id);
      });
      // pass 2：存在“新父行”的多级结构时，回填 parentLineId
      const hasNewParentLink = editLines.some(
        (line) =>
          line.parentKey &&
          !editLines.find((p) => p._key === line.parentKey)?.id,
      );
      let finalHeader = res1;
      if (hasNewParentLink) {
        const resolveParentPass2 = (key?: string) =>
          key ? keyToId.get(key) : undefined;
        const pass2 = editLines.map((line, index) =>
          buildLineInput(line, index, resolveParentPass2, resolveOwnId),
        );
        finalHeader = await capabilities.api.updateLines({
          id: headerId as string,
          lines: pass2,
          reason: capabilities.configuration.parentLinkSaveReason,
        });
      }
      message.success('本单 BOM 已保存');
      setBom(finalHeader);
      setEditing(false);
      setEditLines([]);
      setRouteOptionsByLine({});
      onSaved?.();
    } catch (error) {
      message.error(readErrorMessage(error) || '保存本单 BOM 失败');
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = useMemo(
    () =>
      editLines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.lineState !== 'excluded')
        .map(({ line, index }) => ({
          value: line._key,
          label: buildLineDisplayLabel(line, index, capabilities.configuration),
        })),
    [editLines],
  );

  const getParentOptions = (record: EditableBomLine) => {
    const disabledKeys = buildDescendantKeySet(editLines, record._key);
    disabledKeys.add(record._key);
    return parentOptions.filter((option) => !disabledKeys.has(option.value));
  };

  const viewMaterialCustomFieldColumns: ColumnsType<DocumentBomLineWithCustomFields> =
    visibleMaterialCustomFields.map((field) => ({
      title: `物料·${field.label}`,
      key: `material-custom-${field.fieldKey}`,
      width: resolveMaterialCustomFieldWidth(field),
      render: (_: unknown, record) => {
        const material = record.material;
        return renderCustomFieldCell(field, {
          computedValues: material?.customComputedValues,
          rawValues: material?.customValues,
          errors: material?.customComputedErrors,
        });
      },
    }));

  const editMaterialCustomFieldColumns: ColumnsType<EditableBomLine> =
    visibleMaterialCustomFields.map((field) => ({
      title: `物料·${field.label}`,
      key: `material-custom-${field.fieldKey}`,
      width: resolveMaterialCustomFieldWidth(field),
      render: (_: unknown, record) => {
        if ((record.itemSource ?? 'material') !== 'material') return '-';
        const selectedOption =
          record.materialOption?.value === record.materialId
            ? record.materialOption
            : undefined;
        return renderCustomFieldCell(field, {
          computedValues:
            selectedOption?.customComputedValues ??
            record.material?.customComputedValues,
          rawValues:
            selectedOption?.customValues ?? record.material?.customValues,
          errors:
            selectedOption?.customComputedErrors ??
            record.material?.customComputedErrors,
        });
      },
    }));

  const viewLineCustomFieldColumns: ColumnsType<DocumentBomLineWithCustomFields> =
    visibleLineCustomFields.map((field) => ({
      title: field.label,
      key: `line-custom-${field.fieldKey}`,
      width: resolveDocumentLineCustomFieldWidth(field),
      render: (_: unknown, record) =>
        renderCustomFieldCell(field, {
          computedValues: record.customComputedValues,
          rawValues: record.customValues,
          errors: record.customComputedErrors,
        }),
    }));

  const editLineCustomFieldColumns: ColumnsType<EditableBomLine> =
    editableLineCustomFields.map((field) => ({
      title: field.label,
      key: `line-custom-${field.fieldKey}`,
      width: resolveDocumentLineCustomFieldWidth(field),
      render: (_: unknown, record) =>
        renderDocumentLineCustomFieldEditor(
          field,
          record.customValues?.[field.fieldKey],
          (value) =>
            updateEditLine(record._key, {
              customFieldSchemaVersion: lineCustomFieldSchema?.schemaVersion,
              customValues: {
                ...(record.customValues ?? {}),
                [field.fieldKey]: value,
              },
            }),
        ),
    }));

  const renderViewBody = () => {
    if (!bom) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="当前单据尚未生成专属 BOM；未改配时生产仍按来源标准 BOM 解析。"
        />
      );
    }
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions
          size="small"
          bordered
          column={2}
          items={[
            {
              key: 'versionNo',
              label: '单据 BOM 版本',
              children: bom.versionNo || '-',
            },
            {
              key: 'status',
              label: '状态',
              children: (
                <Tag
                  color={
                    capabilities.configuration.documentBomStatusColors[bom.status ?? ''] ?? 'default'
                  }
                >
                  {capabilities.configuration.documentBomStatusLabels[bom.status ?? ''] ?? capabilities.configuration.unknownStatusLabel}
                </Tag>
              ),
            },
            {
              key: 'sourceStandardBom',
              label: '来源标准 BOM',
              children: formatSourceBom(
                bom,
                capabilities.configuration.standardBomFallbackLabel,
              ),
            },
            {
              key: 'manufactureMode',
              label: '产品类型',
              children: bom.manufactureMode
                ? capabilities.configuration.manufactureModeLabels[bom.manufactureMode] ?? bom.manufactureMode
                : '-',
            },
            {
              key: 'lineSummary',
              label: '行数',
              children: `有效 ${activeCount}，已排除 ${excludedCount}`,
            },
          ]}
        />
        {excludedCount > 0 ? (
          <Space>
            <Switch
              size="small"
              checked={showExcludedLines}
              onChange={setShowExcludedLines}
            />
            <Typography.Text type="secondary">显示已排除行</Typography.Text>
          </Space>
        ) : null}
        <Table<DocumentBomLineWithCustomFields>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={visibleLines}
          scroll={{
            x:
              capabilities.configuration.viewTableScrollWidth +
              materialCustomFieldScrollWidth +
              viewLineCustomFieldScrollWidth,
          }}
          columns={[
            { title: '行号', dataIndex: 'lineNo', width: 72 },
            {
              title: '状态',
              dataIndex: 'lineState',
              width: 90,
              render: (value) => (
                <Tag color={capabilities.configuration.lineStateColors[String(value)] ?? 'default'}>
                  {capabilities.configuration.lineStateLabels[String(value)] ?? String(value ?? '-')}
                </Tag>
              ),
            },
            {
              title: '物料',
              dataIndex: 'materialId',
              width: capabilities.configuration.materialColumnWidth,
              render: (_, record) => {
                const itemSource = resolveLineItemSource(
                  record,
                  capabilities.configuration.resolveDocumentLineItemSource,
                );
                return (
                  <Space size={6} wrap>
                    <Tag color={capabilities.configuration.itemSourceColors[itemSource]}>
                      {capabilities.configuration.itemSourceLabels[itemSource]}
                    </Tag>
                    <Typography.Text>
                      {formatMaterial(
                        record,
                        capabilities.configuration.resolveDocumentLineItemSource,
                        capabilities.configuration.temporaryItemFallbackLabel,
                      )}
                    </Typography.Text>
                  </Space>
                );
              },
            },
            ...viewMaterialCustomFieldColumns,
            ...viewLineCustomFieldColumns,
            {
              title: '类型',
              dataIndex: 'partType',
              width: 96,
              render: (value) => {
                const partType = value as BomItemPartType | undefined;
                return partType ? (
          <Tag color={capabilities.configuration.partTypeColors[partType]}>
                    {formatPartType(partType, capabilities.configuration.partTypeLabels)}
                  </Tag>
                ) : (
                  '-'
                );
              },
            },
            {
              title: '数量',
              dataIndex: 'quantity',
              width: 110,
              align: 'right',
              render: (value) => formatNumber(value as number | null),
            },
            {
              title: '单位',
              dataIndex: 'unit',
              width: 80,
              // 存量自由文本单位不在字典中，labelMap 命不中时回退原值，不吞数据
              render: (value) =>
                formatUnitLabel(value as string | undefined, unitLabelMap) ||
                '-',
            },
            {
              title: (
                <Tooltip title="本行冻结自标准 BOM 明细行的取整规则：整单需求按「计划数量 × 用量 × (1+损耗率)」算出后，再按这里的规则收口。- 表示沿用默认（向上取整 4 位）。">
                  <span
                    style={{ borderBottom: '1px dashed #999', cursor: 'help' }}
                  >
                    取整
                  </span>
                </Tooltip>
              ),
              dataIndex: 'roundingMode',
              width: 150,
              render: (_, record) =>
                capabilities.configuration.formatBomQuantityRounding(
                  record.roundingMode,
                  record.roundingPrecision,
                ) ?? '-',
            },
            {
              title: '领料',
              dataIndex: 'issueRequirementMode',
              width: 96,
              render: (value) => {
                const mode =
                  capabilities.configuration.resolveLoadedIssueRequirementMode(
                    value as BomLineIssueRequirementMode | undefined,
                  );
                return (
                  <Tag
                    color={capabilities.configuration.issueRequirementModeDisplay[mode].color}
                  >
                    {capabilities.configuration.issueRequirementModeDisplay[mode].label}
                  </Tag>
                );
              },
            },
            {
              title: '领料模式',
              dataIndex: 'materialConsumptionMode',
              width: 132,
              render: (value) => {
                const mode = value as MaterialConsumptionMode | undefined;
                if (!mode) return '-';
                return (
                  <Tag
                    color={capabilities.configuration.materialConsumptionModeDisplay[mode].color}
                  >
                    {capabilities.configuration.materialConsumptionModeDisplay[mode]?.label ?? mode}
                  </Tag>
                );
              },
            },
            {
              title: '工艺路线',
              dataIndex: 'routeId',
              width: 190,
              render: (_, record) => (
                <Typography.Text
                  type={
                    capabilities.configuration.isManualRouteSelectableLine(record)
                      ? undefined
                      : 'secondary'
                  }
                >
                  {formatProcessRoute(
                    record,
                    capabilities.configuration.isManualRouteSelectableLine,
                    capabilities.configuration.routeByMaterialRuleLabel,
                  )}
                </Typography.Text>
              ),
            },
            {
              title: '图纸',
              dataIndex: 'drawingUrls',
              width: 180,
              render: (_, record) =>
                capabilities.files.renderDrawingFiles({
                  value: getLineFileUrls(record),
                  emptyText: '暂无图纸',
                  maxCount: 20,
                }),
            },
            {
              title: '损耗率',
              dataIndex: 'lossRate',
              width: 100,
              align: 'right',
              render: (value) => formatNumber(value as number | null),
            },
            {
              title: '差异说明',
              dataIndex: 'adjustReason',
              width: 180,
              render: (value, record) => (
                <Typography.Text
                  type={
                    record.lineState === 'excluded' ? 'secondary' : undefined
                  }
                >
                  {value || '-'}
                </Typography.Text>
              ),
            },
          ]}
        />
      </Space>
    );
  };

  const renderEditBody = () => (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap>
        <Button icon={<PlusOutlined />} onClick={addEditLine}>
          手工加行
        </Button>
        <Button
          icon={<ImportOutlined />}
          onClick={() => {
            setPasteText('');
            setPasteOpen(true);
          }}
        >
          上传/粘贴 BOM
        </Button>
        <Typography.Text type="secondary">
          编辑结果写入本单 BOM（document_bom），不影响来源标准 BOM。
        </Typography.Text>
      </Space>
      <Table<EditableBomLine>
        rowKey="_key"
        size="small"
        pagination={false}
        dataSource={editLines}
        scroll={{
          x:
            capabilities.configuration.editTableScrollWidth +
            materialCustomFieldScrollWidth +
            editLineCustomFieldScrollWidth,
        }}
        columns={[
          {
            title: '来源/物料',
            dataIndex: 'materialId',
            width: capabilities.configuration.materialColumnWidth,
            render: (_, record) => {
              const itemSource =
                record.itemSource === 'temporary' ? 'temporary' : 'material';
              const sourceLocked = Boolean(record.sourceStandardBomItemId);
              return (
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Segmented
                    size="small"
                    block
                    options={[...capabilities.configuration.itemSourceOptions]}
                    value={itemSource}
                    disabled={sourceLocked}
                    onChange={(value) => {
                      const nextSource = String(value) as ItemSource;
                      if (nextSource === itemSource) return;
                      const sourceDefaults =
                        capabilities.configuration.resolveItemSourceSwitchDefaults(
                          nextSource,
                          {
                            issueRequirementMode: record.issueRequirementMode,
                            materialConsumptionMode:
                              record.materialConsumptionMode,
                          },
                        );
                      updateEditLine(record._key, {
                        itemSource: nextSource,
                        materialId: undefined,
                        material: undefined,
                        materialOption: undefined,
                        originalMaterialId: undefined,
                        temporaryItemCode: undefined,
                        temporaryItemName: undefined,
                        temporaryItemSpec: undefined,
                        routeId: undefined,
                        routeOption: undefined,
                        ...sourceDefaults,
                      });
                    }}
                  />
                  {itemSource === 'temporary' ? (
                    <Space
                      direction="vertical"
                      size={4}
                      style={{ width: '100%' }}
                    >
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="编码/图号"
                          value={record.temporaryItemCode}
                          style={{ width: '42%' }}
                          onChange={(event) =>
                            updateEditLine(record._key, {
                              temporaryItemCode: event.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="名称"
                          value={record.temporaryItemName}
                          style={{ width: '58%' }}
                          onChange={(event) =>
                            updateEditLine(record._key, {
                              temporaryItemName: event.target.value,
                            })
                          }
                        />
                      </Space.Compact>
                      <Input
                        placeholder="规格/材质"
                        value={record.temporaryItemSpec}
                        onChange={(event) =>
                          updateEditLine(record._key, {
                            temporaryItemSpec: event.target.value,
                          })
                        }
                      />
                    </Space>
                  ) : (
                    capabilities.materials.renderSelector({
                      request: async (params) => {
                        const materials = await capabilities.api.searchSelectableMaterials({
                          keyword: params?.keyWords ?? '',
                          page: 1,
                          pageSize: 10,
                        });
                        return materials.flatMap((material) => {
                          const option = buildMaterialOption(material);
                          return option ? [option] : [];
                        });
                      },
                      value: record.materialId,
                      selectedOption:
                        record.materialOption ??
                        buildMaterialOption(record.material),
                      filterMode: 'hidden',
                      style: { width: '100%' },
                      onChange: (value, selectedOption) => {
                        const partType = value
                          ? capabilities.configuration.resolveDefaultPartTypeFromProcurement(
                              selectedOption?.procurementType,
                            )
                          : undefined;
                        updateEditLine(record._key, {
                          itemSource: 'material',
                          materialId: value,
                          material: undefined,
                          materialOption: selectedOption,
                          temporaryItemCode: undefined,
                          temporaryItemName: undefined,
                          temporaryItemSpec: undefined,
                          partType,
                          routeId: undefined,
                          routeOption: undefined,
                          unit: record.unit || undefined,
                        });
                      },
                    })
                  )}
                </Space>
              );
            },
          },
          ...editMaterialCustomFieldColumns,
          ...editLineCustomFieldColumns,
          {
            title: '类型',
            dataIndex: 'partType',
            width: 130,
            render: (_, record) => (
              <Select
                value={record.partType}
                options={
                  record.itemSource === 'temporary'
                    ? [...capabilities.configuration.temporaryPartTypeOptions]
                    : [...capabilities.configuration.partTypeOptions]
                }
                // 仅继承自上游的行(挂来源锚点)且非「完全可调整」时锁定供料方式；
                // 本单原生手工行/新增行自由可改。与后端 assertExistingLineAdjustmentAllowed 同口径。
                disabled={
                  Boolean(
                    record.sourceStandardBomItemId ||
                      record.sourceDocumentBomLineId,
                  ) && !record.canCustomize
                }
                placeholder="类型"
                style={{ width: '100%' }}
                onChange={(value) => {
                  const nextLine = { ...record, partType: value };
                  updateEditLine(record._key, {
                    partType: value,
                    routeId: capabilities.configuration.isManualRouteSelectableLine(nextLine)
                      ? record.routeId
                      : undefined,
                    routeOption: capabilities.configuration.isManualRouteSelectableLine(nextLine)
                      ? record.routeOption
                      : undefined,
                  });
                }}
              />
            ),
          },
          {
            title: '工艺路线',
            dataIndex: 'routeId',
            width: 220,
            render: (_, record) => {
              const routeSelectable = capabilities.configuration.isManualRouteSelectableLine(record);
              const options = mergeRouteOptions(
                routeOptionsByLine[record._key] ?? [],
                record.routeOption,
              );
              return (
                <RemoteSelect<string, ProcessRouteSelectOption>
                  allowClear
                  showSearch
                  placeholder={
                    routeSelectable
                      ? '选择通用工艺'
                      : record.itemSource === 'temporary'
                        ? '仅临时自制/委外需要'
                        : capabilities.configuration.routeByMaterialRuleLabel
                  }
                  disabled={!routeSelectable}
                  value={routeSelectable ? record.routeId : undefined}
                  options={options}
                  filterOption={false}
                  style={{ width: '100%' }}
                  onFocus={() => void loadRouteOptionsForLine(record)}
                  onSearch={(value) =>
                    void loadRouteOptionsForLine(record, value)
                  }
                  onChange={(value, option) => {
                    const selected = Array.isArray(option) ? undefined : option;
                    updateEditLine(record._key, {
                      routeId: value || undefined,
                      routeOption:
                        value && selected
                          ? {
                              value: String(selected.value),
                              label: String(selected.label ?? selected.value),
                            }
                          : undefined,
                    });
                  }}
                />
              );
            },
          },
          {
            title: '数量',
            dataIndex: 'quantity',
            width: 120,
            render: (_, record) => (
              <InputNumber
                min={0}
                value={record.quantity}
                style={{ width: '100%' }}
                onChange={(value) =>
                  updateEditLine(record._key, {
                    quantity: value ?? undefined,
                  })
                }
              />
            ),
          },
          {
            title: '单位',
            dataIndex: 'unit',
            width: 128,
            render: (_, record) => (
              <Select
                showSearch
                allowClear
                placeholder="用量单位"
                value={record.unit || undefined}
                options={[...unitOptions]}
                optionFilterProp="label"
                style={{ width: '100%' }}
                onChange={(value) =>
                  updateEditLine(record._key, { unit: value || undefined })
                }
              />
            ),
          },
          {
            title: (
              <Tooltip title="本行冻结自标准 BOM 明细行的取整规则：整单需求按「计划数量 × 用量 × (1+损耗率)」算出后，再按这里的规则收口。- 表示沿用默认（向上取整 4 位）。规则在标准 BOM 明细行维护，单据 BOM 只读。">
                <span
                  style={{ borderBottom: '1px dashed #999', cursor: 'help' }}
                >
                  取整
                </span>
              </Tooltip>
            ),
            dataIndex: 'roundingMode',
            width: 130,
            render: (_, record) => (
              <Typography.Text type="secondary">
                {capabilities.configuration.formatBomQuantityRounding(
                  record.roundingMode,
                  record.roundingPrecision,
                ) ?? '-'}
              </Typography.Text>
            ),
          },
          {
            title: '领料',
            dataIndex: 'issueRequirementMode',
            width: 110,
            render: (_, record) => (
              <Switch
                checked={
                  record.itemSource !== 'temporary' &&
                  capabilities.configuration.isIssueRequirementGenerated(
                    record.issueRequirementMode,
                  )
                }
                disabled={record.itemSource === 'temporary'}
                checkedChildren={
                  capabilities.configuration.issueRequirementModeDisplay.required.label
                }
                unCheckedChildren={
                  capabilities.configuration.issueRequirementModeDisplay.not_required.label
                }
                onChange={(checked) =>
                  updateEditLine(record._key, {
                    issueRequirementMode:
                      capabilities.configuration.resolveIssueRequirementModeFromToggle(
                        checked,
                      ),
                  })
                }
              />
            ),
          },
          {
            title: '领料模式',
            dataIndex: 'materialConsumptionMode',
            width: 164,
            render: (_, record) => (
              <Select
                allowClear={!record.id}
                disabled={record.itemSource === 'temporary'}
                placeholder="按物料/公司带出"
                value={record.materialConsumptionMode}
                options={[...capabilities.configuration.materialConsumptionModeOptions]}
                style={{ width: '100%' }}
                onChange={(value) =>
                  updateEditLine(record._key, {
                    materialConsumptionMode: value as
                      | MaterialConsumptionMode
                      | undefined,
                  })
                }
              />
            ),
          },
          {
            title: '图纸',
            dataIndex: 'drawingUrls',
            width: 220,
            render: (_, record) =>
              capabilities.files.renderDrawingFiles({
                editable: true,
                value: record.drawingUrls ?? [],
                emptyText: '暂无行图纸',
                uploadText: '上传行图纸',
                maxCount: 20,
                onChange: (drawingUrls) =>
                  updateEditLine(record._key, { drawingUrls }),
              }),
          },
          {
            title: '损耗率',
            dataIndex: 'lossRate',
            width: 110,
            render: (_, record) => (
              <InputNumber
                min={0}
                value={record.lossRate}
                style={{ width: '100%' }}
                onChange={(value) =>
                  updateEditLine(record._key, { lossRate: value ?? undefined })
                }
              />
            ),
          },
          {
            title: '投料工序',
            dataIndex: 'operationSequence',
            width: 110,
            render: (_, record) => (
              <InputNumber
                min={0}
                value={record.operationSequence}
                style={{ width: '100%' }}
                onChange={(value) =>
                  updateEditLine(record._key, {
                    operationSequence: value ?? undefined,
                  })
                }
              />
            ),
          },
          {
            title: '父项',
            dataIndex: 'parentKey',
            width: 240,
            render: (_, record) => (
              <Select
                allowClear
                placeholder="顶层"
                style={{ width: '100%' }}
                value={record.parentKey}
                options={getParentOptions(record)}
                onChange={(value) =>
                  updateEditLine(record._key, { parentKey: value || undefined })
                }
              />
            ),
          },
          {
            title: '状态',
            dataIndex: 'lineState',
            width: 84,
            render: (_, record) => (
              <Tag color={capabilities.configuration.lineStateColors[record.lineState] ?? 'default'}>
                {capabilities.configuration.lineStateLabels[record.lineState] ?? record.lineState}
              </Tag>
            ),
          },
          {
            title: '操作',
            key: 'actions',
            dataIndex: '__actions',
            valueType: 'option',
            width: 80,
            render: (_, record) =>
              record.lineState === 'excluded' ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    updateEditLine(record._key, { lineState: 'active' })
                  }
                >
                  恢复
                </Button>
              ) : (
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeEditLine(record._key)}
                />
              ),
          },
        ]}
      />
    </Space>
  );

  const drawerExtra =
    canEdit && !editing && statusEditable ? (
      <Button
        type="primary"
        icon={<EditOutlined />}
        loading={saving}
        onClick={() => void enterEditing()}
      >
        {bom ? '编辑' : '导入/新增'}
      </Button>
    ) : canEdit && editing ? (
      <Space>
        <Button onClick={() => void cancelEditing()} disabled={saving}>
          取消
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => void handleSave()}
        >
          保存
        </Button>
      </Space>
    ) : null;

  if (!canView) return null;

  return (
    <Drawer
      title={title ?? '单据 BOM'}
      open={open}
      onClose={onClose}
      width={editing && canEdit ? 1280 : 1040}
      destroyOnHidden
      extra={drawerExtra}
    >
      <Spin spinning={loading || saving}>
        {editing && canEdit ? renderEditBody() : renderViewBody()}
      </Spin>
      <Modal
        title="上传/粘贴本单 BOM"
        open={pasteOpen}
        onCancel={() => setPasteOpen(false)}
        onOk={() => void handlePasteMatch()}
        okText="解析并匹配"
        confirmLoading={pasteMatching}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Upload
              accept=".xlsx,.csv,.tsv,.txt"
              maxCount={1}
              showUploadList={false}
              beforeUpload={handleBomFileBeforeUpload}
            >
              <Button icon={<UploadOutlined />} loading={pasteMatching}>
                上传 BOM 明细文件
              </Button>
            </Upload>
            <Button
              icon={<DownloadOutlined />}
              loading={templateDownloading}
              onClick={() => void handleDownloadBomTemplate()}
            >
              下载模板
            </Button>
          </Space>
          <Typography.Text type="secondary">
            支持 XLSX / CSV / TSV / TXT；XLSX
            文件由后端解析并按物料档案匹配；未匹配物料档案的行会按本单临时自制件导入且不生成领料。插入到图纸/附件/图片列的图片会自动上传并带入当前行，文本文件只解析图纸
            URL。
          </Typography.Text>
        </Space>
        <Typography.Paragraph type="secondary">
          每行一个物料，列用 Tab 或逗号分隔；支持带表头：
          <br />
          <Typography.Text code>
            物料编码 [Tab] 数量 [Tab] 单位 [Tab] 参与领料 [Tab]
            自制/委外工艺路线 [Tab] 损耗率
          </Typography.Text>
          <br />
          <Typography.Text code>
            行号 [Tab] 层级 [Tab] 父项行号 [Tab] 父项编码 [Tab] 物料编码 [Tab]
            物料名称 [Tab] 数量 [Tab] 单位 [Tab] 参与领料 [Tab]
            自制/委外工艺路线 [Tab] 损耗率 [Tab] 投料工序 [Tab] 图纸URL/图片
          </Typography.Text>
          <br />
          父项行号用于导入多级
          BOM，顶层留空；父项编码适合父项物料唯一的简单场景。
          工艺路线仅本单新增的自制/委外行需要填写，标准 BOM
          来源行和采购/标准件按物料默认规则处理。
          <br />
          需要直接放图片时，请使用 XLSX
          文件，并把图片左上角放在对应明细行的图纸/附件/图片列。
          <br />
          系统按物料编码/名称匹配档案；匹配不上的一次性自制件会作为临时件导入。需要计算领料时，请把钢板、螺丝等真实材料作为子行并选择物料档案。
        </Typography.Paragraph>
        <Input.TextArea
          rows={10}
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder={capabilities.configuration.importPlaceholder}
        />
      </Modal>
    </Drawer>
  );
}
