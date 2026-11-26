import { PlusOutlined } from '@ant-design/icons';
import {
  type ProFormInstance,
  ProFormDatePicker,
  ProFormGroup,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Input, Modal, Segmented, Space, Spin, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CustomFieldFormSection,
} from '../documents/CustomFieldFormSection';
import {
  BatchMaterialAddButton,
  buildBatchMaterialOption,
} from '../inventory/BatchMaterialAddButton';
import { MasterDataQuickCreateSelect } from '../shared/MasterDataQuickCreateSelect';
import {
  BomCostSnapshotEditor,
  getBomCostSnapshotIssue,
} from '../manufacturing/BomCostSnapshotEditor';
import { DocumentModalForm } from '../documents/DocumentModalForm';
import { RemoteSelect } from '../../../components/RemoteSelect';
import {
  nextItemKey,
  OrderItemEditor,
} from '../shared/OrderItemEditor';
import type { CustomFieldFormRuntime } from '../documents/custom-field-form-types';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';
import type { MaterialFilteredSelectOption } from '../inventory/material-select-types';
import type {
  QuotationCustomValuesPayload,
  CustomerMaterialRecord,
  QuotationFormDrawerProps,
  QuotationFormValues,
  QuotationItemDraft,
  QuotationItemPayload,
  QuotationItemRecord,
  QuotationMaterial,
  QuotationMutationPayload,
  QuotationSelectOption,
  ResolvedQuotationPriceContext,
} from './quotation-form-drawer-types';
import type { ProductionBomOption } from '../manufacturing/production-bom-select-types';
import './quotation-form-drawer.css';

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getSnapshotCurrency(value: unknown): string | undefined {
  const currency = readObject(value).currency;
  return typeof currency === 'string' && currency.trim()
    ? currency.trim()
    : undefined;
}

function newQuotationItemDraft(): QuotationItemDraft {
  return {
    _key: nextItemKey(),
    materialId: '',
    qty: 1,
    unitPrice: undefined,
    isCustom: false,
    imageUrls: [],
    imageFiles: [],
  };
}

function isEmptyQuotationItem(item: QuotationItemDraft): boolean {
  return (
    !item.materialId &&
    !item.isCustom &&
    item.qty === 1 &&
    item.unitPrice == null &&
    !item.customerMaterialCode &&
    !item.customerMaterialName &&
    !item.customerMaterialSpec &&
    !item.remarks &&
    (item.imageUrls?.length ?? 0) === 0
  );
}

function imageFileListFromUrls(urls?: string[] | null): UploadFile[] {
  return (urls ?? []).map((url, index) => ({
    uid: `${url}-${index}`,
    name: `图片${index + 1}`,
    status: 'done',
    url,
  }));
}

function buildQuotationMaterialOption(
  item: Pick<
    QuotationItemRecord,
    | 'materialId'
    | 'material'
    | 'customerMaterialCode'
    | 'customerMaterialName'
    | 'customerMaterialSpec'
  >,
): MaterialFilteredSelectOption | undefined {
  if (!item.materialId) return undefined;
  const material = item.material;
  const materialLabel = [material?.code, material?.name]
    .filter(Boolean)
    .join(' - ');
  const customerLabel = [
    item.customerMaterialCode,
    item.customerMaterialName,
    item.customerMaterialSpec,
  ]
    .filter(Boolean)
    .join(' / ');
  const label = customerLabel
    ? `${customerLabel}${materialLabel ? ` / ${materialLabel}` : ''}`
    : materialLabel;
  if (!label) return undefined;
  return {
    label,
    value: item.materialId,
    title: label,
    code: material?.code,
    name: material?.name,
    unit: material?.unit,
    spec: material?.spec,
    familyId: material?.familyId,
    baseType: material?.baseType ?? material?.materialCategory?.baseType,
    categoryId: material?.categoryId ?? material?.materialCategory?.id,
    ...pickMaterialCustomFieldRuntime(material),
  };
}

function mapQuotationItemToDraft(item: QuotationItemRecord): QuotationItemDraft {
  return {
    _key: item.id || nextItemKey(),
    id: item.id,
    materialId: item.materialId ?? '',
    materialOption: buildQuotationMaterialOption(item),
    isCustom: !item.materialId,
    qty: Number(item.quantity ?? 0),
    unitPrice: item.unitPrice ?? undefined,
    currency: item.currency ?? getSnapshotCurrency(item.priceSnapshot),
    selectedBomHeaderId: item.selectedBomHeaderId ?? undefined,
    bomSelectionSource: item.bomSelectionSource ?? undefined,
    bomSelectionReason: item.bomSelectionReason ?? undefined,
    bomCostSnapshot:
      item.bomCostSnapshot && typeof item.bomCostSnapshot === 'object'
        ? item.bomCostSnapshot
        : undefined,
    customerMaterialCode: item.customerMaterialCode ?? undefined,
    customerMaterialName: item.customerMaterialName ?? undefined,
    customerMaterialSpec: item.customerMaterialSpec ?? undefined,
    remarks: item.remarks ?? undefined,
    customValues: item.customValues,
    customComputedValues: item.customComputedValues,
    customComputedErrors: item.customComputedErrors,
    imageUrls: item.imageUrls ?? [],
    imageFiles: imageFileListFromUrls(item.imageUrls),
  };
}

function toDateString(value?: Dayjs | string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (dayjs.isDayjs(value)) {
    return value.format('YYYY-MM-DD');
  }
  return value;
}

