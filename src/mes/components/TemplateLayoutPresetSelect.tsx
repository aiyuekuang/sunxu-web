import { ProForm } from '@ant-design/pro-components';
import { Radio } from 'antd';
import type { FormItemProps } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import type {
  TemplateLayoutPresetOption,
  TemplateLayoutThumbnail,
} from './template-print-types';

export interface TemplateLayoutPresetSelectProps {
  templateType?: string;
  options: readonly TemplateLayoutPresetOption[];
  formItemProps: Omit<FormItemProps, 'name' | 'children' | 'rules'>;
  rules?: FormItemProps['rules'];
}

const groupStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))',
  gap: 12,
  width: '100%',
};

const radioStyle: CSSProperties = {
  alignItems: 'flex-start',
  border: '1px solid var(--ant-color-border)',
  borderRadius: 8,
  display: 'flex',
  marginInlineEnd: 0,
  padding: 10,
  width: '100%',
};

const optionBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  width: '100%',
};

const optionTitleStyle: CSSProperties = {
  color: 'var(--ant-color-text)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.35,
};

const optionDescStyle: CSSProperties = {
  color: 'var(--ant-color-text-secondary)',
  fontSize: 12,
  lineHeight: 1.45,
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain print-templates
 * @sunxu-reason Shares layout preset radio cards and their SVG previews while template enums, options, labels, and field help come from the host.
 */
export function TemplateLayoutPresetSelect({
  templateType,
  options,
  formItemProps,
  rules,
}: TemplateLayoutPresetSelectProps) {
  if (!templateType || options.length === 0) {
    return null;
  }

  return (
    <ProForm.Item
      name="layoutPreset"
      {...formItemProps}
      rules={rules ?? [{ required: true, message: '请选择模板版式' }]}
    >
      <Radio.Group style={groupStyle}>
        {options.map((option) => (
          <Radio key={option.value} value={option.value} style={radioStyle}>
            <span style={optionBodyStyle}>
              <PresetThumbnail value={option.thumbnail} />
              <span style={optionTitleStyle}>{option.label}</span>
              <span style={optionDescStyle}>{option.description}</span>
            </span>
          </Radio>
        ))}
      </Radio.Group>
    </ProForm.Item>
  );
}

function PresetThumbnail({ value }: { value: TemplateLayoutThumbnail }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 160 96"
      style={{ display: 'block', width: '100%', height: 74 }}
    >
      <rect x="1" y="1" width="158" height="94" rx="8" fill="#f8fafc" />
      {renderPresetShapes(value)}
    </svg>
  );
}

function renderPresetShapes(value: TemplateLayoutThumbnail): ReactNode {
  switch (value) {
    case 'label-qr-right':
      return (
        <>
          <LabelFrame />
          <TextLines x={18} y={24} width={76} count={4} />
          <QrMark x={108} y={28} size={34} />
        </>
      );
    case 'label-qr-top':
      return (
        <>
          <LabelFrame />
          <QrMark x={64} y={14} size={32} />
          <TextLines x={24} y={56} width={112} count={3} />
        </>
      );
    case 'label-barcode-bottom':
      return (
        <>
          <LabelFrame />
          <TextLines x={20} y={20} width={120} count={3} />
          <BarcodeMark x={30} y={62} width={100} />
        </>
      );
    case 'label-text-only':
      return (
        <>
          <LabelFrame />
          <TextLines x={22} y={18} width={116} count={6} />
        </>
      );
    case 'document-compact-table':
      return (
        <>
          <DocumentFrame />
          <TextLines x={20} y={16} width={118} count={2} />
          <MiniTable x={18} y={38} width={124} rows={5} compact />
        </>
      );
    case 'document-report-summary':
      return (
        <>
          <DocumentFrame />
          <TextLines x={26} y={16} width={108} count={2} />
          <MiniTable x={20} y={36} width={120} rows={3} />
          <rect x="80" y="72" width="58" height="10" rx="2" fill="#c7d2fe" />
        </>
      );
    case 'document-header-qr-table':
      return (
        <>
          <DocumentFrame />
          <QrMark x={116} y={14} size={24} />
          <TextLines x={22} y={18} width={82} count={3} />
          <MiniTable x={20} y={48} width={120} rows={3} />
        </>
      );
    case 'continuous-three-copy':
      return (
        <>
          <ContinuousFrame y={10} />
          <ContinuousFrame y={34} />
          <ContinuousFrame y={58} />
          <TextLines x={28} y={18} width={92} count={1} />
          <TextLines x={28} y={42} width={92} count={1} />
          <TextLines x={28} y={66} width={92} count={1} />
        </>
      );
    case 'continuous-delivery-stub':
      return (
        <>
          <ContinuousFrame y={16} height={64} />
          <TextLines x={28} y={28} width={94} count={2} />
          <MiniTable x={28} y={48} width={78} rows={2} compact />
          <rect x="112" y="54" width="28" height="14" rx="2" fill="#bfdbfe" />
        </>
      );
    case 'continuous-warehouse-handover':
      return (
        <>
          <ContinuousFrame y={16} height={64} />
          <TextLines x={24} y={26} width={116} count={2} />
          <MiniTable x={24} y={48} width={116} rows={3} compact />
        </>
      );
    case 'document-standard-table':
      return (
        <>
          <DocumentFrame />
          <TextLines x={22} y={18} width={116} count={3} />
          <MiniTable x={20} y={48} width={120} rows={3} />
        </>
      );
    case 'continuous-compact-single':
      return (
        <>
          <ContinuousFrame y={16} height={64} />
          <TextLines x={22} y={18} width={116} count={3} />
          <MiniTable x={20} y={48} width={120} rows={3} />
        </>
      );
  }
}

