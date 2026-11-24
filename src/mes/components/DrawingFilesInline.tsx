import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  LeftOutlined,
  PrinterOutlined,
  RightOutlined,
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Drawer,
  Empty,
  Image,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { DrawingFileUploadFn } from './drawing-files-types';
import { useMesDrawingFilesCapabilities } from '../MesUiProvider';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './drawing-files.css';

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024;
const DRAWING_IMAGE_REGEXP = /\.(jpg|jpeg|png|webp)(?:[?#].*)?$/i;
const DRAWING_PDF_REGEXP = /\.pdf(?:[?#].*)?$/i;
const DRAWING_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];
const BUSINESS_ATTACHMENT_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
];

type FileKind = 'image' | 'pdf' | 'file';

export type PdfPreviewFile =
  | {
      url: string;
      name: string;
      blob?: never;
    }
  | {
      blob: Blob;
      name: string;
      url?: never;
    };

export interface FileUrlsInlineProps {
  value?: string[] | null;
  onChange?: (next: string[]) => void;
  editable?: boolean;
  emptyText?: string;
  uploadText?: string;
  maxCount?: number;
  maxSize?: number;
  accept?: string;
  allowedExtensions?: string[];
  maxSizeByExtension?: Record<string, number>;
  uploadFiles?: DrawingFileUploadFn;
  fileLabel?: string;
  uploadSuccessText?: string;
}

export interface DrawingFilesInlineProps
  extends Omit<
    FileUrlsInlineProps,
    'accept' | 'allowedExtensions' | 'fileLabel' | 'uploadSuccessText'
  > {
  accept?: string;
  allowedExtensions?: string[];
  fileLabel?: string;
  uploadSuccessText?: string;
  /** 允许从订单头附件中选取图纸，关联后仍保存到当前明细行。 */
  availableFileUrls?: string[];
}

export interface DrawingFileGroup {
  key: string;
  title: string;
  description?: string;
  urls?: string[] | null;
}

export interface DrawingFilesGalleryProps {
  groups?: DrawingFileGroup[];
  emptyText?: string;
  canPrint?: boolean;
  onPrint?: (urls: string[]) => void;
}

const normalizeFileUrls = (urls?: string[] | null) =>
  Array.from(
    new Set(
      (urls ?? [])
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter(Boolean),
    ),
  );

const getFileName = (url: string, fallback: string) => {
  const raw = url.split('?')[0]?.split('/').pop() || fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const getFileKind = (url: string): FileKind => {
  if (DRAWING_IMAGE_REGEXP.test(url)) return 'image';
  if (DRAWING_PDF_REGEXP.test(url)) return 'pdf';
  return 'file';
};

const getFileIcon = (kind: FileKind) => {
  if (kind === 'image') return <FileImageOutlined />;
  if (kind === 'pdf') return <FilePdfOutlined />;
  return <FileOutlined />;
};

const getFileExtension = (fileName: string) => {
  const cleanName = fileName.split('?')[0] ?? fileName;
  const dotIndex = cleanName.lastIndexOf('.');
  return dotIndex >= 0 ? cleanName.slice(dotIndex + 1).toLowerCase() : '';
};

const formatExtensions = (extensions: string[]) =>
  extensions.map((ext) => ext.toUpperCase()).join('/');

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  const responseData = (error as { response?: { data?: unknown } })?.response
    ?.data;
  if (responseData && typeof responseData === 'object') {
    const message = (responseData as { message?: unknown; msg?: unknown })
      .message;
    if (typeof message === 'string' && message) return message;
    const msg = (responseData as { message?: unknown; msg?: unknown }).msg;
    if (typeof msg === 'string' && msg) return msg;
  }
  return fallback;
};

const displayNameCache = new Map<string, string | null>();

function useFileDisplayNames(urls: readonly string[]) {
  const resolveNames = useMesDrawingFilesCapabilities()?.resolveFileDisplayNames;
  const key = useMemo(
    () => Array.from(new Set(urls.filter(Boolean))).sort().join('\n'),
    [urls],
  );
  const [revision, refresh] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    if (!key || !resolveNames) return;
    const requested = key.split('\n').filter((url) => !displayNameCache.has(url));
    if (requested.length === 0) return;
    let alive = true;
    void resolveNames(requested)
      .then((names) => {
        requested.forEach((url) => {
          displayNameCache.set(url, names[url]?.trim() || null);
        });
        if (alive) refresh();
      })
      .catch(() => {
        requested.forEach((url) => displayNameCache.set(url, null));
        if (alive) refresh();
      });
    return () => {
      alive = false;
    };
  }, [key, resolveNames]);

  return useCallback(
    (url: string, fallback: string) => displayNameCache.get(url) ?? fallback,
    [revision],
  );
}

