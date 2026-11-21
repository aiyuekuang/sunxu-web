import React from 'react';
import { ContextualHelp } from './ContextualHelp';

export type SharedFieldHelpKey = 'formDrawer' | 'orderItems';

const SHARED_FIELD_HELP: Record<SharedFieldHelpKey, { title: string; purpose: string; usage: string[]; caliber?: string[] }> = {
  formDrawer: {
    title: '表单弹窗',
    purpose: '用于集中维护当前业务单据或记录的关键字段，提交后会直接影响后续状态和上下游数据。',
    usage: ['保存前先确认必填项、关键时间和归属对象是否正确，再一次性提交，避免反复改动留下脏数据。'],
  },
  orderItems: {
    title: '明细行',
    purpose: '用于逐行维护本次单据关联的物料、数量和单价，是金额、库存和交付口径的直接来源。',
    caliber: ['一行只维护一个物料或规格，不要把不同物料混在同一行。'],
    usage: ['先选物料，再填数量；开启价格场景下再补单价，确保明细和汇总金额能对上。'],
  },
};

/** MES shared form and order-line guidance copied from the host-owned definitions. */
export function withSharedFieldHelp(label: React.ReactNode, key: SharedFieldHelpKey): React.ReactNode {
  const help = SHARED_FIELD_HELP[key];
  return (
    <ContextualHelp
      label={label}
      title={help.title}
      ariaLabel={`查看${help.title}字段说明`}
      trigger={['hover', 'focus']}
      content={
        <div style={{ display: 'grid', gap: 8, maxWidth: 380 }}>
          <div><strong>作用</strong><div style={{ lineHeight: 1.6 }}>{help.purpose}</div></div>
          {help.caliber?.length ? <div><strong>口径</strong>{help.caliber.map((item) => <div key={item} style={{ lineHeight: 1.6 }}>- {item}</div>)}</div> : null}
          {help.usage.length ? <div><strong>怎么用</strong>{help.usage.map((item) => <div key={item} style={{ lineHeight: 1.6 }}>- {item}</div>)}</div> : null}
        </div>
      }
    />
  );
}
