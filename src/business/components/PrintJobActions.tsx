/** @sunxu-layer business @sunxu-domain print @sunxu-reason Keeps the MES print settings, preview, confirmation and history workflow while the host injects all requests, permissions, status semantics, messages and refresh callbacks. */
import {
  DownloadOutlined,
  HistoryOutlined,
  PrinterOutlined,
  RedoOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Drawer,
  Empty,
  List,
  Space,
  Spin,
  Tag,
  theme,
  Typography,
} from 'antd';
import React, {
  createContext,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { downloadBlob } from '../utils/downloadBlob';
import {
  getTemplateTypeOptionsForBusiness,
  isPrintTemplateType,
  MAX_PRINT_COPY_COUNT,
  toTemplateOptions,
} from './print-options';
import type {
  PrintJobActionCapabilities,
  PrintJobActionParams,
  PrintJobActionReloadRef,
  PrintJobBatchFailure,
  PrintJobPaperProfile,
  PrintJobRecord,
  PrintJobSceneOptions,
  PrintJobTemplate,
  PrintRecordQueryParams,
} from './print-job-action-types';
import type { PrintTemplateType } from './print-options';

interface ReprintFormValues {
  reprintReason: string;
}

interface PrintSettingsFormValues {
  templateType?: PrintTemplateType;
  templateId?: string;
  copyCount?: number;
}

interface PendingPrintSettings {
  paramsList: PrintJobActionParams[];
  business: PrintJobSceneOptions['business'];
  fixedTemplateType?: PrintTemplateType;
  initialValues: PrintSettingsFormValues;
}

interface BatchPrintCreationResult {
  createdRecords: PrintJobRecord[];
  failedItems: PrintJobBatchFailure[];
}

interface PrintPreviewPaperSize {
  name?: string;
  widthMm: number;
  heightMm: number;
}

interface ResolvedTemplatePaperProfile {
  paper: PrintJobPaperProfile | null;
  source: 'template' | 'default' | 'missing';
}

export interface PrintActionProps extends PrintJobActionParams {
  label?: string;
  type?: 'link' | 'default' | 'primary';
  disabled?: boolean;
}

export interface PrintRecordsActionProps extends PrintRecordQueryParams {
  label?: string;
  type?: 'link' | 'default' | 'primary';
  disabled?: boolean;
}

export interface PrintJobActionsProviderProps {
  capabilities: PrintJobActionCapabilities;
  children: ReactNode;
}

const PrintJobActionsContext = createContext<PrintJobActionCapabilities | null>(
  null,
);

/**
 * Inject host-owned print APIs, permission results, messages and refresh callbacks.
 * @sunxu-layer business
 * @sunxu-domain print
 * @sunxu-reason Provides explicit host capabilities without binding the component to MES services or authorization hooks.
 */
export function PrintJobActionsProvider({
  capabilities,
  children,
}: PrintJobActionsProviderProps) {
  return (
    <PrintJobActionsContext.Provider value={capabilities}>
      {children}
    </PrintJobActionsContext.Provider>
  );
}

function usePrintJobActionCapabilities(): PrintJobActionCapabilities {
  const capabilities = useContext(PrintJobActionsContext);
  if (!capabilities) {
    throw new Error(
      'PrintAction and PrintRecordsAction must be rendered inside PrintJobActionsProvider.',
    );
  }
  return capabilities;
}

const MM_TO_CSS_PX = 96 / 25.4;

function getRenderedHtml(job?: PrintJobRecord | null): string {
  const html = job?.renderSnapshotJson?.html;
  return typeof html === 'string' ? html : '';
}

function sanitizeJobHtml(
  job: PrintJobRecord | null | undefined,
  sanitize: (html: string) => string,
): string {
  const rawHtml = getRenderedHtml(job);
  if (!rawHtml) return '';
  return sanitize(rawHtml);
}

function combineRenderedHtml(htmlList: string[]): string {
  const firstHtml = htmlList[0] ?? '';
  const head = firstHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const bodyAttributes = firstHtml.match(/<body([^>]*)>/i)?.[1] ?? '';
  const bodyList = htmlList.map((documentHtml, index) => {
    const body = documentHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
    const content = body ?? documentHtml;
    const pageBreak = index === htmlList.length - 1 ? 'auto' : 'always';
    return `<section style="break-after: ${pageBreak}; page-break-after: ${pageBreak};">${content}</section>`;
  });
  return `<!doctype html><html><head>${head}</head><body${bodyAttributes}>${bodyList.join('')}</body></html>`;
}

function openHtmlForPrint(html: string): boolean {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
  return true;
}

async function readBlobJsonMessage(blob: Blob): Promise<string | undefined> {
  try {
    const parsed = JSON.parse(await blob.text()) as { msg?: unknown };
    return typeof parsed?.msg === 'string' ? parsed.msg : undefined;
  } catch {
    return undefined;
  }
}

async function extractBackendMessage(error: unknown): Promise<string | undefined> {
  const err = error as {
    info?: { msg?: unknown };
    data?: { msg?: unknown };
    response?: { data?: unknown };
  };
  if (typeof err?.info?.msg === 'string') return err.info.msg;
  if (typeof err?.data?.msg === 'string') return err.data.msg;
  const payload = err?.response?.data;
  if (typeof Blob !== 'undefined' && payload instanceof Blob) {
    return readBlobJsonMessage(payload);
  }
  if (payload && typeof payload === 'object' && 'msg' in payload) {
    const msg = (payload as { msg?: unknown }).msg;
    return typeof msg === 'string' ? msg : undefined;
  }
  return undefined;
}

function isServerPdfUnavailable(msg?: string): boolean {
  if (!msg) return false;
  return /chrom(e|ium)|PRINT_CHROME_PATH|转\s*PDF|生成\s*PDF|PDF\s*失败/i.test(
    msg,
  );
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    info?: { msg?: unknown };
    data?: { msg?: unknown };
    message?: unknown;
  };
  if (typeof err?.info?.msg === 'string') return err.info.msg;
  if (typeof err?.data?.msg === 'string') return err.data.msg;
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getRecordValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function safePrintFilenamePart(value: string): string {
  const withoutControlCharacters = [...value]
    .map((character) => {
      const codePoint = character.charCodeAt(0);
      return codePoint <= 0x1f || codePoint === 0x7f ? '_' : character;
    })
    .join('');
  return withoutControlCharacters
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_ .-]+|[_ .-]+$/g, '')
    .slice(0, 120);
}

