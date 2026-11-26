import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  Alert,
  Button,
  Drawer,
  message,
  Result,
  Space,
  Spin,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import React, { useCallback, useState } from 'react';
import { ContextualHelp } from '../../../components/ContextualHelp';
import { downloadBlob } from '../../utils/downloadBlob';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportResult {
  created: number;
  updated?: number;
  skipped?: number;
  errors: string[];
  createdFamilies?: number;
  reusedFamilies?: number;
  createdMaterials?: number;
  updatedFamilies?: number;
  updatedMaterials?: number;
}

export interface ImportDrawerProps {
  /** 抽屉标题 */
  title: string;
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 导入成功后回调（用于刷新列表） */
  onSuccess?: () => void;
  /** 下载模板的 API 调用（返回 Blob） */
  downloadTemplateFn: () => Promise<unknown>;
  /** 导入 Excel 的 API 调用（接受 base64 字符串，返回 ImportResult） */
  importFn: (base64: string) => Promise<ImportResult>;
  /** 模板文件名 */
  templateFileName?: string;
  /** 最大导入条数提示 */
  maxRows?: number;
  /** 额外提示信息 */
  tips?: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:application/...;base64,XXXX → XXXX
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'upload' | 'importing' | 'result';

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Preserves host template download, Excel upload, base64 submission, importing/result phases, partial-failure details, and reset lifecycle while service calls remain caller supplied.
 */
const ImportDrawer: React.FC<ImportDrawerProps> = ({
  title,
  open,
  onClose,
  onSuccess,
  downloadTemplateFn,
  importFn,
  templateFileName = 'import_template.xlsx',
  maxRows,
  tips,
}) => {
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  const reset = useCallback(() => {
    setPhase('upload');
    setFileList([]);
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleDownloadTemplate = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await downloadTemplateFn();
      downloadBlob(blob, templateFileName);
      message.success('模板文件已开始下载');
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '模板下载失败');
    } finally {
      setDownloading(false);
    }
  }, [downloadTemplateFn, templateFileName]);

  const handleImport = useCallback(async () => {
    const file = fileList[0]?.originFileObj;
    if (!file) return;

    setPhase('importing');
    try {
      const base64 = await fileToBase64(file);
      const res = await importFn(base64);
      setResult(res);
      setPhase('result');
      if (
        res.created > 0 ||
        (res.updated ?? 0) > 0 ||
        (res.createdFamilies ?? 0) > 0 ||
        (res.updatedFamilies ?? 0) > 0 ||
        (res.updatedMaterials ?? 0) > 0
      ) {
        onSuccess?.();
      }
    } catch (error: unknown) {
      setPhase('upload');
      const msg =
        error instanceof Error
          ? error.message
          : '导入失败，请检查文件格式后重试';
      message.error(msg);
    }
  }, [fileList, importFn, onSuccess]);

  return (
    <Drawer
      title={title}
      open={open}
      onClose={handleClose}
      size={520}
      destroyOnHidden
      footer={
        phase === 'upload' ? (
          <Space style={{ float: 'right' }}>
            <Button onClick={handleClose}>取消</Button>
            <Tooltip title={fileList.length === 0 ? '请先上传 Excel 文件' : ''}>
              {/* 禁用按钮自身不触发鼠标事件，需用 span 承接 hover 才能显示 Tooltip */}
              <span
                style={{
                  display: 'inline-block',
                  cursor: fileList.length === 0 ? 'not-allowed' : undefined,
                }}
              >
                <Button
                  type="primary"
                  disabled={fileList.length === 0}
                  onClick={handleImport}
                  style={
                    fileList.length === 0
                      ? { pointerEvents: 'none' }
                      : undefined
                  }
                >
                  开始导入
                </Button>
              </span>
            </Tooltip>
          </Space>
        ) : phase === 'result' ? (
          <Space style={{ float: 'right' }}>
            <Button onClick={handleClose}>关闭</Button>
            <Button type="primary" onClick={reset}>
              继续导入
            </Button>
          </Space>
        ) : null
      }
    >
      {phase === 'upload' && (
        <>
          <ContextualHelp
            label="导入步骤"
            title="下载模板、填写数据、上传文件"
            ariaLabel="查看导入步骤"
            content="先下载导入模板，按模板格式填写数据，再上传填好的 Excel 文件。"
          />

          {/* 下载模板 */}
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={downloading}
            style={{ marginBottom: 16 }}
          >
            下载导入模板
          </Button>

          {maxRows && (
            <div
              style={{
                marginBottom: 8,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
              单次最多导入 {maxRows} 条数据
            </div>
          )}

          {tips && (
            <div
              style={{
                marginBottom: 16,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
              {tips}
            </div>
          )}

          {/* 文件上传 */}
          <Upload.Dragger
            accept=".xlsx,.xls"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: fl }) => setFileList(fl)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 .xlsx / .xls 格式</p>
          </Upload.Dragger>
        </>
      )}

      {phase === 'importing' && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div
            style={{ marginTop: 16, color: 'var(--ant-color-text-secondary)' }}
          >
            正在导入数据，请稍候...
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <>
          <Result
            status={result.errors.length === 0 ? 'success' : 'warning'}
            title={
              result.errors.length === 0 ? '导入完成' : '导入完成（部分失败）'
            }
            subTitle={
              <Space orientation="vertical" size={4}>
                <Text>
                  <CheckCircleOutlined
                    style={{ color: '#52c41a', marginRight: 4 }}
                  />
                  {(() => {
                    // 物料系列导入：新建总数 = 新建物料档案 + 新建系列（仅系列模式物料档案为 0，避免显示“成功创建 0 条”）
                    const createdTotal =
                      result.createdMaterials !== undefined
                        ? result.createdMaterials +
                          (result.createdFamilies ?? 0)
                        : result.created;
                    const hasUpdates =
                      (result.updated ?? 0) > 0 ||
                      (result.updatedMaterials ?? 0) > 0 ||
                      (result.updatedFamilies ?? 0) > 0;
                    return hasUpdates
                      ? `新建 ${createdTotal} 条`
                      : `成功创建 ${createdTotal} 条`;
                  })()}
                </Text>
                {result.createdMaterials !== undefined && (
                  <Text type="secondary">
                    新建物料档案 {result.createdMaterials} 个
                    {result.createdFamilies !== undefined
                      ? `，新建系列 ${result.createdFamilies} 个`
                      : ''}
                    {result.reusedFamilies !== undefined &&
                    result.reusedFamilies > 0
                      ? `，复用系列 ${result.reusedFamilies} 个`
                      : ''}
                  </Text>
                )}
                {((result.updatedMaterials ?? 0) > 0 ||
                  (result.updatedFamilies ?? 0) > 0 ||
                  (result.updated ?? 0) > 0) && (
                  <Text type="secondary">
                    {result.updated !== undefined
                      ? `更新 ${result.updated} 条`
                      : `更新物料档案 ${result.updatedMaterials ?? 0} 个${
                          result.updatedFamilies !== undefined
                            ? `，更新系列 ${result.updatedFamilies} 个`
                            : ''
                        }`}
                  </Text>
                )}
                {(result.skipped ?? 0) > 0 && (
                  <Text type="secondary">跳过 {result.skipped} 条</Text>
                )}
                {result.errors.length > 0 && (
                  <Text type="danger">
                    <CloseCircleOutlined style={{ marginRight: 4 }} />
                    失败 {result.errors.length} 条
                  </Text>
                )}
              </Space>
            }
          />

          {result.errors.length > 0 && (
            <Alert
              type="error"
              message="错误详情"
              description={
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {result.errors.map((err) => (
                    <div key={err} style={{ marginBottom: 4, fontSize: 13 }}>
                      {err}
                    </div>
                  ))}
                </div>
              }
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}
    </Drawer>
  );
};

export default ImportDrawer;