function downloadBlobInBrowser(blob: Blob, fileName: string) {
  if (!(blob instanceof Blob)) throw new Error('下载响应不是有效文件');
  if (blob.size === 0) throw new Error('下载文件为空');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

const hasPdfBlob = (
  previewFile: PdfPreviewFile,
): previewFile is { blob: Blob; name: string; url?: never } =>
  previewFile.blob instanceof Blob;

export function PdfPreviewDrawer({
  file,
  onClose,
}: {
  file: PdfPreviewFile | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const capabilities = useMesDrawingFilesCapabilities();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [stageContentWidth, setStageContentWidth] = useState<number | null>(
    null,
  );
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPdfUrl(null);
      setLoading(false);
      setErrorText(null);
      setNumPages(0);
      setPageNumber(1);
      setScale(1);
      setStageContentWidth(null);
      return;
    }

    let disposed = false;
    let objectUrl: string | null = null;
    setPdfUrl(null);
    setNumPages(0);
    setPageNumber(1);
    setScale(1);

    if (!capabilities?.pdfWorkerSrc) {
      setLoading(false);
      setErrorText('PDF 预览尚未配置对应版本的 Worker');
      return () => {
        disposed = true;
      };
    }
    pdfjs.GlobalWorkerOptions.workerSrc = capabilities.pdfWorkerSrc;
    setLoading(true);
    setErrorText(null);

    const loadPdfBlob = hasPdfBlob(file)
      ? Promise.resolve(file.blob)
      : capabilities?.fetchFileBlob
        ? capabilities.fetchFileBlob(file.url)
        : Promise.reject(new Error('当前宿主未配置文件代理'));

    loadPdfBlob
      .then((blob) => {
        if (disposed) return;
        objectUrl = URL.createObjectURL(
          blob.type === 'application/pdf'
            ? blob
            : new Blob([blob], { type: 'application/pdf' }),
        );
        setPdfUrl(objectUrl);
      })
      .catch((error: unknown) => {
        if (disposed) return;
        setErrorText(getErrorMessage(error, 'PDF 加载失败，请下载后查看'));
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [capabilities?.fetchFileBlob, capabilities?.pdfWorkerSrc, file]);

  useEffect(() => {
    if (!file || errorText) return;

    const syncStageWidth = () => {
      const stageElement = stageRef.current;
      if (!stageElement) return;
      const computedStyle = window.getComputedStyle(stageElement);
      const horizontalPadding =
        Number.parseFloat(computedStyle.paddingLeft || '0') +
        Number.parseFloat(computedStyle.paddingRight || '0');
      const nextWidth = Math.floor(
        stageElement.clientWidth - horizontalPadding,
      );
      setStageContentWidth(nextWidth > 0 ? nextWidth : null);
    };

    let active = true;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    const observeStage = () => {
      if (!active) return;
      const stageElement = stageRef.current;
      if (!stageElement || stageElement.clientWidth === 0) {
        frameId = window.requestAnimationFrame(observeStage);
        return;
      }
      syncStageWidth();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(syncStageWidth);
        resizeObserver.observe(stageElement);
      }
    };

    frameId = window.requestAnimationFrame(observeStage);
    window.addEventListener('resize', syncStageWidth);

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncStageWidth);
    };
  }, [errorText, file]);

  const downloadPdf = async () => {
    if (!file) return;
    try {
      if (hasPdfBlob(file)) {
        (capabilities?.downloadBlob ?? downloadBlobInBrowser)(
          file.blob,
          file.name,
        );
        return;
      }
      if (capabilities?.downloadUrl) {
        await capabilities.downloadUrl(file.url, file.name);
        return;
      }
      if (!capabilities?.fetchFileBlob) {
        throw new Error('当前宿主未配置文件下载代理');
      }
      const blob = await capabilities.fetchFileBlob(file.url);
      (capabilities.downloadBlob ?? downloadBlobInBrowser)(blob, file.name);
    } catch {
      message.error('PDF 下载失败，请稍后重试');
    }
  };

  const pageWidth = stageContentWidth
    ? Math.max(240, Math.floor(stageContentWidth * scale))
    : undefined;

  return (
    <Drawer
      title={file?.name ?? 'PDF 预览'}
      open={!!file}
      // 预览必须在当前 keep-alive 标签页内挂载，不能通过 body portal 覆盖其他标签。
      getContainer={false}
      size="100%"
      destroyOnHidden
      onClose={onClose}
      extra={
        file ? (
          <Button
            icon={<DownloadOutlined />}
            onClick={() => void downloadPdf()}
          >
            下载
          </Button>
        ) : null
      }
      styles={{
        root: { position: 'absolute', inset: 0 },
        wrapper: { maxWidth: '100%' },
        section: { background: '#f5f7fb' },
        header: { flex: '0 0 auto' },
        body: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          padding: 16,
        },
      }}
    >
      <Space className="sxw-mes-pdf-preview-toolbar" size={8} wrap>
        <Button
          icon={<LeftOutlined />}
          disabled={pageNumber <= 1 || numPages <= 0}
          onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
        >
          上一页
        </Button>
        <Typography.Text className="sxw-mes-pdf-preview-page-count">
          {numPages > 0 ? `${pageNumber} / ${numPages}` : '加载中'}
        </Typography.Text>
        <Button
          icon={<RightOutlined />}
          disabled={numPages <= 0 || pageNumber >= numPages}
          onClick={() =>
            setPageNumber((current) => Math.min(numPages, current + 1))
          }
        >
          下一页
        </Button>
        <Tooltip title="缩小">
          <Button
            aria-label="缩小 PDF"
            icon={<ZoomOutOutlined />}
            disabled={scale <= 0.6}
            onClick={() =>
              setScale((current) =>
                Number(Math.max(0.6, current - 0.2).toFixed(1)),
              )
            }
          />
        </Tooltip>
        <Typography.Text className="sxw-mes-pdf-preview-zoom">
          {Math.round(scale * 100)}%
        </Typography.Text>
        <Tooltip title="放大">
          <Button
            aria-label="放大 PDF"
            icon={<ZoomInOutlined />}
            disabled={scale >= 2}
            onClick={() =>
              setScale((current) =>
                Number(Math.min(2, current + 0.2).toFixed(1)),
              )
            }
          />
        </Tooltip>
      </Space>

      {errorText ? (
        <Alert
          showIcon
          type="error"
          message={errorText}
          action={
            file ? (
              <Button size="small" onClick={() => void downloadPdf()}>
                下载查看
              </Button>
            ) : null
          }
        />
      ) : (
        <div ref={stageRef} className="sxw-mes-pdf-preview-stage">
          {loading || !pdfUrl || !stageContentWidth ? (
            <Empty
              className="sxw-mes-pdf-preview-empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="正在加载 PDF"
            />
          ) : (
            <Document
              file={pdfUrl}
              loading={
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="正在解析 PDF"
                />
              }
              error={
                <Alert
                  className="sxw-mes-pdf-preview-empty"
                  showIcon
                  type="error"
                  message="PDF 解析失败，请下载后查看"
                />
              }
              onLoadSuccess={(pdf: PDFDocumentProxy) => {
                setNumPages(pdf.numPages);
                setPageNumber(1);
              }}
              onLoadError={(error) => {
                setErrorText(error.message || 'PDF 解析失败，请下载后查看');
              }}
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                scale={pageWidth ? undefined : scale}
                renderAnnotationLayer
                renderTextLayer
                className="sxw-mes-pdf-preview-page"
              />
            </Document>
          )}
        </div>
      )}
    </Drawer>
  );
}

