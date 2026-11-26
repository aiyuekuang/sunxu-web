import {
  BoxPlotOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  List,
  Popconfirm,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
  theme,
} from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PdfPreviewDrawer } from '../shared/DrawingFilesInline';
import type { PdfPreviewFile } from '../shared/DrawingFilesInline';
import type {
  MaterialDrawingPolicy,
  MaterialDrawingsPanelProps,
} from './material-drawings-panel-types';

type DrawingKind = 'image' | 'pdf' | 'model' | 'file';

interface DrawingItem {
  key: string;
  index: number;
  url: string;
  name: string;
  extension: string;
  kind: DrawingKind;
}

const DRAWING_IMAGE_REGEXP = /\.(jpg|jpeg|png|webp)(?:[?#].*)?$/i;
const DRAWING_PDF_REGEXP = /\.pdf(?:[?#].*)?$/i;
const DRAWING_MODEL_REGEXP = /\.glb(?:[?#].*)?$/i;

function getDrawingKind(value: string): DrawingKind {
  if (DRAWING_IMAGE_REGEXP.test(value)) return 'image';
  if (DRAWING_PDF_REGEXP.test(value)) return 'pdf';
  if (DRAWING_MODEL_REGEXP.test(value)) return 'model';
  return 'file';
}

function getDrawingExtension(name: string): string {
  const extension = name.split('.').pop();
  return extension && extension !== name ? extension.toUpperCase() : '文件';
}

function getDrawingTypeLabel(kind: DrawingKind): string {
  if (kind === 'image') return '图片';
  if (kind === 'pdf') return 'PDF';
  if (kind === 'model') return '3D模型';
  return '文件';
}

function getDrawingName(
  url: string,
  resolvedNames: Readonly<Record<string, string | null | undefined>>,
  getFallbackFileName: (value: string) => string,
): string {
  return resolvedNames[url]?.trim() || getFallbackFileName(url) || '图纸附件';
}

function buildDrawingItems(
  urls: readonly string[],
  resolveName: (url: string) => string,
): DrawingItem[] {
  return urls.map((url, index) => {
    const name = resolveName(url);
    const kind = getDrawingKind(url);
    return {
      key: `${url}-${index}`,
      index: index + 1,
      url,
      name,
      kind,
      extension: getDrawingExtension(name),
    };
  });
}

function isRcFile(file?: UploadFile['originFileObj']): file is RcFile {
  return Boolean(file);
}

function getDrawingIcon(
  kind: DrawingKind,
  token: {
    colorPrimary: string;
    colorError: string;
    colorInfo: string;
    colorTextTertiary: string;
  },
  fontSize = 18,
) {
  const style = { fontSize };
  if (kind === 'image') {
    return <FileImageOutlined style={{ ...style, color: token.colorPrimary }} />;
  }
  if (kind === 'pdf') {
    return <FilePdfOutlined style={{ ...style, color: token.colorError }} />;
  }
  if (kind === 'model') {
    return <BoxPlotOutlined style={{ ...style, color: token.colorInfo }} />;
  }
  return <FileOutlined style={{ ...style, color: token.colorTextTertiary }} />;
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves material drawing upload, deletion, selection and typed preview while the host supplies file services, authorization results, URL handling and business feedback; the shared PDF drawer uses the host's drawing-file provider capabilities.
 */
export function MaterialDrawingsPanel({
  materialId,
  drawings,
  canEdit,
  onReload,
  capabilities,
}: MaterialDrawingsPanelProps) {
  const { token } = theme.useToken();
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;
  const [drawingFileList, setDrawingFileList] = useState<UploadFile[]>([]);
  const [drawingUploading, setDrawingUploading] = useState(false);
  const [selectedDrawingUrl, setSelectedDrawingUrl] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [pdfPreviewFile, setPdfPreviewFile] = useState<PdfPreviewFile | null>(
    null,
  );
  const [drawingPolicy, setDrawingPolicy] = useState<MaterialDrawingPolicy>();
  const [drawingPolicyError, setDrawingPolicyError] = useState(false);
  const [resolvedNames, setResolvedNames] = useState<
    Readonly<Record<string, string | null | undefined>>
  >({});

  const drawingUrls = useMemo(() => drawings ?? [], [drawings]);
  const drawingUrlsKey = useMemo(
    () => Array.from(new Set(drawingUrls.filter(Boolean))).sort().join('\n'),
    [drawingUrls],
  );

  useEffect(() => {
    let active = true;
    setDrawingPolicy(undefined);
    setDrawingPolicyError(false);
    void capabilitiesRef.current
      .requestDrawingPolicy()
      .then((policy) => {
        if (active) setDrawingPolicy(policy);
      })
      .catch(() => {
        if (active) setDrawingPolicyError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!drawingUrlsKey) {
      setResolvedNames({});
      return undefined;
    }
    let active = true;
    const urls = drawingUrlsKey.split('\n');
    void capabilitiesRef.current
      .resolveFileDisplayNames(urls)
      .then((names) => {
        if (active) setResolvedNames(names);
      })
      .catch(() => {
        if (active) setResolvedNames({});
      });
    return () => {
      active = false;
    };
  }, [drawingUrlsKey]);

  const drawingItems = useMemo(
    () =>
      buildDrawingItems(drawingUrls, (url) =>
        getDrawingName(url, resolvedNames, capabilities.getFallbackFileName),
      ),
    [capabilities.getFallbackFileName, drawingUrls, resolvedNames],
  );
  const imageDrawingItems = useMemo(
    () => drawingItems.filter((item) => item.kind === 'image'),
    [drawingItems],
  );
  const activeDrawing =
    drawingItems.find((item) => item.url === selectedDrawingUrl) ??
    drawingItems[0];
  const drawingCapacity = drawingPolicy
    ? Math.max(0, drawingPolicy.maxCount - drawingItems.length)
    : 0;
  const isPolicyReady = Boolean(drawingPolicy);
  const isDrawingLimitReached = isPolicyReady && drawingCapacity === 0;

  const handleUploadDrawings = async () => {
    if (drawingFileList.length === 0) return;
    if (!drawingPolicy) {
      capabilities.notifyError('正在读取物料资料上传规则，请稍候重试');
      return;
    }

    const pendingFiles = drawingFileList
      .map((file) => file.originFileObj)
      .filter(isRcFile);
    if (pendingFiles.length === 0) {
      capabilities.notifyError('请选择有效图纸文件');
      return;
    }
    if (pendingFiles.length > drawingCapacity) {
      capabilities.notifyError(
        `单个物料最多维护 ${drawingPolicy.maxCount} 个图纸附件，请先删除不需要的图纸`,
      );
      return;
    }

    setDrawingUploading(true);
    try {
      const urlsByIndex: Array<string | undefined> = [];
      const filesWithIndex = pendingFiles.map((file, index) => ({
        file,
        index,
      }));
      const documentFiles = filesWithIndex.filter(
        ({ file }) => !DRAWING_MODEL_REGEXP.test(file.name),
      );
      const modelFiles = filesWithIndex.filter(({ file }) =>
        DRAWING_MODEL_REGEXP.test(file.name),
      );

      if (documentFiles.length > 0) {
        const uploadedUrls = await capabilities.uploadDocumentFiles(
          documentFiles.map(({ file }) => file),
        );
        uploadedUrls.forEach((url, index) => {
          const file = documentFiles[index];
          if (file && url) urlsByIndex[file.index] = url;
        });
      }

      for (const { file, index } of modelFiles) {
        const url = await capabilities.uploadModelFile(file);
        if (url) urlsByIndex[index] = url;
      }

      const urls = urlsByIndex.filter((url): url is string => Boolean(url));
      if (urls.length === 0) {
        capabilities.notifyError('上传失败，未获取到文件地址');
        return;
      }

      await capabilities.addDrawings({ id: materialId, urls });
      capabilities.notifySuccess('上传成功');
      setDrawingFileList([]);
      setSelectedDrawingUrl(urls[0]);
      onReload();
    } catch (error) {
      capabilities.notifyError(
        capabilities.formatErrorMessage(error, '图纸上传失败'),
      );
    } finally {
      setDrawingUploading(false);
    }
  };

  const handleRemoveDrawing = async (url: string) => {
    try {
      await capabilities.removeDrawing({ id: materialId, url });
      capabilities.notifySuccess('删除成功');
      if (selectedDrawingUrl === url) setSelectedDrawingUrl(undefined);
      onReload();
    } catch (error) {
      capabilities.notifyError(
        capabilities.formatErrorMessage(error, '图纸删除失败，请稍后重试'),
      );
    }
  };

  const removeSelectedFile = (uid: string) => {
    setDrawingFileList((files) => files.filter((file) => file.uid !== uid));
  };

  const viewDrawing = (item: DrawingItem) => {
    if (item.kind === 'image') {
      setSelectedDrawingUrl(item.url);
      setPreviewIndex(
        Math.max(
          0,
          imageDrawingItems.findIndex(
            (imageItem) => imageItem.url === item.url,
          ),
        ),
      );
      setPreviewOpen(true);
      return;
    }
    if (item.kind === 'pdf') {
      setSelectedDrawingUrl(item.url);
      setPdfPreviewFile({ url: item.url, name: item.name });
      return;
    }
    if (item.kind === 'model') setSelectedDrawingUrl(item.url);
  };

  const downloadDrawing = async (item: DrawingItem) => {
    try {
      await capabilities.downloadFile(item.url, item.name);
    } catch (error) {
      capabilities.notifyError(
        capabilities.formatErrorMessage(error, '图纸下载失败，请稍后重试'),
      );
    }
  };

  return (
    <Row gutter={[16, 16]} style={{ paddingBlock: 16 }}>
      <Col xs={24} lg={10} xl={8}>
        <Card
          size="small"
          style={{ minHeight: 360 }}
          title={
            <Space size={8}>
              <span>已上传图纸与3D资料</span>
              <Tag>共 {drawingItems.length} 个</Tag>
            </Space>
          }
        >
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            {canEdit ? (
              <div>
                <Space wrap>
                  <Upload
                    fileList={drawingFileList}
                    showUploadList={false}
                    onChange={({ fileList }) => setDrawingFileList(fileList)}
                    beforeUpload={(file) => {
                      if (!isPolicyReady || isDrawingLimitReached) {
                        capabilities.notifyError(
                          isPolicyReady
                            ? `单个物料最多维护 ${drawingPolicy?.maxCount ?? 0} 个图纸附件`
                            : '正在读取物料资料上传规则，请稍候重试',
                        );
                        return Upload.LIST_IGNORE;
                      }
                      const extension = file.name
                        .toLowerCase()
                        .split('.')
                        .pop() ?? '';
                      if (!drawingPolicy?.allowedExtensions.includes(extension)) {
                        capabilities.notifyError(
                          `仅支持 ${drawingPolicy?.allowedExtensions.join('/').toUpperCase()}`,
                        );
                        return Upload.LIST_IGNORE;
                      }
                      const maxSize =
                        extension === 'glb'
                          ? drawingPolicy?.glbFileMaxSize
                          : drawingPolicy?.normalFileMaxSize;
                      if (typeof maxSize === 'number' && file.size > maxSize) {
                        capabilities.notifyError(
                          `${extension === 'glb' ? 'GLB 模型' : '普通附件'}单文件大小不能超过 ${capabilities.formatFileSize(maxSize)}`,
                        );
                        return Upload.LIST_IGNORE;
                      }
                      return false;
                    }}
                    multiple
                    accept={drawingPolicy?.allowedExtensions
                      .map((extension) => `.${extension}`)
                      .join(',')}
                    maxCount={drawingCapacity}
                    disabled={!isPolicyReady || isDrawingLimitReached}
                  >
                    <Button
                      htmlType="button"
                      icon={<UploadOutlined />}
                      disabled={!isPolicyReady || isDrawingLimitReached}
                    >
                      选择图纸文件
                    </Button>
                  </Upload>
                  <Button
                    htmlType="button"
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={drawingUploading}
                    disabled={
                      drawingFileList.length === 0 ||
                      !isPolicyReady ||
                      isDrawingLimitReached
                    }
                    onClick={() => void handleUploadDrawings()}
                  >
                    上传选中文件
                  </Button>
                </Space>
                <Typography.Text
                  type="secondary"
                  role="status"
                  style={{ display: 'block', marginTop: 8 }}
                >
                  {drawingPolicy
                    ? `支持 ${drawingPolicy.allowedExtensions.join('、').toUpperCase()}；普通附件不超过 ${capabilities.formatFileSize(drawingPolicy.normalFileMaxSize)}，GLB 不超过 ${capabilities.formatFileSize(drawingPolicy.glbFileMaxSize)}，单个物料最多维护 ${drawingPolicy.maxCount} 个资料。`
                    : drawingPolicyError
                      ? '资料上传规则加载失败，请刷新页面后重试。'
                      : '正在读取资料上传规则…'}
                </Typography.Text>
                <Tag
                  color={
                    isDrawingLimitReached
                      ? 'error'
                      : drawingFileList.length > 0
                        ? 'processing'
                        : 'default'
                  }
                  style={{ marginTop: 8 }}
                >
                  {isDrawingLimitReached
                    ? '已达上限'
                    : `待上传 ${drawingFileList.length}`}
                </Tag>
                {drawingFileList.length > 0 ? (
                  <List
                    size="small"
                    dataSource={drawingFileList}
                    renderItem={(file) => {
                      const kind = getDrawingKind(file.name);
                      return (
                        <List.Item
                          key={file.uid}
                          actions={[
                            <Button
                              key="remove"
                              htmlType="button"
                              type="text"
                              danger
                              size="small"
                              aria-label={`移除 ${file.name}`}
                              icon={<DeleteOutlined />}
                              onClick={() => removeSelectedFile(file.uid)}
                            />,
                          ]}
                        >
                          <Space size={8} style={{ minWidth: 0, width: '100%' }}>
                            {getDrawingIcon(kind, token)}
                            <Typography.Text
                              ellipsis={{ tooltip: file.name }}
                              style={{ flex: 1 }}
                            >
                              {file.name}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {capabilities.formatFileSize(file.size)}
                            </Typography.Text>
                          </Space>
                        </List.Item>
                      );
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            {drawingItems.length > 0 ? (
              <List
                size="small"
                dataSource={drawingItems}
                renderItem={(item) => {
                  const selected = activeDrawing?.key === item.key;
                  const actions: ReactNode[] = [];
                  if (
                    item.kind === 'image' ||
                    item.kind === 'pdf' ||
                    item.kind === 'model'
                  ) {
                    actions.push(
                      <Tooltip
                        key="view"
                        title={
                          item.kind === 'pdf'
                            ? '预览 PDF'
                            : item.kind === 'model'
                              ? '查看 3D模型'
                              : '放大查看'
                        }
                      >
                        <Button
                          htmlType="button"
                          type="text"
                          size="small"
                          aria-label={`查看 ${item.name}`}
                          icon={<EyeOutlined />}
                          onClick={() => viewDrawing(item)}
                        />
                      </Tooltip>,
                    );
                  }
                  actions.push(
                    <Tooltip key="download" title="下载">
                      <Button
                        htmlType="button"
                        type="text"
                        size="small"
                        aria-label={`下载 ${item.name}`}
                        icon={<DownloadOutlined />}
                        onClick={() => void downloadDrawing(item)}
                      />
                    </Tooltip>,
                  );
                  if (canEdit) {
                    actions.push(
                      <Popconfirm
                        key="delete"
                        title="确认删除此图纸？"
                        onConfirm={() => handleRemoveDrawing(item.url)}
                      >
                        <Tooltip title="删除">
                          <Button
                            htmlType="button"
                            type="text"
                            danger
                            size="small"
                            aria-label={`删除 ${item.name}`}
                            icon={<DeleteOutlined />}
                          />
                        </Tooltip>
                      </Popconfirm>,
                    );
                  }
                  return (
                    <List.Item key={item.key} actions={actions}>
                      <Button
                        htmlType="button"
                        type="text"
                        block
                        aria-pressed={selected}
                        aria-label={`选择图纸 ${item.name}`}
                        onClick={() => setSelectedDrawingUrl(item.url)}
                        style={{ height: 'auto', padding: '8px 4px', textAlign: 'left' }}
                      >
                        <Space align="center" size={8} style={{ minWidth: 0 }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: 56,
                              height: 56,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: '0 0 auto',
                            }}
                          >
                            {item.kind === 'image' ? (
                              <Image
                                width={56}
                                height={56}
                                src={capabilities.resolvePreviewUrl(item.url)}
                                preview={false}
                                alt=""
                              />
                            ) : (
                              getDrawingIcon(item.kind, token, 24)
                            )}
                          </span>
                          <Space
                            orientation="vertical"
                            size={2}
                            align="start"
                            style={{ minWidth: 0, textAlign: 'left' }}
                          >
                            <Space size={4} style={{ minWidth: 0 }}>
                              <Typography.Text
                                ellipsis={{ tooltip: item.name }}
                                style={{ maxWidth: 220 }}
                              >
                                {item.name}
                              </Typography.Text>
                              {selected ? <Tag color="processing">当前预览</Tag> : null}
                            </Space>
                            <Typography.Text type="secondary">
                              第 {item.index} 个附件 · {getDrawingTypeLabel(item.kind)}/
                              {item.extension}
                            </Typography.Text>
                          </Space>
                        </Space>
                      </Button>
                    </List.Item>
                  );
                }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        canEdit
                          ? '暂无图纸，上传后可在这里查看'
                          : '暂无图纸信息'
                      }
                    />
                  ),
                }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  canEdit ? '暂无图纸，上传后可在这里查看' : '暂无图纸信息'
                }
              />
            )}
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={14} xl={16}>
        <Card size="small" style={{ minHeight: 360 }}>
          {activeDrawing ? (
            <Space
              orientation="vertical"
              size={12}
              style={{ width: '100%' }}
            >
              <Row align="middle" justify="space-between" gutter={[8, 8]}>
                <Col flex="auto">
                  <Space size={8} style={{ minWidth: 0 }}>
                    {getDrawingIcon(activeDrawing.kind, token)}
                    <Typography.Text
                      strong
                      ellipsis={{ tooltip: activeDrawing.name }}
                    >
                      {activeDrawing.name}
                    </Typography.Text>
                  </Space>
                </Col>
                <Col>
                  <Space size={4} wrap>
                    {activeDrawing.kind === 'image' ||
                    activeDrawing.kind === 'pdf' ||
                    activeDrawing.kind === 'model' ? (
                      <Button
                        htmlType="button"
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => viewDrawing(activeDrawing)}
                      >
                        {activeDrawing.kind === 'image'
                          ? '放大查看'
                          : activeDrawing.kind === 'pdf'
                            ? '预览 PDF'
                            : '查看 3D模型'}
                      </Button>
                    ) : null}
                    <Button
                      htmlType="button"
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => void downloadDrawing(activeDrawing)}
                    >
                      下载
                    </Button>
                  </Space>
                </Col>
              </Row>

              <div
                style={{
                  display: 'flex',
                  alignItems: activeDrawing.kind === 'model' ? 'stretch' : 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: activeDrawing.kind === 'model' ? 300 : 240,
                  padding: activeDrawing.kind === 'model' ? 0 : 12,
                  background: token.colorFillQuaternary,
                  borderRadius: token.borderRadius,
                }}
              >
                {activeDrawing.kind === 'image' ? (
                  <Image
                    src={capabilities.resolvePreviewUrl(activeDrawing.url)}
                    alt={activeDrawing.name}
                    style={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain' }}
                  />
                ) : activeDrawing.kind === 'pdf' ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="PDF 图纸可在当前页面预览，也可以下载后查看"
                  >
                    <Button
                      htmlType="button"
                      icon={<EyeOutlined />}
                      onClick={() => viewDrawing(activeDrawing)}
                    >
                      预览 PDF
                    </Button>
                  </Empty>
                ) : activeDrawing.kind === 'model' ? (
                  capabilities.renderModelPreview(
                    capabilities.resolvePreviewUrl(activeDrawing.url),
                    activeDrawing.name,
                  )
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="当前文件不支持在线查看，请下载后查看"
                  >
                    <Button
                      htmlType="button"
                      icon={<DownloadOutlined />}
                      onClick={() => void downloadDrawing(activeDrawing)}
                    >
                      下载
                    </Button>
                  </Empty>
                )}
              </div>
            </Space>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                canEdit
                  ? '上传图片、PDF或GLB资料后可在这里预览'
                  : '暂无图纸与3D资料信息'
              }
            />
          )}

          {imageDrawingItems.length > 0 ? (
            <Image.PreviewGroup
              preview={{
                open: previewOpen,
                current: previewIndex,
                onOpenChange: setPreviewOpen,
                onChange: setPreviewIndex,
              }}
            >
              <div style={{ display: 'none' }}>
                {imageDrawingItems.map((item) => (
                  <Image
                    key={item.key}
                    src={capabilities.resolvePreviewUrl(item.url)}
                    alt={item.name}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          ) : null}

          <PdfPreviewDrawer
            file={pdfPreviewFile}
            onClose={() => setPdfPreviewFile(null)}
          />
        </Card>
      </Col>
    </Row>
  );
}
