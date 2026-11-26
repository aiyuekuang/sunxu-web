/** @sunxu-layer business @sunxu-domain print @sunxu-reason Preserves MES print option labels and request boundaries while the host owns all print-service requests. */

export type PrintTemplateType =
  | 'document_flow'
  | 'label_compact'
  | 'serial_label'
  | 'continuous_fixed';

export interface PrintSelectOption<T extends string = string> {
  label: string;
  value: T;
}

export interface MesPrintBusiness {
  businessType: string;
  businessName: string;
  enabled: boolean;
  supportedTemplateTypes: PrintTemplateType[];
}

export interface MesPrintTemplate {
  id: string;
  name: string;
  isDefault?: boolean;
  currentVersion?: { versionNo?: string | null } | null;
}

export interface MesPaperProfile {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  isDefault?: boolean;
}

export interface MesPrintSceneOptions {
  business: MesPrintBusiness;
  templates: MesPrintTemplate[];
  paperProfiles: MesPaperProfile[];
}

export interface MesPrintOptionsCapabilities {
  pageSize: number;
  listBusinesses: (params: { page: number; pageSize: number }) => Promise<MesPrintBusiness[]>;
  getSceneOptions: (params: {
    businessType: string;
    templateType?: PrintTemplateType;
  }) => Promise<MesPrintSceneOptions>;
  listTemplates: (params: {
    page: number;
    pageSize: number;
    businessType?: string;
    templateType?: PrintTemplateType;
    status: 'published';
  }) => Promise<{ list?: MesPrintTemplate[] }>;
  listPaperProfiles: (params: {
    page: number;
    pageSize: number;
    templateType?: PrintTemplateType;
  }) => Promise<{ list?: MesPaperProfile[] }>;
}

export const MAX_PRINT_COPY_COUNT = 6;

const PRINT_TEMPLATE_TYPE_LABELS: Record<PrintTemplateType, string> = {
  document_flow: 'A4/流式单据',
  label_compact: '标签',
  serial_label: '序列号小标签',
  continuous_fixed: '连续纸/针打',
};

const PRINT_TEMPLATE_TYPE_VALUES = Object.keys(
  PRINT_TEMPLATE_TYPE_LABELS,
) as PrintTemplateType[];

export const TEMPLATE_TYPE_OPTIONS: PrintSelectOption<PrintTemplateType>[] =
  PRINT_TEMPLATE_TYPE_VALUES.map((value) => ({
    label: PRINT_TEMPLATE_TYPE_LABELS[value],
    value,
  }));

export function isPrintTemplateType(value: unknown): value is PrintTemplateType {
  return (
    typeof value === 'string' &&
    PRINT_TEMPLATE_TYPE_VALUES.some((item) => item === value)
  );
}

export function getTemplateTypeLabel(templateType?: PrintTemplateType): string {
  return templateType ? PRINT_TEMPLATE_TYPE_LABELS[templateType] : '';
}

export async function loadPrintBusinesses(
  capabilities: MesPrintOptionsCapabilities,
): Promise<MesPrintBusiness[]> {
  const rows = await capabilities.listBusinesses({
    page: 1,
    pageSize: capabilities.pageSize,
  });
  return rows.filter((item) => item.enabled);
}

export function toBusinessOptions(rows: MesPrintBusiness[]): PrintSelectOption[] {
  return rows.map((item) => ({
    label: `${item.businessName}（${item.businessType}）`,
    value: item.businessType,
  }));
}

export async function loadBusinessOptions(
  capabilities: MesPrintOptionsCapabilities,
): Promise<PrintSelectOption[]> {
  return toBusinessOptions(await loadPrintBusinesses(capabilities));
}

export function findPrintBusiness(
  rows: MesPrintBusiness[],
  businessType?: string,
): MesPrintBusiness | undefined {
  if (!businessType) return undefined;
  return rows.find((item) => item.businessType === businessType);
}

export function getTemplateTypeOptionsForBusiness(
  business?: MesPrintBusiness | null,
): PrintSelectOption<PrintTemplateType>[] {
  if (!business) return [];
  const supported = new Set(business.supportedTemplateTypes);
  return TEMPLATE_TYPE_OPTIONS.filter((option) => supported.has(option.value));
}

export async function loadPrintSceneOptions(
  capabilities: MesPrintOptionsCapabilities,
  businessType: string,
  templateType?: PrintTemplateType,
): Promise<MesPrintSceneOptions> {
  return capabilities.getSceneOptions({ businessType, templateType });
}

function formatTemplateLabel(template: MesPrintTemplate): string {
  const marks: string[] = [];
  if (template.isDefault) marks.push('默认');
  if (template.currentVersion?.versionNo) {
    marks.push(`v${template.currentVersion.versionNo}`);
  }
  return marks.length > 0
    ? `${template.name}（${marks.join('，')}）`
    : template.name;
}

export function toTemplateOptions(rows: MesPrintTemplate[]): PrintSelectOption[] {
  return rows.map((item) => ({ label: formatTemplateLabel(item), value: item.id }));
}

export async function loadPublishedTemplateRows(
  capabilities: MesPrintOptionsCapabilities,
  businessType?: string,
  templateType?: PrintTemplateType,
): Promise<MesPrintTemplate[]> {
  const result = await capabilities.listTemplates({
    page: 1,
    pageSize: capabilities.pageSize,
    businessType,
    templateType,
    status: 'published',
  });
  return result.list ?? [];
}

export async function loadTemplateOptions(
  capabilities: MesPrintOptionsCapabilities,
  businessType?: string,
  templateType?: PrintTemplateType,
): Promise<PrintSelectOption[]> {
  return toTemplateOptions(
    await loadPublishedTemplateRows(capabilities, businessType, templateType),
  );
}

function formatPaperProfileLabel(paper: MesPaperProfile): string {
  const defaultMark = paper.isDefault ? '，默认' : '';
  return `${paper.name}（${paper.widthMm}x${paper.heightMm}mm${defaultMark}）`;
}

export function toPaperOptions(rows: MesPaperProfile[]): PrintSelectOption[] {
  return rows.map((item) => ({
    label: formatPaperProfileLabel(item),
    value: item.id,
  }));
}

export async function loadPaperRows(
  capabilities: MesPrintOptionsCapabilities,
  templateType?: PrintTemplateType,
): Promise<MesPaperProfile[]> {
  const result = await capabilities.listPaperProfiles({
    page: 1,
    pageSize: capabilities.pageSize,
    templateType,
  });
  return result.list ?? [];
}

export async function loadPaperOptions(
  capabilities: MesPrintOptionsCapabilities,
  templateType?: PrintTemplateType,
): Promise<PrintSelectOption[]> {
  return toPaperOptions(await loadPaperRows(capabilities, templateType));
}