export function FileUrlsInline({
  value,
  onChange,
  editable = false,
  emptyText = '暂无附件',
  uploadText = '上传附件',
  maxCount = 20,
  maxSize = DEFAULT_MAX_SIZE,
  accept = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv',
  allowedExtensions = BUSINESS_ATTACHMENT_EXTENSIONS,
  maxSizeByExtension,
  uploadFiles: uploadFilesProp,
  fileLabel = '附件',
  uploadSuccessText = '附件已上传',
}: FileUrlsInlineProps) {
  const { message } = App.useApp();
  const capabilities = useMesDrawingFilesCapabilities();
  const uploadFiles = uploadFilesProp ?? capabilities?.uploadFiles;
  const [uploadingCount, setUploadingCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [pdfPreviewFile, setPdfPreviewFile] = useState<PdfPreviewFile | null>(
    null,
  );
  const urls = normalizeFileUrls(value);
  const getDisplayName = useFileDisplayNames(urls);
  const imageUrls = urls.filter((url) => getFileKind(url) === 'image');
  const latestUrlsRef = useRef(urls);
  const pendingUploadsRef = useRef(0);
  const uploading = uploadingCount > 0;
  const normalizedAllowedExtensions = allowedExtensions.map((ext) =>
    ext.replace(/^\./, '').toLowerCase(),
  );

  useEffect(() => {
    latestUrlsRef.current = urls;
  }, [urls]);

  const uploadFile = async (file: RcFile) => {
    if (!uploadFiles) {
      message.error(`${fileLabel}上传服务尚未配置`);
      return;
    }
    const currentUrls = latestUrlsRef.current;
    const ext = getFileExtension(file.name);
    if (!normalizedAllowedExtensions.includes(ext)) {
      message.error(`仅支持 ${formatExtensions(normalizedAllowedExtensions)}`);
      return;
    }
    const effectiveMaxSize = maxSizeByExtension?.[ext] ?? maxSize;
    if (file.size > effectiveMaxSize) {
      message.error(
        `单文件大小不能超过 ${Math.round(effectiveMaxSize / 1024 / 1024)}MB`,
      );
      return;
    }
    if (currentUrls.length + pendingUploadsRef.current >= maxCount) {
      message.warning(`最多上传 ${maxCount} 个${fileLabel}`);
      return;
    }

    pendingUploadsRef.current += 1;
    setUploadingCount((count) => count + 1);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await uploadFiles({
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrls = res?.urls ?? [];
      if (uploadedUrls.length === 0) {
        message.error('上传失败，未获取到文件地址');
        return;
      }
      const availableCount = maxCount - latestUrlsRef.current.length;
      const next = normalizeFileUrls([
        ...latestUrlsRef.current,
        ...uploadedUrls.slice(0, Math.max(availableCount, 0)),
      ]);
      latestUrlsRef.current = next;
      onChange?.(next);
      message.success(uploadSuccessText);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, `${fileLabel}上传失败，请稍后重试`));
    } finally {
      pendingUploadsRef.current = Math.max(0, pendingUploadsRef.current - 1);
      setUploadingCount((count) => Math.max(0, count - 1));
    }
  };

  const removeUrl = (url: string) => {
    const next = urls.filter((item) => item !== url);
    latestUrlsRef.current = next;
    onChange?.(next);
  };

  const viewFile = (url: string, kind: FileKind) => {
    if (kind === 'image') {
      setPreviewIndex(Math.max(0, imageUrls.indexOf(url)));
      setPreviewOpen(true);
      return;
    }
    if (kind === 'pdf') {
      setPdfPreviewFile({
        url,
        name: getDisplayName(url, getFileName(url, fileLabel)),
      });
    }
  };

  const downloadFile = async (url: string, name: string) => {
    try {
      if (capabilities?.downloadUrl) {
        await capabilities.downloadUrl(url, name);
        return;
      }
      if (!capabilities?.fetchFileBlob) {
        throw new Error('当前宿主未配置文件下载代理');
      }
      const blob = await capabilities.fetchFileBlob(url);
      (capabilities.downloadBlob ?? downloadBlobInBrowser)(blob, name);
    } catch {
      message.error('附件下载失败，请稍后重试');
    }
  };

  return (
    <>
      <Space size={[8, 8]} wrap>
        {urls.map((url) => {
          const name = getDisplayName(url, getFileName(url, fileLabel));
          const kind = getFileKind(url);
          return (
            <Tag
              key={url}
              icon={getFileIcon(kind)}
              closable={editable}
              closeIcon={
                <Tooltip title="移除">
                  <DeleteOutlined />
                </Tooltip>
              }
              onClose={(event) => {
                event.preventDefault();
                removeUrl(url);
              }}
            >
              <Tooltip title={name}>
                {kind === 'image' || kind === 'pdf' ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => viewFile(url, kind)}
                    style={{ height: 20, padding: 0 }}
                  >
                    {name}
                  </Button>
                ) : (
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => void downloadFile(url, name)}
                    style={{ height: 20, padding: 0 }}
                  >
                    {name}
                  </Button>
                )}
              </Tooltip>
            </Tag>
          );
        })}

        {editable && (
          <Upload
            showUploadList={false}
            accept={accept}
            beforeUpload={(file) => {
              void uploadFile(file as RcFile);
              return Upload.LIST_IGNORE;
            }}
            multiple
            disabled={uploading || urls.length >= maxCount}
          >
            <Button size="small" icon={<UploadOutlined />} loading={uploading}>
              {uploadText}
            </Button>
          </Upload>
        )}

        {!editable && urls.length === 0 ? (
          <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{emptyText}</span>
        ) : null}
      </Space>

      {imageUrls.length > 0 && (
        <Image.PreviewGroup
          preview={{
            open: previewOpen,
            current: previewIndex,
            onOpenChange: (open) => setPreviewOpen(open),
            onChange: (current) => setPreviewIndex(current),
          }}
        >
          <div style={{ display: 'none' }}>
            {imageUrls.map((url) => (
              <Image
                key={url}
                src={url}
                alt={getDisplayName(url, getFileName(url, fileLabel))}
              />
            ))}
          </div>
        </Image.PreviewGroup>
      )}

      <PdfPreviewDrawer
        file={pdfPreviewFile}
        onClose={() => setPdfPreviewFile(null)}
      />
    </>
  );
}

