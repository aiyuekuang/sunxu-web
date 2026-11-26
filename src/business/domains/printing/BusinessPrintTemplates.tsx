/**
 * host business print templates migrated from mes-admin.
 *
 * Host-owned host dictionaries, permission masking and QR payload encoding are
 * passed through props so this file has no dependency on host application hooks.
 */
import React from 'react';
import { DotMatrixLayout } from './DotMatrixLayout';
import { PrintLayout } from './PrintLayout';
import { formatUnitLabel, type UnitLabelMap } from '../../utils/qty-unit';

/** Structural DTO boundary: these templates intentionally keep the source host wire fields intact. */
export type BusinessPrintRecord = Record<string, any> & {
  items?: BusinessPrintRecord[] | null;
  defects?: BusinessPrintRecord[] | null;
  operations?: BusinessPrintRecord[] | null;
  runningToolingSessions?: BusinessPrintRecord[] | null;
  bottleneckCompletedQty?: number | string | null;
  completedQty?: number | string | null;
  scrappedQty?: number | string | null;
};
export type InternalDocumentQrKind =
  | 'sale_delivery'
  | 'purchase_order'
  | 'purchase_receipt'
  | 'material_issue'
  | 'work_order'
  | 'quality_inspection';
export type BarcodeLevel = 'M';
export interface BarcodeRenderOptions {
  size: number;
  level: BarcodeLevel;
}
export type RenderBarcode = (value: string, options: BarcodeRenderOptions) => React.ReactNode;
export type BuildDocumentQr = (kind: InternalDocumentQrKind, id: string | number) => string;
export type BuildOperationQr = (workOrderId: string | number, operationId: string | number) => string;
export type AmountMask = (value: string) => string;
export interface PaymentTermsOption {
  value: string;
  label: string;
}

export interface DeliveryNoteDotMatrixPrintProps {
  detail: BusinessPrintRecord;
  unitLabelMap: UnitLabelMap;
  companyName?: string;
}
export interface DeliveryNotePrintProps {
  detail: BusinessPrintRecord;
  unitLabelMap: UnitLabelMap;
  renderBarcode: RenderBarcode;
  buildDocumentQr: BuildDocumentQr;
}
export interface InspectionReportPrintProps {
  detail: BusinessPrintRecord;
  defectCodeMap?: Record<string, string>;
  renderBarcode: RenderBarcode;
  buildDocumentQr: BuildDocumentQr;
  inspectionTypeLabels: Record<string, string>;
  inspectionStatusLabels: Record<string, string>;
  inspectionResultLabels: { passed: string; failed: string };
  formatQualitySpecTypeLabel: (specType: string) => string;
  formatInspectionConclusion: (conclusion: string) => string;
}
export interface MaterialIssuePrintProps {
  detail: BusinessPrintRecord;
  unitLabelMap: UnitLabelMap;
  renderBarcode: RenderBarcode;
  buildDocumentQr: BuildDocumentQr;
  issueTypeLabels: Record<string, string>;
}
export interface ProcessCardPrintProps {
  detail: BusinessPrintRecord & { operations?: BusinessPrintRecord[] };
  unitLabelMap: UnitLabelMap;
  renderBarcode: RenderBarcode;
  buildDocumentQr: BuildDocumentQr;
  buildOperationQr: BuildOperationQr;
  qualityFlowLabels: { blocked: string; ready: string };
}
export interface PurchaseOrderDotMatrixPrintProps {
  detail: BusinessPrintRecord;
  unitLabelMap: UnitLabelMap;
  paymentTermsLabelMap: Record<string, string>;
  maskAmount: AmountMask;
  companyName?: string;
}
export interface PurchaseOrderPrintProps {
  detail: BusinessPrintRecord;
  unitLabelMap: UnitLabelMap;
  paymentTermsLabelMap: Record<string, string>;
  maskAmount: AmountMask;
  renderBarcode: RenderBarcode;
  buildDocumentQr: BuildDocumentQr;
}
export interface PurchaseReceiptPrintProps {
  detail: BusinessPrintRecord;
  unitLabelMap: UnitLabelMap;
  renderBarcode: RenderBarcode;
  buildDocumentQr: BuildDocumentQr;
}
export interface SaleOrderPrintProps {
  detail: BusinessPrintRecord & { confirmedAt?: string };
  unitLabelMap: UnitLabelMap;
  paymentTermsOptions: PaymentTermsOption[];
  maskAmount: AmountMask;
}
export interface WorkOrderPrintProps {
  detail: BusinessPrintRecord;
  unitLabelMap: UnitLabelMap;
  renderBarcode: RenderBarcode;
  buildDocumentQr: BuildDocumentQr;
  workOrderStatusLabels: Record<string, string>;
  operationStatusLabels: Record<string, string>;
}

interface FormatNumberOptions {
  maximumFractionDigits?: number;
  fallback?: string;
}

function formatNumber(
  value?: number | string | null,
  options: FormatNumberOptions = {},
): string {
  if (value === undefined || value === null || value === '') {
    return options.fallback ?? '-';
  }
  const number = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(number)) return options.fallback ?? '-';
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 3,
  });
}

/**
 * 送货单针打模板 — 针式打印机 + 连续复写纸专用。
 *
 * 与 DeliveryNotePrint（A4）并行存在：
 * - 纯黑白、宋体、实线表格
 * - 无 Logo、无背景、无阴影
 * - 字段精简，按针打纸张宽度排版
 */

const MIN_DETAIL_ROWS = 3;

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable delivery note dot matrix print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const DeliveryNoteDotMatrixPrint = React.forwardRef<
  HTMLDivElement,
  DeliveryNoteDotMatrixPrintProps