function getPrintPdfFilename(job: PrintJobRecord): string {
  if (job.businessType !== 'work_order') {
    return `打印记录_${job.id}.pdf`;
  }

  const data = getRecordValue(job.dataSnapshotJson) ?? {};
  const material = getRecordValue(data.material) ?? {};
  const template = getRecordValue(job.templateSnapshotJson) ?? {};
  const materialName = getStringValue(material.name);

  if (template.templateType === 'serial_label') {
    const labelItems = Array.isArray(data.labelItems) ? data.labelItems : [];
    const serialNos = labelItems
      .map((item) => getStringValue(getRecordValue(item)?.serialNo))
      .filter((serialNo): serialNo is string => Boolean(serialNo));
    if (serialNos.length > 0) {
      const start = serialNos[0];
      const end = serialNos[serialNos.length - 1];
      const range = start === end ? start : `${start}-${end}`;
      const base = safePrintFilenamePart(
        [`序列号_${range}`, materialName].filter(Boolean).join('_'),
      );
      if (base) return `${base}.pdf`;
    }
  }

  const base = safePrintFilenamePart(
    [getStringValue(data.docNo), getStringValue(material.code), materialName]
      .filter(Boolean)
      .join('_'),
  );
  return `${base || '工单打印'}.pdf`;
}

function getNumberOrStringValue(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return undefined;
}

function getPrintRecordTemplateName(record: PrintJobRecord): string {
  const templateSnapshot = getRecordValue(record.templateSnapshotJson);
  return (
    record.template?.name ??
    getStringValue(templateSnapshot?.name) ??
    '打印记录'
  );
}

function getPrintRecordVersionNo(record: PrintJobRecord): string | undefined {
  const templateSnapshot = getRecordValue(record.templateSnapshotJson);
  return getNumberOrStringValue(
    record.templateVersion?.versionNo ?? templateSnapshot?.versionNo,
  );
}

function getPrintRecordPaperName(record: PrintJobRecord): string | undefined {
  const templateSnapshot = getRecordValue(record.templateSnapshotJson);
  const snapshotPaper = getRecordValue(templateSnapshot?.paperProfile);
  return record.paperProfile?.name ?? getStringValue(snapshotPaper?.name);
}

function getPrintJobSnapshotPaperProfile(
  record?: PrintJobRecord | null,
): Record<string, unknown> | undefined {
  const templateSnapshot = getRecordValue(record?.templateSnapshotJson);
  return getRecordValue(templateSnapshot?.paperProfile);
}

function getPrintRecordPrinterName(
  record?: PrintJobRecord | null,
): string | undefined {
  const snapshotPaper = getPrintJobSnapshotPaperProfile(record);
  const snapshot = getStringValue(snapshotPaper?.preferredPrinterName);
  return snapshot ?? record?.paperProfile?.preferredPrinterName ?? undefined;
}

function getPositiveNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function getPaperSizeFromHtml(html: string): PrintPreviewPaperSize | null {
  const match = html.match(/@page\s*\{[^}]*size:\s*([0-9.]+)mm\s+([0-9.]+)mm/i);
  const widthMm = getPositiveNumberValue(match?.[1]);
  const heightMm = getPositiveNumberValue(match?.[2]);
  return widthMm && heightMm ? { widthMm, heightMm } : null;
}

function getPaperSizeFromRecord(
  paperProfile: unknown,
): PrintPreviewPaperSize | null {
  const paper = getRecordValue(paperProfile);
  if (!paper) return null;
  const rawWidthMm = getPositiveNumberValue(paper.widthMm);
  const rawHeightMm = getPositiveNumberValue(paper.heightMm);
  if (!rawWidthMm || !rawHeightMm) return null;
  const isLandscape = paper.orientation === 'landscape';
  const shouldSwapToLandscape = isLandscape && rawWidthMm < rawHeightMm;
  return {
    name: getStringValue(paper.name),
    widthMm: shouldSwapToLandscape ? rawHeightMm : rawWidthMm,
    heightMm: shouldSwapToLandscape ? rawWidthMm : rawHeightMm,
  };
}

function resolvePrintPreviewPaperSize(
  record: PrintJobRecord | null,
  html: string,
): PrintPreviewPaperSize | null {
  const htmlPaper = getPaperSizeFromHtml(html);
  const recordPaper =
    getPaperSizeFromRecord(record?.paperProfile) ??
    getPaperSizeFromRecord(getPrintJobSnapshotPaperProfile(record));

  if (!htmlPaper) return recordPaper;
  return {
    ...htmlPaper,
    name: recordPaper?.name,
  };
}

