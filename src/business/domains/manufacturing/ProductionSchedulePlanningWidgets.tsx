import {
  ClockCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  DragOutlined,
  FilterOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Input,
  Popover,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { KeyboardEvent, MouseEvent } from 'react';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type {
  CapacityBarProps,
  GanttBarCapabilities,
  GanttBarLayout,
  GanttBarPresentation,
  GanttContextMenuProps,
  GanttDensityMetrics,
  GanttDragKind,
  GanttInspectorProps,
  GanttToolbarProps,
  GanttTooltipProps,
  UnscheduledPanelProps,
  UnscheduledWorkOrder,
} from './production-schedule-planning-types';
import { ListKeywordSearch } from '../../../components/ListKeywordSearch';
import './production-schedule-planning.css';

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Renders the schedule capacity summary while timeline coordinates, aggregation, palette, and unit formatting stay host-owned.
 */
export const CapacityBar = memo(function CapacityBar({
  data,
  loading = false,
  resourcePanelWidth,
  timelineWidth,
  dayPixelWidth,
  capabilities,
}: CapacityBarProps) {
  const { token } = theme.useToken();
  if (loading) {
    return (
      <div className="sxw-capacity-loading">
        <Spin size="small" />
      </div>
    );
  }
  if (!data?.length) return null;

  const barHeight = 32;
  const maxBarHeight = 24;
  const { labels } = capabilities;

  return (
    <div className="sxw-capacity-bar">
      <div
        className="sxw-capacity-label"
        style={{
          width: resourcePanelWidth,
          minWidth: resourcePanelWidth,
          color: token.colorTextTertiary,
        }}
      >
        {labels.summaryTitle}
      </div>
      <div
        className="sxw-capacity-timeline"
        style={{ width: timelineWidth, height: barHeight }}
      >
        {data.map((point) => {
          const rate = Math.min(
            point.occupiedUtilizationRate,
            capabilities.maximumDisplayRate,
          );
          const noCapacityWithLoad =
            point.totalMinutes === 0 &&
            (point.scheduledMinutes > 0 || point.occupiedMinutes > 0);
          const color = capabilities.getCapacityColor(
            noCapacityWithLoad
              ? capabilities.warningThreshold + 0.01
              : point.occupiedUtilizationRate,
          );
          const height = Math.max(
            (rate / capabilities.maximumDisplayRate) * maxBarHeight,
            2,
          );

          return (
            <Tooltip
              key={point.date}
              title={
                <div>
                  <div>{labels.tooltipTitle(point.date)}</div>
                  <div>
                    {labels.availableCapacity}：
                    {capabilities.formatDuration(point.totalMinutes)}
                  </div>
                  <div>
                    {labels.plannedLoad}：
                    {capabilities.formatDuration(point.scheduledMinutes)}（
                    {formatPercent(point.utilizationRate)}）
                  </div>
                  <div>
                    {labels.actualOccupancy}：
                    {capabilities.formatDuration(point.occupiedMinutes)}（
                    {formatPercent(point.occupiedUtilizationRate)}）
                  </div>
                  {noCapacityWithLoad && (
                    <div>{labels.noCapacityRisk}</div>
                  )}
                  <div className="sxw-capacity-note">
                    {labels.equipmentLaneNote}
                  </div>
                  <div>
                    {labels.equipmentSnapshot}：
                    {point.availableEquipmentCount}/{point.totalEquipmentCount}
                    {point.unavailableEquipmentCount > 0
                      ? labels.unavailableSuffix(
                          point.unavailableEquipmentCount,
                        )
                      : ''}
                  </div>
                  <div>
                    {labels.effectiveConcurrency}：
                    {point.effectiveConcurrency}/
                    {point.configuredConcurrency}
                  </div>
                </div>
              }
            >
              <div
                className="sxw-capacity-column"
                style={{
                  left: capabilities.getDatePosition(point.date),
                  bottom: 4,
                  width: Math.max(dayPixelWidth - 2, 4),
                  height,
                  backgroundColor: color,
                }}
              />
            </Tooltip>
          );
        })}
        <div
          className="sxw-capacity-threshold"
          style={{
            bottom:
              4 +
              (capabilities.warningThreshold /
                capabilities.maximumDisplayRate) *
                maxBarHeight,
            borderColor: token.colorWarning,
          }}
        />
      </div>
    </div>
  );
});

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Reuses the schedule hover/focus detail popover while its records and localized values come from the host.
 */
export const GanttTooltip = memo(function GanttTooltip({
  model,
  children,
  disabled = false,
}: GanttTooltipProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <Popover
      content={
        <Descriptions
          column={1}
          size="small"
          labelStyle={{ color: 'var(--ant-color-text-tertiary)', whiteSpace: 'nowrap' }}
          contentStyle={{ fontWeight: 500 }}
          style={{ width: model.kind === 'buffer' ? 220 : 260 }}
        >
          {model.rows.map((row) => (
            <Descriptions.Item key={row.key} label={row.label}>
              {row.value}
            </Descriptions.Item>
          ))}
        </Descriptions>
      }
      title={null}
      placement="right"
      trigger={['hover', 'focus']}
      mouseEnterDelay={0.3}
      destroyOnHidden
      open={disabled ? false : open}
      onOpenChange={(nextOpen) => setOpen(disabled ? false : nextOpen)}
      styles={{
        root: { maxWidth: 'calc(100vw - 32px)' },
        container: {
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        },
      }}
    >
      {children}
    </Popover>
  );
});