>(function DeliveryNoteDotMatrixPrint(
  { detail, unitLabelMap, companyName },
  ref,
) {

  const items = detail.items ?? [];
  const totalQty = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  const partnerName = detail.partnerNameSnapshot ?? '—';
  const contactName = detail.contactNameSnapshot ?? '—';
  const contactPhone = detail.contactPhoneSnapshot ?? '—';
  const address = detail.addressSnapshot ?? '—';
  const headerRemark = detail.remarks?.trim() || '—';

  const docDate = detail.deliveryDate
    ? new Date(detail.deliveryDate).toLocaleDateString('zh-CN')
    : new Date().toLocaleDateString('zh-CN');

  return (
    <DotMatrixLayout
      ref={ref}
      companyName={companyName || undefined}
      title="送货单"
      docNo={detail.deliveryNo}
      docDate={docDate}
    >
      {/* ── 客户信息（两列紧凑布局） ── */}
      <div className="dm-info">
        <div className="dm-info-item">
          <span className="dm-info-label">客户：</span>
          {partnerName}
        </div>
        <div className="dm-info-item">
          <span className="dm-info-label">联系人：</span>
          {contactName}
        </div>
      </div>
      <div className="dm-info">
        <div className="dm-info-item">
          <span className="dm-info-label">电话：</span>
          {contactPhone}
        </div>
      </div>
      <div className="dm-info" style={{ marginBottom: '1mm' }}>
        <div className="dm-info-item" style={{ flex: 2 }}>
          <span className="dm-info-label">地址：</span>
          {address}
        </div>
      </div>
      <div className="dm-info" style={{ marginBottom: '1mm' }}>
        <div className="dm-info-item" style={{ flex: 2 }}>
          <span className="dm-info-label">备注：</span>
          {headerRemark}
        </div>
      </div>

      {/* ── 明细表 ── */}
      <table className="dm-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>序号</th>
            <th>品名规格</th>
            <th style={{ width: '18%' }}>客户料号/编码</th>
            <th style={{ width: '7%' }}>单位</th>
            <th style={{ width: '10%' }}>数量</th>
            <th style={{ width: '12%' }}>批号</th>
            <th style={{ width: '18%' }}>备注</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="center">{idx + 1}</td>
              <td>
                {item.customerMaterialName || item.material?.name || '—'}
                {item.customerMaterialSpec || item.material?.spec
                  ? ` ${item.customerMaterialSpec || item.material?.spec}`
                  : ''}
              </td>
              <td>{item.customerMaterialCode || item.material?.code || '—'}</td>
              <td className="center">
                {formatUnitLabel(item.material?.unit, unitLabelMap) || '—'}
              </td>
              <td className="right">{item.quantity}</td>
              <td>{item.batchNo ?? '—'}</td>
              <td>{item.remarks?.trim() || '—'}</td>
            </tr>
          ))}
          {/* 保留最小行数，兼顾针打对齐与版面紧凑 */}
          {items.length < MIN_DETAIL_ROWS &&
            Array.from({ length: MIN_DETAIL_ROWS - items.length }).map(
              (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 空行填充用于固定打印行数
                <tr key={`empty-${i}`}>
                  <td className="center">{items.length + i + 1}</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ),
            )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="right">
              合计
            </td>
            <td className="right">
              {formatNumber(totalQty, { maximumFractionDigits: 4 })}
            </td>
            <td />
            <td />
          </tr>
        </tfoot>
      </table>

      {/* ── 签字栏 ── */}
      <div className="dm-sign">
        <div className="dm-sign-item">发货人：____________</div>
        <div className="dm-sign-item">送货人：____________</div>
        <div className="dm-sign-item">收货人：____________</div>
      </div>
    </DotMatrixLayout>
  );
});

/**
 * 送货单 / 销售出库单打印模板。
 *
 * 包含：客户信息、出库明细、签字栏。
 */

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable delivery note print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const DeliveryNotePrint = React.forwardRef<
  HTMLDivElement,
  DeliveryNotePrintProps
