import { useMemo, useRef, useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DrawingFilesGallery,
  DrawingFilesInline,
  FileUrlsInline,
  BusinessUiProvider,
  type DrawingFileGroup,
  type DrawingFilesCapabilities,
} from '../../src/business';
import drawingImageUrl from './fixtures/drawing-sample.png';
import drawingPdfUrl from './fixtures/drawing-sample.pdf?url&no-inline';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const orderHeaderImageUrl = `${drawingImageUrl}?source=order`;
const orderHeaderPdfUrl = `${drawingPdfUrl}?source=order`;
const csvAttachmentUrl = `${drawingImageUrl.replace(/\.png(?=$|\?)/, '.csv')}?source=specification`;

async function fetchDemoFileBlob(url: string) {
  if (url.startsWith('blob:')) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('本地示例文件读取失败');
    return response.blob();
  }
  const source = /\.pdf(?:$|\?)/i.test(url)
    ? drawingPdfUrl
    : drawingImageUrl;
  const response = await fetch(source);
  if (!response.ok) throw new Error('本地示例文件读取失败');
  return response.blob();
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DrawingFilesDemo() {
  const uploadedNames = useRef(new Map<string, string>());
  const [printReceipt, setPrintReceipt] = useState('尚未触发打印');
  const [lineDrawingUrls, setLineDrawingUrls] = useState<string[]>([
    drawingImageUrl,
    drawingPdfUrl,
  ]);
  const [attachments, setAttachments] = useState<string[]>([
    drawingImageUrl,
    drawingPdfUrl,
    csvAttachmentUrl,
  ]);

  const groups: DrawingFileGroup[] = [
    {
      key: 'current-line',
      title: '当前明细图纸',
      description: '图片就地放大；PDF 在当前页面抽屉内查看。',
      urls: lineDrawingUrls,
    },
    {
      key: 'order-header',
      title: '来源订单附件',
      description: '示例图库只展示图片、PDF 和普通附件的文件类型分流。',
      urls: [orderHeaderImageUrl, orderHeaderPdfUrl, csvAttachmentUrl],
    },
  ];

  const drawingFilesCapabilities = useMemo<DrawingFilesCapabilities>(
    () => ({
      pdfWorkerSrc: pdfWorkerUrl,
      uploadFiles: async ({ data }) => {
        const file = data.get('files');
        if (!(file instanceof File)) return { urls: [] };
        const url = URL.createObjectURL(file);
        uploadedNames.current.set(url, file.name);
        return { urls: [url] };
      },
      fetchFileBlob: fetchDemoFileBlob,
      downloadUrl: async (url, fileName) => {
        const blob = await fetchDemoFileBlob(url);
        downloadBlob(blob, fileName);
      },
      downloadBlob,
      resolveFileDisplayNames: async (urls) =>
        Object.fromEntries(
          urls.map((url) => [
            url,
            uploadedNames.current.get(url) ??
              (url.includes('source=order')
                ? url.endsWith('.pdf') || url.includes('.pdf?')
                  ? '订单-支架总图.pdf'
                  : '订单-焊缝细节.png'
                : url.endsWith('.pdf') || url.includes('.pdf?')
                  ? '支架总图-版本 C.pdf'
                  : url.endsWith('.csv') || url.includes('.csv?')
                    ? '检验尺寸清单.csv'
                    : 'RM-BRACKET-2048-侧视图.png'),
          ]),
        ),
    }),
    [],
  );

  return (
    <SectionCard title="图纸与附件">
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          附件上传、代理下载和原始文件名解析由宿主注入；此目录示例使用本地文件模拟。
        </Typography.Paragraph>
        <BusinessUiProvider
          hasPermission={() => true}
          drawingFilesCapabilities={drawingFilesCapabilities}
        >
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>明细图纸关联与上传</Typography.Text>
              <DrawingFilesInline
                editable
                value={lineDrawingUrls}
                onChange={setLineDrawingUrls}
                availableFileUrls={[orderHeaderImageUrl, orderHeaderPdfUrl]}
                maxCount={6}
                maxSize={5 * 1024 * 1024}
              />
            </div>
            <div>
              <Typography.Text strong>单据附件</Typography.Text>
              <FileUrlsInline
                editable
                value={attachments}
                onChange={setAttachments}
                maxCount={8}
                maxSize={5 * 1024 * 1024}
              />
            </div>
            <div>
              <Typography.Text strong>按来源分组的图纸图库</Typography.Text>
              <DrawingFilesGallery
                groups={groups}
                canPrint
                onPrint={(urls) => setPrintReceipt(`${urls.length} 张图片`)}
              />
              <Typography.Text type="secondary" role="status">
                打印回执：{printReceipt}
              </Typography.Text>
            </div>
          </Space>
        </BusinessUiProvider>
      </Space>
    </SectionCard>
  );
}
