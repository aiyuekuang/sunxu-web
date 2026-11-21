import { HolderOutlined } from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, Typography } from 'antd';
import React, { type CSSProperties, useEffect, useState } from 'react';

export interface SortableDocumentView {
  id: string;
  name: string;
}

export type DocumentViewSortModalProps = {
  open: boolean;
  views: SortableDocumentView[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (ids: string[]) => Promise<boolean>;
};

function SortableViewItem({
  index,
  view,
}: {
  index: number;
  view: SortableDocumentView;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: view.id });
  const style: CSSProperties = {
    alignItems: 'center',
    background: isDragging
      ? 'var(--ant-color-bg-layout)'
      : 'var(--ant-color-bg-container)',
    border: '1px solid var(--ant-color-border-secondary)',
    borderRadius: 4,
    display: 'flex',
    gap: 8,
    minHeight: 36,
    opacity: isDragging ? 0.6 : 1,
    padding: '6px 10px',
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button
        {...listeners}
        aria-label={`拖动排序：${view.name}`}
        type="button"
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 0,
          color: 'var(--ant-color-text-tertiary)',
          cursor: 'grab',
          display: 'inline-flex',
          padding: 0,
        }}
      >
        <HolderOutlined />
      </button>
      <Typography.Text type="secondary" style={{ width: 20 }}>
        {index + 1}
      </Typography.Text>
      <Typography.Text ellipsis style={{ flex: 1, minWidth: 0 }}>
        {view.name}
      </Typography.Text>
    </div>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-view
 * @sunxu-reason Preserves pointer and keyboard drag ordering, confirmation/loading, and host-owned save semantics for MES saved views.
 */
export function DocumentViewSortModal({
  open,
  views,
  loading,
  onCancel,
  onSubmit,
}: DocumentViewSortModalProps) {
  const [orderedViews, setOrderedViews] = useState<SortableDocumentView[]>(views);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (open) setOrderedViews(views);
  }, [open, views]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setOrderedViews((current) => {
      const oldIndex = current.findIndex((view) => view.id === active.id);
      const newIndex = current.findIndex((view) => view.id === over.id);
      return oldIndex < 0 || newIndex < 0
        ? current
        : arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleSubmit = async () => {
    const saved = await onSubmit(orderedViews.map((view) => view.id));
    if (saved) onCancel();
  };

  return (
    <Modal
      cancelText="取消"
      confirmLoading={loading}
      okButtonProps={{ disabled: orderedViews.length < 2 }}
      okText="保存排序"
      open={open}
      title="排序视图"
      width={440}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
    >
      <Typography.Paragraph type="secondary">
        拖动左侧手柄调整视图栏的显示顺序。
      </Typography.Paragraph>
      <div
        style={{ display: 'grid', gap: 6, maxHeight: 360, overflowY: 'auto' }}
      >
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedViews.map((view) => view.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedViews.map((view, index) => (
              <SortableViewItem index={index} key={view.id} view={view} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </Modal>
  );
}