async function uploadQuotationItemImages(
  fileList: UploadFile[] | undefined,
  uploadImages: (files: readonly RcFile[]) => Promise<string[]>,
): Promise<string[]> {
  if (!fileList || fileList.length === 0) {
    return [];
  }

  const keptUrls = fileList
    .map((file) => file.url)
    .filter((url): url is string => Boolean(url));
  const pendingFiles = fileList
    .map((file) => file.originFileObj)
    .filter((file): file is RcFile => Boolean(file));

  if (pendingFiles.length === 0) {
    return keptUrls;
  }

  const uploadedUrls = await uploadImages(pendingFiles);
  if (uploadedUrls.length !== pendingFiles.length) {
    throw new Error('报价图片上传失败，请重新选择图片');
  }

  return [...keptUrls, ...uploadedUrls];
}

function pickMaterialCustomFieldRuntime(material?: unknown) {
  const source = readObject(material);
  const readRuntime = (key: string) => {
    const value = source[key];
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  };
  return {
    customValues: readRuntime('customValues'),
    customComputedValues: readRuntime('customComputedValues'),
    customComputedErrors: readRuntime('customComputedErrors'),
  };
}

function buildCustomerMaterialSnapshotPatch(
  customerMaterial?: Pick<
    MaterialFilteredSelectOption,
    'customerMaterialCode' | 'customerMaterialName' | 'customerMaterialSpec'
  > | null,
) {
  return {
    customerMaterialCode: customerMaterial?.customerMaterialCode ?? undefined,
    customerMaterialName: customerMaterial?.customerMaterialName ?? undefined,
    customerMaterialSpec: customerMaterial?.customerMaterialSpec ?? undefined,
  };
}

function clearSalesLineAutoPricePatch() {
  return {
    unitPrice: undefined,
    currency: undefined,
    taxRate: undefined,
    priceIncludesTax: undefined,
    discountRate: undefined,
    ...buildCustomerMaterialSnapshotPatch(),
  };
}

function buildSalesLineAutoPricePatch(
  resolved: ResolvedQuotationPriceContext,
) {
  const price = resolved.price;
  return {
    unitPrice: price.unitPrice ?? undefined,
    currency: price.currency ?? undefined,
    taxRate: price.taxRate ?? undefined,
    priceIncludesTax:
      price.taxMode === 'tax_included'
        ? true
        : price.taxMode === 'tax_excluded'
          ? false
          : undefined,
    discountRate: undefined,
    ...buildCustomerMaterialSnapshotPatch(resolved.customerMaterial),
  };
}

function buildCommercialLinePayloadFields(
  item: QuotationItemDraft,
  canManagePrice: boolean,
): Partial<QuotationItemPayload> {
  if (!canManagePrice) return {};
  const payload: Partial<QuotationItemPayload> = {};
  const parse = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return Number(value);
  };
  const unitPrice = parse(item.unitPrice);
  const discountRate = parse(item.discountRate);
  const taxRate = parse(item.taxRate);
  const currency = item.currency?.trim();
  if (unitPrice !== undefined) payload.unitPrice = unitPrice;
  if (discountRate !== undefined) payload.discountRate = discountRate;
  if (taxRate !== undefined) payload.taxRate = taxRate;
  if (typeof item.priceIncludesTax === 'boolean') {
    payload.priceIncludesTax = item.priceIncludesTax;
  }
  if (currency) payload.currency = currency;
  return payload;
}

function buildDocumentLineCustomValuePayload(
  row: QuotationItemDraft,
  schema: DocumentLineCustomFieldSchema | null,
) {
  const fields = (schema?.fields ?? []).filter(
    (field) =>
      field.isActive !== false &&
      readObject(field.displayJson).showInForm === true,
  );
  if (!schema || fields.length === 0) return null;
  const inputKeys = new Set(
    (schema.fields ?? [])
      .filter((field) => field.isActive !== false && field.fieldKind === 'input')
      .map((field) => field.fieldKey),
  );
  const currentValues = readObject(row.customValues);
  const preservedValues = Object.fromEntries(
    Object.entries(currentValues).filter(([key]) => inputKeys.has(key)),
  );
  const visibleValues = Object.fromEntries(
    fields
      .filter((field) => field.fieldKind === 'input')
      .flatMap((field) => {
        const hasCurrentValue = Object.hasOwn(currentValues, field.fieldKey);
        const currentValue = currentValues[field.fieldKey];
        if (!hasCurrentValue && currentValue == null) return [];
        return [[field.fieldKey, currentValue ?? null]];
      }),
  );
  return {
    customFieldSchemaVersion: schema.schemaVersion,
    customValues: { ...preservedValues, ...visibleValues },
  };
}

function hasAdminMaterialItems(items: QuotationItemDraft[]): boolean {
  return items.some((item) =>
    Boolean(
      item.materialId ||
        item.remarks ||
        item.customerMaterialCode ||
        item.customerMaterialName ||
        item.customerMaterialSpec ||
        (item.imageUrls?.length ?? 0) > 0 ||
        (typeof item.qty === 'number' && item.qty !== 1) ||
        (typeof item.unitPrice === 'number' && item.unitPrice !== 0),
    ),
  );
}