export function DrawingFilesInline({
  availableFileUrls: sourceFileUrls,
  ...props
}: DrawingFilesInlineProps) {
  const allowedExtensions = props.allowedExtensions ?? DRAWING_EXTENSIONS;
  const availableFileUrls = normalizeFileUrls(sourceFileUrls).filter(
    (url) => DRAWING_IMAGE_REGEXP.test(url) || DRAWING_PDF_REGEXP.test(url),
  );
  const resolveAvailableName = useFileDisplayNames(availableFileUrls);
  const selectedAvailableUrls = normalizeFileUrls(props.value).filter((url) =>
    availableFileUrls.includes(url),
  );
  const handleAvailableFilesChange = (selectedUrls: string[]) => {
    const rowUploadedUrls = normalizeFileUrls(props.value).filter(
      (url) => !availableFileUrls.includes(url),
    );
    props.onChange?.(normalizeFileUrls([...rowUploadedUrls, ...selectedUrls]));
  };
  return (
    <Space orientation="vertical" size={6}>
      <FileUrlsInline
        {...props}
        accept={
          props.accept ??
          allowedExtensions.map((extension) => `.${extension}`).join(',')
        }
        allowedExtensions={allowedExtensions}
        emptyText={props.emptyText ?? '暂无图纸'}
        uploadText={props.uploadText ?? '上传图纸'}
        fileLabel={props.fileLabel ?? '图纸附件'}
        uploadSuccessText={props.uploadSuccessText ?? '图纸已上传'}
      />
      {props.editable && availableFileUrls.length > 0 ? (
        <Select
          mode="multiple"
          size="small"
          showSearch
          optionFilterProp="label"
          placeholder="从订单附件关联图纸"
          value={selectedAvailableUrls}
          maxTagCount={0}
          maxTagPlaceholder={() =>
            `已关联 ${selectedAvailableUrls.length} 份订单图纸`
          }
          options={availableFileUrls.map((url) => ({
            value: url,
            label: resolveAvailableName(url, getFileName(url, '订单附件')),
          }))}
          style={{ minWidth: 220, maxWidth: 360 }}
          onChange={handleAvailableFilesChange}
        />
      ) : null}
    </Space>
  );
}