function getBarBorderColor(
  presentation: GanttBarPresentation,
  selected: boolean,
) {
  if (presentation.hasDependencyConflict || presentation.hasDependencyWarning) {
    return presentation.borderColor;
  }
  return selected ? presentation.execution.color : presentation.borderColor;
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Shows compact schedule bars and delegates time geometry, eligibility, dictionaries, drag handling, and record actions to the host.
 */
export function GanttBar<TEntry>({
  layout,
  presentation,
  densityMetrics,
  selected = false,
  dimmed = false,
  showProgress = true,
  tooltipDisabled = false,
  tooltipModel,
  capabilities,
}: {
  layout: GanttBarLayout<TEntry>;
  presentation: GanttBarPresentation;
  densityMetrics?: GanttDensityMetrics;
  selected?: boolean;
  dimmed?: boolean;
  showProgress?: boolean;
  tooltipDisabled?: boolean;
  tooltipModel: GanttTooltipProps['model'];
  capabilities: GanttBarCapabilities<TEntry>;
}) {
  const { token } = theme.useToken();
  const { entry, left, width, actualWidth, displayMinWidth, lane, label } = layout;
  const { onDragStart, onSelect, onDoubleClick, onContextMenu } = capabilities;
  const barHeight = densityMetrics?.barHeight ?? 52;
  const barGap = densityMetrics?.barGap ?? 4;
  const top = lane * (barHeight + barGap) + barGap;
  const isCompact = barHeight <= 30;
  const isDenseRow = barHeight <= 22;
  const canShowMetaLine = barHeight >= 36;
  const titleFontSize = barHeight <= 22 ? 10 : isCompact ? 11 : 12;
  const titleLineHeight = barHeight <= 22 ? '12px' : isCompact ? '14px' : '16px';
  const secondaryLineHeight = canShowMetaLine ? '14px' : '13px';
  const durationBarHeight = isDenseRow ? 6 : 10;
  const durationBarBottom = isDenseRow ? 4 : 6;
  const barPadding = isDenseRow ? 8 : 10;
  const trackInset = presentation.isBuffer ? 0 : barPadding;
  const actualTrackWidth = presentation.isBuffer
    ? Math.max(Math.min(actualWidth, width), 1)
    : Math.max(Math.min(actualWidth, width) - barPadding * 2, 6);
  const setupWidth = Math.min(actualWidth, width) * presentation.setupFraction;
  const showPrimaryText = presentation.isBuffer
    ? width >= 56
    : selected
      ? width >= 64
      : width >= 72;
  const showSecondaryText = canShowMetaLine && width >= 144;
  const showTimeLabel =
    canShowMetaLine &&
    presentation.secondaryLabel !== presentation.timeRangeLabel &&
    (selected ? width >= 288 : width >= 328);
  const showStatusChip = !presentation.isBuffer && canShowMetaLine && width >= 360;
  const showOutsourcingChip =
    !presentation.isBuffer && presentation.isOutsourced && showPrimaryText && width >= 96;
  const showOrderNo =
    !presentation.isBuffer &&
    Boolean(presentation.durationOrderLabel) &&
    width >= (selected ? 84 : 96);
  const compactProductLabel = presentation.compactPrimaryLabel;
  const denseLabel = isDenseRow
    ? presentation.isBuffer
      ? `${compactProductLabel} ${presentation.bufferSuffix}`
      : compactProductLabel
    : label;
  const borderColor = getBarBorderColor(presentation, selected);
  const borderStyle = presentation.hasDependencyConflict || presentation.hasDependencyWarning
    ? 'solid'
    : presentation.borderStyle;
  const hoverShadow = `0 8px 18px ${presentation.execution.color}20`;
  const selectedShadow = `0 0 0 2px ${presentation.execution.color}18, 0 10px 24px ${presentation.execution.color}26`;
  const baseShadow = '0 2px 6px rgba(15, 23, 42, 0.08)';

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || !presentation.canMove) return;
      onSelect(entry);
      onDragStart(
        event,
        entry,
        'move',
        left,
        actualWidth,
        width,
        displayMinWidth,
      );
    },
    [
      actualWidth,
      displayMinWidth,
      entry,
      left,
      onDragStart,
      onSelect,
      presentation.canMove,
      width,
    ],
  );

  const handleResize = useCallback(
    (event: MouseEvent<HTMLSpanElement>, kind: GanttDragKind) => {
      event.stopPropagation();
      if (event.button !== 0 || !presentation.canResize) return;
      onSelect(entry);
      onDragStart(
        event,
        entry,
        kind,
        left,
        actualWidth,
        width,
        displayMinWidth,
      );
    },
    [
      actualWidth,
      displayMinWidth,
      entry,
      left,
      onDragStart,
      onSelect,
      presentation.canResize,
      width,
    ],
  );

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onContextMenu?.(event, entry);
    },
    [entry, onContextMenu],
  );

  return (
    <GanttTooltip model={tooltipModel} disabled={tooltipDisabled}>
      <button
        type="button"
        className="sxw-gantt-bar"
        data-entry-id={layout.id}
        aria-label={presentation.ariaLabel}
        title={tooltipDisabled ? undefined : presentation.title}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(entry);
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={presentation.canEdit ? () => onDoubleClick?.(entry) : undefined}
        onContextMenu={handleContextMenu}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(entry);
          }
        }}
        onMouseEnter={(event) => {
          if (!selected && !presentation.isBuffer) {
            event.currentTarget.style.boxShadow = hoverShadow;
          }
        }}
        onMouseLeave={(event) => {
          if (!presentation.isBuffer) {
            event.currentTarget.style.boxShadow = selected
              ? selectedShadow
              : baseShadow;
          }
        }}
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height: barHeight,
          borderRadius: isCompact ? 8 : 10,
          backgroundColor: presentation.isBuffer
            ? 'transparent'
            : presentation.isOutsourced
              ? presentation.outsourcingBackgroundColor
              : presentation.barBackgroundColor,
          border: presentation.isBuffer ? 'none' : `1px ${borderStyle} ${borderColor}`,
          cursor: presentation.canMove ? 'grab' : 'pointer',
          overflow: presentation.isBuffer ? 'visible' : 'hidden',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          transition: 'box-shadow 0.15s, opacity 0.15s',
          padding: 0,
          appearance: 'none',
          WebkitAppearance: 'none',
          textAlign: 'left',
          boxShadow: presentation.isBuffer
            ? 'none'
            : selected
              ? selectedShadow
              : presentation.hasDependencyConflict
                ? `0 0 0 2px ${token.colorError}28, 0 6px 16px ${token.colorError}22`
                : presentation.hasDependencyWarning
                  ? `0 0 0 2px ${token.colorWarning}24, 0 6px 16px ${token.colorWarning}1f`
                  : presentation.isCritical
                    ? presentation.criticalShadow
                    : baseShadow,
          opacity: dimmed ? 0.44 : 1,
        }}
      >
        {setupWidth > 0 && (
          <span
            aria-hidden="true"
            className="sxw-gantt-setup-track"
            style={{
              width: setupWidth,
              background: presentation.setupBackground,
              borderColor: presentation.setupBorderColor,
            }}
          />
        )}
        <span
          aria-hidden="true"
          className="sxw-gantt-duration-track"
          style={{
            left: trackInset,
            bottom: durationBarBottom,
            width: `var(--gantt-actual-width, ${actualTrackWidth}px)`,
            height: durationBarHeight,
            boxShadow:
              !presentation.isBuffer && presentation.isCritical
                ? '0 0 0 1px rgba(212,160,23,0.35)'
                : 'none',
          }}
        >
          <span
            className="sxw-gantt-track-fill"
            style={{ backgroundColor: presentation.actualTrackColor }}
          />
          {showProgress && presentation.progressPercent > 0 && !presentation.isBuffer && (
            <span
              className="sxw-gantt-track-progress"
              style={{
                width: `${Math.min(presentation.progressPercent, 100)}%`,
                backgroundColor: presentation.actualProgressColor,
              }}
            />
          )}
        </span>
        {showOrderNo && (
          <span
            className="sxw-gantt-order-no"
            style={{
              left: barPadding,
              bottom: Math.max(0, durationBarBottom - 1),
              maxWidth: Math.max(width - barPadding * 2, 0),
              height: durationBarHeight + 2,
              color: selected ? token.colorText : token.colorTextSecondary,
            }}
          >
            {presentation.durationOrderLabel}
          </span>
        )}
        {!presentation.isBuffer && (
          <span
            className="sxw-gantt-bar-content"
            style={{
              paddingLeft: barPadding,
              paddingRight: barPadding,
              paddingTop: isDenseRow ? 4 : 6,
              paddingBottom: durationBarHeight + durationBarBottom + (isDenseRow ? 4 : 6),
              gap: canShowMetaLine ? 2 : 0,
            }}
          >
            {showPrimaryText && (
              <span className="sxw-gantt-primary-row">
                {showOutsourcingChip && (
                  <span
                    className="sxw-gantt-outsource-chip"
                    style={{
                      color: presentation.outsourcingColor,
                      backgroundColor: presentation.outsourcingBackgroundColor,
                    }}
                  >
                    {presentation.outsourcingLabel}
                  </span>
                )}
                <span className="sxw-gantt-primary-text" style={{ fontSize: titleFontSize, lineHeight: titleLineHeight }}>
                  {denseLabel}
                </span>
                {showStatusChip && (
                  <span
                    className="sxw-gantt-status-chip"
                    style={{ color: presentation.scheduleStatus.color, backgroundColor: `${presentation.scheduleStatus.color}14` }}
                  >
                    {presentation.scheduleStatus.label}
                  </span>
                )}
                {(presentation.hasDependencyConflict || presentation.hasDependencyWarning) && width >= 112 && (
                  <span
                    className="sxw-gantt-dependency-chip"
                    style={{
                      color: presentation.hasDependencyConflict ? token.colorError : token.colorWarning,
                      backgroundColor: presentation.hasDependencyConflict ? token.colorErrorBg : token.colorWarningBg,
                    }}
                  >
                    {presentation.dependencyBadgeLabel}
                  </span>
                )}
              </span>
            )}
            {showSecondaryText && (
              <span className="sxw-gantt-secondary-row">
                <span className="sxw-gantt-secondary-text">
                  {width >= 156 ? presentation.secondaryLabel : presentation.compactSecondaryLabel}
                </span>
                {showTimeLabel && (
                  <span className="sxw-gantt-time-text" style={{ lineHeight: secondaryLineHeight }}>
                    {presentation.timeRangeLabel}
                  </span>
                )}
              </span>
            )}
          </span>
        )}
        {presentation.canResize && selected && (
          <>
            <span
              aria-hidden="true"
              className="sxw-gantt-resize-handle is-start"
              onMouseDown={(event) => handleResize(event, 'resize-left')}
            />
            <span
              aria-hidden="true"
              className="sxw-gantt-resize-handle is-end"
              onMouseDown={(event) => handleResize(event, 'resize-right')}
            />
          </>
        )}
      </button>
    </GanttTooltip>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Keeps the source point-anchored action menu while permissions, action availability, labels, and route outcomes are supplied by the host.
 */
