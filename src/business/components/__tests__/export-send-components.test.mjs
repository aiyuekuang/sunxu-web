import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let MesExportButton;
let MesExportDropdownButton;
let SendAttachmentRow;

before(async () => {
  // pdfjs-dist references browser canvas primitives during module evaluation.
  globalThis.DOMMatrix ??= class DOMMatrix {};
  globalThis.ImageData ??= class ImageData {};
  globalThis.Path2D ??= class Path2D {};

  vite = await createServer({
    configFile: 'vite.lib.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const [exports, attachment] = await Promise.all([
    vite.ssrLoadModule('/src/business/components/MesExportControls.tsx'),
    vite.ssrLoadModule('/src/business/components/SendAttachmentRow.tsx'),
  ]);
  MesExportButton = exports.MesExportButton;
  MesExportDropdownButton = exports.MesExportDropdownButton;
  SendAttachmentRow = attachment.SendAttachmentRow;
});

after(async () => {
  await vite?.close();
});

test('export button hides itself when the host denies export permission', () => {
  const html = renderToStaticMarkup(
    React.createElement(MesExportButton, {
      canExport: false,
      exportFn: async () => new Blob(['data']),
      fileName: 'report.xlsx',
      download: () => {},
    }),
  );

  assert.equal(html, '');
});

test('export button preserves caller label and button props', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MesExportButton,
      {
        canExport: true,
        exportFn: async () => new Blob(['data']),
        fileName: 'report.xlsx',
        download: () => {},
        title: '导出当前结果',
      },
      '导出当前结果',
    ),
  );

  assert.match(html, /导出当前结果/);
  assert.match(html, /title="导出当前结果"/);
});

test('export dropdown preserves caller label and accessible button semantics', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MesExportDropdownButton,
      {
        items: [
          {
            key: 'all',
            label: '导出全部',
            exportFn: async () => new Blob(['data']),
            fileName: 'all.xlsx',
          },
        ],
        download: () => {},
        'aria-label': '导出菜单',
      },
      '导出选项',
    ),
  );

  assert.match(html, /导出选项/);
  assert.match(html, /aria-label="导出菜单"/);
});

test('attachment row keeps the filename and hides preview/download when not permitted', () => {
  const html = renderToStaticMarkup(
    React.createElement(SendAttachmentRow, {
      payload: { id: 'doc-1' },
      filename: 'statement.pdf',
      previewable: false,
      fetchPdf: async () => new Blob(['pdf'], { type: 'application/pdf' }),
      download: () => {},
      notifyError: () => {},
    }),
  );

  assert.match(html, /statement\.pdf/);
  assert.match(html, /邮件直发附带/);
  assert.match(html, /无金额查看权限，不可预览/);
  assert.doesNotMatch(html, />预览</);
  assert.doesNotMatch(html, />下载</);
});

test('attachment row exposes preview and download actions when permitted', () => {
  const html = renderToStaticMarkup(
    React.createElement(SendAttachmentRow, {
      payload: { id: 'doc-1' },
      filename: 'statement.pdf',
      previewable: true,
      fetchPdf: async () => new Blob(['pdf'], { type: 'application/pdf' }),
      download: () => {},
      notifyError: () => {},
    }),
  );

  assert.match(html, />预览</);
  assert.match(html, />下载</);
  assert.doesNotMatch(html, /无金额查看权限/);
});

test('attachment row keeps preview but hides download without a host download capability', () => {
  const html = renderToStaticMarkup(
    React.createElement(SendAttachmentRow, {
      payload: { id: 'doc-1' },
      filename: 'statement.pdf',
      previewable: true,
      fetchPdf: async () => new Blob(['pdf'], { type: 'application/pdf' }),
      notifyError: () => {},
    }),
  );

  assert.match(html, />预览</);
  assert.doesNotMatch(html, />下载</);
});
