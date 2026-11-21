import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BomVersionHistoryDrawer,
  type BomVersionHistoryRecord,
} from '../../src/mes';

interface DemoBomVersion extends BomVersionHistoryRecord {
  isDefault: boolean;
}

const initialVersions: DemoBomVersion[] = [
  {
    id: 'bom-v3',
    version: 'V3',
    status: 'active',
    changeRemark: '替换轴承供应商，更新装配工时。',
    updatedAt: '2026-11-20T08:30:00+08:00',
    isDefault: true,
  },
  {
    id: 'bom-v2',
    version: 'V2',
    status: 'obsolete',
    changeRemark: '调整壳体规格。',
    updatedAt: '2026-10-15T14:20:00+08:00',
    isDefault: false,
  },
  {
    id: 'bom-v4-draft',
    version: 'V4',
    status: 'draft',
    changeRemark: '待评审：优化紧固件用量。',
    updatedAt: '2026-11-21T09:00:00+08:00',
    isDefault: false,
  },
];

export function BomVersionHistoryDrawerDemo() {
  const [open, setOpen] = useState(false);
  const [versions] = useState(initialVersions);
  const [selected, setSelected] = useState('bom-v3');
  const [lastAction, setLastAction] = useState('当前选中 V3');

  return (
    <SectionCard title="BOM 版本记录">
      <Typography.Paragraph type="secondary">
        版本记录支持点击行或版本号切换；状态文案、权限和操作由 MES 宿主提供。
      </Typography.Paragraph>
      <Space>
        <Button type="primary" onClick={() => setOpen(true)}>
          查看版本记录
        </Button>
        <Typography.Text aria-live="polite" type="secondary">
          {lastAction}
        </Typography.Text>
      </Space>
      <BomVersionHistoryDrawer<DemoBomVersion>
        open={open}
        master={{ name: '电机组件 A', versions }}
        selectedBomId={selected}
        onOpenChange={setOpen}
        onSelectVersion={(version) => {
          setSelected(version.id);
          setLastAction(`已选择 ${version.version}`);
        }}
        getActionItems={(version) => [
          {
            key: 'set-default',
            label: version.isDefault ? '当前默认' : '设为默认',
            visible: !version.isDefault,
            onClick: async () => {
              setLastAction(`${version.version} 已设为默认版本`);
            },
            successMessage: '默认版本已更新',
          },
          {
            key: 'archive',
            label: '归档版本',
            danger: true,
            visible: version.status === 'active',
            confirm: {
              title: `确认归档 ${version.version}？`,
              content: '归档操作由宿主服务执行。',
            },
            onClick: async () => {
              setLastAction(`${version.version} 已归档`);
            },
            successMessage: '版本已归档',
          },
        ]}
        hasPermission={() => true}
      />
    </SectionCard>
  );
}