export function GanttContextMenu<TEntry>({
  visible,
  x,
  y,
  entry,
  items,
  onClose,
  capabilities,
}: GanttContextMenuProps<TEntry>) {
  const { token } = theme.useToken();
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ left: x, top: y });
  const enabledIndexes = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((index) => index >= 0);

  useLayoutEffect(() => {
    if (!visible || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    setPosition({
      left: Math.max(0, Math.min(x, window.innerWidth - rect.width)),
      top: Math.max(0, Math.min(y, window.innerHeight - rect.height)),
    });
  }, [visible, x, y, items.length]);

  useEffect(() => {
    if (!visible) return;
    const firstIndex = enabledIndexes[0];
    if (firstIndex === undefined) return;
    setActiveIndex(firstIndex);
    itemRefs.current[firstIndex]?.focus({ preventScroll: true });
  }, [visible, enabledIndexes.join(',')]);

  useEffect(() => {
    if (!visible) return;
    const handleOutsidePointer = (event: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const handleOutsideFocus = (event: FocusEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleOutsidePointer);
    document.addEventListener('focusin', handleOutsideFocus);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
      document.removeEventListener('focusin', handleOutsideFocus);
    };
  }, [onClose, visible]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      capabilities.restoreFocus();
      return;
    }
    if (!enabledIndexes.length) return;
    let nextIndex = activeIndex;
    if (event.key === 'ArrowDown') {
      const current = enabledIndexes.indexOf(activeIndex);
      nextIndex = enabledIndexes[(current + 1 + enabledIndexes.length) % enabledIndexes.length];
    } else if (event.key === 'ArrowUp') {
      const current = enabledIndexes.indexOf(activeIndex);
      nextIndex = enabledIndexes[(current - 1 + enabledIndexes.length) % enabledIndexes.length];
    } else if (event.key === 'Home') {
      nextIndex = enabledIndexes[0];
    } else if (event.key === 'End') {
      nextIndex = enabledIndexes[enabledIndexes.length - 1];
    } else {
      return;
    }
    event.preventDefault();
    setActiveIndex(nextIndex);
    itemRefs.current[nextIndex]?.focus({ preventScroll: true });
  };

  if (!visible || !entry || items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="sxw-gantt-context-menu"
      role="menu"
      aria-label={capabilities.menuLabel}
      onKeyDown={handleMenuKeyDown}
      style={{
        left: position.left,
        top: position.top,
        backgroundColor: token.colorBgContainer,
        color: token.colorText,
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          type="button"
          role="menuitem"
          tabIndex={activeIndex === index && !item.disabled ? 0 : -1}
          disabled={item.disabled}
          aria-disabled={item.disabled || undefined}
          className={item.danger ? 'is-danger' : undefined}
          onFocus={() => setActiveIndex(index)}
          onClick={() => {
            capabilities.onAction(entry, item.key);
            onClose();
          }}
        >
          {item.icon ? <span className="sxw-gantt-menu-icon">{item.icon}</span> : null}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function InspectorItem({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  const { token } = theme.useToken();
  return (
    <div className="sxw-gantt-inspector-item">
      <span style={{ color: token.colorTextTertiary }}>{label}</span>
      <span style={{ color: token.colorText }}>{value ?? '-'}</span>
    </div>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Renders the source selected-entry inspector sections and fixed action area; host supplies formatted business values and permitted actions.
 */
export function GanttInspector<TEntry>({
  entry,
  model,
  onClose,
  capabilities,
}: GanttInspectorProps<TEntry>) {
  const renderAction = (action: GanttInspectorProps<TEntry>['model']['footerActions'][number]) => (
    <Button
      key={action.key}
      block
      type={action.type ?? 'default'}
      danger={action.danger}
      disabled={action.disabled}
      loading={action.loading}
      icon={action.icon}
      onClick={() => capabilities.onAction(entry, action.key)}
    >
      {action.label}
    </Button>
  );

  return (
    <aside className="sxw-gantt-inspector">
      <div className="sxw-gantt-inspector-header">
        <div className="sxw-gantt-inspector-heading">
          <div className="sxw-gantt-inspector-kicker">{model.kicker}</div>
          <div className="sxw-gantt-inspector-title">{model.title}</div>
        </div>
        <Button
          aria-label={model.labels.close}
          icon={<CloseOutlined />}
          onClick={onClose}
          size="small"
          type="text"
        />
      </div>

      <div className="sxw-gantt-inspector-body">
        <div className="sxw-gantt-inspector-hero">
          <div className="sxw-gantt-inspector-hero-copy">
            <div className="sxw-gantt-inspector-main">{model.heroTitle}</div>
            {model.heroSubtitle ? (
              <div className="sxw-gantt-inspector-sub">{model.heroSubtitle}</div>
            ) : null}
          </div>
          <Tag color={model.status.color} className="sxw-gantt-inspector-tag">
            {model.status.label}
          </Tag>
        </div>

        {model.sections.map((section, index) => (
          <React.Fragment key={section.key}>
            {index > 0 ? <Divider className="sxw-gantt-inspector-divider" /> : null}
            <section className="sxw-gantt-inspector-section">
              <div className="sxw-gantt-inspector-section-title">
                {section.icon}
                <span>{section.title}</span>
              </div>
              {section.fields.map((field) => (
                <InspectorItem key={field.key} label={field.label} value={field.value} />
              ))}
            </section>
          </React.Fragment>
        ))}

        {model.dependency ? (
          <>
            <Divider className="sxw-gantt-inspector-divider" />
            <section className="sxw-gantt-inspector-section">
              <div className="sxw-gantt-inspector-section-title">
                <span>{model.dependency.title}</span>
              </div>
              {model.dependency.fields.map((field) => (
                <InspectorItem key={field.key} label={field.label} value={field.value} />
              ))}
              {model.dependency.guidance ? (
                <Alert
                  type={model.dependency.guidance.type}
                  showIcon
                  message={model.dependency.guidance.title}
                  description={model.dependency.guidance.description}
                  className="sxw-gantt-inspector-guidance"
                  action={
                    model.dependency.guidance.actions?.length ? (
                      <Space orientation="vertical" size={8}>
                        {model.dependency.guidance.actions.map(renderAction)}
                      </Space>
                    ) : undefined
                  }
                />
              ) : null}
            </section>
          </>
        ) : null}
      </div>

      <div className="sxw-gantt-inspector-footer">
        {model.footerActions.map(renderAction)}
      </div>
    </aside>
  );
}

function hasActiveGanttFilters(state: GanttToolbarProps['state']) {
  return Boolean(
    state.workCenterType ||
      state.statusFilter?.length ||
      state.customerId ||
      state.keyword,
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Presents schedule range, grouping, filters, refresh/export and fullscreen controls while dictionaries and time-window rules stay in the host.
 */
export function GanttToolbar({
  state,
  onStateChange,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
  showUnscheduled,
  onToggleUnscheduled,
  onExport,
  exporting = false,
  capabilities,
}: GanttToolbarProps) {
  const { token } = theme.useToken();
  const [showFilters, setShowFilters] = useState(false);
  const filtersActive = hasActiveGanttFilters(state);
  const labels = capabilities.labels;
  const dateRange = capabilities.formatDateRange(state.startDate, state.endDate);

  useEffect(() => {
    if (filtersActive) setShowFilters(true);
  }, [filtersActive]);

  const navigateDate = (direction: -1 | 1) => {
    onStateChange(capabilities.shiftDateWindow(state, direction));
  };
  const goToToday = () => onStateChange(capabilities.getTodayWindow(state.zoom));
  const handleZoomChange = (zoom: string | number) => {
    const nextZoom = String(zoom);
    onStateChange({ zoom: nextZoom, ...capabilities.getZoomWindow(nextZoom) });
  };
  const clearFilters = () => {
    onStateChange({
      workCenterType: undefined,
      statusFilter: undefined,
      customerId: undefined,
      keyword: undefined,
    });
  };

  return (
    <div className="sxw-gantt-toolbar">
      <div className="sxw-gantt-toolbar-main">
        <Space size="small" wrap>
          {state.drillPath.length > 1 ? (
            <Breadcrumb
              items={state.drillPath.map((pathItem, index) => ({
                title:
                  index < state.drillPath.length - 1 ? (
                    <Button
                      type="link"
                      size="small"
                      onClick={() =>
                        onStateChange({ drillPath: state.drillPath.slice(0, index + 1) })
                      }
                    >
                      {pathItem.name}
                    </Button>
                  ) : (
                    pathItem.name
                  ),
              }))}
              className="sxw-gantt-breadcrumb"
            />
          ) : null}
          <Space.Compact>
            <Tooltip title={labels.previousPeriod}>
              <Button
                aria-label={labels.previousPeriod}
                icon={<LeftOutlined />}
                onClick={() => navigateDate(-1)}
              />
            </Tooltip>
            <Button
              aria-label={labels.dateRangeTitle}
              title={labels.dateRangeTitle}
              className="sxw-gantt-date-range"
              disabled
            >
              {labels.productionDate(dateRange)}
            </Button>
            <Tooltip title={labels.nextPeriod}>
              <Button
                aria-label={labels.nextPeriod}
                icon={<RightOutlined />}
                onClick={() => navigateDate(1)}
              />
            </Tooltip>
          </Space.Compact>
          <Button onClick={goToToday}>{labels.today}</Button>
        </Space>

        <Space size={8} wrap className="sxw-gantt-toolbar-controls">
          <Segmented
            size="small"
            value={state.zoom}
            options={[...capabilities.zoomOptions]}
            onChange={handleZoomChange}
          />
          <Segmented
            size="small"
            value={state.groupBy}
            options={[...capabilities.groupByOptions]}
            onChange={(value) => onStateChange({ groupBy: String(value) })}
          />
          <span
            aria-hidden="true"
            className="sxw-gantt-toolbar-separator"
            style={{ backgroundColor: token.colorBorderSecondary }}
          />
          <Tooltip title={labels.filters}>
            <Button
              aria-label={labels.filters}
              aria-expanded={showFilters}
              size="small"
              icon={<FilterOutlined />}
              type={filtersActive ? 'primary' : 'text'}
              ghost={filtersActive}
              onClick={() => setShowFilters((current) => !current)}
            />
          </Tooltip>
          <Tooltip title={labels.refresh}>
            <Button
              aria-label={labels.refresh}
              size="small"
              icon={<ReloadOutlined />}
              type="text"
              onClick={onRefresh}
            />
          </Tooltip>
          <Tooltip title={labels.exportTitle}>
            <Button
              aria-label={labels.export}
              size="small"
              icon={<DownloadOutlined />}
              type="text"
              loading={exporting}
              onClick={onExport}
            />
          </Tooltip>
          <Tooltip title={isFullscreen ? labels.exitFullscreen : labels.fullscreen}>
            <Button
              aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
              size="small"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              type="text"
              onClick={onToggleFullscreen}
            />
          </Tooltip>
          <span
            aria-hidden="true"
            className="sxw-gantt-toolbar-separator"
            style={{ backgroundColor: token.colorBorderSecondary }}
          />
          <Button
            size="small"
            type={showUnscheduled ? 'primary' : 'default'}
            ghost={showUnscheduled}
            icon={<UnorderedListOutlined />}
            aria-pressed={showUnscheduled}
            onClick={onToggleUnscheduled}
          >
            {showUnscheduled ? labels.unscheduledSelected : labels.unscheduled}
          </Button>
        </Space>
      </div>

      {showFilters ? (
        <div
          className="sxw-gantt-filter-row"
          style={{
            backgroundColor: token.colorFillQuaternary,
            borderRadius: token.borderRadiusSM,
          }}
        >
          <span className="sxw-gantt-filter-caption">{labels.filters}</span>
          <Select
            size="small"
            placeholder={labels.workCenterType}
            aria-label={labels.workCenterType}
            allowClear
            loading={capabilities.workCenterTypeLoading}
            options={[...capabilities.workCenterTypeOptions]}
            value={state.workCenterType}
            onChange={(value) => onStateChange({ workCenterType: value })}
            className="sxw-gantt-filter-select"
            variant="filled"
          />
          <Select
            size="small"
            mode="multiple"
            placeholder={labels.statusFilter}
            aria-label={labels.statusFilter}
            allowClear
            maxTagCount={2}
            value={state.statusFilter}
            onChange={(value) =>
              onStateChange({ statusFilter: value.length ? value : undefined })
            }
            className="sxw-gantt-filter-select is-status"
            options={[...capabilities.statusOptions]}
            variant="filled"
          />
          <Select
            size="small"
            allowClear
            showSearch
            placeholder={labels.customer}
            aria-label={labels.customer}
            value={state.customerId}
            onChange={(value) => onStateChange({ customerId: value })}
            options={[...capabilities.customerOptions]}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            className="sxw-gantt-filter-select is-customer"
            variant="filled"
          />
          <Input
            size="small"
            aria-label={labels.keywordPlaceholder}
            placeholder={labels.keywordPlaceholder}
            allowClear
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            value={state.keyword}
            onChange={(event) =>
              onStateChange({ keyword: event.target.value || undefined })
            }
            className="sxw-gantt-keyword"
            variant="filled"
          />
          {filtersActive ? (
            <Button size="small" type="link" onClick={clearFilters}>
              {labels.clearFilters}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Displays unscheduled work orders with source search, debounce, loading and empty states; host owns query, unit formatting, drag payload, and click-to-schedule.
 */
export const UnscheduledPanel = memo(function UnscheduledPanel({
  refreshKey,
  capabilities,
}: UnscheduledPanelProps) {
  const { token } = theme.useToken();
  const [workOrders, setWorkOrders] = useState<UnscheduledWorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedKeyword(value), 300);
  }, []);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    capabilities
      .loadWorkOrders({
        keyword: debouncedKeyword || undefined,
        page: 1,
        pageSize: 100,
      })
      .then((next) => {
        if (active) setWorkOrders(next);
      })
      .catch((error: unknown) => {
        if (active) {
          capabilities.reportLoadError(error);
          setWorkOrders([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [capabilities, debouncedKeyword, refreshKey]);

  return (
    <Card
      title={
        <Space>
          <DragOutlined />
          <span>{capabilities.labels.title}</span>
          <Tag>{workOrders.length}</Tag>
        </Space>
      }
      size="small"
      className="sxw-unscheduled-panel"
      styles={{ body: { padding: 8 } }}
    >
      <div style={{ marginBottom: 8 }}>
        <ListKeywordSearch
          ariaLabel={capabilities.labels.searchPlaceholder}
          placeholder={capabilities.labels.searchPlaceholder}
          size="small"
          value={keyword}
          onChange={(event) => handleKeywordChange(event.target.value)}
          onSearch={(value) => {
            clearTimeout(debounceTimer.current);
            setDebouncedKeyword(value);
          }}
        />
      </div>
      {loading ? (
        <div className="sxw-unscheduled-loading">
          <Spin size="small" />
        </div>
      ) : workOrders.length === 0 ? (
        <Empty
          description={capabilities.labels.empty}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="sxw-unscheduled-list">
          {workOrders.map((workOrder) => {
            const sourceHint = [
              workOrder.customer?.name,
              workOrder.sourceOrderNo ?? undefined,
              workOrder.planNo ?? undefined,
            ]
              .filter((value): value is string => Boolean(value))
              .join(' · ');
            const identityHint = [
              workOrder.customerMaterialCode,
              workOrder.customerMaterialName,
              workOrder.customerMaterialSpec,
            ]
              .filter((value): value is string => Boolean(value))
              .join(' · ');

            return (
              <div
                key={workOrder.id}
                className="sxw-unscheduled-work-order"
                draggable
                onDragStart={(event) =>
                  capabilities.beginScheduleDrag(workOrder, event)
                }
              >
                <div className="sxw-unscheduled-heading">
                  <Typography.Text strong style={{ fontSize: 12 }}>
                    {workOrder.orderNo}
                  </Typography.Text>
                  <DragOutlined
                    aria-hidden="true"
                    className="sxw-unscheduled-grip"
                  />
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                  {workOrder.material?.name ?? '-'}
                </Typography.Text>
                {sourceHint ? (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                    {sourceHint}
                  </Typography.Text>
                ) : null}
                {identityHint ? (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                    {identityHint}
                  </Typography.Text>
                ) : null}
                {workOrder.sourceRemark ? (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                    {capabilities.labels.sourceRemark}：{workOrder.sourceRemark}
                  </Typography.Text>
                ) : null}
                <div className="sxw-unscheduled-footer">
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {workOrder.plannedQty}{' '}
                    {capabilities.formatUnit(workOrder.material?.unit)}
                  </Typography.Text>
                  {workOrder.planEndTime ? (
                    <Space size={2}>
                      <ClockCircleOutlined
                        style={{ fontSize: 10, color: token.colorTextTertiary }}
                      />
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {capabilities.formatDueDate(workOrder.planEndTime)}
                      </Typography.Text>
                    </Space>
                  ) : null}
                </div>
                {capabilities.activateWorkOrder ? (
                  <Button
                    type="link"
                    size="small"
                    className="sxw-unscheduled-schedule-action"
                    onClick={() => capabilities.activateWorkOrder?.(workOrder)}
                  >
                    {capabilities.labels.scheduleAction}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
});
