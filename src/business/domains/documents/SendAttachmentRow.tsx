import { DownloadOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';
import { useCallback, useState } from 'react';
import { PdfPreviewDrawer, type PdfPreviewFile } from '../shared/DrawingFilesInline';
import type { SendAttachmentRowProps } from './send-action-modal-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readBlobJsonMessage(blob: Blob): Promise<string | undefined> {
  try {
    const parsed: unknown = JSON.parse(await blob.text());
    return isRecord(parsed) && typeof parsed.msg === 'string'
      ? parsed.msg
      : undefined;
  } catch {
    return undefined;
  }
}

async function extractBackendMessage(error: unknown): Promise<string | undefined> {
  if (!isRecord(error)) return undefined;
  const info = isRecord(error.info) ? error.info : undefined;
  if (typeof info?.msg === 'string') return info.msg;
  const data = isRecord(error.data) ? error.data : undefined;
  if (typeof data?.msg === 'string') return data.msg;
  const response = isRecord(error.response) ? error.response : undefined;
  const responseData = response && isRecord(response.data) ? response.data : undefined;
  if (responseData && typeof responseData.msg === 'string') return responseData.msg;
  if (response?.data instanceof Blob) return readBlobJsonMessage(response.data);
  return undefined;
}

/** @sunxu-layer business @sunxu-domain documents attachment @sunxu-reason Preserves the host send-attachment preview and download actions while keeping PDF access behind host capabilities.*/
export function SendAttachmentRow<TPayload>({
  payload,
  filename,
  previewable,
  fetchPdf,
  download,
  notifyError,
}: SendAttachmentRowProps<TPayload>) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<PdfPreviewFile | null>(null);

  const loadBlob = useCallback(async (): Promise<Blob | null> => {
    try {
      const result: unknown = await fetchPdf(payload);
      if (!(result instanceof Blob)) {
        notifyError('获取附件失败，请稍后重试');
        return null;
      }
      if (result.type.includes('json')) {
        notifyError((await readBlobJsonMessage(result)) || '生成附件失败');
        return null;
      }
      return result;
    } catch (error: unknown) {
      notifyError((await extractBackendMessage(error)) || '生成附件失败，请稍后重试');
      return null;
    }
  }, [fetchPdf, payload, notifyError]);

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const blob = await loadBlob();
      if (blob) setPreviewFile({ blob, name: filename });
    } finally {
      setPreviewLoading(false);
    }
  }, [loadBlob, filename]);

  const handleDownload = useCallback(async () => {
    if (!download) return;
    setDownloadLoading(true);
    try {
      const blob = await loadBlob();
      if (blob) download(blob, filename);
    } finally {
      setDownloadLoading(false);
    }
  }, [download, loadBlob, filename]);

  return (
    <div
      style={{
        marginTop: 12,
        padding: '8px 12px',
        border: '1px solid var(--ant-color-border-secondary)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <Space size={8} style={{ minWidth: 0 }}>
        <FilePdfOutlined aria-hidden="true" style={{ color: 'var(--ant-color-error)' }} />
        <Typography.Text ellipsis style={{ maxWidth: 260 }} title={filename}>
          {filename}
        </Typography.Text>
        <Tag>邮件直发附带</Tag>
      </Space>
      <Space size={4}>
        {previewable ? (
          <>
            <Button
              size="small"
              type="link"
              icon={<EyeOutlined aria-hidden="true" />}
              loading={previewLoading}
              onClick={() => void handlePreview()}
            >
              预览
            </Button>
            {download ? (
              <Button
                size="small"
                type="link"
                icon={<DownloadOutlined aria-hidden="true" />}
                loading={downloadLoading}
                onClick={() => void handleDownload()}
              >
                下载
              </Button>
            ) : null}
          </>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            无金额查看权限，不可预览
          </Typography.Text>
        )}
      </Space>
      <PdfPreviewDrawer file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
