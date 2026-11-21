import { useMemo, useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DocumentViewBar,
  type DocumentViewBarController,
  type DocumentViewBarView,
} from '../../src/mes';

interface DemoView extends DocumentViewBarView {
  configVersion: number;
}

export function DocumentViewBarDemo() {
  const [activeViewId, setActiveViewId] = useState('view-all');
  const [dirty, setDirty] = useState(false);
  const [lastAction, setLastAction] = useState('尚未操作');
  const [filterOpen, setFilterOpen] = useState(false);
  const views = useMemo<DemoView[]>(
    () => [
      { id: 'view-all', name: '全部订单', isDefault: true, configVersion: 1 },
      { id: 'view-pending', name: '待处理', configVersion: 2 },
      { id: 'view-history', name: '历史采购订单', configVersion: 1 },
    ],
    [],
  );
  const controller = useMemo<DocumentViewBarController<DemoView>>(
    () => ({
      views,
      loading: false,
      activeViewId,
      dirty,
      activeFilterCount: 2,
      selectView(viewId) {
        setActiveViewId(viewId);
        setDirty(false);
        setLastAction(`切换到视图 ${viewId}`);
      },
      save() {
        setDirty(false);
        setLastAction('当前视图已保存');
        return true;
      },
      saveAs({ name }) {
        setLastAction(`已另存视图：${name}`);
        return true;
      },
      setDefault(view) {
        setLastAction(`已将 ${view.name} 设为默认`);
      },
      rename(view, name) {
        setLastAction(`已重命名 ${view.name} 为 ${name}`);
      },
      remove(view) {
        setLastAction(`已删除视图 ${view.name}`);
      },
      reorder(orderedIds) {
        setLastAction(`视图顺序：${orderedIds.join('、')}`);
      },
      discardAndSwitch() {
        setDirty(false);
        setLastAction(`已放弃修改并切换到 ${activeViewId}`);
      },
      saveAndSwitch() {
        setDirty(false);
        setLastAction('已保存并切换视图');
      },
    }),
    [activeViewId, dirty, views],
  );

  return (
    <SectionCard title="单据视图栏与筛选入口">
      <Typography.Paragraph type="secondary">
        SavedViewBar 负责视图保存、另存、重命名、默认视图、删除、排序和未保存切换；MES 适配器保持控制器方法参数与调用时序。
      </Typography.Paragraph>
      <DocumentViewBar
        controller={controller}
        onOpenFilters={() => setFilterOpen((current) => !current)}
      />
      <Space orientation="vertical" size={4}>
        <Typography.Text type="secondary" aria-live="polite">
          {lastAction}
        </Typography.Text>
        <Typography.Text type="secondary">
          筛选面板：{filterOpen ? '已打开' : '关闭'}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
