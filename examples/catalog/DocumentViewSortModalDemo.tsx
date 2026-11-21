import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DocumentViewSortModal,
  type SortableDocumentView,
} from '../../src/mes';

export function DocumentViewSortModalDemo() {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SortableDocumentView[]>([
    { id: 'view-default', name: '默认视图' },
    { id: 'view-mine', name: '我的待处理' },
    { id: 'view-archived', name: '已归档' },
  ]);

  return (
    <SectionCard title="保存视图排序">
      <Space wrap>
        <Button onClick={() => setOpen(true)}>调整视图顺序</Button>
        <Typography.Text>{views.map((view) => view.name).join(' → ')}</Typography.Text>
      </Space>
      <DocumentViewSortModal
        open={open}
        views={views}
        onCancel={() => setOpen(false)}
        onSubmit={async (ids) => {
          setViews(ids.map((id) => views.find((view) => view.id === id)!).filter(Boolean));
          return true;
        }}
      />
    </SectionCard>
  );
}