function formatMm(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatPaperProfileLabel(paper: PrintJobPaperProfile): string {
  const defaultMark = paper.isDefault ? '，默认' : '';
  const orientation = paper.orientation === 'landscape' ? '横向' : '纵向';
  const printer = paper.preferredPrinterName
    ? `，打印机：${paper.preferredPrinterName}`
    : '，未绑定打印机';
  return `${paper.name}（${formatMm(paper.widthMm)}x${formatMm(
    paper.heightMm,
  )}mm，${orientation}${printer}${defaultMark}）`;
}

function buildPreviewPaperFrameStyle(
  paper: PrintPreviewPaperSize | null,
): CSSProperties | undefined {
  if (!paper) return undefined;
  return {
    aspectRatio: `${paper.widthMm} / ${paper.heightMm}`,
    width: Math.round(paper.widthMm * MM_TO_CSS_PX),
    height: Math.round(paper.heightMm * MM_TO_CSS_PX),
  };
}

function getDefaultTemplate(rows: PrintJobTemplate[]): PrintJobTemplate | null {
  return rows.find((item) => item.isDefault) ?? rows[0] ?? null;
}

function findPrintTemplate(
  scene: PrintJobSceneOptions | null,
  templateId?: string,
): PrintJobTemplate | undefined {
  if (!scene || !templateId) return undefined;
  return scene.templates.find((item) => item.id === templateId);
}

function resolveTemplatePaperProfile(
  scene: PrintJobSceneOptions | null,
  templateId?: string,
): ResolvedTemplatePaperProfile {
  const template = findPrintTemplate(scene, templateId);
  if (template?.paperProfile) {
    return { paper: template.paperProfile, source: 'template' };
  }
  if (template?.paperProfileId) {
    const paper =
      scene?.paperProfiles.find((item) => item.id === template.paperProfileId) ??
      null;
    return {
      paper,
      source: paper ? 'template' : 'missing',
    };
  }
  const defaultPaper =
    scene?.paperProfiles.find((paper) => paper.isDefault) ?? null;
  return {
    paper: defaultPaper,
    source: defaultPaper ? 'default' : 'missing',
  };
}

function getPaperProfileHelpText(
  resolved: ResolvedTemplatePaperProfile,
): string {
  if (resolved.source === 'template') {
    return '此纸型由打印模板绑定；需要换纸张时，请复制或编辑模板。';
  }
  if (resolved.source === 'default') {
    return '模板未绑定纸型，不能生成打印记录；请先编辑模板并绑定纸型。';
  }
  return '当前模板未绑定纸型，也没有可用默认纸型，请先维护纸型或模板。';
}

function formatDateTime(
  value: string | null | undefined,
  formatter: (value?: string | null) => string,
): string {
  if (!value) return '-';
  return formatter(value);
}

function notifyReload(
  capabilities: PrintJobActionCapabilities,
  actionRef?: PrintJobActionReloadRef,
) {
  const reload = actionRef?.current?.reload;
  if (reload) reload.call(actionRef?.current);
  else capabilities.onReload?.();
}

export function usePrintJobAction(actionRef?: PrintJobActionReloadRef) {
  const capabilities = usePrintJobActionCapabilities();
  const { token } = theme.useToken();
  const [job, setJob] = useState<PrintJobRecord | null>(null);
  const [batchPrintJobs, setBatchPrintJobs] = useState<PrintJobRecord[]>([]);
  const [batchPrintIndex, setBatchPrintIndex] = useState(0);
  const [batchPrintFailures, setBatchPrintFailures] = useState<PrintJobBatchFailure[]>([]);
  const [batchRetrying, setBatchRetrying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reprintOpen, setReprintOpen] = useState(false);
  const [reprintLoading, setReprintLoading] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [recordQuery, setRecordQuery] = useState<PrintRecordQueryParams | null>(null);
  const [records, setRecords] = useState<PrintJobRecord[]>([]);
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [printSettings, setPrintSettings] = useState<PendingPrintSettings | null>(null);
  const [printSceneOptions, setPrintSceneOptions] = useState<PrintJobSceneOptions | null>(null);
  const printSettingsFormRef = useRef<ProFormInstance<PrintSettingsFormValues> | undefined>(undefined);
  const settingsRequestId = useRef(0);
  const sceneRequestId = useRef(0);
  const recordsRequestId = useRef(0);
  const detailRequestId = useRef(0);
  const submitInFlight = useRef(false);
  const sanitizedPreview = useMemo(() => {
    try {
      return {
        html: sanitizeJobHtml(job, capabilities.sanitizeRenderedHtml),
        error: null as string | null,
      };
    } catch {
      return {
        html: '',
        error: '打印内容无法安全预览，请联系管理员检查模板',
      };
    }
  }, [capabilities.sanitizeRenderedHtml, job]);
  const html = sanitizedPreview.html;
  const previewPaper = useMemo(
    () => resolvePrintPreviewPaperSize(job, html),
    [html, job],
  );
  const previewPaperFrameStyle = useMemo(
    () => buildPreviewPaperFrameStyle(previewPaper),
    [previewPaper],
  );
  const previewPaperLabel = useMemo(() => {
    if (!previewPaper) return '';
    const sizeText = `${formatMm(previewPaper.widthMm)} × ${formatMm(
      previewPaper.heightMm,
    )} mm`;
    return previewPaper.name ? `${previewPaper.name}（${sizeText}）` : sizeText;
  }, [previewPaper]);
  const preferredPrinterName = useMemo(
    () => getPrintRecordPrinterName(job),
    [job],
  );
  const confirmTargets =
    batchPrintJobs.length > 1
      ? batchPrintJobs.filter(capabilities.isRendered)
      : job
        ? [job]
        : [];
  const canConfirm =
    capabilities.permissions.canConfirmPrinted &&
    confirmTargets.length > 0 &&
    confirmTargets.every(capabilities.isRendered);
  const canReprint =
    capabilities.permissions.canReprint && Boolean(job && capabilities.isPrinted(job));
  const printTypeOptions = useMemo(
    () => getTemplateTypeOptionsForBusiness(printSettings?.business),
    [printSettings],
  );
  const templateOptions = useMemo(
    () =>
      toTemplateOptions(
        (printSceneOptions?.templates ?? []).map((template) => ({
          ...template,
          currentVersion: template.currentVersion
            ? {
                ...template.currentVersion,
                versionNo: getNumberOrStringValue(
                  template.currentVersion.versionNo,
                ),
              }
            : template.currentVersion,
        })),
      ),
    [printSceneOptions],
  );
  const printSettingsKey = useMemo(() => {
    if (!printSettings) return 'print-settings';
    const first = printSettings.paramsList[0];
    return [
      printSettings.business.businessType,
      first?.businessId ?? '',
      printSettings.paramsList.length,
      printSettings.initialValues.templateType ?? '',
      printSettings.initialValues.templateId ?? '',
    ].join(':');
  }, [printSettings]);

  const loadSceneOptions = useCallback(
    (businessType: string, templateType?: PrintTemplateType) =>
      capabilities.printOptions.getSceneOptions({ businessType, templateType }),
    [capabilities.printOptions],
  );

  const createPrintRecords = useCallback(
    async (paramsList: PrintJobActionParams[]) => {
      const createdRecords: PrintJobRecord[] = [];
      const failedItems: PrintJobBatchFailure[] = [];
      for (const params of paramsList) {
        try {
          const created = await capabilities.submitPrintJob({ ...params });
          createdRecords.push(created);
        } catch (error) {
          failedItems.push({
            params,
            message: getActionErrorMessage(error, '生成打印记录失败'),
          });
        }
      }
      return { createdRecords, failedItems } satisfies BatchPrintCreationResult;
    },
    [capabilities.submitPrintJob],
  );

  const resetBatchPrintState = useCallback(() => {
    setBatchPrintJobs([]);
    setBatchPrintIndex(0);
    setBatchPrintFailures([]);
  }, []);

  const clearPrintSettings = useCallback(() => {
    settingsRequestId.current += 1;
    sceneRequestId.current += 1;
    setSettingsLoading(false);
    setSceneLoading(false);
    setPrintSettingsOpen(false);
    setPrintSettings(null);
    setPrintSceneOptions(null);
  }, []);

  const openPrintSettings = useCallback(
    async (paramsList: PrintJobActionParams[]) => {
      const first = paramsList[0];
      if (!first) {
        capabilities.messages.warning('请先选择要打印的单据');
        return;
      }
      const hasDifferentBusiness = paramsList.some(
        (item) => item.businessType !== first.businessType,
      );
      if (hasDifferentBusiness) {
        capabilities.messages.warning('一次只能批量打印同一类单据');
        return;
      }
      const templateTypes = paramsList
        .map((item) => item.templateType)
        .filter((value): value is PrintTemplateType => Boolean(value));
      const fixedTemplateType = templateTypes[0];
      if (
        fixedTemplateType &&
        templateTypes.some((item) => item !== fixedTemplateType)
      ) {
        capabilities.messages.warning('一次只能批量打印同一种打印方式');
        return;
      }

      const requestId = ++settingsRequestId.current;
      sceneRequestId.current += 1;
      setSettingsLoading(true);
      try {
        const initialScene = await loadSceneOptions(first.businessType);
        if (settingsRequestId.current !== requestId) return;
        const templateType =
          fixedTemplateType ?? initialScene.business.defaultTemplateType;
        if (!initialScene.business.supportedTemplateTypes.includes(templateType)) {
          capabilities.messages.error(
            `${initialScene.business.businessName} 不支持当前打印方式`,
          );
          return;
        }
        const scene =
          templateType === initialScene.business.defaultTemplateType
            ? { ...initialScene, templateType }
            : {
                ...(await loadSceneOptions(first.businessType, templateType)),
                templateType,
              };
        if (settingsRequestId.current !== requestId) return;
        const selectedTemplate =
          scene.templates.find((item) => item.id === first.templateId) ??
          getDefaultTemplate(scene.templates);
        setPrintSceneOptions(scene);
        setPrintSettings({
          paramsList,
          business: scene.business,
          fixedTemplateType,
          initialValues: {
            templateType,
            templateId: selectedTemplate?.id,
            copyCount: first.copyCount ?? 1,
          },
        });
        setPrintSettingsOpen(true);
      } catch (error) {
        if (settingsRequestId.current === requestId) {
          capabilities.messages.error(
            getActionErrorMessage(error, '加载打印选项失败，请稍后重试'),
          );
        }
      } finally {
        if (settingsRequestId.current === requestId) setSettingsLoading(false);
      }
    },
    [capabilities.messages, loadSceneOptions],
  );

  const openPrint = useCallback(
    async (params: PrintJobActionParams) => {
      await openPrintSettings([params]);
    },
    [openPrintSettings],
  );

  const openPrintBatch = useCallback(
    async (paramsList: PrintJobActionParams[]) => {
      await openPrintSettings(paramsList);
    },
    [openPrintSettings],
  );

  const resetTemplateDefaults = useCallback(
    async (templateType?: PrintTemplateType) => {
      if (!printSettings || !templateType) {
        sceneRequestId.current += 1;
        setSceneLoading(false);
        setPrintSceneOptions(null);
        printSettingsFormRef.current?.setFieldsValue({ templateId: undefined });
        return;
      }
      const requestId = ++sceneRequestId.current;
      setSceneLoading(true);
      try {
        const scene = await loadSceneOptions(
          printSettings.business.businessType,
          templateType,
        );
        if (sceneRequestId.current !== requestId) return;
        const selectedTemplate = getDefaultTemplate(scene.templates);
        setPrintSceneOptions({ ...scene, templateType });
        printSettingsFormRef.current?.setFieldsValue({
          templateId: selectedTemplate?.id,
        });
      } catch (error) {
        if (sceneRequestId.current === requestId) {
          capabilities.messages.error(
            getActionErrorMessage(error, '加载打印模板失败，请稍后重试'),
          );
        }
      } finally {
        if (sceneRequestId.current === requestId) setSceneLoading(false);
      }
    },
    [capabilities.messages, loadSceneOptions, printSettings],
  );

  const syncTemplatePaper = useCallback(
    async (templateId?: string, templateType?: PrintTemplateType) => {
      if (!printSettings || !templateId || !templateType) return;
      if (printSceneOptions?.templateType === templateType) return;
      const requestId = ++sceneRequestId.current;
      setSceneLoading(true);
      try {
        const scene = await loadSceneOptions(
          printSettings.business.businessType,
          templateType,
        );
        if (sceneRequestId.current === requestId) {
          setPrintSceneOptions({ ...scene, templateType });
        }
      } catch (error) {
        if (sceneRequestId.current === requestId) {
          capabilities.messages.error(
            getActionErrorMessage(error, '加载打印模板失败，请稍后重试'),
          );
        }
      } finally {
        if (sceneRequestId.current === requestId) setSceneLoading(false);
      }
    },
    [capabilities.messages, loadSceneOptions, printSceneOptions, printSettings],
  );

  const submitPrintSettings = useCallback(
    async (values: PrintSettingsFormValues) => {
      if (!printSettings || submitInFlight.current) return false;
      const templateType = values.templateType;
      if (!templateType || !values.templateId) {
        capabilities.messages.warning('请选择打印模板');
        return false;
      }
      if (
        sceneLoading ||
        printSceneOptions?.templateType !== templateType
      ) {
        capabilities.messages.warning('打印模板选项仍在加载，请稍后重试');
        return false;
      }
      const resolvedPaper = resolveTemplatePaperProfile(
        printSceneOptions,
        values.templateId,
      );
      if (resolvedPaper.source !== 'template' || !resolvedPaper.paper) {
        capabilities.messages.warning(
          '当前模板未绑定有效纸型，请先编辑模板并发布后再打印',
        );
        return false;
      }
      submitInFlight.current = true;
      setSettingsSubmitting(true);
      try {
        const paramsList = printSettings.paramsList.map((params) => ({
          ...params,
          templateType,
          templateId: values.templateId,
          copyCount: values.copyCount,
        }));
        const { createdRecords, failedItems } =
          await createPrintRecords(paramsList);
        capabilities.onPrintJobsCreated?.(createdRecords, failedItems);
        if (createdRecords.length === 0) {
          setBatchPrintFailures(failedItems);
          capabilities.messages.error(
            failedItems[0]?.message ?? '未生成打印记录，请修正后重试',
          );
          return false;
        }
        setBatchPrintJobs(createdRecords);
        setBatchPrintIndex(0);
        setBatchPrintFailures(failedItems);
        setJob(createdRecords[0]);
        setDrawerOpen(true);
        capabilities.onRecordsChanged?.(createdRecords);
        notifyReload(capabilities, actionRef);
        if (failedItems.length > 0) {
          capabilities.messages.warning(
            `已生成 ${createdRecords.length} 条，${failedItems.length} 条失败，可在预览中重试失败项`,
          );
        } else {
          capabilities.messages.success(
            createdRecords.length > 1
              ? `已生成 ${createdRecords.length} 条打印记录`
              : '已生成打印记录',
          );
        }
        clearPrintSettings();
        return true;
      } finally {
        submitInFlight.current = false;
        setSettingsSubmitting(false);
      }
    },
    [
      actionRef,
      capabilities,
      clearPrintSettings,
      createPrintRecords,
      printSceneOptions,
      printSettings,
      sceneLoading,
    ],
  );

  const loadRecords = useCallback(
    async (params: PrintRecordQueryParams) => {
      const requestId = ++recordsRequestId.current;
      setRecordsLoading(true);
      setRecordsError(null);
      try {
        const result = await capabilities.listPrintJobs({
          page: 1,
          pageSize: 20,
          businessType: params.businessType,
          businessId: params.businessId,
        });
        if (recordsRequestId.current === requestId) {
          setRecords(result.list ?? []);
        }
      } catch (error) {
        if (recordsRequestId.current === requestId) {
          const message = getActionErrorMessage(
            error,
            '加载打印记录失败，请稍后重试',
          );
          setRecordsError(message);
          capabilities.messages.error(message);
        }
      } finally {
        if (recordsRequestId.current === requestId) setRecordsLoading(false);
      }
    },
    [capabilities.listPrintJobs, capabilities.messages],
  );

  const openRecords = useCallback(
    async (params: PrintRecordQueryParams) => {
      setRecordQuery(params);
      setRecords([]);
      setRecordsError(null);
      setRecordsOpen(true);
      await loadRecords(params);
    },
    [loadRecords],
  );

  const openRecordPreview = useCallback(
    async (record: PrintJobRecord) => {
      const requestId = ++detailRequestId.current;
      setPreviewLoading(true);
      try {
        const detail = await capabilities.getPrintJobDetail({ id: record.id });
        if (detailRequestId.current !== requestId) return;
        resetBatchPrintState();
        setJob(detail);
        setDrawerOpen(true);
      } catch (error) {
        if (detailRequestId.current === requestId) {
          capabilities.messages.error(
            getActionErrorMessage(error, '加载打印记录详情失败，请稍后重试'),
          );
        }
      } finally {
        if (detailRequestId.current === requestId) setPreviewLoading(false);
      }
    },
    [capabilities.getPrintJobDetail, capabilities.messages, resetBatchPrintState],
  );

  const retryFailedBatch = useCallback(async () => {
    if (batchPrintFailures.length === 0 || batchRetrying) return;
    setBatchRetrying(true);
    try {
      const { createdRecords, failedItems } = await createPrintRecords(
        batchPrintFailures.map((item) => item.params),
      );
      capabilities.onPrintJobsCreated?.(createdRecords, failedItems);
      if (createdRecords.length > 0) {
        setBatchPrintJobs((current) => [...current, ...createdRecords]);
        if (!job) {
          setBatchPrintIndex(0);
          setJob(createdRecords[0]);
        }
        capabilities.onRecordsChanged?.(createdRecords);
        notifyReload(capabilities, actionRef);
      }
      setBatchPrintFailures(failedItems);
      if (failedItems.length > 0) {
        capabilities.messages.warning(
          `已重试成功 ${createdRecords.length} 条，仍有 ${failedItems.length} 条失败`,
        );
      } else {
        capabilities.messages.success(
          `失败项已全部重试成功，共 ${createdRecords.length} 条`,
        );
      }
    } finally {
      setBatchRetrying(false);
    }
  }, [
    actionRef,
    batchPrintFailures,
    batchRetrying,
    capabilities,
    createPrintRecords,
    job,
  ]);

  const selectBatchPrintJob = useCallback(
    (index: number) => {
      const nextJob = batchPrintJobs[index];
      if (!nextJob) return;
      setBatchPrintIndex(index);
      setJob(nextJob);
    },
    [batchPrintJobs],
  );

  const confirmPrinted = useCallback(async () => {
    if (confirmTargets.length === 0 || confirming) return;
    setConfirming(true);
    try {
      const results = await Promise.allSettled(
        confirmTargets.map((target) =>
          Promise.resolve().then(() =>
            capabilities.confirmPrintJob({
              id: target.id,
              message: '浏览器打印后人工确认',
            }),
          ),
        ),
      );
      const updatedRecords = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      setBatchPrintJobs((current) =>
        current.map(
          (item) =>
            updatedRecords.find((updated) => updated.id === item.id) ?? item,
        ),
      );
      const currentUpdated = updatedRecords.find((item) => item.id === job?.id);
      if (currentUpdated) setJob(currentUpdated);
      notifyReload(capabilities, actionRef);
      if (updatedRecords.length > 0) {
        capabilities.onRecordsChanged?.(updatedRecords);
      }
      const failedCount = results.length - updatedRecords.length;
      if (failedCount > 0) {
        capabilities.messages.warning(
          `已确认 ${updatedRecords.length} 条，${failedCount} 条失败，可继续重试失败项`,
        );
      } else {
        capabilities.messages.success(
          updatedRecords.length > 1
            ? `已确认 ${updatedRecords.length} 条打印记录`
            : '已确认',
        );
      }
    } finally {
      setConfirming(false);
    }
  }, [
    actionRef,
    capabilities,
    confirmTargets,
    confirming,
    job?.id,
  ]);

  const printByBrowser = useCallback(() => {
    if (!html) {
      capabilities.messages.warning('当前打印记录没有可预览内容');
      return;
    }
    if (preferredPrinterName) {
      capabilities.messages.info(
        `该纸型首选打印机：${preferredPrinterName}。浏览器不能自动切换实体打印机，请在系统打印窗口中确认该设备。`,
      );
    }
    if (!openHtmlForPrint(html)) {
      capabilities.messages.error('浏览器阻止了打印窗口，请允许弹窗后重试');
    }
  }, [capabilities.messages, html, preferredPrinterName]);

  const printAllByBrowser = useCallback(() => {
    let htmlList: string[];
    try {
      htmlList = batchPrintJobs.map((item) =>
        sanitizeJobHtml(item, capabilities.sanitizeRenderedHtml),
      );
    } catch {
      capabilities.messages.error('打印内容无法安全预览，请联系管理员检查模板');
      return;
    }
    if (htmlList.some((item) => !item)) {
      capabilities.messages.warning(
        '部分打印记录没有可预览内容，请先切换到对应记录检查',
      );
      return;
    }
    if (preferredPrinterName) {
      capabilities.messages.info(
        `该纸型首选打印机：${preferredPrinterName}。浏览器不能自动切换实体打印机，请在系统打印窗口中确认该设备。`,
      );
    }
    if (!openHtmlForPrint(combineRenderedHtml(htmlList))) {
      capabilities.messages.error('浏览器阻止了打印窗口，请允许弹窗后重试');
    }
  }, [
    batchPrintJobs,
    capabilities.messages,
    capabilities.sanitizeRenderedHtml,
    preferredPrinterName,
  ]);

  const handlePdfFailure = useCallback(
    (msg?: string) => {
      if (isServerPdfUnavailable(msg)) {
        capabilities.messages.warning(
          '服务器暂不支持直接生成 PDF，已改用浏览器打印，请在打印窗口选择「另存为 PDF」',
        );
        printByBrowser();
        return;
      }
      capabilities.messages.error(
        msg || '下载 PDF 失败，请改用「浏览器打印」另存为 PDF',
      );
    },
    [capabilities.messages, printByBrowser],
  );

  const downloadPdf = useCallback(async () => {
    if (!job || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const blob = await capabilities.downloadPrintJobPdf({ id: job.id });
      if (
        typeof Blob !== 'undefined' &&
        blob instanceof Blob &&
        blob.type.includes('json')
      ) {
        handlePdfFailure(await readBlobJsonMessage(blob));
        return;
      }
      downloadBlob(
        blob,
        capabilities.getPdfFilename?.(job) || getPrintPdfFilename(job),
      );
    } catch (error) {
      handlePdfFailure(await extractBackendMessage(error));
    } finally {
      setDownloadingPdf(false);
    }
  }, [
    capabilities.downloadPrintJobPdf,
    capabilities.getPdfFilename,
    downloadingPdf,
    handlePdfFailure,
    job,
  ]);

  const printJobActionNode = (
    <>
      <ModalForm<PrintSettingsFormValues>
        key={printSettingsKey}
        title={
          printSettings && printSettings.paramsList.length > 1
            ? '批量打印设置'
            : '打印设置'
        }
        open={printSettingsOpen}
        width={560}
        formRef={printSettingsFormRef}
        initialValues={printSettings?.initialValues}
        modalProps={{
          destroyOnHidden: true,
          onCancel: clearPrintSettings,
        }}
        submitter={{
          searchConfig: { submitText: '生成打印记录' },
        }}
        onFinish={submitPrintSettings}
      >
        {printSettings ? (
          <Typography.Paragraph type="secondary">
            {printSettings.business.businessName}
            {printSettings.paramsList.length > 1
              ? `，共 ${printSettings.paramsList.length} 条`
              : ''}
          </Typography.Paragraph>
        ) : null}
        {settingsLoading ? <Spin size="small" /> : null}
        <ProFormSelect
          name="templateType"
          label="打印方式"
          options={printTypeOptions}
          disabled={
            Boolean(printSettings?.fixedTemplateType) ||
            printTypeOptions.length <= 1 ||
            settingsSubmitting
          }
          rules={[{ required: true, message: '请选择打印方式' }]}
          fieldProps={{
            onChange: (value) => {
              const nextType = isPrintTemplateType(value) ? value : undefined;
              void resetTemplateDefaults(nextType);
            },
          }}
        />
        <ProFormDependency name={['templateType']}>
          {({ templateType }: PrintSettingsFormValues) => {
            const selectedType = isPrintTemplateType(templateType)
              ? templateType
              : undefined;
            return (
              <ProFormSelect
                key={`template-${selectedType ?? 'empty'}`}
                name="templateId"
                label="打印模板"
                disabled={!selectedType || settingsSubmitting}
                showSearch
                placeholder={
                  selectedType ? '请选择本次打印模板' : '先选择打印方式'
                }
                options={
                  selectedType === printSceneOptions?.templateType
                    ? templateOptions
                    : []
                }
                rules={[{ required: true, message: '请选择打印模板' }]}
                fieldProps={{
                  loading: sceneLoading,
                  onChange: (value) => {
                    void syncTemplatePaper(
                      getStringValue(value),
                      selectedType,
                    );
                  },
                }}
              />
            );
          }}
        </ProFormDependency>
        <ProFormDependency name={['templateId']}>
          {({ templateId }: PrintSettingsFormValues) => {
            const resolvedPaper = resolveTemplatePaperProfile(
              printSceneOptions,
              templateId,
            );
            const paper = resolvedPaper.paper;
            return (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8, color: token.colorText }}>
                  模板纸型
                </div>
                <div
                  style={{
                    minHeight: 40,
                    padding: '8px 12px',
                    border: paper
                      ? `1px solid ${token.colorBorder}`
                      : `1px solid ${token.colorError}`,
                    borderRadius: 6,
                    color: paper ? token.colorText : token.colorError,
                    background: paper ? token.colorFillAlter : token.colorErrorBg,
                  }}
                >
                  {templateId
                    ? paper
                      ? formatPaperProfileLabel(paper)
                      : '未配置可用纸型'
                    : '选择模板后自动带出纸型'}
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {templateId
                    ? getPaperProfileHelpText(resolvedPaper)
                    : '纸型由打印模板维护，生成打印记录时自动应用。'}
                </Typography.Text>
              </div>
            );
          }}
        </ProFormDependency>
        <ProFormDigit
          name="copyCount"
          label="打印份数"
          min={1}
          max={MAX_PRINT_COPY_COUNT}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: '请填写打印份数' }]}
          disabled={Boolean(
            settingsSubmitting ||
              printSettings?.paramsList.some((params) => params.serialIds?.length),
          )}
          extra={
            printSettings?.paramsList.some((params) => params.serialIds?.length)
              ? '每个成品序列号打印一张标签。'
              : '按整套单据重复打印；多联模板（如三联）每份都包含全部联次'
          }
        />
      </ModalForm>

      <Drawer
        title="打印预览"
        size="80vw"
        open={drawerOpen}
        destroyOnHidden
        onClose={() => {
          detailRequestId.current += 1;
          setPreviewLoading(false);
          setDrawerOpen(false);
          resetBatchPrintState();
        }}
        extra={
          <Space>
            {capabilities.permissions.canDownloadPdf ? (
              <Button
                icon={<DownloadOutlined />}
                loading={downloadingPdf}
                disabled={previewLoading || !job}
                onClick={() => void downloadPdf()}
              >
                下载当前 PDF
              </Button>
            ) : null}
            <Button
              icon={<PrinterOutlined />}
              loading={previewLoading}
              disabled={!html}
              onClick={printByBrowser}
            >
              浏览器打印当前
            </Button>
            {batchPrintJobs.length > 1 ? (
              <Button
                icon={<PrinterOutlined />}
                disabled={batchPrintFailures.length > 0 || previewLoading}
                onClick={printAllByBrowser}
              >
                浏览器打印全部
              </Button>
            ) : null}
            {canConfirm ? (
              <Button
                icon={<SafetyCertificateOutlined />}
                loading={confirming}
                disabled={previewLoading}
                onClick={() => void confirmPrinted()}
              >
                {batchPrintJobs.length > 1 ? '确认全部已打印' : '确认已打印'}
              </Button>
            ) : null}
            {canReprint ? (
              <Button
                icon={<RedoOutlined />}
                disabled={previewLoading}
                onClick={() => setReprintOpen(true)}
              >
                补打
              </Button>
            ) : null}
          </Space>
        }
      >
        <Spin spinning={previewLoading}>
          {batchPrintFailures.length > 0 ? (
            <Alert
              showIcon
              type="warning"
              style={{ marginBottom: 16 }}
              message={`有 ${batchPrintFailures.length} 条单据生成失败`}
              description={
                <Space orientation="vertical" size={8}>
                  <Typography.Text>
                    已生成的单据仍可预览和打印；失败项不会被忽略，可修正数据后重试。
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {batchPrintFailures
                      .slice(0, 5)
                      .map((item) => `${item.params.businessId}：${item.message}`)
                      .join('；')}
                    {batchPrintFailures.length > 5 ? '……' : ''}
                  </Typography.Text>
                  <Button
                    type="primary"
                    size="small"
                    loading={batchRetrying}
                    onClick={() => void retryFailedBatch()}
                  >
                    重试失败项
                  </Button>
                </Space>
              }
            />
          ) : null}
          {batchPrintJobs.length > 1 ? (
            <Space
              style={{
                width: '100%',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Button
                disabled={batchPrintIndex <= 0}
                onClick={() => selectBatchPrintJob(batchPrintIndex - 1)}
              >
                上一张
              </Button>
              <Typography.Text>
                第 {batchPrintIndex + 1} / {batchPrintJobs.length} 张
              </Typography.Text>
              <Button
                disabled={batchPrintIndex >= batchPrintJobs.length - 1}
                onClick={() => selectBatchPrintJob(batchPrintIndex + 1)}
              >
                下一张
              </Button>
            </Space>
          ) : null}
          {sanitizedPreview.error ? (
            <Alert type="error" showIcon message={sanitizedPreview.error} />
          ) : html ? (
            <div
              style={{
                height: 'calc(100vh - 150px)',
                overflow: 'auto',
                padding: 24,
                background: token.colorBgLayout,
              }}
            >
              {previewPaperLabel ? (
                <div
                  style={{
                    marginBottom: 12,
                    color: token.colorTextSecondary,
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  <div>{previewPaperLabel}</div>
                  <div>
                    首选打印机：{preferredPrinterName ?? '未绑定（本次手工选择）'}
                  </div>
                </div>
              ) : null}
              <div
                style={{
                  ...(previewPaperFrameStyle ?? {
                    height: '100%',
                    width: '100%',
                  }),
                  position: 'relative',
                  maxWidth: '100%',
                  margin: '0 auto',
                  overflow: 'hidden',
                  background: token.colorBgContainer,
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorder}`,
                }}
              >
                <iframe
                  title="打印预览"
                  srcDoc={html}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: 0,
                    background: token.colorBgContainer,
                  }}
                />
              </div>
            </div>
          ) : (
            <Empty description="暂无可预览内容" />
          )}
        </Spin>
      </Drawer>

      <ModalForm<ReprintFormValues>
        title="补打原因"
        open={reprintOpen}
        width={520}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setReprintOpen(false),
        }}
        submitter={{
          searchConfig: { submitText: '提交补打' },
        }}
        onFinish={async (values) => {
          if (!job || reprintLoading) return false;
          setReprintLoading(true);
          try {
            const reprinted = await capabilities.requestPrintJobReprint({
              id: job.id,
              reprintReason: values.reprintReason,
            });
            setJob(reprinted);
            setReprintOpen(false);
            capabilities.onRecordsChanged?.([reprinted]);
            notifyReload(capabilities, actionRef);
            if (recordQuery) await loadRecords(recordQuery);
            capabilities.messages.success('已生成补打记录');
            return true;
          } catch (error) {
            capabilities.messages.error(
              getActionErrorMessage(error, '补打失败，请稍后重试'),
            );
            return false;
          } finally {
            setReprintLoading(false);
          }
        }}
      >
        <ProFormTextArea
          name="reprintReason"
          label="补打原因"
          rules={[{ required: true, message: '请填写补打原因' }]}
          fieldProps={{ rows: 4, maxLength: 200, showCount: true }}
        />
      </ModalForm>

      <Drawer
        title={recordQuery?.title ?? '打印记录'}
        size={720}
        open={recordsOpen}
        destroyOnHidden
        onClose={() => {
          recordsRequestId.current += 1;
          setRecordsLoading(false);
          setRecordsOpen(false);
        }}
        extra={
          recordQuery ? (
            <Button
              icon={<HistoryOutlined />}
              loading={recordsLoading}
              onClick={() => void loadRecords(recordQuery)}
            >
              刷新
            </Button>
          ) : null
        }
      >
        {recordsError ? (
          <Alert
            type="error"
            showIcon
            message="打印记录加载失败"
            description={recordsError}
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <List<PrintJobRecord>
          loading={recordsLoading}
          dataSource={records}
          locale={{ emptyText: <Empty description="暂无打印记录" /> }}
          renderItem={(record) => {
            const status = capabilities.getStatusPresentation(record.status);
            const templateName = getPrintRecordTemplateName(record);
            const versionNo = getPrintRecordVersionNo(record);
            const paperName = getPrintRecordPaperName(record);
            const canRecordReprint =
              capabilities.permissions.canReprint &&
              capabilities.isPrinted(record);
            return (
              <List.Item
                key={record.id}
                actions={[
                  <Button
                    key="preview"
                    type="link"
                    loading={previewLoading}
                    onClick={() => void openRecordPreview(record)}
                  >
                    预览
                  </Button>,
                  ...(canRecordReprint
                    ? [
                        <Button
                          key="reprint"
                          type="link"
                          onClick={() => {
                            setJob(record);
                            setReprintOpen(true);
                          }}
                        >
                          补打
                        </Button>,
                      ]
                    : []),
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={8} wrap>
                      <Typography.Text strong>{templateName}</Typography.Text>
                      {versionNo ? <Tag color="blue">v{versionNo}</Tag> : null}
                      <Tag color={status.color}>{status.text || record.status || '-'}</Tag>
                      {record.reprintOfJobId ? (
                        <Tag color="warning">补打</Tag>
                      ) : null}
                    </Space>
                  }
                  description={
                    <Space
                      orientation="vertical"
                      size={2}
                      style={{ width: '100%' }}
                    >
                      <Typography.Text type="secondary">
                        生成时间：
                        {formatDateTime(record.createdAt, capabilities.formatDateTime)}
                      </Typography.Text>
                      {record.printedAt ? (
                        <Typography.Text type="secondary">
                          确认时间：
                          {formatDateTime(record.printedAt, capabilities.formatDateTime)}
                        </Typography.Text>
                      ) : null}
                      <Typography.Text type="secondary">
                        纸型：{paperName ?? '-'} · 份数：{record.copyCount ?? 1}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        首选打印机：
                        {getPrintRecordPrinterName(record) ?? '未绑定'}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        copyable={{ text: record.id }}
                        ellipsis
                        style={{ maxWidth: 520 }}
                      >
                        记录ID：{record.id}
                      </Typography.Text>
                      {record.reprintReason ? (
                        <Typography.Text type="secondary">
                          补打原因：{record.reprintReason}
                        </Typography.Text>
                      ) : null}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Drawer>
    </>
  );

  return {
    openPrint,
    openPrintBatch,
    openRecords,
    printJobActionNode,
    settingsLoading,
    recordsLoading,
  };
}

/** @sunxu-layer business @sunxu-domain print @sunxu-reason Exposes the print settings, preview, print, PDF and confirmation workflow for a host-selected business record. */
export function PrintAction({
  label = '打印',
  type = 'default',
  disabled,
  ...params
}: PrintActionProps) {
  const { openPrint, printJobActionNode, settingsLoading } = usePrintJobAction();

  return (
    <>
      <Button
        type={type}
        icon={<PrinterOutlined />}
        disabled={disabled}
        loading={settingsLoading}
        onClick={() => void openPrint(params)}
      >
        {label}
      </Button>
      {printJobActionNode}
    </>
  );
}

/** @sunxu-layer business @sunxu-domain print @sunxu-reason Exposes the host-selected record history, preview and authorized reprint workflow. */
export function PrintRecordsAction({
  label = '打印记录',
  type = 'default',
  disabled,
  ...params
}: PrintRecordsActionProps) {
  const { openRecords, printJobActionNode, recordsLoading } = usePrintJobAction();

  return (
    <>
      <Button
        type={type}
        icon={<HistoryOutlined />}
        disabled={disabled}
        loading={recordsLoading}
        onClick={() => void openRecords(params)}
      >
        {label}
      </Button>
      {printJobActionNode}
    </>
  );
}
