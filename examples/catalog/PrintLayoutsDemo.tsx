import { useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DOT_MATRIX_STYLES,
  DotMatrixLayout,
  LABEL_STYLES,
  LabelLayout,
  MesUiProvider,
  PrintLayout,
  type LabelOrientation,
} from '../../src/mes';

export function PrintLayoutsDemo() {
  const [orientation, setOrientation] = useState<LabelOrientation>('horizontal');

  return (
    <SectionCard title="MES 打印布局">
      <Typography.Paragraph type="secondary">
        A4 单据、连续纸和标签布局保留 MES 模板结构；标签纸设置由宿主提供，打印 iframe 样式通过导出的样式常量注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <PrintLayout title="采购收货单" docNo="RCV-2026-0321" metaLines={['供应商：示例供应商']} printDate="2026年11月20日">
          <table className="print-desc">
            <tbody>
              <tr><td className="label">仓库</td><td>一号原料库</td><td className="label">状态</td><td>待检</td></tr>
            </tbody>
          </table>
          <table className="print-table">
            <thead><tr><th>物料编码</th><th>物料名称</th><th>数量</th></tr></thead>
            <tbody><tr><td>RM-AL-0081</td><td>6061 铝型材</td><td className="number">24</td></tr></tbody>
          </table>
        </PrintLayout>
        <div>
          <Typography.Title level={5}>连续纸</Typography.Title>
          <style>{DOT_MATRIX_STYLES}</style>
          <DotMatrixLayout companyName="苏州示例制造" title="材料领用单" docNo="ISS-2026-0088" docDate="2026-11-20">
            <table className="dm-table">
              <thead><tr><th>物料编码</th><th>物料名称</th><th>数量</th></tr></thead>
              <tbody><tr><td>RM-AL-0081</td><td>6061 铝型材</td><td className="right">24</td></tr></tbody>
            </table>
          </DotMatrixLayout>
        </div>
        <div>
          <Space wrap>
            <Typography.Text strong>标签方向</Typography.Text>
            <Segmented
              aria-label="标签布局方向"
              value={orientation}
              options={[
                { label: '横版', value: 'horizontal' },
                { label: '竖版', value: 'vertical' },
              ]}
              onChange={(value) => setOrientation(value as LabelOrientation)}
            />
          </Space>
          <style>{LABEL_STYLES}</style>
          <MesUiProvider hasPermission={() => false} labelLayoutCapabilities={{ getOrientation: () => orientation }}>
            <LabelLayout>
              <div className="label-item" style={{ width: orientation === 'horizontal' ? 240 : 128, height: orientation === 'horizontal' ? 128 : 240, border: '1px dashed #888' }}>
                <div className="label-title">6061 铝型材</div>
                <hr className="label-divider" />
                <div className="label-body">
                  <div className="label-info">
                    <div className="label-row"><span className="label-field">编码</span><span className="label-value">RM-AL-0081</span></div>
                    <div className="label-row"><span className="label-field">规格</span><span className="label-value">20 × 40 mm</span></div>
                    <div className="label-row"><span className="label-field">单位</span><span className="label-value">根</span></div>
                  </div>
                  <div className="label-barcode" aria-label="二维码预览">▦</div>
                </div>
              </div>
            </LabelLayout>
          </MesUiProvider>
        </div>
      </Space>
    </SectionCard>
  );
}
