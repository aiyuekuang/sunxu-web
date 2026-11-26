import {
  Alert,
  Empty,
  Spin,
  Tag,
  theme,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import dayjs from 'dayjs';
import {
  GanttBar,
  GanttContextMenu,
  GanttInspector,
  GanttToolbar,
  UnscheduledPanel,
} from './ProductionSchedulePlanningWidgets';
import { GanttHeatmapCell, GanttNowLine } from './ScheduleGanttWidgets';
import { CapacityBar } from './ProductionSchedulePlanningWidgets';
import type { ProductionScheduleGanttViewProps, ScheduleEntryRecord } from './production-schedule-workflows-types';

/**
 * @sunxu-layer business
 * @sunxu-domain production-schedule
 * @sunxu-reason Hosts the schedule timeline layout while query, permission, date math, bar presentation, drag persistence, and record actions remain injected.
 */
export function ProductionScheduleGanttView({
  state,
  onStateChange,
  refreshKey,
  focusDate,
  onAnalysisQueryChange,
  getWindowAnchoredAt,
  loading,
  error,
  rows,
  productionDayWarnings = 0,
  cells,
  cellWidth,
  timelineWidth,
  resourcePanelWidth = 200,
  timelineStart,
  timelineEnd,
  showCapacity = true,
  capacityPlacement = 'top',
  unscheduledPlacement = 'top',
  selectEntryOnContextMenu = true,
  capacityData,
  heatMax = 0,
  selectedEntryId,
  canUpdate,
  onSelectEntry,
  onEditEntry,
  onRefresh,
  onExport,
  exporting = false,
  onDropWorkOrder,
  getBarPresentation,
  getTooltipModel,
  getInspectorModel,
  getContextMenuItems,
  onContextAction,
  onInspectorAction,
  capacityCapabilities,
  heatmapCapabilities,
  toolbarCapabilities,
  unscheduledCapabilities,
  onDragStart,
  onDragCommit,
  onInteractionWarning,
  getDatePosition,
  getDateAtPosition,
  getDroppedWorkOrderId,
  restoreContextMenuFocus,
  labels = {
    empty: '暂无排产数据',
    resourcePanel: state.groupBy === 'work_center' ? '工作中心/委外' : '设备/委外',
    orderCount: (count) => `${count}单`,
    laneCount: (count) => `${count}层`,
  },
}: ProductionScheduleGanttViewProps) {
  const { token } = theme.useToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const resourceScrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [context, setContext] = useState<{ entry: ScheduleEntryRecord; x: number; y: number } | null>(null);
  const dragRef = useRef<{
    entry: ScheduleEntryRecord;
    kind: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    startY: number;
    originalLeft: number;
    originalWidth: number;
    originalDisplayWidth: number;
    displayMinWidth: number;
    currentLeft: number;
    currentWidth: number;
    targetWorkCenterId?: string | null;
    targetEquipmentId?: string | null;
    targetRowId?: string;
    targetType?: string;
    targetHasChildren?: boolean;
  } | null>(null);
  const lastFocusDate = useRef<string | null>(null);
  const isHeatmap = state.zoom === 'month';
  const rowHeights = useMemo(() => rows.map((row) => state.zoom === 'month' ? Math.max(row.height ?? 0, 64) : Math.max(row.height ?? 0, Math.max(1, row.laneCount) * ((row.barHeight ?? 52) + (row.barGap ?? 4)) + (row.barGap ?? 4), 82)), [rows, state.zoom]);
  const rowTops = useMemo(() => rowHeights.map((_, index) => rowHeights.slice(0, index).reduce((sum, value) => sum + value, 0)), [rowHeights]);
  const bodyHeight = rowHeights.reduce((sum, height) => sum + height, 0);
  const majorCells = useMemo(() => {
    const groups: Array<{ key: string; label: string; span: number; today: boolean }> = [];
    for (const cell of cells) {
      const date = dayjs(cell.date);
      const key = state.zoom === 'hour' ? date.format('YYYY-MM-DD') : date.format('YYYY-MM');
      const label = state.zoom === 'hour' ? `${date.format('M月D日')} 周${['日', '一', '二', '三', '四', '五', '六'][date.day()]}` : date.format('YYYY年M月');
      const last = groups[groups.length - 1];
      if (last?.key === key) last.span += 1;
      else groups.push({ key, label, span: 1, today: !!cell.isToday });
    }
    return groups;
  }, [cells, state.zoom]);
  const selectedEntry = rows.flatMap((row) => row.bars).find((bar) => bar.entry.id === selectedEntryId)?.entry;
  useEffect(() => {
    if (!focusDate || lastFocusDate.current === focusDate || !getWindowAnchoredAt) return;
    lastFocusDate.current = focusDate;
    onStateChange(getWindowAnchoredAt(focusDate, state.zoom));
  }, [focusDate, getWindowAnchoredAt, onStateChange, state.zoom]);
  useEffect(() => {
    const workCenterId = [...state.drillPath].reverse().find((item) => item.id)?.id;
    onAnalysisQueryChange?.({ startDate: state.startDate, endDate: state.endDate, zoom: state.zoom, workCenterId, workCenterType: state.workCenterType, customerId: state.customerId, keyword: state.keyword, statusFilter: state.statusFilter });
  }, [onAnalysisQueryChange, state.customerId, state.drillPath, state.endDate, state.keyword, state.startDate, state.statusFilter, state.workCenterType, state.zoom]);
  const onBarContextMenu = (event: MouseEvent, entry: ScheduleEntryRecord) => {
    event.preventDefault();
    onSelectEntry(selectEntryOnContextMenu ? entry : null);
    setContext({ entry, x: event.clientX, y: event.clientY });
  };
  const handleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await containerRef.current?.requestFullscreen();
    setFullscreen(!!document.fullscreenElement);
  };
  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);
  const handleScroll = () => {
    if (bodyScrollRef.current) {
      if (resourceScrollRef.current) resourceScrollRef.current.scrollTop = bodyScrollRef.current.scrollTop;
      if (headerScrollRef.current) headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  };
  const beginDrag = (event: MouseEvent, entry: ScheduleEntryRecord, kind: 'move' | 'resize-left' | 'resize-right', left: number, actualWidth: number, displayWidth: number, displayMinWidth: number) => {
    event.preventDefault();
    event.stopPropagation();
    onDragStart(event, entry, kind, left, actualWidth, displayWidth, displayMinWidth);
    dragRef.current = { entry, kind, startX: event.clientX, startY: event.clientY, originalLeft: left, originalWidth: actualWidth, originalDisplayWidth: displayWidth, displayMinWidth, currentLeft: left, currentWidth: actualWidth, targetWorkCenterId: entry.workCenterId ?? null, targetEquipmentId: entry.equipmentId ?? null };
  };
  useEffect(() => {
    const move = (event: globalThis.MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || Math.max(Math.abs(event.clientX - drag.startX), Math.abs(event.clientY - drag.startY)) < 4) return;
      const deltaX = event.clientX - drag.startX;
      let left = drag.originalLeft;
      let width = drag.originalWidth;
      if (drag.kind === 'move') left += deltaX;
      if (drag.kind === 'resize-left') { left += deltaX; width -= deltaX; }
      if (drag.kind === 'resize-right') width += deltaX;
      if (width < 2) return;
      drag.currentLeft = left;
      drag.currentWidth = width;
      if (drag.kind === 'move' && bodyScrollRef.current) {
        const rect = bodyScrollRef.current.getBoundingClientRect();
        const y = event.clientY - rect.top + bodyScrollRef.current.scrollTop;
        const targetIndex = rowTops.findIndex((top, index) => y >= top && y < top + rowHeights[index]);
        if (targetIndex >= 0) {
          const target = rows[targetIndex].workCenter;
          drag.targetRowId = target.id;
          drag.targetType = target.type;
          drag.targetHasChildren = target.hasChildren;
          const unassigned = target.id === 'unassigned';
          drag.targetWorkCenterId = target.workCenterId ?? (target.type === 'work_center' && !unassigned ? target.id : null);
          drag.targetEquipmentId = target.equipmentId ?? (target.type === 'equipment' && !unassigned ? target.id : null);
        } else {
          drag.targetType = undefined;
          drag.targetHasChildren = undefined;
          drag.targetRowId = undefined;
          drag.targetWorkCenterId = drag.entry.workCenterId ?? null;
          drag.targetEquipmentId = drag.entry.equipmentId ?? null;
        }
      }
      const element = document.querySelector(`[data-entry-id="${drag.entry.id}"]`) as HTMLElement | null;
      if (element) {
        element.style.left = `${left}px`;
        element.style.width = `${drag.kind === 'move' ? drag.originalDisplayWidth : Math.max(width, drag.displayMinWidth)}px`;
        element.style.setProperty('--gantt-actual-width', `${width}px`);
        element.style.opacity = '0.8';
        element.style.zIndex = '100';
      }
    };
    const end = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const element = document.querySelector(`[data-entry-id="${drag.entry.id}"]`) as HTMLElement | null;
      if (element) {
        element.style.left = `${drag.originalLeft}px`;
        element.style.width = `${drag.originalDisplayWidth}px`;
        element.style.setProperty('--gantt-actual-width', `${drag.originalWidth}px`);
        element.style.opacity = '';
        element.style.zIndex = '';
      }
      const timeChanged = Math.abs(drag.currentLeft - drag.originalLeft) >= 4 || Math.abs(drag.currentWidth - drag.originalWidth) >= 4;
      const workCenterChanged = (drag.targetWorkCenterId ?? null) !== (drag.entry.workCenterId ?? null);
      const equipmentChanged = (drag.targetEquipmentId ?? null) !== (drag.entry.equipmentId ?? null);
      const resourceChanged = workCenterChanged || equipmentChanged;
      const mayKeepUnassignedDevice = state.groupBy === 'equipment' && drag.targetType === 'equipment';
      if (drag.targetType === 'outsourcing') {
        onInteractionWarning('outsourcing-row');
        onRefresh();
        return;
      }
      if (drag.targetRowId === 'unassigned' && !mayKeepUnassignedDevice && drag.kind === 'move') {
        onInteractionWarning('unassigned-row');
        onRefresh();
        return;
      }
      if (drag.targetHasChildren) {
        onInteractionWarning('non-leaf-work-center');
        onRefresh();
        return;
      }
      if (drag.targetType === 'work_center' && drag.targetWorkCenterId == null) {
        onInteractionWarning('unassigned-row');
        onRefresh();
        return;
      }
      if (!timeChanged && !resourceChanged) return;
      const plannedStart = getDateAtPosition(drag.currentLeft);
      const plannedEnd = getDateAtPosition(drag.currentLeft + drag.currentWidth);
      const start = dayjs(plannedStart);
      const end = dayjs(plannedEnd);
      if (!start.isValid() || !end.isValid() || (drag.kind !== 'move' && !end.isAfter(start))) {
        onInteractionWarning('invalid-time-range');
        onRefresh();
        return;
      }
      const changes: Parameters<typeof onDragCommit>[0]['changes'] = {};
      if (drag.kind === 'move') changes.plannedStart = start.toISOString();
      if (drag.kind === 'resize-left') {
        changes.plannedStart = start.toISOString();
        changes.plannedEnd = end.toISOString();
      }
      if (drag.kind === 'resize-right') changes.plannedEnd = end.toISOString();
      if (workCenterChanged && drag.targetWorkCenterId) changes.workCenterId = drag.targetWorkCenterId;
      if (equipmentChanged) {
        if (drag.targetEquipmentId) changes.equipmentId = drag.targetEquipmentId;
        else changes.clearEquipment = true;
      }
      void onDragCommit({ entry: drag.entry, kind: drag.kind, changes, timeChanged, resourceChanged });
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end); };
  }, [getDateAtPosition, onDragCommit, onInteractionWarning, onRefresh, rowHeights, rowTops, rows, state.groupBy]);
  const handleDrop = (event: React.DragEvent<HTMLDivElement>, rowIndex: number) => {
    event.preventDefault();
    if (!canUpdate) return;
    const row = rows[rowIndex];
    if (!row || !onDropWorkOrder) return;
    if (row.workCenter.type === 'outsourcing') { onInteractionWarning('outsourcing-row'); return; }
    if (row.workCenter.id === 'unassigned') { onInteractionWarning('unassigned-row'); return; }
    if (row.workCenter.hasChildren) { onInteractionWarning('non-leaf-work-center'); return; }
    const workOrderId = getDroppedWorkOrderId(event.dataTransfer);
    if (!workOrderId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left + event.currentTarget.scrollLeft;
    const plannedStart = getDateAtPosition(x);
    // Host supplies the transfer contract and zoom/date conversion because production-day rules are business-specific.
    onDropWorkOrder(workOrderId, { rowId: row.workCenter.id, rowType: row.workCenter.type, workCenterId: row.workCenter.workCenterId ?? (row.workCenter.type === 'work_center' ? row.workCenter.id : null), equipmentId: row.workCenter.equipmentId ?? (row.workCenter.type === 'equipment' ? row.workCenter.id : null) }, plannedStart);
  };

  return (
    <div
      ref={containerRef}
      style={{ height: fullscreen ? '100vh' : '100%', minHeight: 400, display: 'flex', flexDirection: 'column', background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, overflow: 'hidden' }}
    >
      <div style={{ padding: '0 12px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <GanttToolbar
          state={state}
          onStateChange={onStateChange}
          onRefresh={onRefresh}
          isFullscreen={fullscreen}
          onToggleFullscreen={() => void handleFullscreen()}
          showUnscheduled={showUnscheduled}
          onToggleUnscheduled={() => setShowUnscheduled((visible) => !visible)}
          onExport={onExport}
          exporting={exporting}
          capabilities={toolbarCapabilities}
        />
      </div>
      {error && <Alert type="error" showIcon style={{ margin: 12 }} message={error} />}
      {!loading && productionDayWarnings > 0 && <Alert type="warning" showIcon style={{ margin: 12 }} message={`${productionDayWarnings} 条排产未命中班次日历，按所选日期内的计划时间保留显示。请在条目提示中核对生产日归属。`} />}
      {showCapacity && capacityPlacement === 'top' && <CapacityBar data={capacityData ?? null} loading={loading && !rows.length} resourcePanelWidth={resourcePanelWidth} timelineWidth={timelineWidth} dayPixelWidth={cellWidth} capabilities={capacityCapabilities} />}
      {showUnscheduled && unscheduledPlacement === 'top' && <div style={{ maxHeight: 260, overflow: 'auto', borderBottom: `1px solid ${token.colorBorderSecondary}` }}><UnscheduledPanel refreshKey={refreshKey} capabilities={unscheduledCapabilities} /></div>}
      {loading && !rows.length ? <div style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><Spin size="large" /></div> : null}
      {!loading && rows.length === 0 ? <div style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><Empty description={labels.empty} /></div> : null}
      {rows.length > 0 && (
        <div style={{ display: 'flex', minHeight: 0, flex: 1, position: 'relative' }}>
          <aside style={{ width: resourcePanelWidth, minWidth: resourcePanelWidth, borderRight: `1px solid ${token.colorBorderSecondary}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, display: 'grid', placeItems: 'center', fontWeight: 600, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>{labels.resourcePanel}</div>
            <div ref={resourceScrollRef} style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ height: bodyHeight, position: 'relative' }}>{rows.map((row, index) => {
                const outsourcing = row.workCenter.type === 'outsourcing';
                const unassigned = row.workCenter.id === 'unassigned';
                const selected = row.bars.some((bar) => bar.entry.id === selectedEntryId);
                return <div key={row.workCenter.id} title={outsourcing ? '委外工序：展示委外计划时长，不占用内部设备产能' : unassigned ? '这些排产条目尚未分配工作中心' : row.workCenter.hasChildren ? '点击下钻查看子级' : undefined} onClick={() => { if (!unassigned && !outsourcing && row.workCenter.hasChildren) onStateChange({ drillPath: [...state.drillPath, { id: row.workCenter.id, name: row.workCenter.name }] }); }} style={{ position: 'absolute', top: rowTops[index], left: 0, right: 0, height: rowHeights[index], display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', cursor: row.workCenter.hasChildren ? 'pointer' : 'default', background: selected ? token.colorPrimaryBg : index % 2 ? token.colorFillQuaternary : token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}` }}><Typography.Text ellipsis style={{ flex: 1 }}>{row.workCenter.name}</Typography.Text>{row.bars.length > 0 && <Tag>{labels.orderCount(row.bars.length)}</Tag>}{row.laneCount >= 3 && !isHeatmap && <Tag color="warning">{labels.laneCount(row.laneCount)}</Tag>}</div>;
              })}</div>
            </div>
          </aside>
          <section style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div ref={headerScrollRef} style={{ overflow: 'hidden', flexShrink: 0 }}><div style={{ width: timelineWidth, height: 48, display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${token.colorBorderSecondary}` }}><div style={{ height: 20, display: 'flex', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>{majorCells.map((cell) => <div key={cell.key} style={{ width: cell.span * cellWidth, flex: `0 0 ${cell.span * cellWidth}px`, textAlign: 'center', paddingTop: 3, borderRight: `1px solid ${token.colorBorderSecondary}`, color: cell.today ? token.colorPrimary : token.colorTextSecondary, fontSize: 11 }}>{cell.label}</div>)}</div><div style={{ height: 28, display: 'flex' }}>{cells.map((cell) => <div key={cell.date} title={cell.date} style={{ width: cellWidth, flex: `0 0 ${cellWidth}px`, textAlign: 'center', paddingTop: 4, background: cell.isWeekend ? token.colorFillQuaternary : cell.isToday ? token.colorPrimaryBg : undefined, borderRight: `1px solid ${token.colorBorderSecondary}`, fontSize: 12 }}>{cell.label}</div>)}</div></div></div>
            <div ref={bodyScrollRef} onScroll={handleScroll} style={{ overflow: 'auto', flex: 1, position: 'relative' }}>
              <div style={{ width: timelineWidth, height: bodyHeight, position: 'relative' }}>
                {!isHeatmap && cells.map((cell, index) => <div key={`grid-${cell.date}`} aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: index * cellWidth, width: 1, background: token.colorBorderSecondary, pointerEvents: 'none' }} />)}
                {rows.map((row, rowIndex) => <div key={`drop-${row.workCenter.id}`} onDragOver={(event) => { if (canUpdate) event.preventDefault(); }} onDrop={(event) => handleDrop(event, rowIndex)} style={{ position: 'absolute', top: rowTops[rowIndex], left: 0, right: 0, height: rowHeights[rowIndex], borderBottom: `1px solid ${token.colorBorderSecondary}`, background: rowIndex % 2 ? token.colorFillQuaternary : undefined }} />)}
                {isHeatmap ? rows.map((row, rowIndex) => (row.heatmap ?? []).map((cell, cellIndex) => <div key={`${row.workCenter.id}-${cell.weekStartMs}`} style={{ position: 'absolute', left: cellIndex * cellWidth, top: rowTops[rowIndex], zIndex: 1 }}><GanttHeatmapCell cell={cell} width={cellWidth} height={rowHeights[rowIndex]} heatMax={heatMax} onClick={() => onStateChange({ startDate: cell.weekStart, endDate: dayjs(cell.weekStart).add(6, 'day').format('YYYY-MM-DD'), zoom: 'day' })} capabilities={heatmapCapabilities} /></div>)) : rows.map((row, rowIndex) => row.bars.map((bar) => <div key={`${row.workCenter.id}-${bar.id}`} style={{ position: 'absolute', left: 0, top: rowTops[rowIndex], zIndex: bar.entry.id === selectedEntryId ? 4 : 2 }}><GanttBar layout={bar} presentation={getBarPresentation(bar.entry)} selected={bar.entry.id === selectedEntryId} dimmed={!!selectedEntryId && bar.entry.id !== selectedEntryId} densityMetrics={{ barHeight: row.barHeight ?? 52, barGap: row.barGap ?? 4, rowHeight: rowHeights[rowIndex] }} tooltipDisabled={!!selectedEntryId || context?.entry.id === bar.entry.id} tooltipModel={getTooltipModel(bar.entry)} capabilities={{ onDragStart: (event, entry, kind, left, actual, display, min) => { if (canUpdate) beginDrag(event, entry, kind, left, actual, display, min); }, onSelect: onSelectEntry, onDoubleClick: canUpdate ? onEditEntry : undefined, onContextMenu: onBarContextMenu }} /></div>))}
                <GanttNowLine timelineStart={timelineStart} timelineEnd={timelineEnd} height={bodyHeight} getPosition={(now) => getDatePosition(now)} />
              </div>
            </div>
          </section>
          {showUnscheduled && unscheduledPlacement === 'side' && <div style={{ width: 280, minWidth: 280, flexShrink: 0, maxHeight: '100%', overflow: 'auto', borderLeft: `1px solid ${token.colorBorderSecondary}` }}><UnscheduledPanel refreshKey={refreshKey} capabilities={unscheduledCapabilities} /></div>}
          {selectedEntry && <div style={{ width: 330, minWidth: 330, borderLeft: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto' }}><GanttInspector entry={selectedEntry} model={getInspectorModel(selectedEntry)} onClose={() => onSelectEntry(null)} capabilities={{ onAction: onInspectorAction }} /></div>}
          <GanttContextMenu visible={!!context} x={context?.x ?? 0} y={context?.y ?? 0} entry={context?.entry ?? null} items={context ? getContextMenuItems(context.entry) : []} onClose={() => setContext(null)} capabilities={{ menuLabel: '排产记录操作', onAction: (entry, key) => { onContextAction(entry, key); setContext(null); }, restoreFocus: restoreContextMenuFocus }} />
        </div>
      )}
      {showCapacity && capacityPlacement === 'bottom' && !isHeatmap && !loading && rows.length > 0 && <CapacityBar data={capacityData ?? null} loading={false} resourcePanelWidth={resourcePanelWidth} timelineWidth={timelineWidth} dayPixelWidth={cellWidth} capabilities={capacityCapabilities} />}
    </div>
  );
}
