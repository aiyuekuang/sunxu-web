import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let AnnouncementBanner;
let BusinessSideNavView;
let MenuSearchInput;

before(async () => {
  vite = await createServer({
    configFile: 'vite.lib.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const [banner, sideNav, menuSearch] = await Promise.all([
    vite.ssrLoadModule('/src/business/domains/application/AnnouncementBanner.tsx'),
    vite.ssrLoadModule('/src/business/domains/application/BusinessSideNavView.tsx'),
    vite.ssrLoadModule('/src/business/domains/application/MenuSearchInput.tsx'),
  ]);
  AnnouncementBanner = banner.AnnouncementBanner;
  BusinessSideNavView = sideNav.BusinessSideNavView;
  MenuSearchInput = menuSearch.MenuSearchInput;
});

after(async () => {
  await vite?.close();
});

test('announcement banner presents priority, count, close and host route affordance', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBanner, {
      className: 'mes-layout-header-announcement',
      items: [
        {
          id: 'ann-1',
          title: '设备维护',
          content: '周五停机',
          priority: 'urgent',
        },
        { id: 'ann-2', title: '库存盘点' },
      ],
      onOpen: () => undefined,
    }),
  );

  assert.match(html, /查看公告：设备维护：周五停机/);
  assert.match(html, /紧急/);
  assert.match(html, /1\/2/);
  assert.match(html, /aria-label="隐藏当前公告"/);
  assert.match(html, /mes-layout-header-announcement/);
});

test('announcement banner renders nothing when the host supplies no items', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBanner, {
      items: [],
      onOpen: () => undefined,
    }),
  );

  assert.equal(html, '');
});

test('menu search keeps host options, visible context and accessible input name', () => {
  const component = MenuSearchInput({
      options: [
        { value: '/sales/orders', title: '销售订单', context: '销售管理' },
      ],
      value: '销售',
      onSearch: () => undefined,
      onSelect: () => undefined,
  });
  const autoComplete = component.props.children;
  const optionHtml = renderToStaticMarkup(
    autoComplete.props.options[0].label,
  );
  const inputHtml = renderToStaticMarkup(component);

  assert.match(inputHtml, /aria-label="搜索菜单"/);
  assert.match(optionHtml, /销售订单/);
  assert.match(optionHtml, /销售管理/);
});

test('business side navigation renders expanded and collapsed visual states', () => {
  const item = {
    key: 'sales-orders',
    path: '/sales/orders',
    title: '销售订单',
    active: true,
  };
  const sharedProps = {
    primaryItems: [
      {
        ...item,
        hasChildren: true,
        sections: [{ key: 'orders', title: '销售', items: [item] }],
      },
    ],
    activePrimaryKey: item.key,
    activePrimaryTitle: '销售管理',
    sections: [{ key: 'orders', title: '销售', items: [item] }],
    search: React.createElement('div', null, '菜单搜索'),
    onPrimarySelect: () => undefined,
    onNavigate: () => undefined,
  };

  const expanded = renderToStaticMarkup(
    React.createElement(BusinessSideNavView, sharedProps),
  );
  const collapsed = renderToStaticMarkup(
    React.createElement(BusinessSideNavView, {
      ...sharedProps,
      collapsed: true,
    }),
  );

  assert.match(expanded, /销售管理任务导航/);
  assert.match(expanded, /菜单搜索/);
  assert.match(expanded, /销售订单/);
  assert.doesNotMatch(expanded, /mes-business-side-nav-collapsed/);
  assert.match(collapsed, /mes-business-side-nav-collapsed/);
  assert.doesNotMatch(collapsed, /销售管理任务导航/);
});

test('business navigation layout keeps both rails and result lists shrinkable', async () => {
  const css = await readFile(
    new URL('../../src/business/domains/shared/business-side-nav.css', import.meta.url),
    'utf8',
  );

  assert.match(css, /\.mes-business-side-nav\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /\.mes-business-side-nav-secondary\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.mes-business-side-nav-secondary-list\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