export function DrawingFilesGallery({
  groups,
  emptyText = '暂无图纸',
  canPrint = false,
  onPrint,
}: DrawingFilesGalleryProps) {
  const { message } = App.useApp();
  const capabilities = useMesDrawingFilesCapabilities();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [pdfPreviewFile, setPdfPreviewFile] = useState<PdfPreviewFile | null>(
    null,
  );
  const normalizedGroups = (groups ?? [])
    .map((group) => ({
      ...group,
      urls: normalizeFileUrls(group.urls),
    }))
    .filter((group) => group.urls.length > 0);
  const getDisplayName = useFileDisplayNames(
    normalizedGroups.flatMap((group) => group.urls),
  );
  const imageUrls = normalizeFileUrls(
    normalizedGroups.flatMap((group) =>
      group.urls.filter((url) => getFileKind(url) === 'image'),
    ),
  );
  const showPrint = canPrint && typeof onPrint === 'function';

  const previewImage = (url: string) => {
    setPreviewIndex(Math.max(0, imageUrls.indexOf(url)));
    setPreviewOpen(true);
  };

  const previewPdf = (url: string) => {
    setPdfPreviewFile({
      url,
      name: getDisplayName(url, getFileName(url, '图纸附件')),
    });
  };

  const downloadFile = async (url: string, name: string) => {
    try {
      if (capabilities?.downloadUrl) {
        await capabilities.downloadUrl(url, name);
        return;
      }
      if (!capabilities?.fetchFileBlob) {
        throw new Error('当前宿主未配置文件下载代理');
      }
      const blob = await capabilities.fetchFileBlob(url);
      (capabilities.downloadBlob ?? downloadBlobInBrowser)(blob, name);
    } catch {
      message.error('附件下载失败，请稍后重试');
    }
  };

  if (normalizedGroups.length === 0) {
    return (
      <div className="sxw-mes-drawing-gallery-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      </div>
    );
  }

  return (
    <>
      <div className="sxw-mes-drawing-gallery">
        {normalizedGroups.map((group) => {
          const groupImageUrls = group.urls.filter(
            (url) => getFileKind(url) === 'image',
          );
          return (
            <section className="sxw-mes-drawing-source-group" key={group.key}>
              <div className="sxw-mes-drawing-source-header">
                <div className="sxw-mes-drawing-source-title">
                  <Typography.Text strong>{group.title}</Typography.Text>
                  {group.description ? (
                    <Typography.Text type="secondary">
                      {group.description}
                    </Typography.Text>
                  ) : null}
                </div>
                <Space size={8} wrap>
                  <Tag>{group.urls.length} 个附件</Tag>
                  {groupImageUrls.length > 0 ? (
                    <Tag color="blue">{groupImageUrls.length} 张图片</Tag>
                  ) : null}
                  {showPrint && groupImageUrls.length > 0 ? (
                    <Button
                      size="small"
                      icon={<PrinterOutlined />}
                      onClick={() => onPrint?.(groupImageUrls)}
                    >
                      打印本组
                    </Button>
                  ) : null}
                </Space>
              </div>
              <div className="sxw-mes-drawing-file-grid">
                {group.urls.map((url) => {
                  const name = getDisplayName(
                    url,
                    getFileName(url, '图纸附件'),
                  );
                  const kind = getFileKind(url);
                  const isImage = kind === 'image';
                  const isPdf = kind === 'pdf';
                  return (
                    <div className="sxw-mes-drawing-file-card" key={url}>
                      <button
                        type="button"
                        className="sxw-mes-drawing-file-thumb"
                        onClick={() =>
                          isImage
                            ? previewImage(url)
                            : isPdf
                              ? previewPdf(url)
                              : void downloadFile(url, name)
                        }
                      >
                        {isImage ? (
                          <Image
                            src={url}
                            alt={name}
                            preview={false}
                            className="sxw-mes-drawing-file-thumb-image"
                          />
                        ) : (
                          <span className="sxw-mes-drawing-file-icon">
                            {getFileIcon(kind)}
                          </span>
                        )}
                      </button>
                      <div className="sxw-mes-drawing-file-info">
                        <Typography.Text
                          ellipsis={{ tooltip: name }}
                          className="sxw-mes-drawing-file-name"
                        >
                          {name}
                        </Typography.Text>
                        <div className="sxw-mes-drawing-file-kind">
                          {kind === 'image'
                            ? '图片图纸'
                            : kind === 'pdf'
                              ? 'PDF 图纸'
                              : '附件'}
                        </div>
                      </div>
                      <Space className="sxw-mes-drawing-file-actions" size={4} wrap>
                        {isImage ? (
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => previewImage(url)}
                          >
                            预览
                          </Button>
                        ) : isPdf ? (
                          <>
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => previewPdf(url)}
                            >
                              预览
                            </Button>
                            <Button
                              size="small"
                              icon={<DownloadOutlined />}
                              onClick={() => void downloadFile(url, name)}
                            >
                              下载
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => void downloadFile(url, name)}
                          >
                            下载
                          </Button>
                        )}
                        {showPrint && isImage ? (
                          <Button
                            size="small"
                            icon={<PrinterOutlined />}
                            onClick={() => onPrint?.([url])}
                          >
                            打印
                          </Button>
                        ) : null}
                      </Space>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {imageUrls.length > 0 && (
        <Image.PreviewGroup
          preview={{
            open: previewOpen,
            current: previewIndex,
            onOpenChange: (open) => setPreviewOpen(open),
            onChange: (current) => setPreviewIndex(current),
          }}
        >
          <div style={{ display: 'none' }}>
            {imageUrls.map((url) => (
              <Image
                key={url}
                src={url}
                alt={getDisplayName(url, getFileName(url, '图纸附件'))}
              />
            ))}
          </div>
        </Image.PreviewGroup>
      )}

      <PdfPreviewDrawer
        file={pdfPreviewFile}
        onClose={() => setPdfPreviewFile(null)}
      />
    </>
  );
}