function confirmBringOutAdminMaterials(
  count: number,
  hasExistingItems: boolean,
): Promise<boolean> {
  const content = hasExistingItems
    ? `检测到当前对象已维护 ${count} 条客户料号，是否带出物料和价格？确认后将覆盖当前明细；取消则仅更新现有明细价格。`
    : `检测到当前对象已维护 ${count} 条客户料号，是否带出物料和价格？取消则保留当前空白明细。`;
  const cancelText = hasExistingItems ? '仅更新现有价格' : '暂不带出';
  return new Promise((resolve) => {
    Modal.confirm({
      title: '带出客户料号',
      content,
      okText: '带出',
      cancelText,
      onOk: async () => resolve(true),
      onCancel: async () => resolve(false),
    });
  });
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales quotation editing
 * @sunxu-reason Preserves the full quotation form, pricing, customer-material, BOM snapshot and custom-field workflow while all host APIs, permission results, dictionaries, labels, and feedback are supplied by the host.
 */
export function QuotationFormDrawer(props: QuotationFormDrawerProps) {
  const { open, quotationId, onOpenChange, onSuccess, capabilities } = props;
  const canViewPrices = capabilities.canViewPrices;
  const capabilitiesRef = useRef(capabilities);
  useEffect(() => {
    capabilitiesRef.current = capabilities;
  }, [capabilities]);
  const formRef = useRef<ProFormInstance<QuotationFormValues> | undefined>(
    undefined,
  );
  const currentCustomerIdRef = useRef<string | undefined>(undefined);
  const currentQuotationDateRef = useRef<string | undefined>(undefined);
  const itemPriceRequestSeqRef = useRef<Record<string, number>>({});
  const batchPriceRequestSeqRef = useRef(0);
  const detailRequestSeqRef = useRef(0);
  const customerRequestSeqRef = useRef(0);
  const detailRequestGuard = useMemo(
    () => ({
      start: () => ++detailRequestSeqRef.current,
      isCurrent: (requestId: number) =>
        detailRequestSeqRef.current === requestId,
      invalidate: () => {
        detailRequestSeqRef.current += 1;
      },
    }),
    [],
  );
  const customerSelectionRequestGuard = useMemo(
    () => ({
      start: () => ++customerRequestSeqRef.current,
      isCurrent: (requestId: number) =>
        customerRequestSeqRef.current === requestId,
      invalidate: () => {
        customerRequestSeqRef.current += 1;
      },
    }),
    [],
  );
  const [items, setItems] = useState<QuotationItemDraft[]>([
    newQuotationItemDraft(),
  ]);
  const [qtyErrors, setQtyErrors] = useState<Record<string, string>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [customFieldRuntime, setCustomFieldRuntime] =
    useState<CustomFieldFormRuntime | null>(null);
  const [lineCustomFieldSchema, setLineCustomFieldSchema] =
    useState<DocumentLineCustomFieldSchema | null>(null);
  const [paymentTermsBaselineEmpty, setPaymentTermsBaselineEmpty] =
    useState(false);
  const [paymentTermsLoading, setPaymentTermsLoading] = useState(false);
  const [paymentTermsError, setPaymentTermsError] = useState(false);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState<
    QuotationSelectOption[]
  >([]);
  const [paymentTermsValue, setPaymentTermsValue] = useState<string | undefined>();
  const [paymentTermsRequestVersion, setPaymentTermsRequestVersion] =
    useState(0);
  const refreshPaymentTermsAfterConfigRef = useRef(false);
  const [bomOptionsMap, setBomOptionsMap] = useState<
    Record<string, ProductionBomOption[]>
  >({});
  const [costAsOfDate, setCostAsOfDate] = useState<string | undefined>(
    dayjs().format('YYYY-MM-DD'),
  );
  const customerMaterialRequest = useMemo(
    () => async (params?: { keyWords?: string } & Record<string, unknown>) =>
      capabilitiesRef.current.requestCustomerPriorityMaterialOptions({
        query: params,
        customerId: currentCustomerIdRef.current,
        asOfDate: currentQuotationDateRef.current,
      }),
    [],
  );

  useEffect(() => {
    let active = true;
    void capabilitiesRef.current
      .requestQuotationItemCustomFieldSchema('quotation_item')
      .then((schema) => {
        if (active) setLineCustomFieldSchema(schema ?? null);
      })
      .catch(() => {
        if (active) {
          setLineCustomFieldSchema(null);
          capabilitiesRef.current.notifyError(
            capabilitiesRef.current.messages.lineCustomFieldsLoadError,
          );
        }
      });
    return () => {
      active = false;
      detailRequestGuard.invalidate();
      customerSelectionRequestGuard.invalidate();
    };
  }, [customerSelectionRequestGuard, detailRequestGuard]);

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshPaymentTermsAfterConfigRef.current) return;
      refreshPaymentTermsAfterConfigRef.current = false;
      setPaymentTermsRequestVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  const loadPaymentTermsOptions = useCallback(async () => {
    setPaymentTermsLoading(true);
    setPaymentTermsError(false);
    try {
      const options = await capabilitiesRef.current.requestPaymentTermsOptions();
      setPaymentTermsOptions(options);
      setPaymentTermsBaselineEmpty(options.length === 0);
    } catch {
      setPaymentTermsOptions([]);
      setPaymentTermsError(true);
    } finally {
      setPaymentTermsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPaymentTermsOptions();
  }, [loadPaymentTermsOptions, paymentTermsRequestVersion]);

  const resetDraft = useCallback(() => {
    detailRequestGuard.invalidate();
    customerSelectionRequestGuard.invalidate();
    batchPriceRequestSeqRef.current += 1;
    itemPriceRequestSeqRef.current = {};
    currentCustomerIdRef.current = undefined;
    currentQuotationDateRef.current = dayjs().format('YYYY-MM-DD');
    setCostAsOfDate(dayjs().format('YYYY-MM-DD'));
    setQtyErrors({});
    setBomOptionsMap({});
    setItems([newQuotationItemDraft()]);
    formRef.current?.resetFields();
    formRef.current?.setFieldsValue({
      quotationDate: dayjs(),
      customerId: undefined,
      salesRepId: undefined,
      paymentTerms: undefined,
      validUntil: undefined,
      remark: undefined,
      customValues: undefined,
    });
    setPaymentTermsValue(undefined);
  }, [customerSelectionRequestGuard, detailRequestGuard]);

  const buildCustomValuesPayload = (
    values: QuotationFormValues,
  ): QuotationCustomValuesPayload | null => {
    if (!customFieldRuntime || customFieldRuntime.formFieldKeys.length === 0) {
      return null;
    }

    const inputKeys = new Set(customFieldRuntime.inputKeys);
    const submittedValues = readObject(values.customValues);
    const preservedValues = Object.fromEntries(
      Object.entries(customFieldRuntime.currentValues).filter(([key]) =>
        inputKeys.has(key),
      ),
    );
    const visibleValues = Object.fromEntries(
      customFieldRuntime.formFieldKeys.map((key) => [
        key,
        submittedValues[key] ?? null,
      ]),
    );

    return {
      schemaVersion: customFieldRuntime.schemaVersion,
      customValues: { ...preservedValues, ...visibleValues },
    };
  };

  const validateCustomValues = async (
    values: QuotationFormValues,
  ): Promise<QuotationCustomValuesPayload | null> => {
    const payload = buildCustomValuesPayload(values);
    if (!payload) return null;
    await capabilitiesRef.current.validateCustomValues({
      objectType: 'quotation',
      customFieldSchemaVersion: payload.schemaVersion,
      customValues: payload.customValues,
    });
    return payload;
  };

  const saveCustomValues = async (
    objectId: string,
    payload: QuotationCustomValuesPayload | null,
  ) => {
    if (!payload) return;
    await capabilitiesRef.current.saveCustomValues({
      objectType: 'quotation',
      objectId,
      customFieldSchemaVersion: payload.schemaVersion,
      customValues: payload.customValues,
    });
  };

  const autoFillPrice = useCallback(
    async (
      itemKey: string,
      materialId: string,
      customerIdOverride?: string,
      quotationDateOverride?: string,
      quantityOverride?: number,
    ) => {
      if (!canViewPrices) return;
      const customerId = customerIdOverride ?? currentCustomerIdRef.current;
      const asOfDate = quotationDateOverride ?? currentQuotationDateRef.current;

      if (!customerId || !materialId) {
        setItems((prev) =>
          prev.map((item) =>
            item._key === itemKey
              ? { ...item, ...clearSalesLineAutoPricePatch() }
              : item,
          ),
        );
        return;
      }

      if (
        currentCustomerIdRef.current !== customerId ||
        currentQuotationDateRef.current !== asOfDate
      ) {
        return;
      }

      const requestSeq = (itemPriceRequestSeqRef.current[itemKey] ?? 0) + 1;
      itemPriceRequestSeqRef.current[itemKey] = requestSeq;
      setItems((prev) =>
        prev.map((item) =>
          item._key === itemKey
            ? { ...item, ...clearSalesLineAutoPricePatch() }
            : item,
        ),
      );

      try {
        const currentQuantity =
          quantityOverride ??
          items.find((item) => item._key === itemKey)?.qty ??
          1;
        const resolved = await capabilitiesRef.current.resolvePriceContext({
          customerId,
          materialId,
          quantity: currentQuantity,
          asOfDate,
        });
        setItems((prev) => {
          const currentItem = prev.find((item) => item._key === itemKey);
          if (
            itemPriceRequestSeqRef.current[itemKey] !== requestSeq ||
            !currentItem ||
            currentItem.materialId !== materialId ||
            currentCustomerIdRef.current !== customerId ||
            currentQuotationDateRef.current !== asOfDate
          ) {
            return prev;
          }

          return prev.map((item) =>
            item._key === itemKey
              ? {
                  ...item,
                  ...buildSalesLineAutoPricePatch(resolved),
                }
              : item,
          );
        });
      } catch {
        capabilitiesRef.current.notifyWarning(
          capabilitiesRef.current.messages.customerPriceLoadError,
        );
      }
    },
    [canViewPrices],
  );

  const refillAllPrices = useCallback(
    async (customerId?: string, quotationDateOverride?: string) => {
      if (!canViewPrices) {
        if (!customerId) {
          setItems((prev) =>
            prev.map((item) => ({
              ...item,
              ...buildCustomerMaterialSnapshotPatch(),
            })),
          );
        }
        return;
      }
      if (!customerId) {
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            unitPrice: undefined,
            customerMaterialCode: undefined,
            customerMaterialName: undefined,
            customerMaterialSpec: undefined,
          })),
        );
        return;
      }

      const asOfDate = quotationDateOverride ?? currentQuotationDateRef.current;
      const requestSeq = ++batchPriceRequestSeqRef.current;
      const snapshotItems = items.map((item) => ({ ...item }));

      await Promise.all(
        snapshotItems.map(async (item) => {
          if (!item.materialId) return;
          await autoFillPrice(item._key, item.materialId, customerId, asOfDate);
        }),
      );

      if (batchPriceRequestSeqRef.current !== requestSeq) return;
    },
    [autoFillPrice, canViewPrices, items],
  );

  const replaceItemsWithCustomerMaterials = useCallback(
    (records: CustomerMaterialRecord[]) => {
      const nextItems =
        records.length > 0
          ? records.map((record) => ({
              _key: nextItemKey(),
              materialId: record.materialId,
              isCustom: false,
              qty: 1,
              unitPrice: undefined,
              customerMaterialCode: record.customerMaterialCode ?? undefined,
              customerMaterialName: record.customerMaterialName ?? undefined,
              customerMaterialSpec: record.customerMaterialSpec ?? undefined,
              imageUrls: [],
              imageFiles: [],
            }))
          : [newQuotationItemDraft()];
      setItems(nextItems);
      return nextItems;
    },
    [canViewPrices],
  );

  const loadBomOptions = useCallback(
    async (itemKey: string, materialId?: string, keyword?: string) => {
      if (!materialId) return;
      const options = await capabilitiesRef.current.requestBomOptions({
        keyWords: keyword,
        materialId,
      });
      setBomOptionsMap((prev) => {
        const seen = new Set<string>();
        const merged = [...(prev[itemKey] ?? []), ...options].filter(
          (option) => {
            if (seen.has(option.value)) return false;
            seen.add(option.value);
            return true;
          },
        );
        return { ...prev, [itemKey]: merged };
      });
    },
    [],
  );

  const handleCustomerChange = useCallback(
    async (customerId?: string) => {
      const requestId = customerSelectionRequestGuard.start();
      currentCustomerIdRef.current = customerId;
      if (!customerId) {
        await refillAllPrices(undefined);
        return;
      }
      if (!canViewPrices) {
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            ...buildCustomerMaterialSnapshotPatch(),
          })),
        );
        return;
      }

      let records: CustomerMaterialRecord[];
      try {
        records = await capabilitiesRef.current.listCustomerMaterials(
          customerId,
          currentQuotationDateRef.current,
        );
      } catch {
        capabilitiesRef.current.notifyError(
          capabilitiesRef.current.messages.customerMaterialsLoadError,
        );
        return;
      }
      if (
        !customerSelectionRequestGuard.isCurrent(requestId) ||
        currentCustomerIdRef.current !== customerId
      ) {
        return;
      }

      if (records.length === 0) {
        await refillAllPrices(customerId);
        return;
      }

      const shouldBringOut = await confirmBringOutAdminMaterials(
        records.length,
        hasAdminMaterialItems(items),
      );

      if (
        !customerSelectionRequestGuard.isCurrent(requestId) ||
        currentCustomerIdRef.current !== customerId
      ) {
        return;
      }

      if (shouldBringOut) {
        const nextItems = replaceItemsWithCustomerMaterials(records);
        await Promise.all(
          nextItems.map((item) =>
            item.materialId
              ? autoFillPrice(item._key, item.materialId, customerId)
              : Promise.resolve(),
          ),
        );
        return;
      }

      await refillAllPrices(customerId);
    },
    [
      autoFillPrice,
      canViewPrices,
      customerSelectionRequestGuard,
      items,
      refillAllPrices,
      replaceItemsWithCustomerMaterials,
    ],
  );

  const loadDetail = useCallback(async () => {
    const requestId = detailRequestGuard.start();
    customerSelectionRequestGuard.invalidate();
    if (!quotationId) return;
    setLoadingDetail(true);
    try {
      batchPriceRequestSeqRef.current += 1;
      itemPriceRequestSeqRef.current = {};
      const detail = await capabilitiesRef.current.loadQuotation(quotationId);
      if (!detailRequestGuard.isCurrent(requestId)) return;
      currentCustomerIdRef.current = detail.customerId ?? undefined;
      currentQuotationDateRef.current = detail.quotationDate ?? undefined;
      setCostAsOfDate(detail.quotationDate ?? undefined);
      setQtyErrors({});
      setBomOptionsMap({});
      setItems(
        detail.items && detail.items.length > 0
          ? detail.items.map(mapQuotationItemToDraft)
          : [newQuotationItemDraft()],
      );
      setPaymentTermsValue(detail.paymentTerms ?? undefined);
      formRef.current?.resetFields();
      formRef.current?.setFieldsValue({
        customerId: detail.customerId ?? undefined,
        salesRepId: detail.salesRepId ?? undefined,
        paymentTerms: detail.paymentTerms ?? undefined,
        quotationDate: detail.quotationDate
          ? dayjs(detail.quotationDate)
          : undefined,
        validUntil: detail.validUntil ? dayjs(detail.validUntil) : undefined,
        remark: detail.remarks ?? undefined,
        customValues: undefined,
      });
    } catch (error) {
      if (!detailRequestGuard.isCurrent(requestId)) return;
      capabilitiesRef.current.notifyError(
        error instanceof Error
          ? error.message
          : capabilitiesRef.current.messages.loadDetailError,
      );
      onOpenChange(false);
    } finally {
      if (detailRequestGuard.isCurrent(requestId)) {
        setLoadingDetail(false);
      }
    }
  }, [
    customerSelectionRequestGuard,
    detailRequestGuard,
    onOpenChange,
    quotationId,
  ]);

  useEffect(() => {
    if (!open) {
      detailRequestGuard.invalidate();
      customerSelectionRequestGuard.invalidate();
      batchPriceRequestSeqRef.current += 1;
      setLoadingDetail(false);
      return;
    }

    if (quotationId) {
      void loadDetail();
      return;
    }

    resetDraft();
  }, [
    customerSelectionRequestGuard,
    detailRequestGuard,
    loadDetail,
    open,
    quotationId,
    resetDraft,
  ]);

  useEffect(() => {
    setQtyErrors((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      let changed = false;
      const nextErrors = { ...prev };
      const activeKeys = new Set(items.map((item) => item._key));

      for (const key of Object.keys(nextErrors)) {
        if (!activeKeys.has(key)) {
          delete nextErrors[key];
          changed = true;
        }
      }

      for (const item of items) {
        if (!nextErrors[item._key]) continue;
        const qtyValid =
          typeof item.qty === 'number' &&
          Number.isFinite(item.qty) &&
          item.qty > 0;
        if (qtyValid) {
          delete nextErrors[item._key];
          changed = true;
        }
      }

      return changed ? nextErrors : prev;
    });
  }, [items]);

  return (
    <DocumentModalForm<QuotationFormValues>
      title={quotationId ? '编辑' : '新增'}
      formRef={formRef}
      open={open}
      width="100vw"
      layout="vertical"
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setCustomFieldRuntime(null);
        }
      }}
      modalProps={{
        destroyOnHidden: true,
        centered: false,
        mask: { closable: false },
        className: 'document-form-modal quotation-form-drawer',
      }}
      onFinish={async (values) => {
        const nextQtyErrors: Record<string, string> = {};
        const validItems = items.filter((item) => {
          const qtyValid =
            typeof item.qty === 'number' &&
            Number.isFinite(item.qty) &&
            item.qty > 0;
          if (!qtyValid) {
            nextQtyErrors[item._key] = '数量必须大于 0';
          }
          return qtyValid;
        });
        setQtyErrors(nextQtyErrors);

        if (Object.keys(nextQtyErrors).length > 0) {
          capabilities.notifyWarning('请修正报价明细中的数量');
          return false;
        }
        if (validItems.length === 0) {
          capabilities.notifyWarning('请至少添加一个报价项');
          return false;
        }
        const bomCostIssue = getBomCostSnapshotIssue(validItems);
        if (bomCostIssue) {
          capabilities.notifyWarning(bomCostIssue);
          return false;
        }
        const invalidIdentityLine = validItems.findIndex((item) => {
          if (item.materialId) return false;
          return !(
            item.customerMaterialCode ||
            item.customerMaterialName ||
            item.customerMaterialSpec ||
            (item.imageFiles?.length ?? 0) > 0
          );
        });
        if (invalidIdentityLine >= 0) {
          capabilities.notifyWarning(
            `第 ${invalidIdentityLine + 1} 行临时报价品请填写名称/规格/图片`,
          );
          return false;
        }

        const customPayload = await validateCustomValues(values);
        const itemsWithImages = await Promise.all(
          validItems.map(async (item) => ({
            ...item,
            imageUrls: await uploadQuotationItemImages(
              item.imageFiles,
              capabilitiesRef.current.uploadImages,
            ),
          })),
        );

        const payload: QuotationMutationPayload = {
          customerId: values.customerId,
          salesRepId: values.salesRepId,
          quotationDate: toDateString(values.quotationDate),
          validUntil: toDateString(values.validUntil),
          paymentTerms: values.paymentTerms,
          remarks: values.remark,
          items: itemsWithImages.map((item) => ({
            id: (item.id as string | undefined) || undefined,
            materialId: item.materialId || undefined,
            selectedBomHeaderId: item.selectedBomHeaderId || undefined,
            bomSelectionSource: item.selectedBomHeaderId
              ? item.bomSelectionSource || 'manual'
              : undefined,
            bomSelectionReason: item.bomSelectionReason || undefined,
            bomCostSnapshot: item.bomCostSnapshot || undefined,
            quantity: item.qty,
            ...buildCommercialLinePayloadFields(item, canViewPrices),
            customerMaterialCode: item.customerMaterialCode || undefined,
            customerMaterialName: item.customerMaterialName || undefined,
            customerMaterialSpec: item.customerMaterialSpec || undefined,
            remarks: item.remarks || undefined,
            imageUrls: item.imageUrls,
            ...(buildDocumentLineCustomValuePayload(
              item,
              lineCustomFieldSchema,
            ) ?? {}),
          })),
        };

        if (quotationId) {
          const quotation = await capabilitiesRef.current.updateQuotation({
            id: quotationId,
            ...payload,
          });
          await saveCustomValues(quotation.id ?? quotationId, customPayload);
          capabilities.notifySuccess(capabilities.messages.updateSuccess);
          onSuccess?.();
        } else {
          const quotation = await capabilitiesRef.current.createQuotation(payload);
          await saveCustomValues(quotation.id, customPayload);
          capabilities.notifySuccess(capabilities.messages.createSuccess);
          onSuccess?.(quotation);
        }
        return true;
      }}
    >
      <Spin spinning={loadingDetail}>
        <div className="document-form-layout">
          <section className="document-form-section">
            <div className="document-form-section-title">报价信息</div>
            <ProFormGroup size={[24, 0]}>
              <MasterDataQuickCreateSelect
                name="customerId"
                quickCreateEntity="customer"
                {...capabilities.fieldHelp.salesProps(
                  '客户',
                  'quotationCustomerId',
                )}
                width="md"
                rules={[{ required: true, message: '请选择客户' }]}
                showSearch
                debounceTime={300}
                request={capabilities.requestActiveCustomerOptions}
                fieldProps={{
                  filterOption: false,
                  fetchDataOnSearch: true,
                  placeholder: '默认显示前50条，输入关键词可搜索更多',
                  onChange: (customerId?: string) => {
                    void handleCustomerChange(customerId);
                  },
                }}
              />
              <ProFormDatePicker
                name="quotationDate"
                {...capabilities.fieldHelp.salesProps(
                  '报价日期',
                  'quotationDate',
                )}
                width="sm"
                fieldProps={{
                  style: { width: '100%' },
                  onChange: (value: Dayjs | Dayjs[] | null) => {
                    const singleValue = Array.isArray(value) ? value[0] : value;
                    const asOfDate = singleValue
                      ? dayjs(singleValue).format('YYYY-MM-DD')
                      : undefined;
                    currentQuotationDateRef.current = asOfDate;
                    setCostAsOfDate(asOfDate);
                    void refillAllPrices(
                      currentCustomerIdRef.current,
                      asOfDate,
                    );
                  },
                }}
              />
              <ProFormDatePicker
                name="validUntil"
                {...capabilities.fieldHelp.salesProps(
                  '有效期至',
                  'quotationValidUntil',
                )}
                width="sm"
                fieldProps={{ style: { width: '100%' } }}
              />
              <ProFormSelect
                name="salesRepId"
                {...capabilities.fieldHelp.automaticProps('销售员')}
                width="md"
                showSearch
                debounceTime={300}
                request={capabilities.requestSalesRepOptions}
                fieldProps={{
                  filterOption: false,
                  placeholder: '默认显示50条，可搜索更多',
                }}
              />
              <ProFormSelect
                name="paymentTerms"
                label={capabilities.renderPaymentTermsConfigEntryLabel({
                  target: 'dictionary',
                  typeCode: 'payment_terms',
                  children: capabilities.fieldHelp.salesProps(
                    '收款条件',
                    'quotationPaymentTerms',
                  ).label,
                  show:
                    paymentTermsBaselineEmpty &&
                    !paymentTermsValue &&
                    !paymentTermsLoading &&
                    !paymentTermsError,
                  onOpen: () => {
                    refreshPaymentTermsAfterConfigRef.current = true;
                  },
                })}
                tooltip={capabilities.fieldHelp.salesProps(
                  '收款条件',
                  'quotationPaymentTerms',
                ).tooltip}
                width="md"
                placeholder="请选择收款条件"
                showSearch
                messageVariables={{ label: '收款条件' }}
                options={paymentTermsOptions}
                fieldProps={{
                  loading: paymentTermsLoading,
                  notFoundContent: paymentTermsLoading
                    ? '正在加载字典项'
                    : paymentTermsError
                      ? (
                          <Space size={8}>
                            <span>字典项加载失败</span>
                            <Button
                              type="link"
                              size="small"
                              htmlType="button"
                              onClick={() =>
                                setPaymentTermsRequestVersion((version) => version + 1)
                              }
                            >
                              重试
                            </Button>
                          </Space>
                        )
                      : '暂无可选字典项',
                  onChange: (value?: string) => setPaymentTermsValue(value),
                }}
              />
            </ProFormGroup>
          </section>
          <section className="document-form-section document-form-section-lines">
            <OrderItemEditor
              items={items}
              onChange={(nextItems) =>
                setItems(nextItems as QuotationItemDraft[])
              }
              title={capabilities.fieldHelp.salesLabel(
                '报价明细',
                'quotationItems',
              )}
              required
              showPrice={canViewPrices}
              showCurrency={canViewPrices}
              showCommercialAmountFields={canViewPrices}
              materialLabel="报价行"
              qtyLabel="数量"
              qtyRequired
              qtyErrors={qtyErrors}
              layout="table"
              showRowIndex
              className="quotation-item-editor"
              cardClassName="quotation-item-card"
              cardHeaderClassName="quotation-item-card-header"
              cardMainClassName="quotation-item-main"
              cardBelowClassName="quotation-item-below"
              addButtonClassName="quotation-item-add"
              materialRequest={customerMaterialRequest}
              materialPlaceholder="搜索客户料号/物料"
              materialFilterMode="hidden"
              materialSelectWidth={320}
              lineCustomFieldObjectType="quotation_item"
              toolbarActions={
                <BatchMaterialAddButton<QuotationItemDraft>
                  rows={items}
                  onRowsChange={setItems}
                  getMaterialId={(item) => item.materialId || undefined}
                  isEmptyRow={isEmptyQuotationItem}
                  quantityLabel="报价数量"
                  createRow={(material, quantity) => ({
                    ...newQuotationItemDraft(),
                    materialId: material.id,
                    material,
                    materialOption: buildBatchMaterialOption(material),
                    qty: quantity,
                  })}
                  onAdded={(addedRows) => {
                    for (const item of addedRows) {
                      void autoFillPrice(item._key, item.materialId);
                    }
                  }}
                />
              }
              hideMaterialSelect={(item) =>
                Boolean((item as QuotationItemDraft).isCustom)
              }
              onMaterialChange={(index, materialId, option) => {
                const itemKey = items[index]?._key;
                if (itemKey && !items[index]?.isCustom) {
                  setItems((prev) =>
                    prev.map((item) =>
                      item._key === itemKey
                        ? {
                            ...item,
                            ...buildCustomerMaterialSnapshotPatch(option),
                            selectedBomHeaderId: undefined,
                            bomSelectionSource: undefined,
                            bomSelectionReason: undefined,
                            bomCostSnapshot: undefined,
                          }
                        : item,
                    ),
                  );
                  void autoFillPrice(itemKey, materialId);
                }
              }}
              onQuantityChange={(itemKey, quantity) => {
                const item = items.find(
                  (candidate) => candidate._key === itemKey,
                );
                if (item?.materialId && !item.isCustom) {
                  void autoFillPrice(
                    itemKey,
                    item.materialId,
                    undefined,
                    undefined,
                    quantity,
                  );
                }
              }}
              renderExtra={(item, _index, update) => {
                const draft = item as QuotationItemDraft;
                return (
                  <Segmented
                    className="quotation-item-mode"
                    size="middle"
                    value={draft.isCustom ? 'custom' : 'material'}
                    options={[
                      { label: '物料', value: 'material' },
                      { label: '临时品', value: 'custom' },
                    ]}
                    onChange={(value) =>
                      update({
                        isCustom: value === 'custom',
                        materialId: value === 'custom' ? '' : draft.materialId,
                        selectedBomHeaderId:
                          value === 'custom'
                            ? undefined
                            : draft.selectedBomHeaderId,
                        bomSelectionSource:
                          value === 'custom'
                            ? undefined
                            : draft.bomSelectionSource,
                        bomSelectionReason:
                          value === 'custom'
                            ? undefined
                            : draft.bomSelectionReason,
                        bomCostSnapshot:
                          value === 'custom'
                            ? undefined
                            : draft.bomCostSnapshot,
                      })
                    }
                  />
                );
              }}
              renderBelow={(item, _index, update) => {
                const draft = item as QuotationItemDraft;
                return (
                  <div className="quotation-item-extra">
                    {!draft.isCustom && draft.materialId && (
                      <Space wrap style={{ width: '100%', marginBottom: 8 }}>
                        <RemoteSelect<string>
                          allowClear
                          showSearch
                          filterOption={false}
                          placeholder="选择本次报价采用的 BOM（可选）"
                          value={draft.selectedBomHeaderId}
                          options={bomOptionsMap[draft._key] ?? []}
                          style={{ minWidth: 280 }}
                          onFocus={() =>
                            void loadBomOptions(draft._key, draft.materialId)
                          }
                          onSearch={(keyword) =>
                            void loadBomOptions(
                              draft._key,
                              draft.materialId,
                              keyword,
                            )
                          }
                          onChange={(value) =>
                            update({
                              selectedBomHeaderId: value,
                              bomSelectionSource: value ? 'manual' : undefined,
                              bomSelectionReason: value
                                ? '报价阶段人工确认'
                                : undefined,
                              bomCostSnapshot: undefined,
                            })
                          }
                        />
                      </Space>
                    )}
                    {!draft.isCustom && draft.materialId ? (
                      <BomCostSnapshotEditor
                        bomHeaderId={draft.selectedBomHeaderId}
                        productQty={draft.qty}
                        asOfDate={costAsOfDate}
                        value={draft.bomCostSnapshot}
                        onChange={(bomCostSnapshot) =>
                          update({ bomCostSnapshot })
                        }
                      />
                    ) : null}
                    {draft.isCustom && (
                      <div className="quotation-item-temp-grid">
                        <Input
                          value={draft.customerMaterialCode || ''}
                          onChange={(event) =>
                            update({
                              customerMaterialCode:
                                event.target.value || undefined,
                            })
                          }
                          placeholder="临时编码/客户图号（可选）"
                          allowClear
                        />
                        <Input
                          value={draft.customerMaterialName || ''}
                          onChange={(event) =>
                            update({
                              customerMaterialName:
                                event.target.value || undefined,
                            })
                          }
                          placeholder="临时品名"
                          allowClear
                        />
                        <Input
                          value={draft.customerMaterialSpec || ''}
                          onChange={(event) =>
                            update({
                              customerMaterialSpec:
                                event.target.value || undefined,
                            })
                          }
                          placeholder="规格/描述（可选）"
                          allowClear
                        />
                      </div>
                    )}
                    <div className="quotation-item-assist-grid">
                      <div className="quotation-image-upload">
                        <div className="quotation-item-field-label">
                          参考图片
                        </div>
                        <Upload
                          fileList={draft.imageFiles ?? []}
                          onChange={({ fileList }) =>
                            update({
                              imageFiles: fileList,
                              imageUrls: fileList
                                .map((file) => file.url)
                                .filter((url): url is string => Boolean(url)),
                            })
                          }
                          beforeUpload={() => false}
                          multiple
                          accept="image/*"
                          maxCount={5}
                          listType="picture-card"
                        >
                          {(draft.imageFiles?.length ?? 0) < 5 ? (
                            <div className="quotation-upload-trigger">
                              <PlusOutlined />
                              <span>上传图片</span>
                            </div>
                          ) : null}
                        </Upload>
                      </div>
                      <div className="quotation-item-remark">
                        <div className="quotation-item-field-label">
                          明细备注
                        </div>
                        <Input.TextArea
                          value={draft.remarks || ''}
                          onChange={(event) =>
                            update({ remarks: event.target.value || undefined })
                          }
                          placeholder="填写这一行单独的要求、包装或交付说明（可选）"
                          allowClear
                          autoSize={{ minRows: 3, maxRows: 5 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </section>
          <section className="document-form-section">
            <div className="document-form-section-title">其他信息</div>
            <ProFormTextArea
              name="remark"
              {...capabilities.fieldHelp.automaticProps('整单备注')}
              placeholder="填写整张报价单共用的背景说明（可选）"
            />
            <CustomFieldFormSection
              objectType="quotation"
              objectId={quotationId}
              onRuntimeChange={setCustomFieldRuntime}
            />
          </section>
        </div>
      </Spin>
    </DocumentModalForm>
  );
}