function LabelFrame() {
  return (
    <rect
      x="13"
      y="14"
      width="134"
      height="68"
      rx="6"
      fill="#fff"
      stroke="#94a3b8"
    />
  );
}

function DocumentFrame() {
  return (
    <rect
      x="14"
      y="8"
      width="132"
      height="80"
      rx="4"
      fill="#fff"
      stroke="#94a3b8"
    />
  );
}

function ContinuousFrame({ y, height = 20 }: { y: number; height?: number }) {
  return (
    <>
      <rect
        x="14"
        y={y}
        width="132"
        height={height}
        rx="3"
        fill="#fff"
        stroke="#94a3b8"
      />
      <circle cx="20" cy={y + height / 2} r="2" fill="#cbd5e1" />
      <circle cx="140" cy={y + height / 2} r="2" fill="#cbd5e1" />
    </>
  );
}

function TextLines({
  x,
  y,
  width,
  count,
}: {
  x: number;
  y: number;
  width: number;
  count: number;
}) {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].slice(0, count).map((lineNo) => (
        <rect
          key={`${x}-${y}-${lineNo}`}
          x={x}
          y={y + lineNo * 8}
          width={lineNo % 2 === 0 ? width : Math.round(width * 0.72)}
          height="3"
          rx="1.5"
          fill="#64748b"
          opacity={lineNo === 0 ? 0.95 : 0.55}
        />
      ))}
    </>
  );
}

function MiniTable({
  x,
  y,
  width,
  rows,
  compact = false,
}: {
  x: number;
  y: number;
  width: number;
  rows: number;
  compact?: boolean;
}) {
  const rowHeight = compact ? 6 : 8;
  const height = rowHeight * rows;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#fff"
        stroke="#475569"
      />
      {[1, 2, 3, 4, 5].slice(0, rows - 1).map((rowNo) => (
        <line
          key={`row-${x}-${y}-${rowNo}`}
          x1={x}
          y1={y + rowHeight * rowNo}
          x2={x + width}
          y2={y + rowHeight * rowNo}
          stroke="#cbd5e1"
        />
      ))}
      {[0.36, 0.68].map((ratio) => (
        <line
          key={`col-${x}-${y}-${ratio}`}
          x1={x + width * ratio}
          y1={y}
          x2={x + width * ratio}
          y2={y + height}
          stroke="#cbd5e1"
        />
      ))}
      <rect x={x} y={y} width={width} height={rowHeight} fill="#e2e8f0" />
    </>
  );
}

function QrMark({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <>
      <rect x={x} y={y} width={size} height={size} rx="2" fill="#111827" />
      <rect
        x={x + size * 0.18}
        y={y + size * 0.18}
        width={size * 0.22}
        height={size * 0.22}
        fill="#fff"
      />
      <rect
        x={x + size * 0.6}
        y={y + size * 0.18}
        width={size * 0.22}
        height={size * 0.22}
        fill="#fff"
      />
      <rect
        x={x + size * 0.18}
        y={y + size * 0.6}
        width={size * 0.22}
        height={size * 0.22}
        fill="#fff"
      />
      <rect
        x={x + size * 0.56}
        y={y + size * 0.56}
        width={size * 0.12}
        height={size * 0.12}
        fill="#fff"
      />
    </>
  );
}

function BarcodeMark({ x, y, width }: { x: number; y: number; width: number }) {
  const bars = [3, 1, 2, 5, 1, 4, 2, 1, 3, 2, 5, 1, 2, 4];
  let offset = x;
  return (
    <>
      {bars.map((barWidth) => {
        const currentX = offset;
        offset += barWidth + 2;
        return (
          <rect
            key={`bar-${currentX}`}
            x={currentX}
            y={y}
            width={barWidth}
            height="18"
            fill="#111827"
          />
        );
      })}
      <rect x={x} y={y + 22} width={width} height="3" rx="1.5" fill="#94a3b8" />
    </>
  );
}
