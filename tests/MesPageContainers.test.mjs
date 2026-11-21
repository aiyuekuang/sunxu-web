import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  root: process.cwd(),
  appType: 'custom',
  server: { middlewareMode: true },
});

const { ListScreenContainer } = await vite.ssrLoadModule(
  '/src/components/PageContainers.tsx',
);
const { MesDetailPageContainer } = await vite.ssrLoadModule(
  '/src/mes/components/MesDetailPageContainer.tsx',
);

after(async () => {
  await vite.close();
});

test('list toolbar stays between the page header and its semantic results region', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ListScreenContainer,
      {
        title: '设备列表',
        toolbar: React.createElement('button', null, '筛选'),
      },
      React.createElement('table', null, '设备结果'),
    ),
  );

  const headerIndex = html.indexOf('设备列表');
  const toolbarIndex = html.indexOf('sxw-list-screen__toolbar');
  const resultIndex = html.indexOf('sxw-list-screen__results');

  assert.match(html, /<main\b/);
  assert.ok(headerIndex >= 0 && toolbarIndex > headerIndex);
  assert.ok(resultIndex > toolbarIndex);
  assert.match(html, /style="min-width:0;flex-wrap:wrap;gap:8px"/);
  assert.match(html, /<section class="sxw-list-screen__results">/);
});

test('MES detail container preserves breadcrumb, header, approval, body, and footer slots', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MesDetailPageContainer,
      {
        title: '设备详情',
        onBack: () => undefined,
        status: {
          value: 'draft',
          enumMap: { draft: { text: '草稿', status: 'Default' } },
        },
        actions: React.createElement('button', null, '编辑'),
        breadcrumbs: [{ title: '设备' }, { title: '详情' }],
        approval: React.createElement('div', null, '审批面板'),
        footer: React.createElement('button', null, '保存'),
        fill: true,
        frame: 'none',
      },
      React.createElement('article', null, '详情内容'),
    ),
  );

  const breadcrumbIndex = html.indexOf('面包屑导航');
  const headerIndex = html.indexOf('设备详情');
  const approvalIndex = html.indexOf('审批面板');
  const bodyIndex = html.indexOf('详情内容');
  const footerIndex = html.indexOf('保存');

  assert.match(html, /<main class="sxw-screen sxw-screen--frame-none sxw-screen--fill sxw-detail-screen sxw-mes-detail-page">/);
  assert.ok(breadcrumbIndex >= 0 && headerIndex > breadcrumbIndex);
  assert.ok(approvalIndex > headerIndex);
  assert.ok(bodyIndex > approvalIndex);
  assert.ok(footerIndex > bodyIndex);
  assert.match(html, /sxw-sticky-action-bar/);
  assert.match(html, /返回/);
  assert.match(html, /草稿/);
  assert.match(html, /编辑/);
});
