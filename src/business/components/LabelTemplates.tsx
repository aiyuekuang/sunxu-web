import React, { type ReactNode } from 'react';
import { formatUnitLabel } from '../utils/qty-unit';
import { LabelLayout } from './LabelLayout';

export type LabelBarcodeRenderer = (
  value: string,
  options: { size: number; level: 'M' },
) => ReactNode;

type BaseLabelProps<T> = {
  items: T[];
  renderBarcode: LabelBarcodeRenderer;
};

function formatLabelNumber(value?: number | string | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(number)) return '-';
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves the MES material label fields and code/barcode source. */
export interface MaterialLabelItem {
  code: string;
  name: string;
  spec?: string | null;
  unit?: string | null;
  barcode?: string | null;
}

export interface MaterialLabelProps extends BaseLabelProps<MaterialLabelItem> {
  unitLabelMap?: Record<string, string>;
}

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves material label content and its barcode identity fallback. */
export const MaterialLabel = React.forwardRef<HTMLDivElement, MaterialLabelProps>(
  function MaterialLabel({ items, renderBarcode, unitLabelMap }, ref) {
    return (
      <LabelLayout ref={ref}>
        {items.map((item) => (
          <div className="label-item" key={item.code}>
            <div className="label-title">{item.name}</div>
            <hr className="label-divider" />
            <div className="label-body">
              <div className="label-info">
                <div className="label-row"><span className="label-field">编码</span><span className="label-value">{item.code}</span></div>
                {item.spec && <div className="label-row"><span className="label-field">规格</span><span className="label-value">{item.spec}</span></div>}
                <div className="label-row"><span className="label-field">单位</span><span className="label-value">{formatUnitLabel(item.unit, unitLabelMap)}</span></div>
              </div>
              <div className="label-barcode">{renderBarcode(item.barcode || item.code, { size: 48, level: 'M' })}</div>
            </div>
          </div>
        ))}
      </LabelLayout>
    );
  },
);

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves batch traceability fields and batch-number barcode. */
export interface BatchLabelItem {
  batchNo: string;
  materialName?: string;
  supplierName?: string;
  productionDate?: string;
  expiryDate?: string;
}

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves batch traceability fields and barcode content. */
export const BatchLabel = React.forwardRef<HTMLDivElement, BaseLabelProps<BatchLabelItem>>(
  function BatchLabel({ items, renderBarcode }, ref) {
    return (
      <LabelLayout ref={ref}>
        {items.map((item) => (
          <div className="label-item" key={item.batchNo}>
            <div className="label-title">{item.batchNo}</div><hr className="label-divider" />
            <div className="label-body"><div className="label-info">
              {item.materialName && <div className="label-row"><span className="label-field">物料</span><span className="label-value">{item.materialName}</span></div>}
              {item.supplierName && <div className="label-row"><span className="label-field">供应商</span><span className="label-value">{item.supplierName}</span></div>}
              {item.productionDate && <div className="label-row"><span className="label-field">生产日期</span><span className="label-value">{item.productionDate}</span></div>}
              {item.expiryDate && <div className="label-row"><span className="label-field">有效期</span><span className="label-value">{item.expiryDate}</span></div>}
            </div><div className="label-barcode">{renderBarcode(item.batchNo, { size: 48, level: 'M' })}</div></div>
          </div>
        ))}
      </LabelLayout>
    );
  },
);

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves equipment identity fields and equipment-code barcode. */
export interface EquipmentLabelItem {
  code: string;
  name: string;
  model?: string;
  workCenterName?: string;
}

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves equipment identity fields and barcode content. */
export const EquipmentLabel = React.forwardRef<HTMLDivElement, BaseLabelProps<EquipmentLabelItem>>(
  function EquipmentLabel({ items, renderBarcode }, ref) {
    return (
      <LabelLayout ref={ref}>
        {items.map((item) => (
          <div className="label-item" key={item.code}>
            <div className="label-title">{item.name}</div><hr className="label-divider" />
            <div className="label-body"><div className="label-info">
              <div className="label-row"><span className="label-field">编码</span><span className="label-value">{item.code}</span></div>
              {item.model && <div className="label-row"><span className="label-field">型号</span><span className="label-value">{item.model}</span></div>}
              {item.workCenterName && <div className="label-row"><span className="label-field">工作中心</span><span className="label-value">{item.workCenterName}</span></div>}
            </div><div className="label-barcode">{renderBarcode(item.code, { size: 48, level: 'M' })}</div></div>
          </div>
        ))}
      </LabelLayout>
    );
  },
);

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves package, material, batch, quantity and warehouse label data. */
export interface PackageUnitLabelItem {
  id: string;
  packageNo: string;
  materialName?: string;
  materialCode?: string;
  batchNo?: string | null;
  totalQty?: number;
  unit?: string;
  warehouseName?: string;
  packageTypeLabel?: string;
}

