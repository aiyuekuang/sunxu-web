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
const {
  MesDetailPageContainer,
  MesDetailPageContent,
  MesDetailPageState,
} = await vite.ssrLoadModule('/src/business/components/MesDetailPageContainer.tsx');

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

test('MES detail content composes host slots without adding a screen or scroll container', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MesDetailPageContent,
      {
        header: React.createElement('header', null, '宿主详情标题'),
        approval: React.createElement('aside', null, '宿主审批面板'),
      },
      React.createElement('article', null, '详情正文'),
    ),
  );

  assert.match(html, /^<header>宿主详情标题<\/header><aside>宿主审批面板<\/aside>/);
  assert.match(html, /<article>详情正文<\/article>$/);
  assert.doesNotMatch(html, /sxw-detail-screen|sxw-screen|sxw-mes-detail-page__approval/);
});

test('MES detail state preserves loading, error retry, and empty presentation', () => {
  const loadingHtml = renderToStaticMarkup(
    React.createElement(MesDetailPageState, { state: 'loading' }),
  );
  const errorHtml = renderToStaticMarkup(
    React.createElement(MesDetailPageState, {
      state: 'error',
      description: '加载失败，请重试',
      onRetry: () => undefined,
    }),
  );
  const emptyHtml = renderToStaticMarkup(
    React.createElement(MesDetailPageState, {
      state: 'empty',
      description: '未找到数据',
    }),
  );

  assert.match(loadingHtml, /aria-busy="true"/);
  assert.match(loadingHtml, /ant-spin/);
  assert.match(errorHtml, /加载失败，请重试/);
  assert.match(errorHtml, /重\s*试/);
  assert.match(errorHtml, /margin-top:16px/);
  assert.match(emptyHtml, /未找到数据/);
  assert.doesNotMatch(emptyHtml, /重\s*试/);
});
