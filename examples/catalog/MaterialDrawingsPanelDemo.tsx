import { useMemo, useRef, useState } from 'react';
import { Button, Space, Typography, theme } from 'antd';
import { SectionCard } from '../../src';
import {
  BusinessUiProvider,
  type DrawingFilesCapabilities,
} from '../../src/business';
import { MaterialDrawingsPanel } from '../../src/business/domains/inventory/MaterialDrawingsPanel';
import type { MaterialDrawingsPanelCapabilities } from '../../src/business/domains/inventory/material-drawings-panel-types';
import drawingImageUrl from './fixtures/drawing-sample.png';
import drawingPdfUrl from './fixtures/drawing-sample.pdf?url&no-inline';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const demoMaterialId = 'material-demo-001';
const demoModelUrl = 'demo://material/model.glb';
const demoFileUrl = 'demo://material/specification.step';

function fallbackFileName(url: string): string {
  const raw = url.split('?')[0]?.split('/').pop() || '图纸附件';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function formatFileSize(size?: number): string {
  if (typeof size !== 'number') return '-';
  if (size === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  return `${(size / 1024 ** unitIndex).toFixed(1)} ${units[unitIndex]}`;
}

async function fetchDemoFileBlob(url: string): Promise<Blob> {
  const source = /\.pdf(?:$|\?)/i.test(url) ? drawingPdfUrl : drawingImageUrl;
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

export function MaterialDrawingsPanelDemo() {
  const { token } = theme.useToken();
  const [drawings, setDrawings] = useState<string[]>([
    drawingImageUrl,
    drawingPdfUrl,
    demoModelUrl,
    demoFileUrl,
  ]);
  const [canEdit, setCanEdit] = useState(true);
  const [policyFailure, setPolicyFailure] = useState(false);
  const [lastAction, setLastAction] = useState('组件示例已就绪');
  const uploadedNames = useRef(new Map<string, string>());

  const capabilities = useMemo<MaterialDrawingsPanelCapabilities>(
    () => ({
      async requestDrawingPolicy() {
        if (policyFailure) throw new Error('示例上传规则暂不可用');
        return {
          maxCount: 8,
          normalFileMaxSize: 20 * 1024 * 1024,
          glbFileMaxSize: 100 * 1024 * 1024,
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'step', 'glb'],
        };
      },
      async uploadDocumentFiles(files) {
        return files.map((file) => {
          const url = URL.createObjectURL(file);
          uploadedNames.current.set(url, file.name);
          return url;
        });
      },
      async uploadModelFile(file) {
        const url = URL.createObjectURL(file);
        uploadedNames.current.set(url, file.name);
        return url;
      },
      async addDrawings({ urls }) {
        setDrawings((current) => [...current, ...urls]);
      },
      async removeDrawing({ url }) {
        setDrawings((current) => current.filter((item) => item !== url));
      },
      async resolveFileDisplayNames(urls) {
        return Object.fromEntries(
          urls.map((url) => [
            url,
            uploadedNames.current.get(url) ??
              (url === drawingImageUrl
                ? 'RM-CAST-042 侧视图.png'
                : url === drawingPdfUrl
                  ? 'RM-CAST-042 零件图.pdf'
                  : url === demoModelUrl
                    ? 'RM-CAST-042 三维模型.glb'
                    : url === demoFileUrl
                      ? 'RM-CAST-042 工艺资料.step'
                      : undefined),
          ]),
        );
      },
      getFallbackFileName: fallbackFileName,
      resolvePreviewUrl: (url) => url,
      async downloadFile(_url, fileName) {
        downloadBlob(new Blob(['示例附件内容']), fileName);
      },
      formatFileSize,
      formatErrorMessage: (error, fallback) =>
        error instanceof Error && error.message ? error.message : fallback,
      notifySuccess: (message) => setLastAction(message),
      notifyError: (message) => setLastAction(message),
      renderModelPreview: (_url, name) => (
        <div
          style={{
            minHeight: 320,
            display: 'grid',
            placeItems: 'center',
            border: `1px dashed ${token.colorBorder}`,
            borderRadius: token.borderRadius,
          }}
        >
          <Typography.Text type="secondary">
            宿主 GLB 预览器将在此显示：{name}
          </Typography.Text>
        </div>
      ),
    }),
    [policyFailure],
  );

  const drawingFilesCapabilities = useMemo<DrawingFilesCapabilities>(
    () => ({
      pdfWorkerSrc: pdfWorkerUrl,
      fetchFileBlob: (url) =>
        fetchDemoFileBlob(uploadedNames.current.get(url) ?? url),
      downloadUrl: async (_url, fileName) => {
        downloadBlob(new Blob(['示例附件内容']), fileName);
      },
      downloadBlob,
      resolveFileDisplayNames: capabilities.resolveFileDisplayNames,
    }),
    [capabilities.resolveFileDisplayNames],
  );

  return (
    <SectionCard title="物料图纸资料">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          物料资料服务、权限、文件名与预览地址由宿主注入；图片和 PDF 使用当前页面预览，GLB 预览器由宿主提供。
        </Typography.Paragraph>
        <Space wrap>
          <Button onClick={() => setCanEdit((value) => !value)}>
            {canEdit ? '切换为只读' : '切换为可维护'}
          </Button>
          <Button onClick={() => setPolicyFailure((value) => !value)}>
            {policyFailure ? '恢复上传规则' : '模拟上传规则错误'}
          </Button>
        </Space>
        <BusinessUiProvider
          hasPermission={() => true}
          drawingFilesCapabilities={drawingFilesCapabilities}
        >
          <MaterialDrawingsPanel
            key={policyFailure ? 'policy-error' : 'policy-ready'}
            materialId={demoMaterialId}
            drawings={drawings}
            canEdit={canEdit}
            capabilities={capabilities}
            onReload={() => setLastAction('资料已刷新')}
          />
        </BusinessUiProvider>
        <Typography.Text type="secondary" role="status">
          操作状态：{lastAction}；资料数：{drawings.length}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