export interface PackageUnitLabelProps extends BaseLabelProps<PackageUnitLabelItem> {
  unitLabelMap?: Record<string, string>;
}

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves package, material, batch, quantity, and warehouse label fields. */
export const PackageUnitLabel = React.forwardRef<HTMLDivElement, PackageUnitLabelProps>(
  function PackageUnitLabel({ items, renderBarcode, unitLabelMap }, ref) {
    return (
      <LabelLayout ref={ref}>
        {items.map((item) => (
          <div className="label-item" key={item.id}>
            <div className="label-title">{item.packageNo}</div><hr className="label-divider" />
            <div className="label-body"><div className="label-info">
              {item.materialName && <div className="label-row"><span className="label-field">产品</span><span className="label-value">{item.materialName}</span></div>}
              {item.materialCode && <div className="label-row"><span className="label-field">编码</span><span className="label-value">{item.materialCode}</span></div>}
              {item.batchNo && <div className="label-row"><span className="label-field">批次</span><span className="label-value">{item.batchNo}</span></div>}
              {item.totalQty != null && <div className="label-row"><span className="label-field">数量</span><span className="label-value">{formatLabelNumber(item.totalQty)}{item.unit ? ` ${formatUnitLabel(item.unit, unitLabelMap)}` : ''}</span></div>}
              {item.packageTypeLabel && <div className="label-row"><span className="label-field">包装</span><span className="label-value">{item.packageTypeLabel}</span></div>}
              {item.warehouseName && <div className="label-row"><span className="label-field">仓库</span><span className="label-value">{item.warehouseName}</span></div>}
            </div><div className="label-barcode">{renderBarcode(item.packageNo, { size: 48, level: 'M' })}</div></div>
          </div>
        ))}
      </LabelLayout>
    );
  },
);

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves tooling identity, model fields and tooling-code barcode. */
export interface ToolingLabelItem {
  toolingCode: string;
  name: string;
  spec?: string;
  type?: string;
}

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves tooling identity, model fields, and barcode content. */
export const ToolingLabel = React.forwardRef<HTMLDivElement, BaseLabelProps<ToolingLabelItem>>(
  function ToolingLabel({ items, renderBarcode }, ref) {
    return (
      <LabelLayout ref={ref}>
        {items.map((item) => (
          <div className="label-item" key={item.toolingCode}>
            <div className="label-title">{item.name}</div><hr className="label-divider" />
            <div className="label-body"><div className="label-info">
              <div className="label-row"><span className="label-field">编码</span><span className="label-value">{item.toolingCode}</span></div>
              {item.type && <div className="label-row"><span className="label-field">类型</span><span className="label-value">{item.type}</span></div>}
              {item.spec && <div className="label-row"><span className="label-field">规格</span><span className="label-value">{item.spec}</span></div>}
            </div><div className="label-barcode">{renderBarcode(item.toolingCode, { size: 48, level: 'M' })}</div></div>
          </div>
        ))}
      </LabelLayout>
    );
  },
);

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves work-order identity and lets the MES host retain its internal document QR encoding. */
export interface WorkOrderLabelItem {
  id: string;
  orderNo: string;
  materialName?: string;
  materialCode?: string;
  plannedQty?: number;
  unit?: string;
}

export interface WorkOrderLabelProps extends BaseLabelProps<WorkOrderLabelItem> {
  unitLabelMap?: Record<string, string>;
  buildQrValue: (documentType: 'work_order', id: string) => string;
}

/** @sunxu-layer business @sunxu-domain label @sunxu-reason Preserves work-order identity while the host supplies the internal QR encoding. */
export const WorkOrderLabel = React.forwardRef<HTMLDivElement, WorkOrderLabelProps>(
  function WorkOrderLabel({ items, renderBarcode, unitLabelMap, buildQrValue }, ref) {
    return (
      <LabelLayout ref={ref}>
        {items.map((item) => (
          <div className="label-item" key={item.id}>
            <div className="label-title">{item.orderNo}</div><hr className="label-divider" />
            <div className="label-body"><div className="label-info">
              {item.materialName && <div className="label-row"><span className="label-field">产品</span><span className="label-value">{item.materialName}</span></div>}
              {item.materialCode && <div className="label-row"><span className="label-field">编码</span><span className="label-value">{item.materialCode}</span></div>}
              {item.plannedQty != null && <div className="label-row"><span className="label-field">数量</span><span className="label-value">{formatLabelNumber(item.plannedQty)}{item.unit ? ` ${formatUnitLabel(item.unit, unitLabelMap)}` : ''}</span></div>}
            </div><div className="label-barcode">{renderBarcode(buildQrValue('work_order', item.id), { size: 48, level: 'M' })}</div></div>
          </div>
        ))}
      </LabelLayout>
    );
  },
);