>(function DeliveryNotePrint(
  { detail, unitLabelMap, renderBarcode, buildDocumentQr },
  ref,
) {

  const items = detail.items ?? [];
  const totalQty = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  const partnerName = detail.partnerNameSnapshot ?? '—';
  const contactName = detail.contactNameSnapshot ?? '—';
  const contactPhone = detail.contactPhoneSnapshot ?? '—';
  const address = detail.addressSnapshot ?? '—';
  const headerRemark = detail.remarks?.trim() || '—';

  return (
    <PrintLayout
      ref={ref}
      title="销售出库单 / 送货单"
      docNo={detail.deliveryNo}
    >
      {/* ── 基本信息 ── */}
      <div className="print-section">
        <div className="print-section-title">出库信息</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <table className="print-desc" style={{ flex: 1 }}>
            <tbody>
              <tr>
                <td className="label">销售出库单编号</td>
                <td>{detail.deliveryNo}</td>
                <td className="label">关联订单</td>
                <td>{detail.saleOrder?.orderNo ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">客户名称</td>
                <td>{partnerName}</td>
                <td className="label">联系人</td>
                <td>{contactName}</td>
              </tr>
              <tr>
                <td className="label">联系电话</td>
                <td>{contactPhone}</td>
                <td className="label">收货地址</td>
                <td>{address}</td>
              </tr>
              <tr>
                <td className="label">出库仓库</td>
                <td>{detail.warehouse?.name ?? '—'}</td>
                <td className="label">出库日期</td>
                <td>
                  {detail.deliveryDate
                    ? new Date(detail.deliveryDate).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="label">制单人</td>
                <td>
                  {detail.creator?.realName ?? detail.creator?.username ?? '—'}
                </td>
                <td className="label">备注</td>
                <td>{headerRemark}</td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 100,
            }}
          >
            {renderBarcode(buildDocumentQr('sale_delivery', detail.id), { size: 88, level: 'M' })}
            <div style={{ fontSize: 9, color: '#999' }}>扫码核验</div>
          </div>
        </div>
      </div>

      {/* ── 出库明细 ── */}
      <div className="print-section">
        <div className="print-section-title">出库明细</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>序号</th>
              <th>品名规格</th>
              <th style={{ width: 140 }}>客户料号 / 物料编码</th>
              <th style={{ width: 60 }}>单位</th>
              <th style={{ width: 80 }}>数量</th>
              <th style={{ width: 120 }}>批号</th>
              <th style={{ width: 160 }}>备注</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="number">{idx + 1}</td>
                <td>
                  {item.customerMaterialName || item.material?.name || '—'}
                  {item.customerMaterialSpec || item.material?.spec
                    ? ` / ${item.customerMaterialSpec || item.material?.spec}`
                    : ''}
                </td>
                <td>
                  {item.customerMaterialCode || item.material?.code || '—'}
                </td>
                <td>
                  {formatUnitLabel(item.material?.unit, unitLabelMap) || '—'}
                </td>
                <td className="number">{item.quantity}</td>
                <td>{item.batchNo ?? '—'}</td>
                <td>{item.remarks?.trim() || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                合计
              </td>
              <td className="number" style={{ fontWeight: 600 }}>
                {formatNumber(totalQty, { maximumFractionDigits: 4 })}
              </td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          仓库发货：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          客户签收：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          日期：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});

/**
 * 质检报告打印模板。
 *
 * 包含：检验基本信息、检验项目明细、缺陷记录、判定结论、签字栏。
 */



/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable inspection report print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const InspectionReportPrint = React.forwardRef<
  HTMLDivElement,
  InspectionReportPrintProps
>(function InspectionReportPrint(
  {
    detail,
    defectCodeMap = {},
    renderBarcode,
    buildDocumentQr,
    inspectionTypeLabels,
    inspectionStatusLabels,
    inspectionResultLabels,
    formatQualitySpecTypeLabel,
    formatInspectionConclusion,
  },
  ref,
) {
  const items = detail.items ?? [];
  const defects = detail.defects ?? [];
  const passedCount = items.filter((i) => i.isPassed === true).length;
  const failedCount = items.filter((i) => i.isPassed === false).length;

  return (
    <PrintLayout
      ref={ref}
      title="质量检验报告"
      docNo={detail.inspectionNo}
      metaLines={[inspectionTypeLabels[detail.type] ?? '-']}
    >
      {/* ── 基本信息 ── */}
      <div className="print-section">
        <div className="print-section-title">检验信息</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <table className="print-desc" style={{ flex: 1 }}>
            <tbody>
              <tr>
                <td className="label">检验单号</td>
                <td>{detail.inspectionNo}</td>
                <td className="label">检验类型</td>
                <td>{inspectionTypeLabels[detail.type] ?? '-'}</td>
              </tr>
              <tr>
                <td className="label">物料/产品</td>
                <td>
                  {detail.material?.name ??
                    ((detail as Record<string, unknown>)
                      .materialName as string) ??
                    '—'}
                </td>
                <td className="label">物料编码</td>
                <td>
                  {detail.material?.code ??
                    ((detail as Record<string, unknown>)
                      .materialCode as string) ??
                    '—'}
                </td>
              </tr>
              <tr>
                <td className="label">批号</td>
                <td>{detail.batchNo ?? '—'}</td>
                <td className="label">抽检数量</td>
                <td>{detail.sampleQty}</td>
              </tr>
              <tr>
                <td className="label">检验员</td>
                <td>
                  {detail.inspector?.realName ??
                    detail.inspector?.username ??
                    ((detail as Record<string, unknown>).inspector as string) ??
                    '—'}
                </td>
                <td className="label">检验日期</td>
                <td>
                  {(detail as Record<string, unknown>).inspectionDate
                    ? new Date(
                        (detail as Record<string, unknown>)
                          .inspectionDate as string,
                      ).toLocaleDateString('zh-CN')
                    : detail.submittedAt
                      ? new Date(detail.submittedAt).toLocaleDateString('zh-CN')
                      : '—'}
                </td>
              </tr>
              <tr>
                <td className="label">检验模板</td>
                <td>
                  {((detail as Record<string, unknown>)
                    .templateName as string) ?? '—'}
                </td>
                <td className="label">判定状态</td>
                <td style={{ fontWeight: 600 }}>
                  {inspectionStatusLabels[detail.status] ?? '-'}
                </td>
              </tr>
              {detail.conclusion && (
                <tr>
                  <td className="label">判定结论</td>
                  <td colSpan={3}>
                    {formatInspectionConclusion(detail.conclusion)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 100,
            }}
          >
            {renderBarcode(buildDocumentQr('quality_inspection', detail.id), { size: 88, level: 'M' })}
            <div style={{ fontSize: 9, color: '#999' }}>扫码查看</div>
          </div>
        </div>
      </div>

      {/* ── 检验项目 ── */}
      {items.length > 0 && (
        <div className="print-section">
          <div className="print-section-title">
            检验项目（{inspectionResultLabels.passed} {passedCount} /{' '}
            {inspectionResultLabels.failed} {failedCount} / 共{' '}
            {items.length}）
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>序号</th>
                <th>检验项目</th>
                <th>标准要求</th>
                <th style={{ width: 90 }}>检验方法</th>
                <th style={{ width: 90 }}>实测值</th>
                <th style={{ width: 70 }}>判定</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="number">{idx + 1}</td>
                  <td>{item.itemName}</td>
                  <td>{item.standard ?? '—'}</td>
                  <td>{formatQualitySpecTypeLabel(item.specType)}</td>
                  <td>{item.measuredValue ?? '—'}</td>
                  <td
                    style={{
                      fontWeight: 600,
                      color:
                        item.isPassed === true
                          ? '#52c41a'
                          : item.isPassed === false
                            ? '#ff4d4f'
                            : undefined,
                    }}
                  >
                    {item.isPassed == null
                      ? '—'
                      : item.isPassed
                      ? inspectionResultLabels.passed
                      : inspectionResultLabels.failed}
                  </td>
                  <td style={{ fontSize: 10 }}>{item.remarks ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 缺陷记录 ── */}
      {defects.length > 0 && (
        <div className="print-section">
          <div className="print-section-title">缺陷记录</div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>序号</th>
                <th style={{ width: 100 }}>缺陷编码</th>
                <th>缺陷描述</th>
                <th style={{ width: 60 }}>数量</th>
                <th style={{ width: 80 }}>严重程度</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {defects.map((d, idx) => (
                <tr key={d.id}>
                  <td className="number">{idx + 1}</td>
                  <td>
                    {d.defectCode
                      ? (defectCodeMap[d.defectCode] ?? d.defectCode)
                      : '—'}
                  </td>
                  <td>{d.description}</td>
                  <td className="number">{d.qty}</td>
                  <td>{d.severity}</td>
                  <td style={{ fontSize: 10 }}>{d.remarks ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 处置意见 ── */}
      {detail.disposalNote && (
        <div className="print-section">
          <div className="print-section-title">处置意见</div>
          <div
            style={{
              border: '1px solid #d9d9d9',
              padding: 8,
              minHeight: 40,
            }}
          >
            {detail.disposalNote}
          </div>
        </div>
      )}

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          检验员：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          质量主管：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          日期：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});

/**
 * 领料单 A4 打印模板。
 *
 * 车间领料凭据，包含：工单信息、领料明细、签字栏。
 */


/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable material issue print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const MaterialIssuePrint = React.forwardRef<
  HTMLDivElement,
  MaterialIssuePrintProps
>(function MaterialIssuePrint(
  { detail, unitLabelMap, renderBarcode, buildDocumentQr, issueTypeLabels },
  ref,
) {
  const items = detail.items ?? [];
  const totalRequired = items.reduce(
    (s, i) => s + Number(i.requiredQty ?? 0),
    0,
  );
  const totalActual = items.reduce((s, i) => s + Number(i.actualQty ?? 0), 0);
  const headerRemark = detail.remarks?.trim() || '—';

  return (
    <PrintLayout ref={ref} title="领料单" docNo={detail.issueNo}>
      {/* ── 基本信息 ── */}
      <div className="print-section">
        <div className="print-section-title">领料信息</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <table className="print-desc" style={{ flex: 1 }}>
            <tbody>
              <tr>
                <td className="label">领料单号</td>
                <td>{detail.issueNo}</td>
                <td className="label">类型</td>
                <td>{issueTypeLabels[detail.type] ?? '-'}</td>
              </tr>
              <tr>
                <td className="label">关联工单</td>
                <td>{detail.workOrder?.orderNo ?? '—'}</td>
                <td className="label">产品</td>
                <td>{detail.workOrder?.material?.name ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">工序</td>
                <td>{detail.operation?.operationName ?? '—'}</td>
                <td className="label">领料人</td>
                <td>
                  {detail.operator?.realName ??
                    detail.operator?.username ??
                    '—'}
                </td>
              </tr>
              <tr>
                <td className="label">制单人</td>
                <td>
                  {detail.creator?.realName ?? detail.creator?.username ?? '—'}
                </td>
                <td className="label">制单时间</td>
                <td>
                  {detail.createdAt
                    ? new Date(detail.createdAt).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="label">备注</td>
                <td colSpan={3}>{headerRemark}</td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 100,
            }}
          >
            {renderBarcode(buildDocumentQr('material_issue', detail.id), { size: 88, level: 'M' })}
            <div style={{ fontSize: 9, color: '#999' }}>扫码核验</div>
          </div>
        </div>
      </div>

      {/* ── 领料明细 ── */}
      <div className="print-section">
        <div className="print-section-title">领料明细</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>序号</th>
              <th>物料名称</th>
              <th style={{ width: 100 }}>物料编号</th>
              <th style={{ width: 60 }}>单位</th>
              <th style={{ width: 80 }}>需求数量</th>
              <th style={{ width: 80 }}>实发数量</th>
              <th style={{ width: 90 }}>批号</th>
              <th style={{ width: 90 }}>来源仓</th>
              <th style={{ width: 90 }}>线边仓</th>
              <th style={{ width: 160 }}>行备注</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="number">{idx + 1}</td>
                <td>{item.material?.name ?? '—'}</td>
                <td>{item.material?.code ?? '—'}</td>
                <td>
                  {formatUnitLabel(item.material?.unit, unitLabelMap) || '—'}
                </td>
                <td className="number">{item.requiredQty}</td>
                <td className="number">{item.actualQty}</td>
                <td>{item.batchNo ?? '—'}</td>
                <td>{item.warehouse?.name ?? '—'}</td>
                <td>{item.materialReq?.lineSideWarehouse?.name ?? '—'}</td>
                <td>{item.remarks?.trim() || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                合计
              </td>
              <td className="number" style={{ fontWeight: 600 }}>
                {formatNumber(totalRequired, { maximumFractionDigits: 4 })}
              </td>
              <td className="number" style={{ fontWeight: 600 }}>
                {formatNumber(totalActual, { maximumFractionDigits: 4 })}
              </td>
              <td />
              <td />
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          领料人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          发料人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          仓库主管：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          日期：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});

/**
 * 工序流转卡打印模板。
 *
 * 保留整单二维码用于查看工单详情，同时为每道工序打印独立二维码。
 * 现场优先扫工序二维码，减少“先选工单再选工序”的二次操作。
 * 工序表保留手写签字格，用于纸质流转确认。
 */

function formatOperationStage(op: BusinessPrintRecord): string | null {
  if (op.stageName) {
    return `${op.stageNo ?? ''}${op.stageNo ? ' ' : ''}${op.stageName}`;
  }
  return op.stageNo != null ? `第 ${op.stageNo} 段` : null;
}

function formatOperationTooling(op: BusinessPrintRecord): string {
  const sessions = op.runningToolingSessions ?? [];
  if (sessions.length === 0) return '—';
  return sessions
    .map(
      (session) =>
        session.toolingCode ?? session.toolingName ?? session.toolingId,
    )
    .filter(Boolean)
    .join('、');
}

function formatPieceRate(op: BusinessPrintRecord): string {
  return op.pieceRateSnapshot != null
    ? Number(op.pieceRateSnapshot).toFixed(4)
    : '—';
}

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable process card print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const ProcessCardPrint = React.forwardRef<
  HTMLDivElement,
  ProcessCardPrintProps
>(function ProcessCardPrint(
  { detail, unitLabelMap, renderBarcode, buildDocumentQr, buildOperationQr, qualityFlowLabels },
  ref,
) {

  const materialUnitLabel = formatUnitLabel(
    detail.material?.unit,
    unitLabelMap,
  );
  return (
    <PrintLayout
      ref={ref}
      title="工序流转卡"
      docNo={detail.orderNo}
      metaLines={[
        `产品：${detail.material?.name ?? '—'}`,
        `数量：${formatNumber(detail.plannedQty, { maximumFractionDigits: 4 })} ${materialUnitLabel}`,
      ]}
    >
      {/* ── 工单概要 + 二维码 ── */}
      <div className="print-section">
        <div style={{ display: 'flex', gap: 16 }}>
          <table className="print-desc" style={{ flex: 1 }}>
            <tbody>
              <tr>
                <td className="label">工单号</td>
                <td>{detail.orderNo}</td>
                <td className="label">产品编码</td>
                <td>{detail.material?.code ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">产品名称</td>
                <td>{detail.material?.name ?? '—'}</td>
                <td className="label">规格型号</td>
                <td>{detail.material?.spec ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">计划数量</td>
                <td>
                  {formatNumber(detail.plannedQty, {
                    maximumFractionDigits: 4,
                  })}{' '}
                  {materialUnitLabel}
                </td>
                <td className="label">客户</td>
                <td>{detail.customer?.name ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">计划开始</td>
                <td>
                  {detail.planStartTime
                    ? new Date(detail.planStartTime).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
                <td className="label">交货日期</td>
                <td>
                  {detail.dueDate
                    ? new Date(detail.dueDate).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
              </tr>
            </tbody>
          </table>
          {/* 整单二维码保留给查看整单详情；现场报工优先扫下方工序二维码 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 100,
            }}
          >
            {renderBarcode(buildDocumentQr('work_order', detail.id), { size: 88, level: 'M' })}
            <div style={{ fontSize: 9, color: '#999' }}>整单详情</div>
          </div>
        </div>
      </div>

      {/* ── 工序流转表 ── */}
      <div className="print-section">
        <div className="print-section-title">工序流转记录</div>
        <table className="print-table process-card-sign-grid">
          <thead>
            <tr>
              <th style={{ width: 40 }}>序号</th>
              <th>工序名称</th>
              <th style={{ width: 80 }}>设备</th>
              <th style={{ width: 96 }}>前置/质检</th>
              <th style={{ width: 68 }}>计件单价</th>
              <th style={{ width: 68 }}>计划数量</th>
              <th style={{ width: 68 }}>合格数量</th>
              <th style={{ width: 68 }}>不合格数</th>
              <th className="print-qr-cell" style={{ width: 72 }}>
                工序码
              </th>
              <th style={{ width: 80 }}>操作人签字</th>
              <th style={{ width: 80 }}>检验人签字</th>
              <th style={{ width: 76 }}>完成日期</th>
            </tr>
          </thead>
          <tbody>
            {(detail.operations ?? []).map((op) => (
              <tr key={op.id}>
                <td className="number">{op.sequence}</td>
                <td style={{ fontSize: 10 }}>
                  <div>{op.operationName}</div>
                  <div style={{ color: '#777', marginTop: 2 }}>
                    {formatOperationStage(op) ?? '未分段'}
                  </div>
                </td>
                <td style={{ fontSize: 10 }}>
                  <div>{op.equipment?.name ?? '—'}</div>
                  <div style={{ color: '#777', marginTop: 2 }}>
                    工装：{formatOperationTooling(op)}
                  </div>
                </td>
                <td style={{ fontSize: 10 }}>
                  <div>{op.dependencySummary ?? '首道/无前置'}</div>
                  <div
                    style={{
                      color: op.qualityBlockReason ? '#cf1322' : '#237804',
                      marginTop: 2,
                    }}
                  >
                    {op.qualityBlockReason ? qualityFlowLabels.blocked : qualityFlowLabels.ready}
                  </div>
                </td>
                <td className="number">{formatPieceRate(op)}</td>
                <td className="number">
                  {formatNumber(op.plannedQty ?? detail.plannedQty, {
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td />
                <td />
                <td className="print-qr-cell">
                  {renderBarcode(buildOperationQr(detail.id, op.id), { size: 44, level: 'M' })}
                </td>
                <td />
                <td />
                <td />
              </tr>
            ))}
            {/* 额外空行，便于手写补充 */}
            {Array.from({
              length: Math.max(0, 2 - (detail.operations?.length ?? 0)),
            }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
              <tr key={`empty-${i}`}>
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 质量要求 ── */}
      <div className="print-section">
        <div className="print-section-title">质量要求 / 注意事项</div>
        <div
          style={{
            border: '1px solid #d9d9d9',
            minHeight: 50,
            padding: 8,
            fontSize: 11,
          }}
        >
          {String((detail as Record<string, unknown>).description ?? '') ||
            '（无特殊要求）'}
        </div>
      </div>

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          下达人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          车间确认：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          质检确认：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          日期：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});

/**
 * 采购订单针打模板 — 针式打印机 + 连续复写纸专用。
 *
 * 与 PurchaseOrderPrint（A4）并行存在：
 * - 纯黑白、宋体、实线表格
 * - 无 Logo、无背景、无阴影
 */

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable purchase order dot matrix print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const PurchaseOrderDotMatrixPrint = React.forwardRef<
  HTMLDivElement,
  PurchaseOrderDotMatrixPrintProps
>(function PurchaseOrderDotMatrixPrint(
  { detail, paymentTermsLabelMap, unitLabelMap, maskAmount, companyName },
  ref,
) {



  const items = detail.items ?? [];
  const totalQty = items.reduce((s, i) => s + Number(i.orderedQty ?? 0), 0);
  const totalAmount = items.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const partnerName = detail.partnerNameSnapshot ?? '—';
  const contactName = detail.contactNameSnapshot ?? '—';
  const contactPhone = detail.contactPhoneSnapshot ?? '—';
  const address = detail.addressSnapshot ?? '—';
  const headerRemark = detail.remarks?.trim() || '—';
  const paymentTermsLabel = detail.paymentTerms
    ? (paymentTermsLabelMap[detail.paymentTerms] ?? detail.paymentTerms)
    : '—';

  const docDate = detail.createdAt
    ? new Date(detail.createdAt).toLocaleDateString('zh-CN')
    : new Date().toLocaleDateString('zh-CN');

  return (
    <DotMatrixLayout
      ref={ref}
      companyName={companyName || undefined}
      title="采购订单"
      docNo={detail.orderNo}
      docDate={docDate}
    >
      {/* ── 供应商信息（两列紧凑布局） ── */}
      <div className="dm-info">
        <div className="dm-info-item">
          <span className="dm-info-label">供应商：</span>
          {partnerName}
        </div>
        <div className="dm-info-item">
          <span className="dm-info-label">联系人：</span>
          {contactName}
        </div>
      </div>
      <div className="dm-info">
        <div className="dm-info-item">
          <span className="dm-info-label">电话：</span>
          {contactPhone}
        </div>
        <div className="dm-info-item">
          <span className="dm-info-label">预计到货：</span>
          {detail.expectedDate
            ? new Date(detail.expectedDate).toLocaleDateString('zh-CN')
            : '—'}
        </div>
      </div>
      <div className="dm-info">
        <div className="dm-info-item" style={{ flex: 2 }}>
          <span className="dm-info-label">地址：</span>
          {address}
        </div>
      </div>
      <div className="dm-info" style={{ marginBottom: '1mm' }}>
        <div className="dm-info-item">
          <span className="dm-info-label">付款条件：</span>
          {paymentTermsLabel}
        </div>
        <div className="dm-info-item">
          <span className="dm-info-label">采购员：</span>
          {detail.purchasingRep?.realName ??
            detail.purchasingRep?.username ??
            '—'}
        </div>
      </div>
      <div className="dm-info" style={{ marginBottom: '1mm' }}>
        <div className="dm-info-item" style={{ flex: 2 }}>
          <span className="dm-info-label">备注：</span>
          {headerRemark}
        </div>
      </div>

      {/* ── 明细表 ── */}
      <table className="dm-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>序号</th>
            <th>品名规格</th>
            <th style={{ width: '15%' }}>物料编码</th>
            <th style={{ width: '7%' }}>单位</th>
            <th style={{ width: '9%' }}>数量</th>
            <th style={{ width: '11%' }}>单价</th>
            <th style={{ width: '11%' }}>金额</th>
            <th style={{ width: '18%' }}>备注</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="center">{idx + 1}</td>
              <td>
                {item.material?.name ?? '—'}
                {item.material?.spec ? ` / ${item.material.spec}` : ''}
              </td>
              <td>{item.material?.code ?? '—'}</td>
              <td className="center">
                {formatUnitLabel(item.material?.unit, unitLabelMap) || '—'}
              </td>
              <td className="right">{item.orderedQty}</td>
              <td className="right">
                {item.unitPrice == null
                  ? '—'
                  : maskAmount(Number(item.unitPrice).toFixed(2))}
              </td>
              <td className="right">{maskAmount(Number(item.amount).toFixed(2))}</td>
              <td>{item.remarks?.trim() || '—'}</td>
            </tr>
          ))}
          {items.length < MIN_DETAIL_ROWS &&
            Array.from({ length: MIN_DETAIL_ROWS - items.length }).map(
              (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 空行填充用于固定打印行数
                <tr key={`empty-${i}`}>
                  <td className="center">{items.length + i + 1}</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ),
            )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="right">
              合计
            </td>
            <td className="right">
              {formatNumber(totalQty, { maximumFractionDigits: 4 })}
            </td>
            <td />
            <td className="right">{maskAmount(totalAmount.toFixed(2))}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      {/* ── 签字栏 ── */}
      <div className="dm-sign">
        <div className="dm-sign-item">采购方：____________</div>
        <div className="dm-sign-item">供应商：____________</div>
        <div className="dm-sign-item">日期：____________</div>
      </div>
    </DotMatrixLayout>
  );
});

/**
 * 采购订单 A4 打印模板。
 *
 * 发给供应商的采购订单，包含：供应商信息、订单明细、签字栏。
 */

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable purchase order print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const PurchaseOrderPrint = React.forwardRef<
  HTMLDivElement,
  PurchaseOrderPrintProps
>(function PurchaseOrderPrint(
  { detail, paymentTermsLabelMap, unitLabelMap, maskAmount, renderBarcode, buildDocumentQr },
  ref,
) {



  const items = detail.items ?? [];
  const totalAmount = items.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const totalQty = items.reduce((s, i) => s + Number(i.orderedQty ?? 0), 0);
  const partnerName = detail.partnerNameSnapshot ?? '—';
  const contactName = detail.contactNameSnapshot ?? '—';
  const contactPhone = detail.contactPhoneSnapshot ?? '—';
  const address = detail.addressSnapshot ?? '—';
  const headerRemark = detail.remarks?.trim() || '—';
  const paymentTermsLabel = detail.paymentTerms
    ? (paymentTermsLabelMap[detail.paymentTerms] ?? detail.paymentTerms)
    : '—';

  return (
    <PrintLayout ref={ref} title="采购订单" docNo={detail.orderNo}>
      {/* ── 基本信息 ── */}
      <div className="print-section">
        <div className="print-section-title">订单信息</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <table className="print-desc" style={{ flex: 1 }}>
            <tbody>
              <tr>
                <td className="label">订单号</td>
                <td>{detail.orderNo}</td>
                <td className="label">预计到货</td>
                <td>
                  {detail.expectedDate
                    ? new Date(detail.expectedDate).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="label">供应商</td>
                <td>{partnerName}</td>
                <td className="label">联系人</td>
                <td>{contactName}</td>
              </tr>
              <tr>
                <td className="label">联系电话</td>
                <td>{contactPhone}</td>
                <td className="label">付款条件</td>
                <td>{paymentTermsLabel}</td>
              </tr>
              <tr>
                <td className="label">供应商地址</td>
                <td colSpan={3}>{address}</td>
              </tr>
              <tr>
                <td className="label">采购员</td>
                <td>
                  {detail.purchasingRep?.realName ??
                    detail.purchasingRep?.username ??
                    '—'}
                </td>
                <td className="label">制单日期</td>
                <td>
                  {detail.createdAt
                    ? new Date(detail.createdAt).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="label">备注</td>
                <td colSpan={3}>{headerRemark}</td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 100,
            }}
          >
            {renderBarcode(buildDocumentQr('purchase_order', detail.id), { size: 88, level: 'M' })}
            <div style={{ fontSize: 9, color: '#999' }}>扫码核验</div>
          </div>
        </div>
      </div>

      {/* ── 订单明细 ── */}
      <div className="print-section">
        <div className="print-section-title">采购明细</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>序号</th>
              <th>物料名称 / 规格</th>
              <th style={{ width: 120 }}>物料编号</th>
              <th style={{ width: 60 }}>单位</th>
              <th style={{ width: 80 }}>数量</th>
              <th style={{ width: 90 }}>单价（¥）</th>
              <th style={{ width: 100 }}>金额（¥）</th>
              <th style={{ width: 170 }}>备注</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="number">{idx + 1}</td>
                <td>
                  {item.material?.name ?? '—'}
                  {item.material?.spec ? ` / ${item.material.spec}` : ''}
                </td>
                <td>{item.material?.code ?? '—'}</td>
                <td>
                  {formatUnitLabel(item.material?.unit, unitLabelMap) || '—'}
                </td>
                <td className="number">{item.orderedQty}</td>
                <td className="number">
                  {item.unitPrice == null
                    ? '—'
                    : maskAmount(Number(item.unitPrice).toFixed(2))}
                </td>
                <td className="number">
                  {maskAmount(Number(item.amount).toFixed(2))}
                </td>
                <td>{item.remarks?.trim() || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                合计
              </td>
              <td className="number" style={{ fontWeight: 600 }}>
                {formatNumber(totalQty, { maximumFractionDigits: 4 })}
              </td>
              <td />
              <td
                className="number"
                style={{ fontWeight: 600, color: '#cf1322' }}
              >
                {maskAmount(`¥${totalAmount.toFixed(2)}`)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          采购方：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          供应商：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          日期：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});

/**
 * 采购入库单 A4 打印模板。
 *
 * 仓库收货存档单据，包含：供应商信息、入库明细、签字栏。
 */

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable purchase receipt print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const PurchaseReceiptPrint = React.forwardRef<
  HTMLDivElement,
  PurchaseReceiptPrintProps
>(function PurchaseReceiptPrint(
  { detail, unitLabelMap, renderBarcode, buildDocumentQr },
  ref,
) {

  const items = detail.items ?? [];
  const totalQty = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  const partnerName = detail.partnerNameSnapshot ?? '—';
  const contactName = detail.contactNameSnapshot ?? '—';
  const contactPhone = detail.contactPhoneSnapshot ?? '—';
  const address = detail.addressSnapshot ?? '—';
  const headerRemark = detail.remarks?.trim() || '—';

  return (
    <PrintLayout ref={ref} title="采购入库单" docNo={detail.receiptNo}>
      {/* ── 基本信息 ── */}
      <div className="print-section">
        <div className="print-section-title">入库信息</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <table className="print-desc" style={{ flex: 1 }}>
            <tbody>
              <tr>
                <td className="label">采购入库单编号</td>
                <td>{detail.receiptNo}</td>
                <td className="label">采购订单</td>
                <td>{detail.purchaseOrder?.orderNo ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">供应商</td>
                <td>{partnerName}</td>
                <td className="label">联系人</td>
                <td>{contactName}</td>
              </tr>
              <tr>
                <td className="label">联系电话</td>
                <td>{contactPhone}</td>
                <td className="label">入库仓库</td>
                <td>{detail.warehouse?.name ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">供应商地址</td>
                <td colSpan={3}>{address}</td>
              </tr>
              <tr>
                <td className="label">入库日期</td>
                <td>
                  {detail.receiptDate
                    ? new Date(detail.receiptDate).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
                <td className="label">收货人</td>
                <td>
                  {detail.creator?.realName ?? detail.creator?.username ?? '—'}
                </td>
              </tr>
              <tr>
                <td className="label">备注</td>
                <td colSpan={3}>{headerRemark}</td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 100,
            }}
          >
            {renderBarcode(buildDocumentQr('purchase_receipt', detail.id), { size: 88, level: 'M' })}
            <div style={{ fontSize: 9, color: '#999' }}>扫码核验</div>
          </div>
        </div>
      </div>

      {/* ── 入库明细 ── */}
      <div className="print-section">
        <div className="print-section-title">入库明细</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>序号</th>
              <th>物料名称 / 规格</th>
              <th style={{ width: 120 }}>物料编号</th>
              <th style={{ width: 60 }}>单位</th>
              <th style={{ width: 80 }}>数量</th>
              <th style={{ width: 110 }}>批号</th>
              <th style={{ width: 160 }}>备注</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="number">{idx + 1}</td>
                <td>
                  {item.material?.name ?? '—'}
                  {item.material?.spec ? ` / ${item.material.spec}` : ''}
                </td>
                <td>{item.material?.code ?? '—'}</td>
                <td>
                  {formatUnitLabel(item.material?.unit, unitLabelMap) || '—'}
                </td>
                <td className="number">{item.quantity}</td>
                <td>{item.batchNo ?? '—'}</td>
                <td>{item.remarks?.trim() || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                合计
              </td>
              <td className="number" style={{ fontWeight: 600 }}>
                {formatNumber(totalQty, { maximumFractionDigits: 4 })}
              </td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          送货人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          验收人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          仓库主管：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          日期：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});

/**
 * 销售订单打印模板。
 *
 * 包含：客户信息、订单明细、金额合计、签字栏。
 */

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable sale order print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const SaleOrderPrint = React.forwardRef<
  HTMLDivElement,
  SaleOrderPrintProps
>(function SaleOrderPrint(
  { detail, maskAmount, paymentTermsOptions, unitLabelMap },
  ref,
) {



  const paymentTermsLabel = detail.paymentTerms
    ? (paymentTermsOptions.find((o) => o.value === detail.paymentTerms)
        ?.label ?? detail.paymentTerms)
    : null;
  const items = detail.items ?? [];
  const totalAmount = items.reduce(
    (sum, it) => sum + Number(it.quantity ?? 0) * Number(it.unitPrice ?? 0),
    0,
  );
  const partnerName = detail.partnerNameSnapshot ?? '—';
  const contactName = detail.contactNameSnapshot ?? '—';
  const contactPhone = detail.contactPhoneSnapshot ?? '—';
  const address = detail.addressSnapshot ?? '—';
  const headerRemark = detail.remarks?.trim() || '—';

  return (
    <PrintLayout ref={ref} title="销售订单" docNo={detail.orderNo}>
      {/* ── 基本信息 ── */}
      <div className="print-section">
        <div className="print-section-title">订单信息</div>
        <table className="print-desc">
          <tbody>
            <tr>
              <td className="label">订单号</td>
              <td>{detail.orderNo}</td>
              <td className="label">客户名称</td>
              <td>{partnerName}</td>
            </tr>
            <tr>
              <td className="label">联系人</td>
              <td>{contactName}</td>
              <td className="label">联系电话</td>
              <td>{contactPhone}</td>
            </tr>
            <tr>
              <td className="label">交货日期</td>
              <td>
                {detail.deliveryDate
                  ? new Date(detail.deliveryDate).toLocaleDateString('zh-CN')
                  : '—'}
              </td>
              <td className="label">下单日期</td>
              <td>{new Date(detail.createdAt).toLocaleDateString('zh-CN')}</td>
            </tr>
            <tr>
              <td className="label">业务员</td>
              <td>
                {detail.salesRep?.realName ?? detail.salesRep?.username ?? '—'}
              </td>
              <td className="label">收款条件</td>
              <td>{paymentTermsLabel ?? '—'}</td>
            </tr>
            <tr>
              <td className="label">客户地址</td>
              <td colSpan={3}>{address}</td>
            </tr>
            <tr>
              <td className="label">备注</td>
              <td colSpan={3}>{headerRemark}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 订单明细 ── */}
      <div className="print-section">
        <div className="print-section-title">订单明细</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>序号</th>
              <th>产品名称 / 规格</th>
              <th style={{ width: 120 }}>产品编号</th>
              <th style={{ width: 60 }}>单位</th>
              <th style={{ width: 80 }}>数量</th>
              <th style={{ width: 90 }}>单价（¥）</th>
              <th style={{ width: 100 }}>小计（¥）</th>
              <th style={{ width: 170 }}>备注</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="number">{idx + 1}</td>
                <td>
                  {item.customerMaterialName || item.material?.name || '—'}
                  {item.customerMaterialSpec || item.material?.spec
                    ? ` / ${item.customerMaterialSpec || item.material?.spec}`
                    : ''}
                </td>
                <td>
                  {item.customerMaterialCode || item.material?.code || '—'}
                </td>
                <td>
                  {formatUnitLabel(item.material?.unit, unitLabelMap) || '—'}
                </td>
                <td className="number">{item.quantity}</td>
                <td className="number">
                  {item.unitPrice == null
                    ? '—'
                    : maskAmount(Number(item.unitPrice).toFixed(2))}
                </td>
                <td className="number">
                  {maskAmount(Number(item.amount).toFixed(2))}
                </td>
                <td>{item.remarks?.trim() || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                合计
              </td>
              <td className="number" style={{ fontWeight: 600 }}>
                {formatNumber(
                  items.reduce((s, i) => s + Number(i.quantity ?? 0), 0),
                  { maximumFractionDigits: 4 },
                )}
              </td>
              <td />
              <td
                className="number"
                style={{ fontWeight: 600, color: '#cf1322' }}
              >
                {maskAmount(`¥${totalAmount.toFixed(2)}`)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          制单人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          审核人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          客户签章：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});

/**
 * 工单打印模板 — 生产作业单。
 *
 * 包含：基本信息、工序列表、签字栏。
 */

function getDisplayCompletedQty(
  detail: Pick<
    BusinessPrintRecord,
    'completedQty' | 'bottleneckCompletedQty'
  >,
): number {
  return Number(detail.bottleneckCompletedQty ?? detail.completedQty ?? 0);
}

function getDisplayScrappedQty(
  detail: Pick<BusinessPrintRecord, 'scrappedQty' | 'operations'>,
): number {
  const operations = detail.operations ?? [];
  if (operations.length === 0) {
    return Number(detail.scrappedQty ?? 0);
  }

  return operations
    .filter((operation) => operation.status !== 'skipped')
    .reduce((sum, operation) => sum + Number(operation.scrappedQty ?? 0), 0);
}

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Presents reusable work order print behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const WorkOrderPrint = React.forwardRef<
  HTMLDivElement,
  WorkOrderPrintProps
>(function WorkOrderPrint(
  { detail, unitLabelMap, renderBarcode, buildDocumentQr, workOrderStatusLabels, operationStatusLabels },
  ref,
) {

  const statusText = workOrderStatusLabels[detail.status] ?? '-';
  const displayCompletedQty = getDisplayCompletedQty(detail);
  const displayScrappedQty = getDisplayScrappedQty(detail);
  const progressPct = Math.min(Math.round(detail.overallProgress ?? 0), 100);
  const description =
    String((detail as Record<string, unknown>).description ?? '').trim() || '—';

  return (
    <PrintLayout
      ref={ref}
      title="生产工单"
      docNo={detail.orderNo}
      metaLines={[`状态：${statusText}`]}
    >
      {/* ── 基本信息 ── */}
      <div className="print-section">
        <div className="print-section-title">基本信息</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <table className="print-desc" style={{ flex: 1 }}>
            <tbody>
              <tr>
                <td className="label">工单号</td>
                <td>{detail.orderNo}</td>
                <td className="label">状态</td>
                <td>{statusText}</td>
              </tr>
              <tr>
                <td className="label">产品名称</td>
                <td>{detail.material?.name ?? '—'}</td>
                <td className="label">产品编码</td>
                <td>{detail.material?.code ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">规格型号</td>
                <td>{detail.material?.spec ?? '—'}</td>
                <td className="label">单位</td>
                <td>
                  {formatUnitLabel(detail.material?.unit, unitLabelMap) || '—'}
                </td>
              </tr>
              <tr>
                <td className="label">计划数量</td>
                <td>
                  {formatNumber(detail.plannedQty, {
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td className="label">完成数量</td>
                <td>
                  {formatNumber(displayCompletedQty, {
                    maximumFractionDigits: 4,
                  })}{' '}
                  ({progressPct}%)
                </td>
              </tr>
              <tr>
                <td className="label">报废数量</td>
                <td>
                  {formatNumber(displayScrappedQty, {
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td className="label">优先级</td>
                <td>{detail.priority}</td>
              </tr>
              <tr>
                <td className="label">计划开始</td>
                <td>
                  {detail.planStartTime
                    ? new Date(detail.planStartTime).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
                <td className="label">计划结束</td>
                <td>
                  {detail.planEndTime
                    ? new Date(detail.planEndTime).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="label">负责人</td>
                <td>
                  {detail.assignee?.realName ??
                    detail.assignee?.username ??
                    '—'}
                </td>
                <td className="label">客户</td>
                <td>{detail.customer?.name ?? '—'}</td>
              </tr>
              <tr>
                <td className="label">交期</td>
                <td>
                  {detail.dueDate
                    ? new Date(detail.dueDate).toLocaleDateString('zh-CN')
                    : '—'}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 100,
            }}
          >
            {renderBarcode(buildDocumentQr('work_order', detail.id), { size: 88, level: 'M' })}
            <div style={{ fontSize: 9, color: '#999' }}>扫码查看工单</div>
          </div>
        </div>
      </div>

      {/* ── 工序列表 ── */}
      {detail.operations && detail.operations.length > 0 && (
        <div className="print-section">
          <div className="print-section-title">工序列表</div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>序号</th>
                <th>工序名称</th>
                <th style={{ width: 80 }}>计划数量</th>
                <th style={{ width: 80 }}>完成数量</th>
                <th style={{ width: 80 }}>报废数量</th>
                <th style={{ width: 80 }}>状态</th>
                <th style={{ width: 100 }}>操作人</th>
              </tr>
            </thead>
            <tbody>
              {(detail.operations ?? []).map((op) => (
                <tr key={op.id}>
                  <td className="number">{op.sequence}</td>
                  <td>{op.operationName}</td>
                  <td className="number">
                    {op.plannedQty == null
                      ? '—'
                      : formatNumber(op.plannedQty, {
                          maximumFractionDigits: 4,
                        })}
                  </td>
                  <td className="number">
                    {formatNumber(op.completedQty, {
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="number">
                    {formatNumber(op.scrappedQty, { maximumFractionDigits: 4 })}
                  </td>
                  <td>{operationStatusLabels[op.status] ?? '-'}</td>
                  <td>
                    {op.assignee?.realName ?? op.assignee?.username ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 备注 ── */}
      <div className="print-section">
        <div className="print-section-title">备注</div>
        <div style={{ padding: '4px 0' }}>{description}</div>
      </div>

      {/* ── 签字栏 ── */}
      <div className="print-signatures">
        <div className="print-sign-item">
          制单人：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          车间主管：
          <span className="print-sign-line" />
        </div>
        <div className="print-sign-item">
          审核人：
          <span className="print-sign-line" />
        </div>
      </div>
    </PrintLayout>
  );
});
