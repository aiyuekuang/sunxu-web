import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Drawer, Space, Tag, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useState } from 'react';
import { ResizableProTable } from './ResizableTable';
import { todayBusinessDate } from '../utils/businessDate';
import type {
  BusinessInvoiceBatchResult,
  BusinessInvoiceBatchResultRow,
  BusinessInvoiceOpeningImportDrawerProps,
} from './business-invoice-opening-import-types';

const HEADERS = [
  '真实发票号',
  '票据类型',
  '票面日期',
  '往来单位编码',
  '原系统',
  '原单据ID',
  '原单据号',
  '原蓝票ID',
  '物料编码',
  '项目名称',
  '单位',
  '数量',
  '未税单价',
  '未税金额',
  '税率',
  '税额',
  '价税合计',
  '币种',
  '汇率',
  '备注',
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(
        String(reader.result ?? '').split(',').pop() ?? '',
      );
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * @sunxu-layer business
 * @sunxu-domain business-invoice
 * @sunxu-reason Preserves the MES opening-invoice CSV template, upload rules, import result table, and success behavior while API, download, and feedback are host supplied.
 */
export function BusinessInvoiceOpeningImportDrawer({
  mode,
  open,
  onClose,
  onSuccess,
  capabilities,
}: BusinessInvoiceOpeningImportDrawerProps) {
  const isPurchase = mode === 'purchase';
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BusinessInvoiceBatchResult>();

  const downloadTemplate = () => {
    const sample = [
      '',
      '蓝字',
      todayBusinessDate(),
      isPurchase ? 'SUP-001' : 'CUS-001',
      'legacy-erp',
      'LEGACY-001',
      'FP-001',
      '',
      'MAT-001',
      '示例物料',
      '件',
      '1',
      '100',
      '100',
      '13',
      '13',
      '113',
      'CNY',
      '1',
      '',
    ];
    const csv = `\uFEFF${HEADERS.join(',')}\n${sample.join(',')}\n`;
    capabilities.downloadTemplate(
      `${isPurchase ? '采购' : '销售'}期初发票导入模板.csv`,
      csv,
    );
  };

  const execute = async () => {
    const file = files[0]?.originFileObj;
    if (!file) {
      capabilities.notify('warning', '请选择 Excel 或 CSV 文件');
      return;
    }
    setLoading(true);
    try {
      const response = await capabilities.importOpeningInvoices(mode, {
        base64: await fileToBase64(file),
        fileName: file.name,
      });
      setResult(response);
      if (response.failed) {
        capabilities.notify(
          'warning',
          `导入完成：成功 ${response.succeeded}，失败 ${response.failed}`,
        );
      } else {
        capabilities.notify('success', `成功导入 ${response.succeeded} 张发票`);
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={`批量导入期初未匹配${isPurchase ? '采购' : '销售'}发票`}
      open={open}
      onClose={onClose}
      size={900}
      destroyOnHidden
      extra={
        <Space>
          <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
            下载模板
          </Button>
          <Button type="primary" loading={loading} onClick={execute}>
            校验并导入
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Upload.Dragger
          accept=".xlsx,.csv"
          maxCount={1}
          beforeUpload={() => false}
          fileList={files}
          onChange={({ fileList }) => {
            setFiles(fileList);
            setResult(undefined);
          }}
        >
          <p>
            <UploadOutlined /> 选择或拖入 Excel / CSV 文件
          </p>
          <p>
            同一“原系统 + 原单据ID”的多行会合并为一张发票；重复导入按幂等返回。
          </p>
          <p>
            真实发票号须为20位阿拉伯数字；旧版专票需将12位发票代码与8位号码合并填写。
          </p>
        </Upload.Dragger>
        <ResizableProTable<BusinessInvoiceBatchResultRow>
          rowKey="rowNo"
          search={false}
          options={false}
          pagination={false}
          dataSource={result?.rows ?? []}
          columns={[
            { title: '序号', dataIndex: 'rowNo', width: 70 },
            {
              title: '结果',
              render: (_, row) => (
                <Tag color={row.success ? 'green' : 'red'}>
                  {row.success ? (row.duplicate ? '已存在' : '成功') : '失败'}
                </Tag>
              ),
            },
            { title: '真实发票号', dataIndex: 'invoiceNo' },
            { title: '错误信息', dataIndex: 'error' },
          ]}
        />
      </Space>
    </Drawer>
  );
}
